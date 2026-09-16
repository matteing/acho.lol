import { getCollection } from 'astro:content';
import type { Language, WikiPage } from './types';

export async function getPages(): Promise<WikiPage[]> {
  return (await getCollection('wiki')).map((entry) => entry.data);
}

export function sectionChildren(page: WikiPage, pages: WikiPage[]): WikiPage[] {
  if (page.kind !== 'section' || !page.sourcePath) return [];
  const prefix = page.logicalPath.replace(/index$/, '');
  return pages
    .filter(
      (entry) =>
        entry.lang === page.lang && entry.id !== page.id && entry.logicalPath.startsWith(prefix),
    )
    .sort((left, right) => left.title.localeCompare(right.title, page.lang));
}

export function syntheticPage(lang: Language, title: string, url: string): WikiPage {
  return {
    id: `${lang}/generated/${url}`,
    lang,
    title,
    url,
    sourcePath: '',
    logicalPath: '',
    translationKey: `generated:${url}`,
    kind: 'section',
    section: '',
    tags: [],
    aliases: [],
    redirects: [],
    description: title,
    excerpt: '',
    body: '',
    html: '',
    headings: [],
    outgoing: [],
    backlinks: [],
    translations: {},
    readingMinutes: 0,
    hasMermaid: false,
    draft: false,
  };
}
