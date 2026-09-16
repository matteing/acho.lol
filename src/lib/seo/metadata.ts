import { sectionLabel, t } from '../../i18n/translate';
import { homeUrl } from '../../i18n/locales';
import { absoluteUrl } from '../../site.config';
import type { Language, WikiPage } from '../wiki/types';
import { socialImage } from './social-image';

export interface Breadcrumb {
  name: string;
  url: string;
}

export function isIndexable(page: WikiPage): boolean {
  return Boolean(page.sourcePath) && !/(^|\/)Templates(\/|$)/.test(page.logicalPath);
}

export function socialLocale(lang: Language): string {
  return lang === 'es' ? 'es_PR' : 'en_US';
}

/** Include only real translation counterparts, including the page itself. */
export function translationsFor(page: WikiPage, pages: WikiPage[]): WikiPage[] {
  const byId = new Map(pages.map((entry) => [entry.id, entry]));
  return Object.values(page.translations)
    .map((id) => (id ? byId.get(id) : undefined))
    .filter((entry): entry is WikiPage => entry !== undefined);
}

export function pageMetadata(page: WikiPage, pages: WikiPage[], title: string) {
  const indexable = isIndexable(page);
  const translations = translationsFor(page, pages);
  const defaultTranslation = translations.find((entry) => entry.lang === 'es') ?? page;
  const section = pages.find(
    (entry) =>
      entry.lang === page.lang && entry.kind === 'section' && entry.section === page.section,
  );
  const breadcrumbs: Breadcrumb[] =
    page.kind === 'home'
      ? []
      : [
          { name: t(page.lang, 'home'), url: homeUrl(page.lang) },
          ...(section && section.id !== page.id
            ? [{ name: sectionLabel(page.lang, page.section), url: section.url }]
            : []),
          { name: title, url: page.url },
        ];
  const image = socialImage(page);

  return {
    canonical: absoluteUrl(page.url),
    indexable,
    article: page.kind === 'article' && indexable,
    translations,
    defaultTranslation,
    breadcrumbs,
    image: { ...image, url: absoluteUrl(image.url) },
    // The first commit is evidence of existence, not an original publication date.
    published: page.dateSource === 'git-history' ? undefined : page.date,
  };
}

export type PageMetadata = ReturnType<typeof pageMetadata>;
