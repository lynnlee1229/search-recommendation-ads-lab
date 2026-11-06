#!/usr/bin/env python3
"""One deliberate, prefix-scoped IndexNow submission; dry-run unless --submit.

INDEXNOW_KEY is public site-verification material, not a search account token.
Keep it in the deployment secret and environment rather than shell arguments or
receipts. Never retry or fan out automatically; received does not mean indexed.
"""
import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import re
import subprocess
from urllib.error import HTTPError, URLError
from urllib.parse import unquote, urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener
import xml.etree.ElementTree as ET

DEFAULT_SITE = 'https://lynnlee1229.github.io/search-recommendation-ads-lab/'
ENDPOINT = 'https://api.indexnow.org/indexnow'


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def site_url(value):
    p = urlsplit(value)
    if (p.scheme != 'https' or not p.hostname or p.username or p.password
            or p.query or p.fragment or p.port not in (None, 443)):
        raise ValueError('Use a plain HTTPS site URL without credentials, query, or fragment')
    if any(x in ('.', '..') for x in unquote(p.path).split('/')):
        raise ValueError('Site path must not contain dot segments')
    return value.rstrip('/') + '/'


def sitemap_urls(xml, site):
    base = urlsplit(site_url(site))
    root = ET.fromstring(xml)
    if root.tag != '{http://www.sitemaps.org/schemas/sitemap/0.9}urlset':
        raise ValueError('Expected a URL sitemap, not a sitemap index')
    urls = []
    for node in root.findall('{*}url/{*}loc'):
        value = (node.text or '').strip()
        p = urlsplit(value)
        decoded = unquote(p.path)
        if (p.scheme != base.scheme or p.netloc != base.netloc
                or not p.path.startswith(base.path) or not decoded.startswith(base.path)
                or p.query or p.fragment or '\\' in decoded
                or any(x in ('.', '..') for x in decoded.split('/'))):
            raise ValueError('Sitemap contains a URL outside the authorized site prefix')
        if value not in urls:
            urls.append(value)
    if not 1 <= len(urls) <= 10000:
        raise ValueError('One request requires 1–10,000 unique URLs')
    return urls


def fetch(url, transport='urllib'):
    if transport == 'curl':
        response = subprocess.run(['curl', '--http1.1', '--silent', '--show-error',
                                   '--max-time', '25', '--max-filesize', '2000000',
                                   '--proto', '=https', '--write-out', '\n%{http_code}', url],
                                  capture_output=True, timeout=30)
        body, _, status = response.stdout.rpartition(b'\n')
        if response.returncode or status != b'200' or len(body) > 2_000_000:
            raise ValueError('Live verification failed; no notification sent')
        return body
    request = Request(url, headers={'User-Agent': 'SearchRecAdsLab-IndexNow/1.0'})
    with build_opener(NoRedirect).open(request, timeout=25) as response:
        data = response.read(2_000_001)
        if len(data) > 2_000_000:
            raise ValueError('Verification response exceeded the size limit')
        return data


def post_once(body, transport='urllib'):
    if transport == 'curl':
        response = subprocess.run(['curl', '--http1.1', '--silent', '--show-error',
                                   '--max-time', '25', '--proto', '=https',
                                   '--request', 'POST', '--header', 'Content-Type: application/json; charset=utf-8',
                                   '--data-binary', '@-', '--output', os.devnull,
                                   '--write-out', '%{http_code}', ENDPOINT],
                                  input=body, capture_output=True, timeout=30)
        return int(response.stdout) if response.returncode == 0 and response.stdout.isdigit() else None
    request = Request(ENDPOINT, data=body, method='POST', headers={
        'Content-Type': 'application/json; charset=utf-8',
        'User-Agent': 'SearchRecAdsLab-IndexNow/1.0'})
    with build_opener(NoRedirect).open(request, timeout=25) as response:
        return response.status


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--site-url', default=DEFAULT_SITE)
    parser.add_argument('--submit', action='store_true', help='Send exactly one POST after live ownership verification')
    parser.add_argument('--transport', choices=('urllib', 'curl'), default='urllib', help='Use curl HTTP/1.1 if the local Python HTTP stack receives truncated responses; neither transport retries')
    parser.add_argument('--receipt', type=Path, help='Save a non-secret JSON receipt')
    args = parser.parse_args()
    site = site_url(args.site_url)
    urls = sitemap_urls(fetch(site + 'sitemap.xml', args.transport), site)
    receipt = {'site': site, 'sitemap': site + 'sitemap.xml', 'url_count': len(urls),
               'endpoint': ENDPOINT, 'time_utc': datetime.now(timezone.utc).isoformat(),
               'submitted': False, 'status': 'dry_run', 'indexed': 'not verified'}
    if args.submit:
        key = os.environ.get('INDEXNOW_KEY', '').strip()
        if not re.fullmatch(r'[a-zA-Z0-9-]{8,128}', key):
            raise ValueError('Set a valid INDEXNOW_KEY environment variable')
        location = site + key + '.txt'
        if fetch(location, args.transport).decode('utf-8').strip() != key:
            raise ValueError('Live key verification failed; no URLs submitted')
        body = json.dumps({'host': urlsplit(site).hostname, 'key': key,
                           'keyLocation': location, 'urlList': urls}).encode('utf-8')
        try:
            status = post_once(body, args.transport)
        except HTTPError as error:
            status = error.code
        except (URLError, TimeoutError, OSError, subprocess.TimeoutExpired):
            status = None
        receipt.update(submitted=True, http_status=status,
                       status={200: 'received', 202: 'key_validation_pending',
                               None: 'transport_outcome_unknown'}.get(status, 'not_accepted'))
    if args.receipt:
        args.receipt.parent.mkdir(parents=True, exist_ok=True)
        args.receipt.write_text(json.dumps(receipt, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(receipt, indent=2))
    return 1 if receipt['status'] in ('not_accepted', 'transport_outcome_unknown') else 0


if __name__ == '__main__':
    raise SystemExit(main())
