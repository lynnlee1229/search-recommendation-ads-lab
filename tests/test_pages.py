"""Public static export: content parity, crawling, links and output boundaries."""
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import shutil
import sys
import tempfile
import unittest
from urllib.parse import unquote, urljoin, urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from scripts.build_pages import build, dataframe_html, resolve_link, sanitize_html


class Document(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.links, self.ids, self.scripts, self.attributes = [], [], [], []
        self.lang, self.canonical = None, None
        self.alternates = {}
        self.robot = None
        self.text = []
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.attributes.append((tag, attrs))
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        if tag == 'html':
            self.lang = attrs.get('lang')
        if tag in ('a', 'link') and attrs.get('href'):
            self.links.append(attrs['href'])
        if tag in ('img', 'script') and attrs.get('src'):
            self.links.append(attrs['src'])
        if tag == 'script':
            self.scripts.append(attrs)
        if tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonical = attrs.get('href')
        if tag == 'link' and attrs.get('rel') == 'alternate':
            self.alternates[attrs.get('hreflang')] = attrs.get('href')
        if tag == 'meta' and attrs.get('name') == 'robots':
            self.robot = attrs.get('content')

    def handle_data(self, value):
        self.text.append(value)


class PublicPagesTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.node = os.environ.get('NODE') or shutil.which('node')
        if not cls.node:
            raise unittest.SkipTest('Public export checks need build-time Node; set NODE=/path/to/node')
        cls.temporary = tempfile.TemporaryDirectory(prefix='lab-pages-test-')
        cls.output = Path(cls.temporary.name) / 'public'
        cls.base = 'https://example.test/project-lab/'
        cls.manifest = build(cls.output, cls.base, cls.node, 'test-verification-key-12345')
        cls.documents = {path.relative_to(cls.output).as_posix(): Document(path.read_text()) for path in cls.output.rglob('*.html')}

    @classmethod
    def tearDownClass(cls):
        cls.temporary.cleanup()

    def test_every_lesson_and_path_is_prerendered_and_language_linked(self):
        self.assertEqual(self.manifest['canonical_pages'], 136)
        self.assertEqual(self.manifest['lesson_pages'], 126)
        self.assertEqual(len(self.documents), 138)
        self.assertEqual(self.documents['index.html'].lang, 'en')
        self.assertEqual(self.documents['index.html'].canonical, self.base + 'en/')
        self.assertIn('noindex', self.documents['404.html'].robot)
        for name, document in self.documents.items():
            if name == '404.html':
                continue
            self.assertIn(document.lang, ('en', 'zh-CN'))
            self.assertEqual(set(document.alternates), {'en', 'zh', 'x-default'})
            self.assertEqual(document.alternates['x-default'], document.alternates['en'])
            self.assertTrue(document.canonical.startswith(self.base))
            if '/lessons/' in name:
                body = ''.join(document.text)
                self.assertGreater(len(body), 1200, name)
                self.assertIn('PYTHON', body, name)
                self.assertTrue(any(a.get('class') == 'markdown-cell' for _, a in document.attributes), name)
                self.assertTrue(any(a.get('class') == 'code-cell' for _, a in document.attributes), name)
            self.assertEqual(len(document.ids), len(set(document.ids)), name)

    def test_all_local_links_assets_and_fragments_work_under_a_project_prefix(self):
        base_path = urlsplit(self.base).path
        for name, document in self.documents.items():
            current = self.base + (name[:-10] if name.endswith('index.html') else name)
            for link in document.links:
                resolved = urlsplit(urljoin(current, link))
                self.assertNotIn(resolved.hostname, ('localhost', '127.0.0.1'), (name, link))
                self.assertNotEqual(resolved.scheme, 'javascript', (name, link))
                if resolved.netloc != 'example.test':
                    continue
                self.assertTrue(resolved.path.startswith(base_path), (name, link))
                relative = unquote(resolved.path[len(base_path):])
                target = self.output / relative
                if target.is_dir():
                    target /= 'index.html'
                self.assertTrue(target.is_file(), (name, link, relative))
                if resolved.fragment and target.suffix == '.html':
                    doc = self.documents[target.relative_to(self.output).as_posix()]
                    self.assertIn(unquote(resolved.fragment), doc.ids, (name, link))

    def test_sitemap_and_public_scope(self):
        root = ET.parse(self.output / 'sitemap.xml').getroot()
        urls = [node.text for node in root.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
        self.assertEqual(urls, self.manifest['urls'])
        self.assertEqual(len(set(urls)), 136)
        self.assertNotIn(self.base, urls)
        self.assertTrue((self.output / '.nojekyll').is_file())
        social = next((name for name in ('social.jpg', 'social.png') if (ROOT / 'web/public' / name).is_file()), None)
        if social:
            self.assertTrue((self.output / 'assets' / social).is_file())
            home = (self.output / 'en/index.html').read_text()
            self.assertIn('property="og:image" content="' + self.base + 'assets/' + social + '"', home)
            self.assertIn('content="summary_large_image"', home)
        self.assertEqual((self.output / 'test-verification-key-12345.txt').read_text(), 'test-verification-key-12345')
        public_files = [p.relative_to(self.output).as_posix() for p in self.output.rglob('*') if p.is_file()]
        for name in public_files:
            self.assertNotIn(name.split('/')[0], ('.git', '.venv', 'logs', 'data', 'artifacts', 'notebooks', 'api', 'reclab'))
            self.assertNotIn(Path(name).suffix, ('.ipynb', '.pt', '.pkl', '.py', '.pem', '.key'))
        for document in self.documents.values():
            for tag, attrs in document.attributes:
                self.assertFalse(any(key.startswith('on') for key in attrs), (tag, attrs))
            for script in document.scripts:
                self.assertTrue(script.get('src', '').startswith('/project-lab/assets/') or script.get('type') == 'application/ld+json', script)

    def test_saved_figures_tables_and_semantic_navigation_survive_export(self):
        ads = (self.output / 'en/lessons/ads_51/index.html').read_text()
        self.assertEqual(ads.count('saved-dataframe'), 3)
        self.assertTrue(list((self.output / 'assets/figures').glob('*.png')))
        english = (self.output / 'en/lessons/search_35/index.html').read_text()
        self.assertIn('/project-lab/en/lessons/search_task_qrels/', english)
        linked = (self.output / 'en/lessons/search_task_qrels/index.html').read_text()
        self.assertIn('/project-lab/en/lessons/search_bm25/', linked)
        self.assertNotIn('href="/learn/', linked)
        self.assertNotIn('href="/notebooks', linked)

    def test_sanitization_and_local_endpoint_replacement(self):
        dirty = '<h1>Heading</h1><script>bad()</script><p onclick="bad()">Safe <a href="javascript:bad()">link</a><img src="data:text/html,bad"></p>'
        cleaned = sanitize_html(dirty)
        self.assertNotIn('script', cleaned)
        self.assertNotIn('onclick', cleaned)
        self.assertNotIn('javascript:', cleaned)
        self.assertNotIn('<img', cleaned)
        self.assertIn('<h2 id="heading">Heading</h2>', cleaned)
        frame = {'data': {'text/html': '<style>bad()</style><table class="dataframe" onclick="bad()"><tr><td style="color:red">safe</td></tr></table>'}}
        rendered = dataframe_html(frame)
        self.assertIn('<td>safe</td>', rendered)
        self.assertNotIn('bad()', rendered)
        self.assertNotIn('style', rendered)
        item = {'repository': 'https://github.com/owner/repo', 'source_url': 'https://github.com/owner/repo/blob/main/notebooks/en/00.ipynb', 'targets': {'next'}, 'notebook_targets': {'01.ipynb': 'next'}}
        self.assertEqual(resolve_link('./01.ipynb', item, '/project-lab/', 'en'), '/project-lab/en/lessons/next/')
        self.assertEqual(resolve_link('/notebooks?target=next&lang=zh', item, '/project-lab/', 'en'), '/project-lab/en/lessons/next/')
        self.assertEqual(resolve_link('../../reclab/models.py', item, '/project-lab/', 'en'), 'https://github.com/owner/repo/blob/main/reclab/models.py')
        self.assertIn('GETTING_STARTED', resolve_link('http://127.0.0.1:18580', item, '/project-lab/', 'en'))
        self.assertIsNone(resolve_link('javascript:alert(1)', item, '/project-lab/', 'en'))

    def test_refuse_unmarked_nonempty_output_and_invalid_key(self):
        unsafe = Path(self.temporary.name) / 'existing'
        unsafe.mkdir()
        (unsafe / 'keep.txt').write_text('user content')
        with self.assertRaisesRegex(ValueError, 'Refusing'):
            build(unsafe, self.base, self.node)
        self.assertEqual((unsafe / 'keep.txt').read_text(), 'user content')
        with self.assertRaisesRegex(ValueError, 'IndexNow'):
            build(Path(self.temporary.name) / 'badkey', self.base, self.node, '../private')


if __name__ == '__main__':
    unittest.main()
