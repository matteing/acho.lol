import path from 'node:path';
import GithubSlugger from 'github-slugger';
import { decodePath, publicUrl, slugPath } from './urls';
import type { Language, ReportDiagnostic, WikiPage } from './types';

export interface ResolvedLink {
  page: WikiPage;
  url: string;
}

export type ResolveLink = (
  page: WikiPage,
  target: string,
  wiki: boolean,
) => ResolvedLink | undefined;

function normalize(value: string): string {
  return decodePath(value)
    .normalize('NFC')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\.md$/i, '')
    .toLocaleLowerCase();
}

/** Resolve against a complete metadata snapshot, independent of render order. */
export function createLinkResolver(pages: WikiPage[], report: ReportDiagnostic): ResolveLink {
  const byUrl = new Map<string, WikiPage>();
  const translationGroups = new Map<string, WikiPage[]>();
  const lookups: Record<Language, Map<string, Set<WikiPage>>> = {
    es: new Map(),
    en: new Map(),
  };

  function addName(page: WikiPage, name: string) {
    const key = normalize(name);
    if (!key) return;
    const matches = lookups[page.lang].get(key) ?? new Set<WikiPage>();
    matches.add(page);
    lookups[page.lang].set(key, matches);
  }

  for (const page of pages) {
    const existing = byUrl.get(normalize(page.url));
    if (existing) {
      report(page, 'duplicate-url', page.url, `URL also belongs to ${existing.sourcePath}.`);
    }
    byUrl.set(normalize(page.url), page);

    const group = translationGroups.get(page.translationKey) ?? [];
    if (group.some((other) => other.lang === page.lang)) {
      report(
        page,
        'duplicate-translation',
        page.translationKey,
        'Translation keys must be unique within each language.',
      );
    }
    group.push(page);
    translationGroups.set(page.translationKey, group);

    for (const name of [
      page.logicalPath,
      slugPath(page.logicalPath),
      page.title,
      ...page.aliases,
    ]) {
      addName(page, name);
    }
    if (page.kind !== 'home') {
      addName(page, path.posix.basename(page.logicalPath));
      addName(page, path.posix.basename(slugPath(page.logicalPath)));
    }
  }

  for (const page of pages) {
    for (const counterpart of translationGroups.get(page.translationKey) ?? []) {
      page.translations[counterpart.lang] = counterpart.id;
    }
  }

  return function resolve(page, raw, wiki) {
    let target = decodePath(raw.trim());
    const hashAt = target.indexOf('#');
    const fragment = hashAt < 0 ? '' : target.slice(hashAt + 1);
    target = hashAt < 0 ? target : target.slice(0, hashAt);

    // Absolute URLs retain site-wide meaning: Spanish owns /, English /en/.
    let lang: Language = raw.startsWith('/') ? 'es' : page.lang;
    const localePrefix = /^\/?(en|es)\//.exec(target);
    const explicitLanguage = Boolean(localePrefix);
    if (localePrefix) {
      lang = localePrefix[1] === 'en' ? 'en' : 'es';
      target = target.slice(localePrefix[0].length);
    }

    let candidates = new Set<WikiPage>();
    if (!target) {
      if (raw.startsWith('#') || !raw) candidates.add(page);
      else if (explicitLanguage || raw === '/') {
        const home = pages.find(
          (entry) => entry.lang === (explicitLanguage ? lang : 'es') && entry.kind === 'home',
        );
        if (home) candidates.add(home);
      }
    } else {
      const isRoot = raw.startsWith('/') || explicitLanguage;
      const exactPath = (logical: string) =>
        pages.filter(
          (entry) =>
            entry.lang === lang &&
            (normalize(entry.logicalPath) === normalize(logical) ||
              normalize(slugPath(entry.logicalPath)) === normalize(logical)),
        );

      // Explicit source paths take precedence over titles and alternate names.
      if (isRoot || target.includes('/')) candidates = new Set(exactPath(target));
      if (!candidates.size && !isRoot && (!wiki || /^\.{1,2}\//.test(target))) {
        const relative = path.posix.normalize(
          path.posix.join(path.posix.dirname(page.logicalPath), target),
        );
        candidates = new Set(exactPath(relative));
      }
      if (!candidates.size && !isRoot)
        candidates = new Set(lookups[lang].get(normalize(target)) ?? []);
      if (!candidates.size && isRoot) {
        const matching = byUrl.get(normalize(publicUrl(target, lang)));
        if (matching) candidates.add(matching);
      }
    }

    const [resolved] = candidates;
    if (candidates.size !== 1 || !resolved) {
      const message = candidates.size
        ? `Link matches multiple pages: ${[...candidates].map((candidate) => candidate.sourcePath).join(', ')}.`
        : `No ${lang} page matches “${raw}”.`;
      report(page, candidates.size ? 'ambiguous-link' : 'missing-link', raw, message);
      return;
    }

    let anchor = '';
    if (fragment) {
      const slug = new GithubSlugger().slug(fragment);
      const heading = resolved.headings.find(
        (entry) => entry.slug === fragment || entry.slug === slug || entry.text === fragment,
      );
      if (!heading) {
        report(page, 'missing-heading', raw, `No heading “${fragment}” in ${resolved.sourcePath}.`);
        return;
      }
      anchor = `#${encodeURIComponent(heading.slug)}`;
    }
    return { page: resolved, url: resolved.url + anchor };
  };
}

export function populateBacklinks(pages: WikiPage[]): void {
  const byId = new Map(pages.map((page) => [page.id, page]));
  for (const page of pages) {
    for (const id of page.outgoing) {
      const destination = byId.get(id);
      if (!destination) throw new Error(`Resolved link disappeared from the content index: ${id}`);
      destination.backlinks.push(page.id);
    }
  }
  for (const page of pages) {
    page.backlinks.sort((first, second) => {
      const firstTitle = byId.get(first)?.title ?? first;
      const secondTitle = byId.get(second)?.title ?? second;
      return firstTitle.localeCompare(secondTitle, page.lang);
    });
  }
}
