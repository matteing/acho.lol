#!/usr/bin/env python3
"""Validate built HTML, social PNGs, and sitemap against the actual content.

Run after `npm run build`. Requires only Python 3's standard library.
"""
from __future__ import annotations

import argparse
import collections
import datetime as dt
import html
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import struct
import sys
from urllib.parse import quote, unquote, urlsplit
import xml.etree.ElementTree as ET

PROJECT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://acho.lol'
SITEMAP_NS = '{http://www.sitemaps.org/schemas/sitemap/0.9}'
XHTML_NS = '{http://www.w3.org/1999/xhtml}'


def normal_url(value):
    parsed = urlsplit(value)
    return parsed.scheme, parsed.netloc, unquote(parsed.path).rstrip('/') or '/'


def clean_text(value):
    return re.sub(r'\s+', ' ', html.unescape(value)).strip()


def scalar(front, name):
    match = re.search(rf'^{re.escape(name)}:\s*(.*?)\s*$', front, re.M)
    if not match:
        return None
    value = match.group(1)
    if value.startswith('"'):
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            pass
    return value.strip("'")


def content_catalog():
    result = {}
    for source in sorted((PROJECT / 'content').rglob('*.md')):
        relative = source.relative_to(PROJECT / 'content')
        lang, *parts = relative.parts
        if lang not in ('es', 'en'):
            continue
        logical = Path(*parts).with_suffix('').as_posix()
        match = re.match(r'^---\n(.*?)\n---(?:\n|$)', source.read_text(), re.S)
        front = match.group(1) if match else ''
        if scalar(front, 'draft') == 'true':
            continue
        segments = [re.sub(r'[?#]', '', re.sub(r'\s', '-', part).replace('&', '-and-').replace('%', '-percent')) for part in logical.split('/')]
        if segments[-1] == 'index':
            segments.pop()
        if lang == 'en':
            segments.insert(0, 'en')
        path = '/' + '/'.join(quote(part, safe="~()*!.'-") for part in segments) + ('/' if segments else '')
        url = ORIGIN + path
        result[normal_url(url)] = {
            'source': relative.as_posix(), 'url': url, 'lang': lang,
            'kind': 'home' if logical == 'index' else 'section' if parts[-1] == 'index.md' else 'article',
            'translation': scalar(front, 'translationKey') or logical,
            'noindex': logical.startswith('Meta/Templates/'),
            'dateSource': scalar(front, 'dateSource'), 'lastmod': scalar(front, 'lastmod'),
        }
    return result


class Document(HTMLParser):
    def __init__(self, content):
        super().__init__(convert_charrefs=True)
        self.lang = None
        self.meta = collections.defaultdict(list)
        self.links = []
        self.title = ''
        self.h1 = ''
        self.json_ld = []
        self.breadcrumbs = []
        self._head = False
        self._title = False
        self._h1 = False
        self._json = None
        self._breadcrumb = False
        self._crumb = None
        self.feed(content)

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if tag == 'html': self.lang = attrs.get('lang')
        if tag == 'head': self._head = True
        if tag == 'title' and self._head: self._title = True
        if tag == 'h1': self._h1 = True
        if self._head and tag == 'meta':
            key = attrs.get('property') or attrs.get('name')
            if key: self.meta[key].append(attrs.get('content', ''))
        if self._head and tag == 'link': self.links.append(attrs)
        if tag == 'script' and attrs.get('type') == 'application/ld+json': self._json = ''
        if tag == 'nav' and 'breadcrumbs' in attrs.get('class', '').split(): self._breadcrumb = True
        if self._breadcrumb and (tag == 'a' or attrs.get('aria-current') == 'page'):
            self._crumb = {'tag': tag, 'name': '', 'url': attrs.get('href')}

    def handle_endtag(self, tag):
        if tag == 'head': self._head = False
        if tag == 'title': self._title = False
        if tag == 'h1': self._h1 = False
        if tag == 'script' and self._json is not None:
            self.json_ld.append(self._json)
            self._json = None
        if self._crumb is not None and tag == self._crumb['tag']:
            self.breadcrumbs.append(self._crumb)
            self._crumb = None
        if tag == 'nav': self._breadcrumb = False

    def handle_data(self, value):
        if self._title: self.title += value
        if self._h1: self.h1 += value
        if self._json is not None: self._json += value
        if self._crumb is not None: self._crumb['name'] += value


