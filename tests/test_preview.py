"""Data-free reader contracts, runnable with the Python standard library."""

from contextlib import contextmanager
import http.client
from http.server import ThreadingHTTPServer
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import threading
import unittest
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from reclab.learning_catalog import catalog, lesson, notebook_path
from scripts.preview import PreviewHandler


class QuietHandler(PreviewHandler):
    def log_message(self, *_args):
        pass


class CourseReaderTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), QuietHandler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def request(self, path, method='GET', headers=None):
        conn = http.client.HTTPConnection('127.0.0.1', self.server.server_port, timeout=10)
        conn.request(method, path, headers=headers or {})
        response = conn.getresponse()
        data = response.read()
        status = response.status
        response_headers = dict(response.getheaders())
        conn.close()
        return status, data, response_headers

    def test_both_languages_cover_the_same_courses_and_sources(self):
        for lang in ('zh', 'en'):
            content = catalog(lang, 'preview')
            self.assertEqual([(m['id'], m['lesson_count']) for m in content['modules']],
                             [('common', 4), ('search', 19), ('ads', 23), ('recommendation', 17)])
            self.assertEqual(len(content['lessons']), 63)
            ownership = [n for m in content['modules'] for p in m['phases'] for n in p['chapters']]
            self.assertEqual(sorted(ownership), list(range(63)))
            self.assertTrue(all(x['available'] for x in content['lessons']))
            self.assertTrue(all(x['run_url'] is None for x in content['lessons']))
            for module in content['modules']:
                for unit in module['units']:
                    self.assertTrue(unit['objective'] and unit['limitation'] and unit['references'])
                    for ref in unit['references']:
                        self.assertEqual(urlsplit(ref['url']).scheme, 'https')
                        self.assertTrue(ref['locator'] and ref['scope'])
            self.assertFalse(content['runtime']['can_execute'])

    def test_every_lesson_reads_without_execution_and_follows_semantic_order(self):
        for lang in ('zh', 'en'):
            content = catalog(lang, 'preview')
            for row in content['lessons']:
                item = lesson(row['target'], lang, 'preview')
                self.assertEqual(item['chapter'], row['chapter'])
                self.assertEqual(item['lang'], lang)
                self.assertTrue(item['cells'])
                self.assertIsNone(item['run_url'])
                self.assertEqual(item['source_url'].endswith(row['file']), True)
            self.assertEqual(lesson('search_35', lang)['next']['target'], 'search_task_qrels')
            self.assertEqual(lesson('ads_47', lang)['next']['target'], 'ads_48')

    def test_http_reader_and_catalog_are_available_without_runtime_assets(self):
        for path in ('/', '/api/learning?lang=en', '/api/lessons/common_31?lang=zh',
                     '/learn/ads_47?lang=en', '/static/vendor/marked.min.js'):
            status, data, headers = self.request(path)
            self.assertEqual(status, 200, (path, data[:100]))
            self.assertTrue(data)
            self.assertEqual(headers['X-Content-Type-Options'], 'nosniff')
        status, data, _ = self.request('/api/learning?lang=en')
        self.assertEqual(json.loads(data)['runtime'], {'mode': 'preview', 'can_execute': False})
        status, data, headers = self.request('/api/learning?lang=en', 'HEAD')
        self.assertEqual(status, 200)
        self.assertEqual(data, b'')
        self.assertGreater(int(headers['Content-Length']), 0)

    def test_only_explicit_reading_surfaces_are_exposed(self):
        for path in ('/.git/config', '/logs/jupyter-runtime', '/data/raw', '/static/../.git/config',
                     '/static/%2e%2e/%2e%2e/.git/config', '/learn/models', '/api/lessons/../models'):
            self.assertEqual(self.request(path)[0], 404, path)
        self.assertEqual(self.request('/api/learning?lang=fr')[0], 422)
        self.assertEqual(self.request('/notebooks?target=common_31')[0], 503)
        self.assertEqual(self.request('/api/train', 'POST')[0], 405)
        self.assertEqual(self.request('/api/health', headers={'Host': 'untrusted.example'})[0], 400)
        for target in ('../service', 'models', 'lab', 'unregistered'):
            with self.assertRaises(KeyError):
                notebook_path(target)

    def test_course_imports_do_not_load_ml_or_web_dependencies(self):
        code = 'import sys; from reclab.learning_catalog import catalog; catalog(); assert not set(("torch", "numpy", "fastapi", "nbformat")) & set(sys.modules)'
        result = subprocess.run([sys.executable, '-c', code], cwd=ROOT, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_minimal_setup_installs_only_environment_and_kernel(self):
        # A fresh checkout with stub executables proves this branch never downloads
        # datasets or trains. It does not modify the developer's real environment.
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / 'setup.sh').write_bytes((ROOT / 'setup.sh').read_bytes())
            (root / 'fake-bin').mkdir()
            (root / '.venv/bin').mkdir(parents=True)
            calls = root / 'calls.txt'
            scripts = {
                root / 'fake-bin/uname': '#!/bin/sh\necho Linux\n',
                root / 'fake-bin/uv': '#!/bin/sh\nif [ "$1" = --version ]; then echo "uv 0.13.6"; else echo "uv $*" >> "$CALLS"; fi\n',
                root / '.venv/bin/python': '#!/bin/sh\necho "python $*" >> "$CALLS"\n',
            }
            for path, text in scripts.items():
                path.write_text(text)
                path.chmod(0o755)
            env = {**os.environ, 'PATH': str(root / 'fake-bin') + os.pathsep + os.environ.get('PATH', ''), 'CALLS': str(calls)}
            result = subprocess.run(['bash', 'setup.sh', '--minimal'], cwd=root, env=env, capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            commands = calls.read_text().splitlines()
            self.assertEqual(len(commands), 2, commands)
            self.assertEqual(commands[0], 'uv sync --frozen --group dev --group notebooks')
            self.assertIn('python -m ipykernel install', commands[1])
            self.assertFalse((root / 'data').exists())
            self.assertFalse((root / 'artifacts').exists())


if __name__ == '__main__':
    unittest.main()
