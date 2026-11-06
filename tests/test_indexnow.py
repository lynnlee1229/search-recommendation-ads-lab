"""Submission boundaries: no foreign hosts, paths, credentials, or redirect tricks."""
import importlib.util
from contextlib import redirect_stdout
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from types import SimpleNamespace

spec = importlib.util.spec_from_file_location('submit_indexnow', Path(__file__).resolve().parents[1] / 'scripts/submit_indexnow.py')
submission = importlib.util.module_from_spec(spec)
spec.loader.exec_module(submission)
SITE = submission.DEFAULT_SITE


def xml(*urls):
    return '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + ''.join(
        '<url><loc>' + u + '</loc></url>' for u in urls) + '</urlset>'


class IndexNowBoundaries(unittest.TestCase):
    def test_curl_posts_once_with_payload_on_stdin_and_no_redirect_or_retry(self):
        payload = b'{"key":"verification-material"}'
        with patch.object(submission.subprocess, 'run', return_value=SimpleNamespace(returncode=0, stdout=b'202')) as run:
            self.assertEqual(submission.post_once(payload, 'curl'), 202)
            self.assertEqual(run.call_count, 1)
            command = run.call_args.args[0]
            self.assertEqual(run.call_args.kwargs['input'], payload)
            self.assertNotIn('verification-material', ' '.join(command))
            self.assertNotIn('--retry', command)
            self.assertNotIn('--location', command)
            self.assertNotIn('-L', command)

    def test_ambiguous_post_is_recorded_without_retry_or_key_leak(self):
        key = '0123456789abcdef0123456789abcdef'
        with tempfile.TemporaryDirectory() as directory:
            receipt = Path(directory) / 'receipt.json'
            with patch('sys.argv', ['submit_indexnow.py', '--submit', '--receipt', str(receipt)]), \
                 patch.dict('os.environ', {'INDEXNOW_KEY': key}), \
                 patch.object(submission, 'fetch', side_effect=[xml(SITE + 'en/').encode(), key.encode()]), \
                 patch.object(submission, 'build_opener') as opener, redirect_stdout(io.StringIO()):
                opener.return_value.open.side_effect = TimeoutError()
                self.assertEqual(submission.main(), 1)
                self.assertEqual(opener.return_value.open.call_count, 1)
            record = json.loads(receipt.read_text())
            self.assertEqual(record['status'], 'transport_outcome_unknown')
            self.assertNotIn(key, receipt.read_text())

    def test_valid_canonical_paths_are_deduplicated(self):
        self.assertEqual(submission.sitemap_urls(xml(SITE + 'en/', SITE + 'zh/', SITE + 'en/'), SITE), [SITE + 'en/', SITE + 'zh/'])

    def test_foreign_or_ambiguous_urls_fail_before_submission(self):
        urls = ['https://other.example/en/', 'https://lynnlee1229.github.io/other/',
                SITE + '../outside/', SITE + '%2e%2e/outside/', SITE + '%5c../outside/',
                SITE + 'en/?tracking=1', SITE + 'en/#fragment', SITE.replace('https:', 'http:')]
        for url in urls:
            with self.subTest(url=url), self.assertRaises(ValueError):
                submission.sitemap_urls(xml(url), SITE)

    def test_empty_sitemap_or_unverified_base_fails(self):
        with self.assertRaises(ValueError):
            submission.sitemap_urls(xml(), SITE)
        for base in ['http://example.com/', 'https://user:password@example.com/', SITE + '../']:
            with self.subTest(base=base), self.assertRaises(ValueError):
                submission.site_url(base)


if __name__ == '__main__':
    unittest.main()
