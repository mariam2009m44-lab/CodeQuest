import os
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path.cwd()
IGNORED_DIRS = {".git", "node_modules", "dist", "build", ".wrangler", ".venv", "__pycache__"}

class LocalReferenceParser(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.source = source
        self.references = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name in {"href", "src"} and value:
                self.references.append((name, value.strip()))

pages = []
for current, directories, filenames in os.walk(ROOT):
    directories[:] = [name for name in directories if name not in IGNORED_DIRS]
    pages.extend(
        Path(current) / filename
        for filename in filenames
        if filename.endswith(".html")
    )

missing = []

for page in sorted(pages):
    parser = LocalReferenceParser(page)
    try:
        parser.feed(page.read_text(encoding="utf-8"))
    except UnicodeDecodeError:
        continue

    for kind, raw in parser.references:
        if not raw or raw.startswith("#"):
            continue
        parsed = urlsplit(raw)
        if parsed.scheme or parsed.netloc:
            continue
        target_text = unquote(parsed.path)
        if not target_text:
            continue
        if any(token in target_text for token in ("{{", "}}", "${", "}")):
            continue

        if target_text.startswith("/"):
            target = (ROOT / target_text.lstrip("/")).resolve()
        else:
            target = (page.parent / target_text).resolve()

        if target.is_dir():
            target = target / "index.html"

        if not target.exists():
            missing.append((page.relative_to(ROOT).as_posix(), kind, raw))

if missing:
    print("Broken local HTML references:")
    for page, kind, reference in missing:
        print(f" - {page}: {kind}={reference}")
    raise SystemExit(1)

print(f"Local HTML reference check passed: {len(pages)} pages scanned.")
