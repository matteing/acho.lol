import { sectionLabel } from '@/i18n/translate';
import type { Language, WikiPage } from '@/lib/wiki/types';

export interface NavigationContext {
  otherLanguage: Language;
  translation: WikiPage | undefined;
  section: WikiPage | undefined;
  sections: WikiPage[];
}

/** Resolve page-specific links once for the layout and its navigation. */
export function getNavigationContext(page: WikiPage, pages: WikiPage[]): NavigationContext {
  const otherLanguage: Language = page.lang === 'es' ? 'en' : 'es';
  const sections = pages
    .filter(
      (candidate) =>
        candidate.lang === page.lang && candidate.kind === 'section' && candidate.section,
    )
    .sort((a, b) =>
      sectionLabel(page.lang, a.section).localeCompare(
        sectionLabel(page.lang, b.section),
        page.lang,
      ),
    );
  return {
    otherLanguage,
    translation: pages.find((candidate) => candidate.id === page.translations[otherLanguage]),
    section: sections.find((candidate) => candidate.section === page.section),
    sections,
  };
}
