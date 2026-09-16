import type { WikiPage } from '../wiki/types';
import { absoluteUrl } from '../../site.config';
import { isIndexable, translationsFor } from './metadata';

function escapeXml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
}

export function sitemap(pages: WikiPage[]): string {
  const indexable = pages.filter(isIndexable);
  const entries = indexable.map((page) => {
    const translations = translationsFor(page, indexable);
    const defaultTranslation = translations.find((entry) => entry.lang === 'es') ?? page;
    const alternate = (lang: string, url: string) =>
      `<xhtml:link rel="alternate" hreflang="${lang}" href="${escapeXml(absoluteUrl(url))}"/>`;
    return [
      '<url>',
      `<loc>${escapeXml(absoluteUrl(page.url))}</loc>`,
      page.lastmod ? `<lastmod>${escapeXml(page.lastmod)}</lastmod>` : '',
      ...translations.map((entry) => alternate(entry.lang, entry.url)),
      alternate('x-default', defaultTranslation.url),
      '</url>',
    ].join('');
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries,
    '</urlset>',
  ].join('\n');
}