def schema_types(node):
    value = node.get('@type', [])
    return value if isinstance(value, list) else [value]


def datetime_value(value):
    return dt.datetime.fromisoformat(value.replace('Z', '+00:00'))


def run(dist):
    errors, warnings = [], []
    checked_images = set()
    descriptions, titles = collections.defaultdict(list), collections.defaultdict(list)
    catalog = content_catalog()
    translation_groups = collections.defaultdict(dict)
    for item in catalog.values(): translation_groups[item['translation']][item['lang']] = item['url']

    def require(condition, label, message):
        if not condition: errors.append(f'{label}: {message}')
        return condition

    def file_for(url, page=False):
        result = dist / unquote(urlsplit(url).path).lstrip('/')
        return result / 'index.html' if page else result

    def metadata(doc, key, label):
        values = doc.meta.get(key, [])
        require(len(values) == 1, label, f'expected one {key}, found {len(values)}')
        return values[0] if values else ''

    def graph_for(doc, label):
        nodes = []
        for raw in doc.json_ld:
            try:
                value = json.loads(raw)
                nodes.extend(value if isinstance(value, list) else value.get('@graph', [value]))
            except (ValueError, TypeError, AttributeError) as error:
                errors.append(f'{label}: invalid JSON-LD: {error}')
        return [node for node in nodes if isinstance(node, dict)]

    baseline = json.loads((PROJECT / 'scripts/migration/baseline-urls.json').read_text())['pages']
    for entry in baseline:
        require(normal_url(entry['url']) in catalog, entry['url'], 'legacy content URL no longer matches a source page')

    article_count = 0
    for item in catalog.values():
        label, expected_url = item['source'], item['url']
        filename = file_for(expected_url, page=True)
        if not require(filename.is_file(), label, f'missing HTML: {filename}'):
            continue
        doc = Document(filename.read_text())
        require(doc.lang == item['lang'], label, f'HTML language is {doc.lang!r}, expected {item["lang"]}')
        require(bool(clean_text(doc.title)) and bool(clean_text(doc.h1)), label, 'title and visible H1 must be nonempty')
        titles[(item['lang'], clean_text(doc.title))].append(label)
        canonical = [link.get('href') for link in doc.links if link.get('rel') == 'canonical']
        require(canonical == [expected_url], label, f'canonical differs from source URL: {canonical}')
        robots = ','.join(doc.meta.get('robots', [])).lower()
        require(('noindex' in robots) == item['noindex'], label, 'robots indexing state differs from public/template policy')
        expected_translations = {} if item['noindex'] else translation_groups[item['translation']]
        actual_alternates = {link.get('hreflang'): link.get('href') for link in doc.links if link.get('rel') == 'alternate' and link.get('hreflang') in ('es', 'en')}
        require(actual_alternates == expected_translations, label, f'hreflang mismatch: {actual_alternates}')
        for link in doc.links:
            if link.get('hreflang') == 'x-default':
                require(link.get('href') == expected_translations.get('es', expected_url), label, 'x-default must retain the corresponding content')

        description = metadata(doc, 'description', label)
        require(bool(clean_text(description)), label, 'empty description')
        descriptions[(item['lang'], clean_text(description))].append(label)
        og_title = metadata(doc, 'og:title', label)
        require(clean_text(og_title) == clean_text(doc.h1), label, 'OG title differs from visible H1')
        require(metadata(doc, 'og:description', label) == description, label, 'OG description differs from meta description')
        require(metadata(doc, 'og:url', label) == expected_url, label, 'OG URL differs from canonical')
        require(metadata(doc, 'og:type', label) == ('article' if item['kind'] == 'article' and not item['noindex'] else 'website'), label, 'OG type does not match page kind/indexing policy')
        require(metadata(doc, 'og:locale', label) == ('es_PR' if item['lang'] == 'es' else 'en_US'), label, 'OG locale differs from page language')
        image_url = metadata(doc, 'og:image', label)
        require(image_url.startswith(ORIGIN + '/_social/') and image_url.endswith('.png'), label, 'OG image must be an absolute generated PNG URL')
        require(metadata(doc, 'og:image:width', label) == '1200' and metadata(doc, 'og:image:height', label) == '630', label, 'incorrect social image dimensions')
        require(metadata(doc, 'og:image:type', label) == 'image/png', label, 'incorrect social image MIME type')
        image_alt = metadata(doc, 'og:image:alt', label)
        require(bool(clean_text(image_alt)), label, 'missing social image alt text')
        require(metadata(doc, 'twitter:card', label) == 'summary_large_image', label, 'incorrect X card type')
        for field, expected in [('title', og_title), ('description', description), ('image', image_url), ('image:alt', image_alt)]:
            require(metadata(doc, 'twitter:' + field, label) == expected, label, f'X {field} differs from OG metadata')
        if image_url not in checked_images:
            image_file = file_for(image_url)
            if require(image_file.is_file(), label, f'social image missing: {image_file}'):
                image_bytes = image_file.read_bytes()[:24]
                valid_png = len(image_bytes) == 24 and image_bytes[:8] == b'\x89PNG\r\n\x1a\n' and image_bytes[12:16] == b'IHDR'
                require(valid_png, label, 'social image is not a valid PNG header')
                if valid_png: require(struct.unpack('>II', image_bytes[16:24]) == (1200, 630), label, 'PNG dimensions differ from declared dimensions')
            checked_images.add(image_url)

        graph = graph_for(doc, label)
        if item['noindex']:
            require(not doc.json_ld, label, 'noindex templates must omit structured data')
            require(not any(link.get('hreflang') for link in doc.links), label, 'noindex templates must omit hreflang metadata')
            continue
        websites = [node for node in graph if 'WebSite' in schema_types(node)]
        webpages = [node for node in graph if set(schema_types(node)) & {'WebPage', 'CollectionPage'}]
        articles = [node for node in graph if 'Article' in schema_types(node)]
        require(len(websites) == 1 and len(webpages) == 1, label, 'expected one WebSite and one WebPage/CollectionPage')
        is_article = item['kind'] == 'article' and not item['noindex']
        require(len(articles) == int(is_article), label, 'Article schema does not match page kind/indexing policy')
        article_count += len(articles)
        for node in webpages + articles:
            node_url = node.get('url') or node.get('@id', '')
            require(normal_url(node_url) == normal_url(expected_url), label, 'structured page/article URL differs from canonical')
            require(node.get('inLanguage') == item['lang'], label, 'structured language differs from HTML')
        for article in articles:
            require(clean_text(article.get('headline', '')) == clean_text(doc.h1), label, 'Article headline differs from H1')
            require(article.get('description') == description, label, 'Article description differs from meta description')
            image_values = article.get('image', [])
            if not isinstance(image_values, list): image_values = [image_values]
            for value in image_values:
                url = value.get('url') or value.get('contentUrl') or value.get('@id', '') if isinstance(value, dict) else str(value)
                require('/_social/' not in url, label, 'Article.image must represent article content, not a branded title card')
                if url.startswith(ORIGIN + '/'):
                    require(file_for(url).is_file(), label, f'Article image missing: {url}')
        if item['dateSource'] == 'git-history':
            require(not any('datePublished' in node for node in graph), label, 'Git history must not be asserted as verified datePublished')
            require(not doc.meta.get('article:published_time'), label, 'Git history must not be asserted as article:published_time')
        if item['lastmod'] and not item['noindex']:
            modified = [node['dateModified'] for node in webpages + articles if node.get('dateModified')]
            require(bool(modified), label, 'known modification date absent from structured data')
            for value in modified:
                try:
                    require(datetime_value(value) == datetime_value(item['lastmod']), label, 'structured modification date differs from source history')
                except (ValueError, TypeError): errors.append(f'{label}: invalid structured modification date {value!r}')
        crumbs = [node for node in graph if 'BreadcrumbList' in schema_types(node)]
        require(len(crumbs) == int(bool(doc.breadcrumbs)), label, 'BreadcrumbList does not match visible breadcrumb navigation')
        if crumbs:
            structured = crumbs[0].get('itemListElement', [])
            require(len(structured) == len(doc.breadcrumbs), label, 'structured/visible breadcrumb counts differ')
            for position, (node, visible) in enumerate(zip(structured, doc.breadcrumbs), 1):
                require(node.get('position') == position and clean_text(node.get('name', '')) == clean_text(visible['name']), label, f'breadcrumb {position} name/position differs from visible navigation')
                target = node.get('item')
                if isinstance(target, dict): target = target.get('@id') or target.get('url')
                if target:
                    expected = ORIGIN + visible['url'] if visible['url'] else expected_url
                    require(normal_url(target) == normal_url(expected), label, f'breadcrumb {position} URL differs from visible navigation')

    missing = dist / '404.html'
    if require(missing.is_file(), '404', 'missing 404.html'):
        doc = Document(missing.read_text())
        require('noindex' in ','.join(doc.meta.get('robots', [])).lower(), '404', '404 must be noindex')
        require(not any('Article' in schema_types(node) for node in graph_for(doc, '404')), '404', '404 must not claim Article schema')

    try:
        sitemap = ET.parse(dist / 'sitemap.xml').getroot()
        entries = sitemap.findall(SITEMAP_NS + 'url')
        urls = [entry.findtext(SITEMAP_NS + 'loc') or '' for entry in entries]
        expected = {item['url'] for item in catalog.values() if not item['noindex']}
        require(set(urls) == expected and len(urls) == len(expected), 'sitemap', f'URL mismatch: missing={sorted(expected-set(urls))}; unexpected={sorted(set(urls)-expected)}')
        for entry in entries:
            url = entry.findtext(SITEMAP_NS + 'loc') or ''
            item = catalog.get(normal_url(url))
            if not item: continue
            alternates = {link.get('hreflang'): link.get('href') for link in entry.findall(XHTML_NS + 'link') if link.get('hreflang') in ('es', 'en')}
            require(alternates == translation_groups[item['translation']], url, 'sitemap alternates differ from actual translation counterparts')
            lastmod = entry.findtext(SITEMAP_NS + 'lastmod')
            if item['lastmod']:
                require(bool(lastmod), url, 'sitemap lacks known modification date')
                if lastmod: require(datetime_value(lastmod) == datetime_value(item['lastmod']), url, 'sitemap date differs from source history')
    except (OSError, ValueError, ET.ParseError) as error: errors.append(f'sitemap: {error}')

    robots = dist / 'robots.txt'
    if require(robots.is_file(), 'robots', 'missing robots.txt'):
        require('Sitemap: ' + ORIGIN + '/sitemap.xml' in robots.read_text(), 'robots', 'missing canonical sitemap declaration')
    for kind, values in [('titles', titles), ('descriptions', descriptions)]:
        for (lang, value), sources in values.items():
            if value and len(sources) > 1: warnings.append(f'Duplicate {lang} {kind} on {", ".join(sources)}: {value[:100]}')
    for warning in warnings: print('WARNING:', warning)
    for error in errors: print('ERROR:', error)
    indexable = sum(not item['noindex'] for item in catalog.values())
    print(f'SEO verification: {len(catalog)} content pages ({len(baseline)} legacy URLs), {indexable} indexable, {len(catalog)-indexable} public templates, {article_count} Article entities, {len(checked_images)} social PNGs; {len(errors)} errors, {len(warnings)} warnings.')
    return 1 if errors else 0


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dist', type=Path, default=PROJECT / 'dist')
    args = parser.parse_args()
    sys.exit(run(args.dist.resolve()))
