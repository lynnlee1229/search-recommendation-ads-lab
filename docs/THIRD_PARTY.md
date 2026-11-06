# Third-party sources, attribution, and rights

[Project overview](../README.md) · [中文首页](../README.zh-CN.md) · [License scope](../LICENSE.md)

This Lab is an independent teaching project. Authors and publishers retain the rights to their courses, papers, datasets, code, and models. A public link is a source reference, not an endorsement or a grant to relicense the linked work. The Lab's original lessons connect these sources to small, inspectable experiments; they are not official course materials.

本 Lab 是独立教学项目。课程、论文、数据、源码与模型保留原作者或发布方权利。公开链接用于说明来源，不代表作者背书，也不等于可重新授权原件。Lab 自编课程将资料与小实验对应，不是作者官方配套课。

## Course references / 课程资料

| Source | How it is used | Provenance and boundary |
|---|---|---|
| [Shusen Wang, Recommender System](https://github.com/wangshusen/RecommenderSystem) | Recommendation syllabus and topic references | 45 Chinese PDFs mapped in [curriculum.json](curriculum.json). Original URLs and SHA-256 in [DATA_DOWNLOADS.json](../DATA_DOWNLOADS.json). PDFs are downloaded locally and excluded from Git. |
| [Shusen Wang, Search Engine](https://github.com/wangshusen/SearchEngine/tree/7339c6b126e314abdb74a89adb033d39d8e3d37b) | Search's six-module structure and published lectures | Fixed revision `7339c6b…`. Nine PDF links exist in the audited outline; later sections are outline-level references. A complete published slide series is not claimed. |
| [BERT](https://arxiv.org/abs/1810.04805v2) and [Passage Re-ranking with BERT](https://arxiv.org/abs/1901.04085v5) | Pair inputs and cross-encoder reranking concepts | Links to the papers; the tiny Lab fine-tune is not a reproduction of their full training recipes. |
| [刘鹏、王超《计算广告》第2版](https://read.douban.com/ebook/371259701/) | Advertising product and market syllabus | Only the publicly supplied table of contents and introduction inform the source audit; the paid book is not bundled or claimed to have been fully reviewed. |
| [《计算传播学导论》, Chapter 8 · 计算广告](https://github.com/SocratesClub/ccrbook/blob/6dbd5650f2adc6e257e5bd5d156bc50a72560ee9/slides/Chapter%208%20%E8%AE%A1%E7%AE%97%E5%B9%BF%E5%91%8A.pptx) | Chinese concepts, products, matching, and auction reference | Authors: 张伦、王成军、许小可. Book-companion repository; fixed revision `6dbd5650…`. One 96-slide chapter, not an entire modern advertising engineering course. Original PPT is linked, not redistributed. |
| [Computational Advertising 2015, SocratesClub](https://github.com/SocratesClub/computational-advertising-2015) | Course topics for auctions, matching, and sponsored search | A course repository/syllabus; not a claim that every lecture deck is available. |
| [Weinan Zhang and Jian Xu, CIKM 2016 RTB tutorial](https://wnzhang.net/slides/cikm-16-rtb-full.pdf) | RTB, response estimation, bidding, attribution, pacing, targeting, and reserve prices | Author-hosted English slides, 164 PDF pages. Historical examples describe the tutorial's setting, not current platform rules. Lab mechanisms are independently scoped. |
| [Weinan Zhang, RTB papers](https://github.com/wnzhang/rtb-papers/tree/ddf66afe2371778a54671e7890d12cb8a4d7dd7f) | Further reading | A paper index, not a lecture deck or evidence that the Lab reproduces each paper. |

The detailed source-role audit is [COURSE_AUDIT_SOURCES.json](COURSE_AUDIT_SOURCES.json). Per-unit source references explain the distinction between a source's topic and a Lab extension. The English Lab notebooks translate the Lab's teaching explanations; they do not translate or relicense third-party courses.

## Data and model provenance / 数据和模型来源

| Input | Original source | Recorded terms and local use |
|---|---|---|
| Retailrocket ecommerce interactions | [Retailrocket's Kaggle dataset](https://www.kaggle.com/datasets/retailrocket/ecommerce-dataset) | Source terms remain applicable. The original archive hash is pinned in [DATA_DOWNLOADS.json](../DATA_DOWNLOADS.json); raw logs and trained weights are not tracked. |
| WSDM 2022 XMRec | [Official competition data](https://github.com/hamedrab/wsdm22_cup_xmrec/tree/f5b1f087a4054537cd8f46bf346f978094b8467e) | Fixed official revision and file hashes in [xmrec_sources.json](xmrec_sources.json). Public visibility does not itself establish a blanket reuse license; consult the original competition/data terms. |
| BEIR SciFact | [Publisher dataset card](https://huggingface.co/datasets/BeIR/scifact) | Manifest records CC-BY-SA-4.0. Fixed corpus, query, and qrels revisions are in [search_sources.json](search_sources.json). |
| MiniLM and TinyBERT model snapshots | [all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2), [ms-marco-TinyBERT-L2-v2](https://huggingface.co/cross-encoder/ms-marco-TinyBERT-L-2-v2) | Manifest records Apache-2.0 for the pinned models. See exact revisions and file hashes in [search_sources.json](search_sources.json); weights stay local. |
| Criteo click logs | [Criteo AI Lab](https://ailab.criteo.com/download-criteo-1tb-click-logs-dataset/) and [Criteo's dataset card](https://huggingface.co/datasets/criteo/CriteoClickLogs) | Publisher card identifies CC-BY-NC-SA-4.0. The fixed shard, first-200,000-row selection, and sampling limits are in [ads_sources.json](ads_sources.json). A code license does not remove the dataset's restrictions. |

Hashes detect byte changes against the recorded inputs; they do not independently prove a publisher's identity, establish data representativeness, or grant rights. Third-party excerpts or data values shown in saved outputs retain applicable third-party rights.

哈希用于识别固定输入是否变化，不独立证明发布者身份、数据代表性或使用许可。Criteo 数据带有非商业使用等原许可约束；代码许可不会消除这些要求。保存输出中包含的第三方文本或数据也保留原权利。

## OPDAI XMRec code lineage / XMRec 源码归属

The selected champion components are attributed to [OPDAI's WSDM 2022 XMRec solution](https://github.com/opdai/wsdm2022-xmrec-top1-solution), fixed at `8af3260368b1980a85a555fc470caa84bf6697d6`.

- `reclab/competition/memory.py` identifies itself as a sparse port of `src/retrieval/icf_v2.py` and `icf_v3.py`.
- `reclab/competition/graph.py` identifies itself as a LightGCN/BPR port compared with `src/retrieval/lgcn_v2/model.py`.
- `reclab/competition/reference.py` loads named definitions from five hash-checked upstream files downloaded to ignored `data/xmrec/upstream/winner/`. Those original files are not redistributed in this repository.
- [xmrec_sources.json](xmrec_sources.json) records the exact source hashes; [XMREC_REPRODUCTION.md](XMREC_REPRODUCTION.md) records the method and recipe differences.

**Upstream license review is unresolved.** In the 2026-11-06 attribution review, the public repository page and the five locally pinned source files did not provide a license grant. A complete repository-tree license check could not be established because the API was rate-limited and an archive request was interrupted. This is not a claim that no license exists anywhere. The Lab does not assert permission to relicense upstream-derived material: `memory.py` and `graph.py` are excluded in full from its original-material MIT grant. Obtain the relevant upstream permission or clarification before relying on additional reuse rights.

**上游许可核验尚未解决。** 2026-11-06 检查的官方仓库页面和五份固定源码未提供明确授权；完整目录核验受 API 限流和归档下载中断影响。这不等于断言整个上游任何位置都没有许可。Lab 不声称拥有移植内容的再许可权，两份移植文件整体排除在原创部分 MIT 授权之外；需要额外复用权时应向上游确认。

## Bundled dependencies / 随仓依赖

If third-party browser assets are present under `web/vendor/`, their own notices and licenses apply. Python packages are installed from the lockfile and retain their individual licenses; installing them does not change those licenses. Keep notices when adding or updating a dependency, and do not label the entire repository as uniformly MIT.

Third-party originals remain outside the repository where the project uses download-and-verify workflows. The [original-material license](../LICENSE.md) does not supersede source terms or grant endorsement rights.
