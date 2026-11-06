#!/usr/bin/env python3
"""Export the bilingual reading experience for any static host.

Python standard library + Node 18+ are build dependencies only. No datasets,
models, package installation, execution kernels or network access are used.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
from html import escape
from html.parser import HTMLParser
import importlib.util
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import struct
import sys
import tempfile
import unicodedata
from urllib.parse import parse_qs, quote, unquote, urljoin, urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from reclab.learning_catalog import catalog, lesson

DEFAULT_SITE = 'https://lynnlee1229.github.io/search-recommendation-ads-lab/'
LANGUAGES = ('en', 'zh')
SITE_TITLE = 'Search, Recommendation & Ads Lab'
UPSTREAM_XMREC = 'https://github.com/opdai/wsdm2022-xmrec-top1-solution/blob/8af3260368b1980a85a555fc470caa84bf6697d6/'


def text(value):
    return ''.join(value) if isinstance(value, list) else str(value or '')


def normalized_site(value):
    parsed = urlsplit(value)
    if parsed.scheme not in ('https', 'http') or not parsed.netloc or parsed.query or parsed.fragment or parsed.username:
        raise ValueError('--site-url must be an HTTP(S) origin and optional project path')
    if '..' in unquote(parsed.path).split('/'):
        raise ValueError('The site path cannot contain traversal segments')
    return value.rstrip('/') + '/'



def image_dimensions(path):
    """Read PNG/JPEG dimensions without installing an imaging package."""
    data = path.read_bytes()
    if path.suffix == '.png' and data[:8] == b'\x89PNG\r\n\x1a\n' and data[12:16] == b'IHDR':
        return struct.unpack('>II', data[16:24])
    if path.suffix == '.jpg' and data[:2] == b'\xff\xd8':
        position = 2
        while position + 8 < len(data):
            if data[position] != 0xff:
                break
            while position < len(data) and data[position] == 0xff:
                position += 1
            marker = data[position]
            position += 1
            length = int.from_bytes(data[position:position + 2], 'big')
            if marker in (0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf):
                height, width = struct.unpack('>HH', data[position + 3:position + 7])
                return width, height
            if length < 2 or marker in (0xda, 0xd9):
                break
            position += length
    raise ValueError('The optional social image must match its PNG or JPEG extension')


def page_path(lang, module=None, target=None):
    if target:
        return f'{lang}/lessons/{quote(target)}/'
    return f'{lang}/{module}/' if module else f'{lang}/'


def setup_url(repository, lang):
    return repository + '/blob/main/docs/GETTING_STARTED' + ('.zh-CN' if lang == 'zh' else '') + '.md'


def resolve_link(value, item, base_path, lang, image=False):
    """Preserve public links, localize lessons, and replace local-only endpoints."""
    value = value.strip()
    if not value or any(ord(ch) < 32 for ch in value):
        return None
    if value.startswith('#'):
        return value
    parsed = urlsplit(value)
    if parsed.scheme and parsed.scheme not in ('https', 'http', 'mailto'):
        return None
    if image and parsed.scheme == 'mailto':
        return None
    if parsed.hostname in ('localhost', '127.0.0.1', '::1'):
        return setup_url(item['repository'], lang)
    if parsed.scheme or parsed.netloc:
        return value if parsed.scheme != '' else 'https:' + value
    if parsed.path in ('/notebooks', '/notebooks/') or parsed.path.startswith('/learn/'):
        target = parse_qs(parsed.query).get('target', [None])[0] if parsed.path.startswith('/notebooks') else parsed.path.rstrip('/').split('/')[-1]
        if target in item['targets']:
            return base_path + page_path(lang, target=target) + ('#' + parsed.fragment if parsed.fragment else '')
        return setup_url(item['repository'], lang)
    if parsed.path.startswith(('/api/', '/static/')) or parsed.path == '/':
        return setup_url(item['repository'], lang)
    resolved = urljoin(item['source_url'], value)
    name = unquote(urlsplit(resolved).path.rsplit('/', 1)[-1])
    if name in item['notebook_targets'] and not image:
        return base_path + page_path(lang, target=item['notebook_targets'][name]) + ('#' + parsed.fragment if parsed.fragment else '')
    # These ignored upstream files exist locally but are not distributed in this repo.
    marker = '/data/xmrec/upstream/winner/'
    if marker in resolved:
        return UPSTREAM_XMREC + resolved.split(marker, 1)[1]
    # GitHub's blob pages are documents, not image bytes.
    if image and '/blob/main/' in resolved and resolved.startswith(item['repository']):
        resolved = resolved.replace('https://github.com/', 'https://raw.githubusercontent.com/', 1).replace('/blob/main/', '/main/', 1)
    return resolved


class SafeHTML(HTMLParser):
    """Conservative HTML allowlist for Markdown and saved notebook tables.

    Script/style contents are discarded. We do not pass through event handlers,
    inline styles, forms, embedded documents, SVG, arbitrary classes or IDs.
    """
    TAGS = set('p br hr strong em b i s del code pre blockquote ul ol li h1 h2 h3 h4 h5 h6 a img table thead tbody tfoot tr th td caption div span details summary sup sub kbd dl dt dd'.split())
    TABLE_TAGS = set('table caption thead tbody tfoot tr th td'.split())
    VOID = {'br', 'hr', 'img'}
    DROP = {'script', 'style', 'iframe', 'object', 'embed', 'svg', 'math', 'template', 'form', 'textarea'}

    def __init__(self, link_resolver=None, headings=None, used_ids=None, table_only=False):
        super().__init__(convert_charrefs=True)
        self.parts = []
        self.stack = []
        self.drop_stack = []
        self.link_resolver = link_resolver or (lambda value, image=False: value if urlsplit(value).scheme in ('https', 'http') else None)
        self.headings = headings if headings is not None else []
        self.used_ids = used_ids if used_ids is not None else set()
        self.table_only = table_only
        self.active_heading = None

    def handle_starttag(self, tag, attrs):
        if self.drop_stack:
            if tag in self.DROP:
                self.drop_stack.append(tag)
            return
        if tag in self.DROP:
            self.drop_stack.append(tag)
            return
        allowed = self.TABLE_TAGS if self.table_only else self.TAGS
        if tag not in allowed:
            return
        attrs = dict(attrs)
        clean = {}
        out_tag = 'h2' if tag == 'h1' else tag
        if tag in ('a', 'img'):
            key = 'href' if tag == 'a' else 'src'
            value = self.link_resolver(attrs.get(key, ''), image=tag == 'img')
            if value:
                clean[key] = value
                if tag == 'a' and urlsplit(value).scheme in ('http', 'https'):
                    clean.update(target='_blank', rel='noopener noreferrer')
            if tag == 'img':
                if not value:
                    return
                clean.update(alt=attrs.get('alt') or 'Lesson illustration', loading='lazy')
            if attrs.get('title'):
                clean['title'] = attrs['title']
        if tag in ('td', 'th'):
            for key in ('colspan', 'rowspan'):
                if attrs.get(key, '').isdigit() and 0 < int(attrs[key]) < 100:
                    clean[key] = attrs[key]
            if attrs.get('scope') in ('row', 'col', 'rowgroup', 'colgroup'):
                clean['scope'] = attrs['scope']
        if tag == 'ol' and re.fullmatch(r'\d{1,5}', attrs.get('start', '')):
            clean['start'] = attrs['start']
        if tag in ('code', 'div', 'span'):
            value = attrs.get('class', '')
            if value in ('math-block', 'math-inline') or re.fullmatch(r'language-[a-zA-Z0-9_-]+', value):
                clean['class'] = value
        if re.fullmatch(r'h[1-6]', tag):
            placeholder = f'__heading_{len(self.parts)}__'
            clean['id'] = placeholder
            self.active_heading = {'position': len(self.parts), 'placeholder': placeholder, 'text': [], 'level': int(out_tag[1:])}
        self.parts.append('<' + out_tag + ''.join(f' {k}="{escape(v, quote=True)}"' for k, v in clean.items()) + '>')
        if tag not in self.VOID:
            self.stack.append((tag, out_tag))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in self.VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        if self.drop_stack:
            if tag == self.drop_stack[-1]:
                self.drop_stack.pop()
            return
        if not any(t[0] == tag for t in self.stack):
            return
        while self.stack:
            original, output = self.stack.pop()
            self.parts.append(f'</{output}>')
            if original == tag:
                break
        if re.fullmatch(r'h[1-6]', tag) and self.active_heading:
            heading = self.active_heading
            title = ''.join(heading['text']).strip()
            slug = re.sub(r'[^\w\s-]', '', unicodedata.normalize('NFKC', title).lower())
            slug = re.sub(r'\s+', '-', slug).strip('-') or 'section'
            candidate, suffix = slug, 1
            while candidate in self.used_ids:
                candidate = f'{slug}-{suffix}'
                suffix += 1
            self.used_ids.add(candidate)
            self.parts[heading['position']] = self.parts[heading['position']].replace(heading['placeholder'], escape(candidate, quote=True))
            self.headings.append({'id': candidate, 'title': title, 'level': heading['level']})
            self.active_heading = None

    def handle_data(self, value):
        if self.drop_stack:
            return
        self.parts.append(escape(value))
        if self.active_heading:
            self.active_heading['text'].append(value)

    def result(self):
        while self.stack:
            self.parts.append(f'</{self.stack.pop()[1]}>')
        return ''.join(self.parts)


def sanitize_html(value, **kwargs):
    parser = SafeHTML(**kwargs)
    parser.feed(value)
    parser.close()
    return parser.result()


def dataframe_html(output):
    raw = text(output.get('data', {}).get('text/html'))
    if len(re.findall(r'<table\b', raw, re.I)) != 1 or not re.search(r'<table\b[^>]*\bclass\s*=\s*[\"\'][^\"\']*\bdataframe\b', raw, re.I):
        return None
    cleaned = sanitize_html(raw, table_only=True).strip()
    if not cleaned.startswith('<table>') or not cleaned.endswith('</table>'):
        return None
    return '<div class="table-wrap saved-dataframe">' + cleaned + '</div>'


def output_text(output):
    if output.get('output_type') == 'stream':
        return text(output.get('text'))
    if output.get('output_type') == 'error':
        body = f"{output.get('ename', 'Error')}: {output.get('evalue', '')}\n" + '\n'.join(output.get('traceback', []))
        return re.sub(r'\x1b\[[0-9;]*m', '', body)
    return text(output.get('data', {}).get('text/plain') or output.get('data', {}).get('text/markdown'))


def render_cells(item, rendered_markdown, output, base_path):
    sections, headings = [], []
    used_ids = {'main', 'page-title', 'lesson-title', 'references', 'lesson-content', 'lesson-sources', 'mark-complete'}
    used_ids.update(f'code-{n}' for n in range(1, sum(cell['cell_type'] == 'code' for cell in item['cells']) + 1))
    lang = item['lang']
    code_number = 0
    for cell in item['cells']:
        kind = cell['cell_type']
        if kind == 'markdown':
            clean = sanitize_html(rendered_markdown[text(cell['source'])], link_resolver=lambda value, image=False: resolve_link(value, item, base_path, lang, image), headings=headings, used_ids=used_ids)
            sections.append('<section class="markdown-cell">' + clean + '</section>')
        elif kind == 'code':
            code_number += 1
            code_id = f'code-{code_number}'
            copy = '复制代码' if lang == 'zh' else 'Copy code'
            section = f'<section class="code-cell"><div class="cell-label"><span>PYTHON · {code_number:02d}</span><button type="button" data-copy-code="{code_id}" class="copy-code" hidden>{copy}</button></div><pre><code id="{code_id}">{escape(text(cell["source"]))}</code></pre>'
            outputs = []
            for recorded in cell.get('outputs', []):
                table = dataframe_html(recorded)
                plain = output_text(recorded)
                if table:
                    outputs.append(table)
                elif plain:
                    outputs.append('<pre>' + escape(plain) + '</pre>')
                elif recorded.get('data', {}).get('text/html'):
                    outputs.append('<pre>' + escape(text(recorded['data']['text/html'])) + '</pre>')
                png = re.sub(r'\s', '', text(recorded.get('data', {}).get('image/png')))
                if png:
                    try:
                        image = base64.b64decode(png, validate=True)
                    except (ValueError, base64.binascii.Error):
                        image = b''
                    if image.startswith(b'\x89PNG\r\n\x1a\n'):
                        name = hashlib.sha256(image).hexdigest() + '.png'
                        folder = output / 'assets/figures'
                        folder.mkdir(exist_ok=True, parents=True)
                        (folder / name).write_bytes(image)
                        alt = 'Notebook 保存的图表' if lang == 'zh' else 'Saved notebook figure'
                        outputs.append(f'<img src="{base_path}assets/figures/{name}" alt="{alt}" loading="lazy">')
            if outputs:
                label = 'Notebook 保存的输出 · 本页未执行' if lang == 'zh' else 'Saved notebook output · not executed on this page'
                section += '<details class="cell-output" open><summary>' + label + '</summary>' + ''.join(outputs) + '</details>'
            sections.append(section + '</section>')
        elif kind == 'raw':
            sections.append('<pre class="raw-cell">' + escape(text(cell['source'])) + '</pre>')
    return '\n'.join(sections), headings


def metadata(context, kind):
    e = lambda value: escape(str(value), quote=True)
    canonical, alternates = context['canonical'], context['alternates']
    parts = [f'<link rel="canonical" href="{e(canonical)}">']
    for lang, url in alternates.items():
        parts.append(f'<link rel="alternate" hreflang="{lang}" href="{e(url)}">')
    for key, value in {'og:type': 'article' if kind == 'lesson' else 'website', 'og:site_name': SITE_TITLE, 'og:title': context['title'], 'og:description': context['description'], 'og:url': canonical, 'og:locale': 'zh_CN' if context['lang'] == 'zh' else 'en_US'}.items():
        parts.append(f'<meta property="{key}" content="{e(value)}">')
    social = context.get('social_image')
    if social:
        alt = 'English homepage of the bilingual course reader' if context['lang'] == 'en' else '双语课程阅读站的英文首页'
        for key, value in {'og:image': social['url'], 'og:image:width': social['width'], 'og:image:height': social['height'], 'og:image:type': social['type'], 'og:image:alt': alt}.items():
            parts.append(f'<meta property="{key}" content="{e(value)}">')
        parts.extend(['<meta name="twitter:card" content="summary_large_image">', f'<meta name="twitter:image" content="{e(social["url"])}">', f'<meta name="twitter:image:alt" content="{e(alt)}">'])
    else:
        parts.append('<meta name="twitter:card" content="summary">')
    if kind == '404':
        parts.append('<meta name="robots" content="noindex,follow">')
    else:
        schema = {'@context': 'https://schema.org', '@type': 'LearningResource' if kind == 'lesson' else 'CollectionPage', 'name': context['title'], 'description': context['description'], 'url': canonical, 'inLanguage': 'zh-CN' if context['lang'] == 'zh' else 'en', 'isAccessibleForFree': True}
        if kind == 'lesson':
            schema.update(learningResourceType='Notebook lesson', isBasedOn=context['lesson']['source_url'])
        parts.append('<script type="application/ld+json">' + json.dumps(schema, ensure_ascii=False).replace('<', '\\u003c') + '</script>')
    return '\n'.join(parts)


def load_renderer():
    path = ROOT / 'web/public/render.py'
    spec = importlib.util.spec_from_file_location('lab_public_renderer', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.render_html


def render_markdown(sources, node):
    unique = sorted(set(sources))
    completed = subprocess.run([node, str(ROOT / 'scripts/render_pages_markdown.cjs')], input=json.dumps(unique), text=True, capture_output=True, check=True, timeout=90, cwd=ROOT)
    parsed = json.loads(completed.stdout)
    if len(parsed) != len(unique):
        raise ValueError('Markdown render count mismatch')
    return dict(zip(unique, parsed))


def build(output, site_url=DEFAULT_SITE, node=None, indexnow_key=None):
    site_url = normalized_site(site_url)
    output = Path(output).resolve()
    if output == ROOT or output in ROOT.parents or output == Path(output.anchor):
        raise ValueError('Output must be a dedicated generated directory')
    if output.exists() and any(output.iterdir()) and not (output / '.lab-pages-export').is_file():
        raise ValueError('Refusing to replace a nonempty directory without the export marker')
    if indexnow_key and not re.fullmatch(r'[a-zA-Z0-9-]{8,128}', indexnow_key):
        raise ValueError('IndexNow key must contain 8–128 letters, numbers or hyphens')
    node = node or os.environ.get('NODE') or shutil.which('node')
    if not node:
        raise ValueError('Node 18+ is needed only to build; pass --node /path/to/node')
    base_path = urlsplit(site_url).path
    render_html = load_renderer()
    catalogs = {lang: catalog(lang, 'preview') for lang in LANGUAGES}
    items = []
    for lang, content in catalogs.items():
        notebook_targets = {row['file']: row['target'] for row in content['lessons']}
        targets = set(notebook_targets.values())
        by_chapter = {row['chapter']: row for row in content['lessons']}
        for row in content['lessons']:
            row['read_url'] = base_path + page_path(lang, target=row['target'])
            item = lesson(row['target'], lang, 'preview')
            item.update(repository=content['repository'], notebook_targets=notebook_targets, targets=targets)
            item['read_url'] = row['read_url']
            for neighbor in ('previous', 'next'):
                if item[neighbor]:
                    item[neighbor]['read_url'] = base_path + page_path(lang, target=item[neighbor]['target'])
            items.append(item)
        for module in content['modules']:
            module['url'] = base_path + page_path(lang, module=module['id'])
            module['start_url'] = by_chapter[module['phases'][0]['chapters'][0]]['read_url']
    rendered = render_markdown([text(cell['source']) for item in items for cell in item['cells'] if cell['cell_type'] == 'markdown'], node)
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='lab-pages-build-', dir=output.parent) as temporary:
        destination = Path(temporary)
        (destination / '.lab-pages-export').write_text('Generated by scripts/build_pages.py\n', encoding='utf-8')
        assets = destination / 'assets'
        assets.mkdir()
        for name in ('site.css', 'site.js', 'favicon.svg'):
            source = ROOT / 'web/public' / name
            if not source.is_file():
                raise ValueError(f'Missing public UI asset: {name}')
            shutil.copy2(source, assets / name)
        social = None
        social_path = next((ROOT / 'web/public' / name for name in ('social.jpg', 'social.png') if (ROOT / 'web/public' / name).is_file()), None)
        if social_path:
            width, height = image_dimensions(social_path)
            shutil.copy2(social_path, assets / social_path.name)
            social = {'url': urljoin(site_url, base_path + 'assets/' + social_path.name), 'width': width, 'height': height, 'type': 'image/jpeg' if social_path.suffix == '.jpg' else 'image/png'}
        vendor = ROOT / 'web/vendor/katex'
        for source in sorted(vendor.rglob('*')):
            if source.is_file() and not source.is_symlink() and (source.suffix in ('.css', '.js', '.woff', '.woff2', '.ttf') or source.name == 'LICENSE'):
                target = assets / 'vendor/katex' / source.relative_to(vendor)
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source, target)
        urls = []
        def write_page(kind, lang, module=None, item=None, root_alias=False):
            relative = page_path(lang, module=module['id'] if module else None, target=item['target'] if item else None)
            if kind == '404':
                relative = '404.html'
            canonical = site_url + relative
            alternates = {key: site_url + page_path(key, module=module['id'] if module else None, target=item['target'] if item else None) for key in LANGUAGES}
            alternates['x-default'] = alternates['en']
            content_html, toc = render_cells(item, rendered, destination, base_path) if item else ('', [])
            title = item['title'] if item else module['title'] if module else ('搜推广告学习 Lab' if lang == 'zh' else SITE_TITLE)
            description = item['summary'] if item else module['description'] if module else ('沿原始课程学习搜索、推荐与计算广告。中英双语课程、实验代码与已保存结果；完整实验请 clone 到本地运行。' if lang == 'zh' else 'Learn search, recommendation and computational advertising through 63 bilingual notebook lessons, original sources and recorded experiments. Read online; clone the Lab to run experiments.')
            if kind == '404':
                title = 'Page not found · ' + SITE_TITLE
                description = 'Choose a learning path to continue.'
            context = dict(lang=lang, base_path=base_path, home_url=base_path + page_path(lang), canonical=canonical, alternates=alternates, catalog=catalogs[lang], module=module, lesson=item, content_html=content_html, toc=toc, title=title, description=description, setup_url=setup_url(catalogs[lang]['repository'], lang))
            context['social_image'] = social
            context['head_extra'] = metadata(context, kind)
            html = render_html(kind, context)
            path = destination / ('index.html' if root_alias else relative if relative.endswith('.html') else relative + 'index.html')
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(html, encoding='utf-8')
            if not root_alias and kind != '404':
                urls.append(canonical)
        for lang in LANGUAGES:
            write_page('home', lang)
            for module in catalogs[lang]['modules']:
                write_page('module', lang, module=module)
            for item in (item for item in items if item['lang'] == lang):
                write_page('lesson', lang, module=next(m for m in catalogs[lang]['modules'] if m['id'] == item['module']), item=item)
        write_page('home', 'en', root_alias=True)
        write_page('404', 'en')
        namespace = 'http://www.sitemaps.org/schemas/sitemap/0.9'
        ET.register_namespace('', namespace)
        sitemap = ET.Element('{' + namespace + '}urlset')
        for url in urls:
            entry = ET.SubElement(sitemap, '{' + namespace + '}url')
            ET.SubElement(entry, '{' + namespace + '}loc').text = url
        ET.ElementTree(sitemap).write(destination / 'sitemap.xml', encoding='utf-8', xml_declaration=True)
        (destination / '.nojekyll').write_text('', encoding='utf-8')
        # Project-level robots.txt is informational; crawlers use the host-root file.
        (destination / 'robots.txt').write_text('User-agent: *\nAllow: /\nSitemap: ' + site_url + 'sitemap.xml\n', encoding='utf-8')
        if indexnow_key:
            (destination / (indexnow_key + '.txt')).write_text(indexnow_key, encoding='utf-8')
        manifest = {'site_url': site_url, 'canonical_pages': len(urls), 'lesson_pages': len(items), 'languages': list(LANGUAGES), 'urls': urls}
        manifest['files'] = len([p for p in destination.rglob('*') if p.is_file()]) + 1
        manifest['bytes_before_manifest'] = sum(p.stat().st_size for p in destination.rglob('*') if p.is_file())
        (destination / 'build-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        if output.exists():
            shutil.rmtree(output)
        shutil.copytree(destination, output)
    return manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT / 'work/pages')
    parser.add_argument('--site-url', default=DEFAULT_SITE)
    parser.add_argument('--node', help='Path to Node 18+; default NODE environment variable or PATH')
    parser.add_argument('--indexnow-key', default=os.environ.get('INDEXNOW_KEY', ''), help='Optional public IndexNow verification key; no automatic submission')
    args = parser.parse_args()
    try:
        manifest = build(args.output, args.site_url, args.node, args.indexnow_key)
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        parser.exit(1, f'Build failed: {error}\n')
    print(json.dumps({key: value for key, value in manifest.items() if key != 'urls'}, indent=2))


if __name__ == '__main__':
    main()
