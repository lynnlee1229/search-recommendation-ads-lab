# Learning roadmap and open work

[简体中文](ROADMAP.zh-CN.md) · [Start learning](GETTING_STARTED.md) · [Contribute](../CONTRIBUTING.md)

The current release contains 63 lessons: foundations 4, search 19, advertising 23, and recommendation 17. Search S01–S18 and advertising A01–A18 have runnable support for their **core teaching objectives**. Several objectives intentionally use constructed examples. This roadmap describes the next depth of learning, not missing navigation entries or a claim of production completeness.

## Delivered foundation

- Four domain-owned paths with prerequisites, source references, and evidence labels.
- Bilingual learning text and English companion notebooks; executable experiments and historical outputs are preserved.
- Read-only lessons before environment installation, then an explicit path to Jupyter and optional data preparation.
- Real recommendation, search, and CTR experiments, with isolated teaching runs and retained negative results.
- Source manifests, per-unit completion records, and reproducibility protocols.

The historical pre-implementation audits are kept for traceability. Current delivery evidence lives in [search completion](SEARCH_CURRICULUM_COMPLETION.json) and [advertising completion](ADS_CURRICULUM_COMPLETION.json). Those files record teaching acceptance, not blanket claims of complete course or paper reproduction.

## Highest-value next experiments

These are proposed directions, not scheduled promises. A useful contribution starts with a learning question and an attainable evaluation, then chooses the implementation.

| Area | Current lesson and limit | Next deliverable | Acceptance evidence |
|---|---|---|---|
| Search · query understanding | 36–39 use dictionary segmentation and rules for intent/rewrite | A small trained intent or rewrite model on a clearly licensed dataset | Train/select/test split by query or session; rule baseline; rejected/ambiguous examples; retrieval errors as well as prediction accuracy |
| Search · semantic retrieval | 27 uses frozen MiniLM; 42 fine-tunes a tiny cross-encoder | A bounded dual-encoder training comparison | Fixed candidates and split; loss/embedding-change evidence; retrieval recall, memory, and cost; new isolated run |
| Search · ANN | 28 compares exact retrieval with a coarse cluster index | HNSW or FAISS as a separately named implementation | Exact-search oracle; recall/latency/memory curves under equal conditions; deletion/incremental behavior explicitly tested or excluded |
| Search · query suggestions | 45 uses constructed sessions | Licensed real query/session suggestions with leakage controls | Defined prefix/related-query tasks; time-aware split; popularity baseline; privacy and data-source review |
| Ads · conversion and delay | 56 uses constructed conversion and censoring | A real conversion/delay dataset with a defensible observation window | Explicit exposure/click/conversion denominators; delayed labels; selection bias analysis; no clicks relabeled as real conversions |
| Ads · attribution and incrementality | 59 demonstrates accounting and known randomization | A study whose available data support the claimed estimator | Separate attribution from causal lift; document assignment/propensity assumptions; falsification or sensitivity checks; no IPS claim without propensities |
| Ads · delivery systems | 52 and 62 are request/feedback and single-process ledger mechanisms | A bounded OpenRTB adapter or transactional ledger extension | Contract fixtures, duplicate/retry handling, budget invariants, failure tests; no claim of production RTB certification |
| Ads · control | 58 uses integral-style error feedback | Compare a documented controller or optimization method | Matched markets/seeds, spend constraints, value/spend trade-offs, drift and sparse-traffic failures |
| Recommendation · method depth | 03–10 include mechanism exercises; 11–15 reproduce selected XMRec core components | One clearly scoped real-data extension to a mechanism lesson | Match the stated method, control capacity and training budget, preserve split isolation, explain the difference from a full paper recipe |
| Shared · portability | Full workflow validated on an Apple Silicon Mac | A verified Linux path, followed by a documented Windows path | Clean environment log, dependency/runtime requirements, no-data reader check, one real-data run, and stated unsupported features |

## Small contributions with immediate value

| Contribution | A useful pull request contains |
|---|---|
| Explain one confusing cell | The learner's question, revised explanation in both languages, and the input/output it refers to |
| Correct a source mapping | Author link, pinned revision where possible, exact chapter/topic/page, and a clear distinction between reference and reproduction |
| Fix a translation | The original sentence, corrected English, and terminology checked in the surrounding experiment |
| Add a counterexample | A short deterministic case that exposes a wrong assumption, plus a meaningful assertion |
| Report a platform problem | OS/architecture, command, sanitized error, and the smallest reproducible case |
| Improve accessibility | A reproducible keyboard, contrast, or small-screen issue and verification of the repair |

Use the [issue templates](https://github.com/lynnlee1229/search-recommendation-ads-lab/issues/new/choose) to describe a concrete learning problem. Source rights and attribution remain part of accepting a contribution; see [third-party notes](THIRD_PARTY.md).

## What stays consistent

Course structure follows the subject, not the available experiments. New tools stay under their domain. Shared methods stay in foundations. Real logs, constructed examples, and simulated markets remain distinct. Teaching runs never silently replace formal models, and failed or negative results are not rewritten into gains.
