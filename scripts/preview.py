#!/usr/bin/env python3
"""Zero-install, read-only local course reader. Python 3.9+; no ML imports."""

import argparse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import mimetypes
from pathlib import Path
import sys
from urllib.parse import parse_qs, unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from reclab.learning_catalog import catalog, lesson, read_document  # noqa: E402


class PreviewHandler(BaseHTTPRequestHandler):
    server_version = 'LearningReader/1'

    def send_bytes(self, body, status=200, mime='application/json; charset=utf-8'):
        self.send_response(status)
        self.send_header('Content-Type', mime)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'no-referrer')
        self.end_headers()
        if self.command != 'HEAD':
            self.wfile.write(body)

    def send_json(self, value, status=200):
        self.send_bytes(json.dumps(value, ensure_ascii=False).encode('utf-8'), status)

    def serve_file(self, path):
        if not path.is_file():
            self.send_json({'detail': 'Not found'}, 404)
            return
        mime = mimetypes.guess_type(path.name)[0] or 'application/octet-stream'
        if mime.startswith('text/') or mime in ('application/javascript', 'application/json'):
            mime += '; charset=utf-8'
        self.send_bytes(path.read_bytes(), mime=mime)

    def do_HEAD(self):
        self.do_GET()

    def do_GET(self):
        try:
            host = urlsplit('//' + self.headers.get('Host', '')).hostname
        except ValueError:
            host = None
        if host not in ('localhost', '127.0.0.1'):
            self.send_json({'detail': 'Local host required'}, 400)
            return
        request = urlsplit(self.path)
        path = unquote(request.path)
        lang = parse_qs(request.query).get('lang', ['zh'])[0]
        try:
            if path == '/':
                self.serve_file(ROOT / 'web/index.html')
            elif path.startswith('/static/'):
                root = (ROOT / 'web').resolve()
                target = (root / path[len('/static/'):]).resolve()
                if root not in target.parents:
                    self.send_json({'detail': 'Not found'}, 404)
                else:
                    self.serve_file(target)
            elif path.startswith('/learn/'):
                lesson(path[len('/learn/'):], lang, 'preview')
                self.serve_file(ROOT / 'web/reader.html')
            elif path == '/api/health':
                self.send_json({'status': 'ok', 'mode': 'preview', 'data_ready': False})
            elif path == '/api/learning':
                self.send_json(catalog(lang, 'preview'))
            elif path.startswith('/api/lessons/'):
                self.send_json(lesson(path[len('/api/lessons/'):], lang, 'preview'))
            elif path == '/api/notebooks':
                self.send_json({'notebooks': catalog(lang, 'preview')['lessons']})
            elif path == '/api/curriculum':
                self.send_json(read_document('curriculum.json'))
            elif path in ('/api/search/course', '/api/ads/course'):
                self.send_json(read_document(path.split('/')[2] + '_course.json'))
            elif path == '/api/experiments':
                self.send_json({'experiments': []})
            elif path == '/api/job':
                self.send_json({'state': 'idle', 'mode': 'preview'})
            elif path.startswith('/api/') or path == '/notebooks':
                self.send_json({'detail': 'Reading mode. Run ./setup.sh --minimal, then ./lab.sh up for execution; domain experiments also need their documented data setup.'}, 503)
            else:
                self.send_json({'detail': 'Not found'}, 404)
        except KeyError:
            self.send_json({'detail': 'Unknown lesson'}, 404)
        except ValueError:
            self.send_json({'detail': 'Choose lang=zh or lang=en'}, 422)

    def do_POST(self):
        self.send_json({'detail': 'The course reader is read-only'}, 405)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=18580)
    args = parser.parse_args()
    if not 1 <= args.port <= 65535:
        parser.error('port must be between 1 and 65535')
    try:
        server = ThreadingHTTPServer(('127.0.0.1', args.port), PreviewHandler)
    except OSError as exc:
        parser.exit(1, f'Cannot bind local port {args.port}: {exc}. An existing Lab may already be running; no process was stopped.\n')
    print(f'Course reader: http://127.0.0.1:{args.port} — read-only; Ctrl+C to stop.', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
