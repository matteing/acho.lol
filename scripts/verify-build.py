#!/usr/bin/env python3
"""Verify generated pages, same-site links, assets, anchors, and legacy URLs.

Run after `pnpm build`: python3 scripts/verify-build.py
Optional flags: --dist path/to/dist --baseline path/to/baseline-urls.json
Uses only the Python standard library; it does not request external URLs.
"""

from __future__ import annotations

import argparse
from collections import Counter
from dataclasses import dataclass, field
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urljoin, urlsplit


SITE_ORIGIN = "https://acho.lol"
ASSET_ATTRIBUTES = {
    "img": ("src",),
    "video": ("src", "poster"),
    "audio": ("src",),
    "source": ("src",),
    "script": ("src",),
    "link": ("href",),
    "input": ("src",),
    "track": ("src",),
}


@dataclass
class Reference:
    url: str
    tag: str
    attribute: str
    line: int
    anchor: bool = False


@dataclass
class Page:
    filename: Path
    url: str
    ids: Counter = field(default_factory=Counter)
    references: list[Reference] = field(default_factory=list)


def srcset_urls(srcset: str):
    """Read candidate URLs, allowing commas inside data: URL tokens."""
    remaining = srcset.lstrip(" ,\t\r\n")
    while remaining:
        match = re.match(r"\S+", remaining)
        if not match:
            return
        token = match.group(0)
        remaining = remaining[len(token):]
        if token.endswith(","):
            yield token.rstrip(",")
        else:
            yield token
            separator = remaining.find(",")
            remaining = "" if separator == -1 else remaining[separator + 1:]
        remaining = remaining.lstrip(" ,\t\r\n")


class DocumentParser(HTMLParser):
    def __init__(self, page: Page):
        super().__init__(convert_charrefs=True)
        self.page = page

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)

    def handle_starttag(self, tag, pairs):
        attrs = dict(pairs)
        if attrs.get("id"):
            self.page.ids[attrs["id"]] += 1
        # Named anchors are valid fragment destinations, but not duplicate IDs.
        if tag == "a" and attrs.get("name") and attrs["name"] not in self.page.ids:
            self.page.ids[attrs["name"]] = 1
        if tag == "a" and attrs.get("href") is not None:
            self.page.references.append(Reference(attrs["href"], tag, "href", self.getpos()[0], True))
        if tag == "meta" and (attrs.get("http-equiv") or "").lower() == "refresh":
            refresh = re.match(r"^\s*[\d.]+\s*;\s*url\s*=\s*(.*?)\s*$", attrs.get("content") or "", re.IGNORECASE)
            if refresh:
                target = refresh.group(1)
                if len(target) >= 2 and target[0] in {"'", '"'} and target[-1] == target[0]:
                    target = target[1:-1]
                self.page.references.append(Reference(target, tag, "content (refresh)", self.getpos()[0], True))
        for attribute in ASSET_ATTRIBUTES.get(tag, ()):
            if attrs.get(attribute):
                self.page.references.append(Reference(attrs[attribute], tag, attribute, self.getpos()[0]))
        if tag in {"img", "source"} and attrs.get("srcset"):
            for url in srcset_urls(attrs["srcset"]):
                self.page.references.append(Reference(url, tag, "srcset", self.getpos()[0]))


def document_url(filename: Path, dist: Path) -> str:
    relative = filename.relative_to(dist).as_posix()
    if relative == "index.html":
        return "/"
    if relative.endswith("/index.html"):
        return "/" + relative[:-len("index.html")]
    return "/" + relative


def local_url(value: str, source_url: str):
    value = value.strip()
    if not value:
        return urlsplit(SITE_ORIGIN + source_url)
    result = urlsplit(urljoin(SITE_ORIGIN + source_url, value))
    if result.scheme not in {"http", "https"} or result.hostname not in {"acho.lol", "www.acho.lol"}:
        return None
    return result


def destination_file(url_path: str, dist: Path) -> Path | None:
    decoded = unquote(url_path)
    if "\x00" in decoded or "\\" in decoded:
        return None
    candidate = (dist / decoded.lstrip("/")).resolve()
    if not candidate.is_relative_to(dist):
        return None
    if candidate.is_file():
        return candidate
    if (candidate / "index.html").is_file():
        return candidate / "index.html"
    return None


def verify(dist: Path, baseline_path: Path):
    dist = dist.resolve()
    errors = []
    documents: dict[Path, Page] = {}
    for filename in sorted(dist.rglob("*.html")):
        page = Page(filename=filename, url=document_url(filename, dist))
        parser = DocumentParser(page)
        parser.feed(filename.read_text(encoding="utf-8"))
        parser.close()
        documents[filename] = page
        for element_id, count in page.ids.items():
            if count > 1:
                errors.append(f"{page.url}: duplicate id={element_id!r} ({count} occurrences)")

    if not documents:
        errors.append(f"No generated HTML pages found under {dist}.")

    checked_links = 0
    checked_assets = 0
    for page in documents.values():
        for reference in page.references:
            try:
                url = local_url(reference.url, page.url)
            except ValueError as error:
                errors.append(f"{page.url}:{reference.line}: invalid URL {reference.url!r}: {error}")
                continue
            if url is None:
                continue
            if reference.anchor:
                checked_links += 1
            else:
                checked_assets += 1
            target = destination_file(url.path, dist)
            location = f"{page.url}:{reference.line} <{reference.tag} {reference.attribute}>"
            if target is None:
                errors.append(f"{location}: missing local target {reference.url!r}")
                continue
            if reference.tag == "meta" and target == page.filename and not url.fragment:
                errors.append(f"{location}: redirect loops to its own page")
            if not reference.anchor or not url.fragment or target not in documents:
                continue
            # Text fragment directives are browser instructions, not element IDs.
            fragment = unquote(url.fragment).split(":~:text=", 1)[0]
            if fragment and fragment not in documents[target].ids:
                errors.append(f"{location}: missing #{fragment} in {documents[target].url}")

    baseline = json.loads(baseline_path.read_text(encoding="utf-8"))
    legacy_routes = [entry["url"] if isinstance(entry, dict) else entry for entry in baseline["pages"]]
    for legacy in legacy_routes:
        url = urlsplit(legacy)
        target = destination_file(url.path.rstrip("/") or "/", dist)
        if target is None or target not in documents:
            errors.append(f"Baseline route missing: {legacy}")

    return errors, len(documents), checked_links, checked_assets, len(legacy_routes)


def main():
    project = Path(__file__).resolve().parent.parent
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dist", type=Path, default=project / "dist")
    parser.add_argument("--baseline", type=Path, default=project / "scripts/migration/baseline-urls.json")
    args = parser.parse_args()
    try:
        errors, pages, links, assets, legacy = verify(args.dist.resolve(), args.baseline.resolve())
    except (OSError, ValueError, KeyError) as error:
        print(f"Build verification failed: {error}", file=sys.stderr)
        return 1
    if errors:
        print(f"Build verification failed with {len(errors)} issue(s):", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 1
    print(f"Build verified: {pages} HTML pages, {links} local links, {assets} local asset references, {legacy} original routes. No missing targets, anchors, assets, or duplicate IDs.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
