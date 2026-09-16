#!/usr/bin/env python3
"""One-time, repeatable Quartz-content import. Never writes to the source repo.

Run from anywhere with Python 3. Existing imported files are overwritten; new
Astro-only files are not removed. Review your edits before re-importing.
"""
from __future__ import annotations

import argparse
import collections
import datetime as dt
import html
import json
import re
import shutil
import subprocess
from pathlib import Path
from urllib.parse import parse_qs, quote, unquote, urlparse

PROJECT = Path(__file__).resolve().parents[2]
VIDEO = {'.mp4', '.webm', '.mov', '.m4v'}
AUDIO = {'.mp3', '.ogg', '.wav', '.m4a', '.flac'}


def frontmatter(text):
    match = re.match(r'\A---\r?\n(.*?)\r?\n---(?:\r?\n|$)', text, re.S)
    return (match.group(1), text[match.end():]) if match else ('', text)


def scalar(front, key):
    match = re.search(rf'^{re.escape(key)}:\s*(.*?)\s*$', front, re.M)
    return match.group(1).strip('\"\'') if match else None


def aliases(front):
    match = re.search(r'^aliases:\s*\[([^\n]*)\]', front, re.M)
    if match:
        return [item.strip().strip('\"\'') for item in match.group(1).split(',')]
    match = re.search(r'^aliases:\s*\n((?:[ \t]+-.*\n?)+)', front, re.M)
    return re.findall(r'^\s+-\s+(.+?)\s*$', match.group(1), re.M) if match else []


def youtube_id(url):
    parsed = urlparse(html.unescape(url))
    host = parsed.hostname or ''
    if host in ('youtu.be', 'www.youtu.be'):
        value = parsed.path.strip('/').split('/')[0]
    elif host in ('youtube.com', 'www.youtube.com', 'm.youtube.com', 'www.youtube-nocookie.com'):
        value = parse_qs(parsed.query).get('v', [''])[0]
        if not value and re.match(r'^/(embed|shorts)/', parsed.path):
            value = parsed.path.strip('/').split('/')[1]
    else:
        return None
    return value if re.fullmatch(r'[\w-]{11}', value) else None


def git_dates(source, relative):
    result = subprocess.run(['git', '-C', str(source), 'log', '--follow', '--format=%aI', '--', relative], capture_output=True, text=True, check=True)
    dates = result.stdout.splitlines()
    if not dates:
        return None, None
    def utc(value):
        return dt.datetime.fromisoformat(value).astimezone(dt.timezone.utc).isoformat().replace('+00:00', 'Z')
    return utc(dates[-1]), utc(dates[0])


