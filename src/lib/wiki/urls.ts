import type { Language } from './types';

/** Match Quartz's file URLs, including its case and Unicode preservation. */
export function slugPath(logicalPath: string): string {
  return logicalPath
    .replace(/\.(md|html)$/i, '')
    .split('/')
    .map((part) =>
      part
        .replace(/\s/g, '-')
        .replace(/&/g, '-and-')
        .replace(/%/g, '-percent')
        .replace(/[?#]/g, ''),
    )
    .join('/')
    .replace(/(^|\/)index$/, '')
    .replace(/^\/+|\/+$/g, '');
}

export function publicUrl(logicalPath: string, lang: Language): string {
  const parts = slugPath(logicalPath).split('/').filter(Boolean).map(encodeURIComponent);
  if (lang === 'en') parts.unshift('en');
  return `/${parts.join('/')}${parts.length ? '/' : ''}`;
}

export function decodePath(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Astro route parameters are decoded; the content index stores public URLs. */
export function routeParam(url: string): string | undefined {
  return url.split('/').filter(Boolean).map(decodeURIComponent).join('/') || undefined;
}
