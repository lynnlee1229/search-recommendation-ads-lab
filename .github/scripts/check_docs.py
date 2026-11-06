"""Check local links from the public entry-point docs without network/dependencies."""
from pathlib import Path
from urllib.parse import unquote, urlsplit
import re

ROOT = Path(__file__).resolve().parents[2]
DOCUMENTS = [
    "README.md", "README.zh-CN.md", "CONTRIBUTING.md", "LICENSE.md",
    "docs/GETTING_STARTED.md", "docs/GETTING_STARTED.zh-CN.md",
    "docs/ROADMAP.md", "docs/ROADMAP.zh-CN.md", "docs/THIRD_PARTY.md",
]
errors = []
checked = 0
for name in DOCUMENTS:
    path = ROOT / name
    if not path.is_file():
        errors.append(f"Missing document: {name}")
        continue
    content = re.sub(r"```[\s\S]*?```", "", path.read_text(encoding="utf-8"))
    for match in re.finditer(r"!?\[[^\]\n]*\]\(([^\s)]+)\)", content):
        url = match.group(1).strip("<>")
        parsed = urlsplit(url)
        if parsed.scheme or parsed.netloc or not parsed.path:
            continue
        target = (path.parent / unquote(parsed.path)).resolve()
        checked += 1
        if not target.is_relative_to(ROOT) or not target.exists():
            errors.append(f"{name}: missing local target {url}")
if errors:
    raise SystemExit("\n".join(errors))
print(f"Checked {checked} local links in {len(DOCUMENTS)} entry-point documents.")
