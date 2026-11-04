#!/usr/bin/env python3
"""Assert the SEO invariants of the built documentation.

Run against a built Starlight site::

    python3 docs/scripts/verify_seo.py docs/dist

Exits non-zero if any invariant is violated, so an SEO regression fails CI
instead of silently degrading rankings.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

BASE_URL = "https://ttlp.docs.isaackogan.com/"
EULER_HOST = "eulerstream.com"
SITEMAP_INDEX = "sitemap-index.xml"
SITEMAP_PAGES = "sitemap-0.xml"
VERIFICATION_FILE = "google93ecefd594fb7167.html"
TITLE_KEYWORD = "tiktok live printer"

# The lucode theme renders the sidebar as <ul class="sidebar-entries ...">; a theme
# upgrade that restructures it would silently drop site navigation.
NAV_MARKER = 'class="sidebar-entries'

# One sitewide footer link is the floor; the homepage must also vary its anchor text.
MIN_HOMEPAGE_ANCHORS = 3

failures: list[str] = []
passes: list[str] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    (passes if ok else failures).append(name)
    print(f"{'PASS' if ok else 'FAIL'}  {name}{f' :: {detail}' if detail and not ok else ''}")


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace")


def main(build_dir: str = "docs/dist") -> int:
    passes.clear()
    failures.clear()

    root = Path(build_dir)
    if not root.is_dir():
        print(f"FAIL  build directory missing: {root}")
        return 1

    index = root / "index.html"
    check("index.html exists", index.is_file())
    if not index.is_file():
        return 1

    page_paths = sorted(root.rglob("index.html"))
    not_found = root / "404.html"
    if not_found.is_file():
        page_paths.append(not_found)
    pages = {p.relative_to(root).as_posix(): _read(p) for p in page_paths}
    index_html = pages["index.html"]

    title = re.search(r"<title>(.*?)</title>", index_html, re.S)
    title_text = title.group(1).strip() if title else ""
    check(f"homepage title contains '{TITLE_KEYWORD}'", TITLE_KEYWORD in title_text.lower(), title_text)

    canonical_re = re.compile(r"<link\b[^>]*\brel=\"canonical\"[^>]*>", re.I)
    missing_canonical = [name for name, html in pages.items() if not any(f'href="{BASE_URL}' in tag for tag in canonical_re.findall(html))]
    check("every page has rel=canonical pointing at the base URL", not missing_canonical, f"{len(missing_canonical)} missing, e.g. {missing_canonical[:3]}")

    check("homepage has og:title", 'property="og:title"' in index_html)
    check("homepage has og:description", 'property="og:description"' in index_html)
    check("homepage has og:image", 'property="og:image"' in index_html)
    check("homepage has meta description", 'name="description"' in index_html)

    sitemap_index = root / SITEMAP_INDEX
    check(f"{SITEMAP_INDEX} exists", sitemap_index.is_file())
    if sitemap_index.is_file():
        check(f"{SITEMAP_INDEX} references {SITEMAP_PAGES}", f"<loc>{BASE_URL}{SITEMAP_PAGES}</loc>" in _read(sitemap_index))

    sitemap_pages = root / SITEMAP_PAGES
    check(f"{SITEMAP_PAGES} exists", sitemap_pages.is_file())
    if sitemap_pages.is_file():
        sitemap_xml = _read(sitemap_pages)
        check(f"{SITEMAP_PAGES} uses the canonical base URL", BASE_URL in sitemap_xml)
        check(f"{SITEMAP_PAGES} lists more than one URL", sitemap_xml.count("<loc>") > 1, f"{sitemap_xml.count('<loc>')} <loc> entries")

    robots = root / "robots.txt"
    sitemap_line = f"Sitemap: {BASE_URL}{SITEMAP_INDEX}"
    check("robots.txt points at the sitemap index", robots.is_file() and sitemap_line in _read(robots), "robots.txt missing" if not robots.is_file() else f"no '{sitemap_line}' line")

    check("search console verification file exists", (root / VERIFICATION_FILE).is_file(), VERIFICATION_FILE)

    anchor_re = re.compile(r"<a\b[^>]*>", re.I)
    nofollowed: list[str] = []
    without_euler: list[str] = []
    for name, html in pages.items():
        euler_anchors = [a for a in anchor_re.findall(html) if EULER_HOST in a]
        if not euler_anchors:
            without_euler.append(name)
        nofollowed += [f"{name}: {a[:90]}" for a in euler_anchors if "nofollow" in a.lower()]
    check("no eulerstream.com link is nofollowed", not nofollowed, f"{len(nofollowed)} nofollowed, e.g. {nofollowed[:2]}")
    check("eulerstream.com linked from every page", not without_euler, f"{len(without_euler)}/{len(pages)} pages missing, e.g. {without_euler[:3]}")

    anchor_text_re = re.compile(r"<a\b[^>]*href=\"[^\"]*" + re.escape(EULER_HOST) + r"[^\"]*\"[^>]*>(.*?)</a>", re.I | re.S)
    anchors = {re.sub(r"<[^>]+>", "", m).strip().lower() for m in anchor_text_re.findall(index_html) if re.sub(r"<[^>]+>", "", m).strip()}
    check(f"homepage uses >= {MIN_HOMEPAGE_ANCHORS} distinct eulerstream anchor texts", len(anchors) >= MIN_HOMEPAGE_ANCHORS, f"{len(anchors)} distinct: {sorted(anchors)[:5]}")

    missing_nav = [name for name, html in pages.items() if NAV_MARKER not in html]
    check("every page retains sidebar navigation", not missing_nav, f"{len(missing_nav)} missing {NAV_MARKER!r}, e.g. {missing_nav[:3]}")

    print(f"\n{len(passes)} passed, {len(failures)} failed")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main(*sys.argv[1:2]))
