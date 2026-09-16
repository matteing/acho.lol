import { siteConfig } from '@/site.config';

export const locales = siteConfig.languages;
export type Language = (typeof locales)[number];
export const defaultLanguage: Language = siteConfig.defaultLanguage;

export function homeUrl(lang: Language): string {
  return lang === defaultLanguage ? '/' : `/${lang}/`;
}