def migrate(source, destination):
    public = destination / 'public'
    content = destination / 'content'
    files = sorted(path for path in source.rglob('*.md')
                   if not any(part.startswith('.') for part in path.relative_to(source).parts)
                   and path.name not in {'AGENTS.md', 'README.md'})
    attachments = sorted(path for path in source.rglob('*') if path.is_file()
                         and '_attachments' in path.relative_to(source).parts
                         and not any(part.startswith('.') for part in path.relative_to(source).parts))
    for path in attachments:
        target = public / path.relative_to(source)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, target)

    unresolved_media = []
    conversions = collections.Counter()
    entries = []
    for path in files:
        relative = path.relative_to(source).as_posix()
        locale = 'en' if relative.startswith('en/') else 'es'
        key = relative.removeprefix('en/').removesuffix('.md')
        original = path.read_text()
        front, body = frontmatter(original)
        date, lastmod = git_dates(source, relative)
        additions = {'lang': locale, 'translationKey': key, 'date': date, 'lastmod': lastmod, 'dateSource': 'git-history' if date else None}
        for field, value in additions.items():
            if value and not re.search(rf'^{field}:', front, re.M):
                front += ('\n' if front else '') + f'{field}: {json.dumps(value, ensure_ascii=False)}'

        def asset_url(target):
            raw = unquote(target).split('#', 1)[0]
            if re.match(r'^(?:https?:|data:|//)', raw):
                return target
            candidates = [(path.parent / raw).resolve(), (source / raw.lstrip('/')).resolve()]
            if locale == 'en':
                candidates.append((source / path.relative_to(source).parent.relative_to('en') / raw).resolve())
            if not raw.startswith(('../', '/')):
                candidates.extend((ancestor / raw).resolve() for ancestor in path.parents if ancestor == source or source in ancestor.parents)
            found = next((candidate for candidate in candidates if candidate.is_file() and candidate.is_relative_to(source)), None)
            if not found:
                matching = [attachment for attachment in attachments if attachment.name == Path(raw).name]
                if len(matching) == 1:
                    found = matching[0]
            if not found:
                unresolved_media.append(f'{relative}: {target}')
                return target
            return '/' + quote(found.relative_to(source).as_posix(), safe='/@-._~')

        def embedded(match):
            target, _, label = match.group(1).partition('|')
            video_id = youtube_id(target)
            if video_id:
                conversions['youtube'] += 1
                return f'::youtube{{id="{video_id}"}}'
            url = asset_url(target)
            extension = Path(urlparse(target).path).suffix.lower()
            if extension in VIDEO or extension in AUDIO:
                kind = 'video' if extension in VIDEO else 'audio'
                conversions[kind] += 1
                return f'::{kind}{{src={json.dumps(url)}}}'
            alt = label if label and not re.fullmatch(r'\d+(?:x\d+)?', label) else Path(target).stem.replace('-', ' ').replace('_', ' ')
            alt = alt.replace('[', '\\[').replace(']', '\\]')
            conversions['image'] += 1
            return f'![{alt}]({url})'

        body = re.sub(r'!\[\[([^\]\n]+)\]\]', embedded, body)
        # Existing conventional images (including the home cover) use shared root URLs.
        body = re.sub(r'(!\[[^\]\n]*\]\()([^\s)]+)(\))', lambda m: m.group(1) + asset_url(m.group(2)) + m.group(3), body)
        def iframe(match):
            attributes = match.group(1)
            src = re.search(r'\bsrc=[\"\']([^\"\']+)', attributes)
            video_id = youtube_id(src.group(1)) if src else None
            if not video_id:
                unresolved_media.append(f'{relative}: unconverted iframe')
                return match.group(0)
            vertical = bool(re.search(r'\bwidth=[\"\']315[\"\']', attributes) and re.search(r'\bheight=[\"\']560[\"\']', attributes))
            ratio = ' ratio="9/16"' if vertical else ''
            conversions['youtube'] += 1
            return f'::youtube{{id="{video_id}"{ratio}}}'
        body = re.sub(r'<iframe\b([^>]+)>\s*</iframe>', iframe, body, flags=re.I)
        def instagram(match):
            permalink = re.search(r'data-instgrm-permalink="([^"]+)"', match.group(0))
            if not permalink:
                return match.group(0)
            url = html.unescape(permalink.group(1)).split('?', 1)[0]
            conversions['instagram'] += 1
            return f'::instagram{{url="{url}"}}'
        body = re.sub(r'<blockquote\b[^>]*class="instagram-media".*?</blockquote>\s*<script[^>]*instagram\.com/embed\.js[^>]*></script>', instagram, body, flags=re.S)
        target = content / locale / f'{key}.md'
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(f'---\n{front}\n---\n{body}')
        entries.append({'source': relative, 'lang': locale, 'key': key, 'title': scalar(front, 'title') or path.stem, 'aliases': aliases(front), 'body': body, 'date': date, 'lastmod': lastmod})

    # An import inventory; the actual Markdown AST/build validator is authoritative.
    lookup = collections.defaultdict(set)
    for entry in entries:
        for name in [entry['key'], Path(entry['key']).name, entry['title'], *entry['aliases']]:
            lookup[(entry['lang'], name.casefold())].add(entry['key'])
    unresolved_links = []
    ambiguous_links = []
    for entry in entries:
        prose = re.sub(r'^```.*?^```[^\n]*$', '', entry['body'], flags=re.S | re.M)
        prose = re.sub(r'`[^`\n]*`', '', prose)
        for raw in re.findall(r'(?<!!)\[\[([^\]\n]+)\]\]', prose):
            target = raw.split('|', 1)[0].split('#', 1)[0].removesuffix('.md')
            if not target or re.match(r'^https?://', target):
                continue
            lang = 'en' if target.startswith('en/') else entry['lang']
            target = target.removeprefix('en/')
            matches = lookup.get((lang, target.casefold()), set())
            if not matches:
                unresolved_links.append(f'{entry["source"]}: [[{raw}]]')
            elif len(matches) > 1:
                ambiguous_links.append(f'{entry["source"]}: [[{raw}]]')
    spanish = {entry['key'] for entry in entries if entry['lang'] == 'es'}
    english = {entry['key'] for entry in entries if entry['lang'] == 'en'}
    missing_en = sorted(spanish - english)
    missing_es = sorted(english - spanish)
    snapshot = subprocess.run(['git', '-C', str(source), 'rev-parse', 'HEAD'], capture_output=True, text=True, check=True).stdout.strip()
    lines = ['# Content migration report', '', f'Source: `../acho.lol` at `{snapshot}`.', '',
             f'- Imported {len(entries)} Markdown pages: {len(spanish)} Spanish and {len(english)} English.',
             f'- Copied {len(attachments)} shared attachment files without modifying originals.',
             '- Kept all source prose, titles, tags, aliases, code examples, and article wikilinks.',
             '- Included intentionally public `Pendientes` and `Meta/Templates`; excluded `README.md`, `AGENTS.md`, hidden files, and editor tooling.',
             '- Added `lang` and stable `translationKey` metadata. Translation keys initially match source paths; retain them when renaming entries.',
             '- Added missing `date` / `lastmod` from earliest / latest per-file `git log --follow` author timestamps, normalized to UTC. These dates reflect repository history, not independently verified publication dates.',
             '- Replaced local media embeds with standard Markdown images or media directives; converted YouTube and Instagram markup to directives. Existing filenames and source assets remain unchanged.',
             '- Alt text retained when supplied. Otherwise derived from existing attachment filenames; an editorial accessibility review can improve those labels.',
             '- `prepare-media.ts` creates responsive WebP derivatives and dimensions, preserving animated GIF originals.',
             '- The home-cover artwork is imported from the content repository. Published-site branding and fonts are maintained separately in public/brand and public/fonts.',
             '- The source home socialImage refers to a missing source asset. Astro generates per-page social cards with scripts/prepare-social.ts instead.', '',
             '## Embed conversions', '', *[f'- {kind}: {count}' for kind, count in sorted(conversions.items())], '',
             '## Missing translations', '', 'English:', *([f'- `{key}.md`' for key in missing_en] or ['- None.'])]
    lines.extend(['', 'Spanish:', *([f'- `{key}.md`' for key in missing_es] or ['- None.']), '', 'No translations were generated. Missing counterparts must remain explicit in the language switcher.', '',
                  '## Unresolved media', '', *(['- ' + issue for issue in unresolved_media] or ['- None.']), '',
                  '## Unresolved article links (import inventory)', '', *(['- ' + issue for issue in unresolved_links] or ['- None.']), '',
                  '## Ambiguous article links (import inventory)', '', *(['- ' + issue for issue in ambiguous_links] or ['- None.']), '',
                  'The Astro Markdown AST validator is authoritative for link resolution. This inventory excludes fenced and inline code, but does not validate external URLs or heading fragments.', '',
                  '## Re-running the import', '', '`python3 scripts/migration/migrate-content.py` re-copies the source snapshot into this folder. It overwrites matching imported content, so review any post-migration edits before running it again. The source repository is read-only throughout.', ''])
    (destination / 'docs/migration.md').write_text('\n'.join(lines))
    print(f'Imported {len(entries)} pages and {len(attachments)} attachments. Media issues: {len(unresolved_media)}; unresolved wiki targets: {len(unresolved_links)}; missing English: {len(missing_en)}.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=PROJECT.parent / 'acho.lol')
    parser.add_argument('--destination', type=Path, default=PROJECT)
    args = parser.parse_args()
    migrate(args.source.resolve(), args.destination.resolve())
