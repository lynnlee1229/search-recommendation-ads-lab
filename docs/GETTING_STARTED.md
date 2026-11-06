# Start learning

[简体中文](GETTING_STARTED.zh-CN.md) · [Project overview](../README.md)

You can read every lesson before downloading data or training anything. The reader and the executable Lab use the same course structure.

## Choose how to start

| Goal | What you need | Command or link |
|---|---|---|
| Read a lesson now | A browser | [English notebooks](../notebooks/en) / [中文](../notebooks) |
| Browse the local learning site | Git and Python 3.9+ | `python3 scripts/preview.py` |
| Run foundation and constructed-mechanism lessons | Project Python environment | `./setup.sh --minimal`, then `./lab.sh up` |
| Reproduce real-data experiments | Environment, network access, disk, CPU time | Prepare the domain below before running its lessons |

The local reader serves [127.0.0.1:18580](http://127.0.0.1:18580). It is read-only: it shows explanations, code, and recorded outputs, and does not train models or start Jupyter. Use `Ctrl+C` in its terminal to stop it before starting the full Lab on the same port. If the full Lab is already running, use it instead.

In the full Lab, **Read lesson** opens the reader; **Run in Jupyter** opens an editable notebook with the project kernel. Switching the interface language changes the learning text, not the experiment's data or model. Experiment code, saved outputs, and Chinese language examples are retained between notebook editions. English companions add one unexecuted setup cell so their deeper directory resolves to the same project root.

## Choose a learning path

Start with **31 → 32 → 33 → 34** if you need tensors, differentiation, optimization, or evaluation. Then choose one domain. Notebook numbers are stable identifiers, not a global study order.

| Path | Learning order | By the end, you should be able to… |
|---|---|---|
| Foundations | 31 → 32 → 33 → 34 | Predict shapes and gradients; distinguish a score, a probability, and a ranking metric. |
| Search | 35 → 25 → 36–39 → 40 → 26–28 → 41–43 → 29 → 44–46 → 30 | Trace a query from interpretation to candidates and ranking; diagnose a failure using the right evaluation contract. |
| Advertising | 47–54 → 19–21 → 55–56 → 22 → 57–62 | Explain a request, eligibility, prediction, allocation, payment, and feedback without confusing simulated revenue with real evidence. |
| Recommendation | 01–10 → 11–15 → 16 | Build a causal behavior sample, compare candidate generation, inspect training, and interpret offline evaluation. |

Search 17 and advertising 18 / 23 / 24 are comprehensive references after the main path. Recommendation 00 is the original recommendation overview; foundations 31–34 are the common prerequisite for all domains.

**A useful first session:** read [31 · Tensors](../notebooks/en/31_Common_Tensors.ipynb), predict one shape, and check the recorded output. Then choose [35 · Search judgments](../notebooks/en/35_Search_Needs_Judgments.ipynb), [47 · Ad products](../notebooks/en/47_Ads_Products.ipynb), or [01 · Recommendation data](../notebooks/en/01_Data_Features_ItemCF.ipynb). Use the lesson's prerequisites before executing code that needs data.

For each lesson:

1. Read the question, input contract, evidence label, and source reference.
2. Write down a prediction before looking at the result.
3. Run from a clean kernel when executing the lesson for the first time.
4. Change one variable, rerun the affected cells, and explain the difference.
5. State one conclusion the experiment does **not** support.

A negative result is still a result. Search fine-tuning and FM examples deliberately retain outcomes that did not improve the chosen metric.

## Install the executable environment

The full environment has been tested on an Apple M1 Pro with 16 GB RAM, using macOS 15. The current macOS setup requires Apple Silicon and macOS 14 or newer. Linux and Windows have not received the same full workflow acceptance; report a reproducible platform issue rather than assuming support. The standard-library reader has a smaller dependency surface than training.

```bash
# macOS only: install this runtime if it is missing
brew install libomp

# From the repository root
./setup.sh --minimal
./lab.sh up
```

The setup needs `uv` or Python 3. It creates project-local Python 3.12 and dependencies from `uv.lock`. If a suitable `uv` is unavailable, it bootstraps the fixed version inside the project. It does not replace your global Python. Even minimal setup downloads Python/dependencies when absent; it skips datasets and model training.

Open [the Lab](http://127.0.0.1:18580). Jupyter listens on `127.0.0.1:18581` and retains token authentication. The Lab's notebook link handles the local login. Do not copy token URLs into issues.

```bash
./lab.sh status
./lab.sh notebook-status
```

Use the **Search Recommendation Ads Lab (Python 3.12)** kernel. Start notebooks through the Lab so they use the project setup. Save your edits before stopping a service. `./lab.sh stop` stops the workbench; `./lab.sh notebook-stop` also stops the project's Jupyter kernels.

## Prepare real-data experiments

Run commands from the repository root. These are explicit downloads and training jobs; reading lessons never runs them automatically.

| Domain | Command | Input and scope |
|---|---|---|
| Recommendation + XMRec | `./setup.sh` | Original public-input setup, recommendation baselines and four two-tower variants, XMRec experiments, checks, and notebooks 11–15. Public inputs are about 376 MiB, excluding Python/dependencies and generated artifacts. |
| Search | `.venv/bin/python -m reclab.search --download` | About 110 MiB of fixed SciFact/model inputs. BM25, frozen MiniLM, fusion, linear reranking, and frozen TinyBERT. The separate lesson 42 fine-tune is not run by merely browsing. |
| Advertising | `.venv/bin/python -m reclab.ads --download` | About 46 MiB of fixed Criteo input; the first 200,000 rows support the original CTR experiment. The market simulation is separate from those logs. |

Reserve at least 5 GB for the original full setup and more for additional runs. Downloads validate recorded byte counts and SHA-256; do not disable verification to work around a changed file. Rerunning setup skips valid inputs and preserves successful original models. Inspect failed runs before retrying; do not delete them to make a report look cleaner.

`./setup.sh --download-only` installs dependencies and checks the original recommendation/XMRec inputs without training. `./setup.sh --no-notebooks` runs the original preparation, training, and checks without executing notebooks 11–15. Search and advertising remain opt-in in either case.

A real-data notebook can require more than raw files: some inspect an existing run. Use its opening cell and domain protocol to distinguish “download first,” “train first,” and a stand-alone constructed exercise. **Run All can train:** lesson 02 creates a new recommendation run; lesson 42 creates a small TinyBERT fine-tune; lesson 55 runs a CTR/FM workshop. They preserve formal serving models.

## When something fails

| Symptom | What to check |
|---|---|
| Port 18580 is in use | Open the existing Lab, or stop your own reader with `Ctrl+C`. Do not terminate an unknown process. |
| Missing data or model | Prepare that domain above. Installing `--minimal` intentionally does not create real-data artifacts. |
| Hash mismatch or interrupted download | Rerun the same download after checking the network. If bytes still differ, report the source URL and expected hash without bypassing validation. |
| `libomp` cannot be loaded on macOS | Confirm `brew install libomp` completed and the machine meets the Apple Silicon/macOS requirement. |
| Notebook import fails | Choose the project kernel and launch through the Lab. Confirm `.venv` belongs to this checkout. |
| Original lecture fails to load | Use its author repository or alternate source link in the source entry; report which URL failed. Availability does not determine whether a teaching unit is implemented. |

## Experiment protocols

These documents preserve detailed methodology, historical results, and known limitations; some technical records are currently in Chinese.

- Shared: [notebook conventions](NOTEBOOK_FIRST.md), [product architecture](PRODUCT_ARCHITECTURE.md), [sources and rights](THIRD_PARTY.md).
- Search: [course](SEARCH_COURSE.md), [fine-tuning protocol](SEARCH_TRAINING_PROTOCOL.md), [unit evidence](SEARCH_CURRICULUM_COMPLETION.json), [fixed source manifest](search_sources.json).
- Advertising: [curriculum guide](ADS_CURRICULUM_GUIDE.md), [original CTR experiment](ADS_EXPERIMENTS.md), [unit evidence](ADS_CURRICULUM_COMPLETION.json), [fixed source manifest](ads_sources.json).
- Recommendation: [deeper experiments](RECOMMENDATION_DEPTH.md), [XMRec methodology](XMREC_REPRODUCTION.md), [original measured results](../results/2026-10-30-m1-pro/README.md).

The older `SEARCH_LEARNING_ROADMAP.md`, `ADS_LEARNING_ROADMAP.md`, and baseline rows in `COURSE_AUDIT_SOURCES.json` retain the **pre-implementation audit**. Use the completion records above for delivered core units and the [current roadmap](ROADMAP.md) for deeper work.
