import type { Language } from './locales';
import { es, sectionNames as spanishSections } from './messages/es';
import { en, sectionNames as englishSections } from './messages/en';
import type { MessageKey } from './messages/es';

export type { MessageKey } from './messages/es';

export function t(lang: Language, key: MessageKey): string {
  return (lang === 'en' ? en : es)[key];
}

const sectionNames: Record<Language, Readonly<Record<string, string>>> = {
  es: spanishSections,
  en: englishSections,
};

export function sectionLabel(lang: Language, section: string): string {
  return sectionNames[lang][section] ?? section;
}
