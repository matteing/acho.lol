import type { WikiPage } from '../../src/lib/wiki/types';

export function wikiPage(overrides: Partial<WikiPage> = {}): WikiPage {
  return {
    id: 'es/Palabras/Prueba',
    lang: 'es',
    title: 'Prueba',
    url: '/Palabras/Prueba/',
    sourcePath: 'es/Palabras/Prueba.md',
    logicalPath: 'Palabras/Prueba',
    translationKey: 'Palabras/Prueba',
    kind: 'article',
    section: 'Palabras',
    tags: [],
    aliases: [],
    redirects: [],
    description: 'Una prueba.',
    excerpt: 'Una prueba.',
    body: '',
    html: '<p>Una prueba.</p>',
    headings: [],
    outgoing: [],
    backlinks: [],
    translations: { es: 'es/Palabras/Prueba' },
    readingMinutes: 1,
    hasMermaid: false,
    draft: false,
    ...overrides,
  };
}
