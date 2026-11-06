# Contributing / 参与贡献

[Project overview](README.md) · [项目介绍](README.zh-CN.md) · [Roadmap](docs/ROADMAP.md) · [后续路线](docs/ROADMAP.zh-CN.md)

Contributions should make a learning question easier to understand, reproduce, or evaluate. A small explanation fix is as useful as a new model. You can write issues and pull requests in English or Chinese.

贡献的目标是让一个学习问题更容易理解、复现或评估。小段解释修正和新增模型同样有价值；issue 与 PR 可用中文或英文。

## Before changing a lesson / 修改课程前

Read the [notebook conventions](docs/NOTEBOOK_FIRST.md), the relevant domain protocol, and [third-party attribution](docs/THIRD_PARTY.md). For a substantial new lesson, open a curriculum issue describing its place in the path, prerequisites, source, evidence type, and a bounded acceptance experiment. For a typo or clearly reproducible bug, a direct PR is fine.

先读 [Notebook 约定](docs/NOTEBOOK_FIRST.md)、领域协议和[第三方说明](docs/THIRD_PARTY.md)。新建较大课程前，请用课程 issue 说明路径位置、先修、来源、证据类型和可验收实验。错字或明确的 bug 可以直接提 PR。

Keep these invariants:

- Preserve the four top-level domains. A model, tool, source, or record belongs inside its domain.
- Explain whether a result uses real logs, constructed examples, or a simulated market. Name the limitation beside the result.
- Keep train/select/calibration/audit roles distinct. Do not tune against the reported audit set or turn a previously observed test set into a new blind benchmark.
- Create new experiment runs; do not overwrite frozen reports, replace formal models with workshop runs, or retrain only to make a result look better.
- Do not commit datasets, third-party slides, weights, credentials, token URLs, or per-example predictions. Preserve attribution and upstream rights.
- Update both learning languages. Translate the explanation, not scientific identifiers or Chinese text that is itself the experimental input.

请保持四模块归属、真实/构造/模拟区分、数据切分和负结果；新增实验另存，教学 run 不替换正式模型。不要上传数据、第三方课件、权重、凭据或逐条预测。中英解释同步；研究输入中的中文和代码标识符无需为了语言切换而改变。

## Local development / 本地开发

```bash
python3 scripts/preview.py       # read-only site, Python 3.9+ standard library
./setup.sh --minimal             # project environment; no dataset/model training
./lab.sh up                     # executable workbench
```

Stop your own reader before starting the full Lab on the same port. Preserve other people's notebooks and running kernels. The training environment is project-scoped; changes should not alter system Python or security/network settings.

在同一端口启动完整 Lab 前，先停止自己的阅读器；保留其他人的 Notebook 和运行中内核。依赖放在项目内，不修改系统 Python 或安全/网络配置。

## Validate the change / 验证改动

The lightweight CI checks the reading experience and repository contracts without downloading datasets or training models:

```bash
python3 .github/scripts/check_docs.py
python3 scripts/check_notebook_translations.py
python3 -m unittest discover -s tests -p 'test_preview*.py'
node --test tests/*.test.cjs
```

For numerical/model changes, run the relevant tests with `.venv/bin/python -m pytest -q tests/test_<area>.py`. The full `pytest` suite includes XMRec reference/data checks that require the original setup. A fresh clone without those inputs is not a valid environment for every integration test. Report the exact checks and any missing prerequisites; do not report skipped data checks as a reproduced experiment.

New or materially changed executable lessons must also run sequentially in a clean project kernel, retain meaningful outputs, and be inspected as rendered content. Re-execute only the lessons your change affects; avoid rerunning training notebooks for a prose-only fix. Check both UI languages, keyboard navigation, direct URLs, and a narrow viewport when changing the interface.

数值或模型改动要运行对应测试；全套 pytest 包含依赖原数据和源码的 XMRec 检查，新克隆不能假设全部可跑。新课或实质修改的代码课需要清洁内核顺序执行、保留有效输出并检查渲染。纯文字修正无需重训。界面改动应检查双语、键盘、深链接和窄屏。

## Pull requests / 提交 PR

Use the PR template to describe the learner-visible problem, the resulting behavior, and validation. For experiments, include a compact aggregate result, the fixed protocol, and the negative or inconclusive outcomes. Link sources at the chapter, paper, or author page that supports the claim.

Use the smallest useful scope. New dependencies need a reason that an existing component cannot meet; update the lockfile when they are necessary. A full-paper reproduction claim requires the actual recipe, data, and evaluation evidence; a mechanism lesson should be described as a mechanism lesson.

PR 先写学习者遇到的问题、修改后的行为和验证。实验附精简结果、固定协议和负结果；来源链接应指向支持该结论的章节、论文或作者页面。范围保持可审阅；新增依赖说明必要性并同步锁文件。机制练习按机制练习描述，不包装成完整论文复现。

Please be specific and respectful in discussion. Reproducible counterexamples and corrections are welcome. See [license scope](LICENSE.md) before contributing third-party material; the Lab's license does not grant rights over external courses, datasets, models, or excluded source ports.

讨论请具体、尊重他人，欢迎可复现的反例与纠错。加入第三方内容前请看[许可范围](LICENSE.md)；Lab 的许可不会替外部课程、数据、模型或明确排除的移植源码授予权利。
