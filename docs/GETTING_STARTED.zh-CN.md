# 开始学习

[English](GETTING_STARTED.md) · [项目首页](../README.zh-CN.md)

所有课程都可以先阅读，再决定是否下载数据和训练。只读模式与可执行 Lab 使用同一套课程结构。

## 选择开始方式

| 目的 | 需要什么 | 命令或入口 |
|---|---|---|
| 直接读一节课 | 浏览器 | [中文 Notebook](../notebooks) / [English](../notebooks/en) |
| 在本地浏览学习网站 | Git 与 Python 3.9+ | `python3 scripts/preview.py` |
| 运行基础与构造机制课 | 项目 Python 环境 | `./setup.sh --minimal`，再执行 `./lab.sh up` |
| 复现真实数据实验 | 环境、网络、磁盘与 CPU 时间 | 先按下文准备对应领域 |

本地阅读器使用 [127.0.0.1:18580](http://127.0.0.1:18580)，只展示讲解、代码和已保存输出，不执行训练或启动 Jupyter。需要切换到同端口的完整 Lab 时，在阅读器终端按 `Ctrl+C` 停止；如果完整 Lab 已运行，直接使用它。

完整 Lab 中，**阅读课程**打开只读正文，**在 Jupyter 运行**打开项目内核下的可编辑 Notebook。语言切换改变教学文字，不改变实验数据或模型。中英版保留相同实验代码、历史输出和中文语言研究样例；英文版增加一个未执行的目录初始化单元，使较深目录仍定位到同一项目根目录。

## 选择学习路径

如果需要补张量、求导、优化和评估，先学 **31 → 32 → 33 → 34**，再进入一个领域。Notebook 编号是稳定标识，不是全站学习顺序。

| 路径 | 学习顺序 | 学完后应能做到 |
|---|---|---|
| 公用基础 | 31 → 32 → 33 → 34 | 预测张量与梯度形状，区分分数、概率和排序指标。 |
| 搜索 | 35 → 25 → 36–39 → 40 → 26–28 → 41–43 → 29 → 44–46 → 30 | 追踪查询理解、候选和排序，用正确的评估口径定位失败。 |
| 广告 | 47–54 → 19–21 → 55–56 → 22 → 57–62 | 解释请求、资格、预测、分配、支付和反馈，区分模拟收入与真实证据。 |
| 推荐 | 01–10 → 11–15 → 16 | 建立因果行为样本，对照召回方法，检查训练，解释离线评估。 |

搜索 17 和广告 18 / 23 / 24 是主线后的综合参考。推荐 00 是原推荐课程导览；三领域共同先修是 31–34。

**第一次可以这样学：** 读 [31 · 张量](../notebooks/31_Common_Tensors.ipynb)，先猜一个形状，再核对已有输出。之后选择 [35 · 搜索判断](../notebooks/35_Search_Needs_Judgments.ipynb)、[47 · 广告产品](../notebooks/47_Ads_Products.ipynb)或 [01 · 推荐数据](../notebooks/01_Data_Features_ItemCF.ipynb)。执行依赖数据的代码前，先读每课的先修和准备要求。

每节遵循：

1. 读问题、输入约定、证据标记和来源。
2. 先写预测，再看结果。
3. 第一次执行时，从干净内核按顺序运行。
4. 只改一个变量，重跑相关单元，解释差异。
5. 写出一个这次实验**不能支持**的结论。

负结果也有学习价值。搜索微调没有提升、FM 过拟合等结果会保留，而不会靠改评估或重训美化。

## 安装可执行环境

完整流程已在 Apple M1 Pro、16 GB 内存、macOS 15 验证。当前 macOS 安装要求 Apple Silicon 和 macOS 14 以上；Linux / Windows 尚未完成同等范围验收，遇到问题请提供可复现信息。标准库阅读器的依赖要求低于完整训练。

```bash
# 仅 macOS：缺少此运行库时先安装
brew install libomp

# 在仓库根目录执行
./setup.sh --minimal
./lab.sh up
```

安装需要 `uv` 或 Python 3。脚本按 `uv.lock` 创建项目 Python 3.12 环境；找不到合适 uv 时，在项目内安装固定版本，不替换全局 Python。最小安装仍会下载缺少的 Python 和依赖，只是不下载数据、不训练模型。

打开 [Lab](http://127.0.0.1:18580)。Jupyter 位于 `127.0.0.1:18581`，保留 token 认证，由 Lab 的 Notebook 链接处理本机登录。不要把含 token 的地址贴到 issue。

```bash
./lab.sh status
./lab.sh notebook-status
```

使用 **Search Recommendation Ads Lab (Python 3.12)** 内核，并从 Lab 启动课程。停止服务前先保存编辑；`./lab.sh stop` 只停止工作台，`./lab.sh notebook-stop` 会同时停止项目 Jupyter 的内核。

## 准备真实数据实验

在仓库根目录执行。下面都是显式的下载或训练操作，阅读页面不会自动触发。

| 领域 | 命令 | 输入与范围 |
|---|---|---|
| 推荐 + XMRec | `./setup.sh` | 原有输入、推荐基线和四组双塔、XMRec 实验、检查及 11–15 章执行；公开输入约 376 MiB，不含 Python、依赖和生成产物。 |
| 搜索 | `.venv/bin/python -m reclab.search --download` | 约 110 MiB 固定 SciFact / 模型输入；BM25、冻结 MiniLM、融合、线性重排与冻结 TinyBERT。42 章的小预算微调不会因浏览页面自动运行。 |
| 广告 | `.venv/bin/python -m reclab.ads --download` | 约 46 MiB 固定 Criteo 输入；前 200,000 行用于原 CTR 实验。模拟市场与这些日志独立。 |

原完整安装建议至少预留 5 GB，追加实验需要更多空间。下载检查固定字节数和 SHA-256；不要关闭校验来绕过来源变化。重复安装会跳过完整输入，保留成功的原模型；失败实验应先检查，不为了让报告好看而删除。

`./setup.sh --download-only` 安装依赖并校验原推荐 / XMRec 输入，不训练。`./setup.sh --no-notebooks` 完成原准备、训练和检查，但不执行 11–15 章。两种选项都不会自动准备搜索和广告。

真实数据课可能不只需要原文件，还会读取已有实验。按开头说明区分“先下载”“先训练”和可独立运行的构造练习。**Run All 可能启动训练：** 02 章创建推荐新实验；42 章启动小型 TinyBERT 微调；55 章运行 CTR / FM 教学训练，均保留原正式服务模型。

## 遇到问题

| 现象 | 检查方式 |
|---|---|
| 18580 端口被占用 | 打开已有 Lab；或在自己的阅读器终端 `Ctrl+C`。不要终止未知进程。 |
| 缺数据或模型 | 按上表准备该领域。`--minimal` 本来就不会创建真实训练产物。 |
| 下载中断或哈希不符 | 检查网络后重跑同一命令；持续不符时报告 URL 和期望哈希，不绕过验证。 |
| macOS 无法加载 `libomp` | 检查 `brew install libomp` 和 Apple Silicon / macOS 版本要求。 |
| Notebook 导入失败 | 选项目内核，从 Lab 打开；确认 `.venv` 属于当前仓库。 |
| 外部讲义打不开 | 尝试来源条目里的作者仓库或备用入口，报告失败地址。外链可达性与教学单元实现状态是两件事。 |

## 实验协议

以下文档保存方法、历史结果和限制，部分技术记录仍为中文。

- 共用：[Notebook 约定](NOTEBOOK_FIRST.md)、[产品结构](PRODUCT_ARCHITECTURE.md)、[来源与权利](THIRD_PARTY.md)。
- 搜索：[课程说明](SEARCH_COURSE.md)、[微调协议](SEARCH_TRAINING_PROTOCOL.md)、[单元证据](SEARCH_CURRICULUM_COMPLETION.json)、[固定来源](search_sources.json)。
- 广告：[课程约定](ADS_CURRICULUM_GUIDE.md)、[原 CTR 实验](ADS_EXPERIMENTS.md)、[单元证据](ADS_CURRICULUM_COMPLETION.json)、[固定来源](ads_sources.json)。
- 推荐：[深化实验](RECOMMENDATION_DEPTH.md)、[XMRec 方法](XMREC_REPRODUCTION.md)、[原始实测结果](../results/2026-10-30-m1-pro/README.md)。

旧 `SEARCH_LEARNING_ROADMAP.md`、`ADS_LEARNING_ROADMAP.md` 和 `COURSE_AUDIT_SOURCES.json` 的基线行保留的是**补齐之前的审计**。当前核心单元交付看上面的 completion 记录；后续深入工作看[当前路线](ROADMAP.zh-CN.md)。
