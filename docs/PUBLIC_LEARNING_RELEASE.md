# Bilingual learning experience · 2026-11-07

The existing Lab now has a reading-first interface and English companions. This iteration changes access, teaching presentation and provenance; it does not claim new model improvements or close the industrial-depth gaps in [the roadmap](ROADMAP.md).

## Delivered

- Four curriculum-led domains: foundations 4, search 19, advertising 23, recommendation 17. Algorithms remain inside their domains.
- 63 English companions translating 404 instructional Markdown cells. All 292 original experiment code cells, saved outputs and execution counts are preserved. Each companion adds one unexecuted setup cell to locate the repository and put it on `sys.path`.
- A bilingual catalog with 48 semantic units, source roles and limitations, and 56 original-material entries: 45 recommendation lectures, 9 search PDFs, and 2 advertising slide decks. These are references to originals, not redistributed course content or claims of complete reproduction.
- Read-only lesson pages, previous/next navigation in curriculum order, language persistence, optional local progress, safe saved-table and figure rendering, and Jupyter links that retain the chosen language.
- A standard-library preview that needs no package installation, datasets or models. `setup.sh --minimal` installs the locked execution environment without data downloads or training.
- English/Chinese README, setup guide and current roadmap; contribution templates; scoped original-material licensing and third-party notices; data-free CI.

## Verification

| Check | Observed result |
|---|---|
| Full local regression suite | 101 pytest tests passed on the existing M1 Pro environment. One upstream TestClient deprecation warning. |
| JavaScript | 14 assertions across navigation, language state, mathematical Markdown, relative links and table eligibility passed. |
| Translation integrity | 63 notebooks; 404 translated Markdown cells; 292 original experiment cells unchanged. Source-cell digests, relative links and unexpected untranslated prose checked. |
| English notebook structure | 63 nbformat validations and 355 code-cell syntax checks passed; setup works from the English folder, including isolated Python imports. No experiment was retrained for translation. |
| Reading isolation | 126 bilingual lesson APIs read successfully while dataset loading and Jupyter startup were forbidden. |
| Zero-install fixture | Actual browser read the 23-lesson advertising path and chapter 47 from a temporary copy with no `data`, `artifacts` or `.venv`. Execution links were absent. Fixture removed after QA. |
| Minimal install contract | A fresh-directory stub run invoked only locked environment sync and kernel registration, with no datasets or training. This does not claim a new cross-platform dependency installation. |
| Desktop UI | Chinese/English home, search path, BERT lesson, advertising source mappings and filtering checked in Chrome. Existing hybrid search returned five documents; a real advertising sample produced raw/sigmoid/isotonic probabilities; the seeded auction returned results with budget constraints satisfied. |
| Narrow screen | At 390 px: search, advertising and recommendation paths, advertising references, and English readers 31/51/47 had document width 390 px. |
| Progress and links | Manual completion survived language switch and reload; test mark then removed. Chapter 25 links resolve to local readers with the selected language. |
| Saved tables | Three chapter-51 DataFrames rendered; no inline styles or event attributes remained in their tables. |
| Documentation and assets | 133 local links across public entry documents passed. Pinned local renderer hashes matched the manifest. |

Original notebooks and model artifacts were preserved. The pre-existing local kernel-display-name edit in notebook 35 was left outside this change. Full-workbench service uses the original localhost port; user Jupyter kernels were not stopped.

The CI workflow is added as part of this release; local results above are distinct from any subsequent GitHub Actions run. Linux/Windows full training workflows remain unverified. Stanford's original IIR host closed connections in the source check, so the source card states its availability limitation. Original source languages and reuse terms still apply.

## 中文说明

本轮面向新学习者完善公开入口：先读课程，再选择是否安装与运行；四个领域保留清楚层级。中英文教材讲同一组实验，真实数据、构造机制和模拟市场分开标注，来源按章节/页码定位。

101项本机Python回归与14项JavaScript断言通过；63本英文教材保留292格原实验代码及输出。桌面、390px窄屏、无数据阅读、章节跳转与进度持久化已实测。这里只验收学习体验，不将教学覆盖等同真实业务效果，也不声称重新训练出了更好的模型。进阶缺口继续见[当前路线](ROADMAP.zh-CN.md)。
