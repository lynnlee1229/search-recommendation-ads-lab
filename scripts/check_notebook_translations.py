#!/usr/bin/env python3
"""Check English companions against source content without executing experiments.

Uses only Python's standard library. Source metadata (for example a local kernel
display name) may differ; any changed source cell requires translation review.
Historical code, execution counts, outputs, and cell metadata must remain exact.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
# Actual language examples intentionally retain Chinese characters and provide
# English explanations. This allowlist does not exempt other instructional prose.
CHINESE_EXAMPLES = {"研究生命起源", "研究生", "命", "起源", "研究", "生命", "量子", "便宜跑鞋", "二手跑鞋"}


def cell_digest(cells: list[dict]) -> str:
    serialized = json.dumps(cells, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(serialized.encode()).hexdigest()


def check(root: Path = ROOT) -> dict:
    manifest = json.loads((root / "docs/notebooks.en.json").read_text())
    entries = manifest["notebooks"]
    sources = {p.name: p for p in (root / "notebooks").glob("*.ipynb")}
    translated = {p.name: p for p in (root / "notebooks/en").glob("*.ipynb")}
    errors = []
    if set(sources) != set(translated) or set(sources) != {e["file"] for e in entries}:
        errors.append("Source notebooks, English companions, and manifest entries differ.")
    if len(entries) != len({e["file"] for e in entries}):
        errors.append("Duplicate English manifest entries.")
    markdown_count = code_count = metadata_only_changes = 0
    for entry in entries:
        name = entry["file"]
        if name not in sources or name not in translated:
            continue
        raw = sources[name].read_bytes()
        source = json.loads(raw)
        english = json.loads(translated[name].read_bytes())
        translation = english.get("metadata", {}).get("translation", {})
        if english.get("metadata", {}).get("language") != "en":
            errors.append(f"{name}: missing English language metadata")
        for key in ("source_sha256", "source_content_sha256", "source_commit"):
            if translation.get(key) != entry.get(key):
                errors.append(f"{name}: inconsistent {key}")
        if translation.get("source_file") != f"notebooks/{name}":
            errors.append(f"{name}: incorrect source path")
        if cell_digest(source["cells"]) != entry["source_content_sha256"]:
            errors.append(f"{name}: source cells changed; translation review required")
        elif hashlib.sha256(raw).hexdigest() != entry["source_sha256"]:
            metadata_only_changes += 1
        original_code = [c for c in source["cells"] if c["cell_type"] == "code"]
        english_code = [c for c in english["cells"] if c["cell_type"] == "code" and not c.get("metadata", {}).get("translation_bootstrap")]
        if original_code != english_code:
            errors.append(f"{name}: experiment code or saved output differs")
        bootstrap = [c for c in english["cells"] if c.get("metadata", {}).get("translation_bootstrap")]
        if len(bootstrap) != 1 or bootstrap[0].get("execution_count") is not None or bootstrap[0].get("outputs") != []:
            errors.append(f"{name}: expected one unexecuted directory setup cell")
        source_md = [c for c in source["cells"] if c["cell_type"] == "markdown"]
        english_md = [c for c in english["cells"] if c["cell_type"] == "markdown"]
        if len(source_md) != len(english_md) or len(english_md) != entry["markdown_cells"]:
            errors.append(f"{name}: Markdown cell count differs")
        if len(original_code) != entry["experiment_code_cells"]:
            errors.append(f"{name}: experiment-code count differs")
        for cell in english_md:
            text = "".join(cell["source"])
            if not text.strip():
                errors.append(f"{name}: empty translated Markdown cell")
            unexpected = set(re.findall(r"[\u4e00-\u9fff]+", text)) - CHINESE_EXAMPLES
            if unexpected:
                errors.append(f"{name}: untranslated prose: {sorted(unexpected)}")
            for target in re.findall(r"\]\(([^)]+)\)", text):
                parsed = urlsplit(target)
                if parsed.scheme or target.startswith("#"):
                    continue
                destination = (translated[name].parent / unquote(parsed.path)).resolve()
                # Downloaded inputs are deliberately absent from a clean clone.
                try:
                    relative = destination.relative_to(root)
                except ValueError:
                    errors.append(f"{name}: link escapes repository: {target}")
                    continue
                if relative.parts and relative.parts[0] in {"data", "artifacts", "resources"}:
                    continue
                if not destination.exists():
                    errors.append(f"{name}: broken relative link: {target}")
        markdown_count += len(english_md)
        code_count += len(original_code)
    if errors:
        raise ValueError("\n".join(errors))
    return {"notebooks": len(entries), "translated_markdown_cells": markdown_count,
            "unchanged_experiment_code_cells": code_count,
            "metadata_only_source_changes": metadata_only_changes}


if __name__ == "__main__":
    try:
        print(json.dumps(check(), indent=2))
    except (OSError, ValueError, KeyError) as error:
        print(error, file=sys.stderr)
        sys.exit(1)
