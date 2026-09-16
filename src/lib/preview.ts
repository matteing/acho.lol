import type { Language } from '@/i18n/locales';
import { locales } from '@/i18n/locales';

/** The static JSON contract shared by preview endpoints and the browser. */
export interface PreviewPayload {
  title: string;
  excerpt: string;
  lang: Language;
  url: string;
}

/** Validate fetched preview data without shipping a schema library to browsers. */
export function isPreviewPayload(value: unknown): value is PreviewPayload {
  return (
    typeof value === 'object' &&
    value !== null &&
    'title' in value &&
    typeof value.title === 'string' &&
    'excerpt' in value &&
    typeof value.excerpt === 'string' &&
    'url' in value &&
    typeof value.url === 'string' &&
    'lang' in value &&
    locales.some((locale) => locale === value.lang)
  );
}
