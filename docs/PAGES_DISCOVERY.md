# Public course site and search discovery

The GitHub Pages edition publishes the reading experience from this same repository. Its default entry is English; Chinese has its own URL. It contains course explanations, code, recorded outputs and source references. Editable notebooks, training and the full workbench remain local after cloning.

- [Default English entry](https://lynnlee1229.github.io/search-recommendation-ads-lab/)
- [Chinese entry](https://lynnlee1229.github.io/search-recommendation-ads-lab/zh/)
- [Sitemap](https://lynnlee1229.github.io/search-recommendation-ads-lab/sitemap.xml)

## Release status

Published and checked **2026-11-07 (Asia/Shanghai)**. The [initial Pages deployment](https://github.com/lynnlee1229/search-recommendation-ads-lab/actions/runs/42252804679) succeeded for commit `597bbe5`; the [source-integrity workflow](https://github.com/lynnlee1229/search-recommendation-ads-lab/actions/runs/42252804486) also passed. The repository website link and both README entries point to the public site.

Acceptance evidence:

- 136 canonical URLs in the live sitemap returned HTTP 200 with HTML content in a bounded HEAD check. The public root serves English immediately; `/zh/` and matching lesson-language links work in the live browser.
- Six export tests verify all 138 HTML documents, including the root alias and 404: pre-rendered content, project-prefix links/assets/fragments, source navigation, sanitized tables and exclusion of private/runtime files. The build produces 126 bilingual lesson pages.
- Desktop and 390px checks covered the home, first lesson, search path/filter and advertising path/tables. Manual progress survived switching languages and was undone after testing. The live local-run link opens the clone/setup instructions.
- The normal Python-only regression run passed 105 tests; the six static-export tests correctly skipped without Node and passed separately with Node. All 18 JavaScript assertions passed. The submission helper's five boundary/transport checks passed after the curl option was added.
- The host-root robots file returned 200 with `User-agent: *` and no disallow rules. It was inspected, not modified.

One IndexNow POST was attempted after these checks, returning **202 (key validation pending)**. It was not repeated. This confirms neither completed ownership validation nor indexing, and no ranking or inclusion is promised.

Launch receipt (verification key deliberately omitted):

```json
{
  "site": "https://lynnlee1229.github.io/search-recommendation-ads-lab/",
  "sitemap": "https://lynnlee1229.github.io/search-recommendation-ads-lab/sitemap.xml",
  "url_count": 136,
  "endpoint": "https://api.indexnow.org/indexnow",
  "time_utc": "2026-11-06T16:37:25.246644+00:00",
  "submitted": true,
  "status": "key_validation_pending",
  "indexed": "not verified",
  "http_status": 202
}
```

## Deployment and scope

Only the generated static output is uploaded to Pages. Raw datasets, model artifacts, local logs, `.venv`, Git metadata and Jupyter authentication are outside the export. The build does not run experiments. Public pages must have readable HTML without JavaScript, working links under the repository subdirectory, language alternatives and canonical URLs. Notebook links on GitHub remain available as another way to inspect the source.

Build locally with Python 3.9+ and Node 18+ (build tools only; no training dependencies):

```bash
python3 scripts/build_pages.py --output dist --site-url https://lynnlee1229.github.io/search-recommendation-ads-lab/
```

The output follows `/en/`, `/zh/`, language-specific domain paths such as `/en/search/`, and lesson paths such as `/en/lessons/common_31/`, all beneath the project prefix. The default root renders English and points its canonical URL to `/en/`. Home-page `#run-locally` sections link to the full setup guides. Course or source edits rebuild from the canonical catalog and notebooks.

The `.github/workflows/pages.yml` workflow deploys from `main` through the `github-pages` environment. GitHub requires `pages: write` and `id-token: write` for the deployment job; the build job needs only read access. The deployment must depend on the finished build artifact. See [GitHub's workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

Official releases checked for this implementation: [configure-pages v6.0.0](https://github.com/actions/configure-pages/releases/tag/v6.0.0), [upload-pages-artifact v5.0.0](https://github.com/actions/upload-pages-artifact/releases/tag/v5.0.0), and [deploy-pages v5.0.1](https://github.com/actions/deploy-pages/releases/tag/v5.0.1). The documentation examples can lag the release pages.

## A restrained discovery submission

IndexNow supports a verification file inside a host subdirectory. A key placed inside `/search-recommendation-ads-lab/` covers URLs under that prefix. Requests must supply its `keyLocation`. A single JSON POST can include up to 10,000 URLs; this launch needs far fewer. See the [protocol and response reference](https://www.indexnow.org/documentation).

Use `https://api.indexnow.org/indexnow` once after verifying the live sitemap and key file:

```json
{
  "host": "lynnlee1229.github.io",
  "key": "<deployment key>",
  "keyLocation": "https://lynnlee1229.github.io/search-recommendation-ads-lab/<deployment key>.txt",
  "urlList": ["<new canonical page URLs from the published sitemap>"]
}
```

Generate the verifier locally and store it as the repository Actions secret `PAGES_INDEXNOW_KEY`; expose it only as `INDEXNOW_KEY` to the build. Do not commit the key, put it in a command argument, print it in logs, or include it in a submission record. Its published text file must be publicly fetchable for the protocol to work. It proves control of this site's path; it is not a GitHub account credential.

The submission helper defaults to a live sitemap check without sending anything:

```bash
python3 scripts/submit_indexnow.py
```

After making `INDEXNOW_KEY` available through the maintainer's environment and verifying the deployed site, explicitly submit once:

```bash
python3 scripts/submit_indexnow.py --submit --receipt work/pages-indexnow/receipt.json
```

The helper validates the live sitemap against the configured HTTPS prefix and checks the live verification file before sending one request. The ignored `work/` receipt records counts and outcome without the key. This helper is deliberately not an automatic step on every push.

An initial `200` means the request was received; `202` means validation is pending. Neither proves indexing. Stop on `429`; do not rotate identities, keys or endpoints to bypass a limit. If a request fails, preserve the status and diagnostic information before considering any retry. Only genuinely new or changed canonical pages belong in later submissions. These response meanings come from the [protocol](https://www.indexnow.org/documentation); the [FAQ](https://www.indexnow.org/faq) also discourages repeated notifications without meaningful changes.

One participating endpoint shares notifications with other IndexNow engines, so duplicate submissions to every engine are unnecessary. The official endpoint list includes Bing, Naver, Seznam.cz, Yandex, Yep and Amazon's crawler; Google is not listed. See the [IndexNow endpoint list](https://www.indexnow.org/faq). This is ordinary site discovery, not purchased links, synthetic traffic, mass comments or keyword stuffing.

## Google and the project-subdirectory limitation

Google Search Console supports a URL-prefix property for this project's exact HTTPS URL. Verification needs the owner's account-specific HTML file or meta tag, kept at the prescribed public location. A GitHub login alone does not establish Google Search Console ownership. After verification, submit the sitemap there. See [Google's ownership verification instructions](https://support.google.com/webmasters/answer/9008080) and [sitemap submission guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

No Google account was accessed for this research, and no Google submission is claimed. Its old anonymous sitemap-ping endpoint is [retired](https://developers.google.com/search/blog/2023/06/sitemaps-lastmod-ping); sending requests to it would add no useful discovery signal.

Crawler rules live at the host root, `https://lynnlee1229.github.io/robots.txt`. A file under this project's directory is not the effective host-level robots file. This deployment does not modify any separate user Pages site or claim that a project-level `robots.txt` advertises the sitemap to Google. See [Google's robots.txt placement rules](https://developers.google.com/crawling/docs/robots-txt/create-robots-txt). The public navigation, README links and sitemap are still useful discovery paths.

## 中文说明

网页版用于直接阅读中英文课程，默认英文；配套实验与完整工作台仍建议 clone 后在本地运行。正规收录只在网站发布并验收后进行一次适量通知，记录返回状态，不把“已收到”写成“已收录”。

IndexNow 支持本项目子目录内的验证文件，可通过一次提交通知参与引擎。Google 需要对应账号的 Search Console 验证；旧匿名 sitemap ping 已失效。项目子目录内的 robots.txt 不能替代域名根目录文件，因此不会为推广去改动其他 Pages 项目，也不会使用刷量、垃圾外链或反复通知。

### Transport note

The launch connection truncated responses through Python's standard HTTP client. A dry-run with `--transport curl` fetched and parsed the complete live sitemap, and the one actual submission used that explicit HTTP/1.1 transport. This option uses an installed `curl`; it follows no redirects, sends its payload through stdin, and does not retry. Keep `--submit` explicit, and do not repeat a request whose receipt says `transport_outcome_unknown` merely because its response was lost.

```bash
# Read and validate only; this does not notify an engine.
python3 scripts/submit_indexnow.py --transport curl
```

中文版验收：公开站已上线，136个canonical链接均返回200；IndexNow仅提交了一次，返回202，仍待验证与后续抓取。Google未主动提交，仍需账号对应的Search Console验证。
