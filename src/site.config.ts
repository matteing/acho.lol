/** Public identity shared by Astro configuration, metadata, and build scripts. */
export const siteConfig = {
  name: 'acho.lol',
  origin: 'https://acho.lol',
  logo: '/brand/acho-wordmark-primary.svg',
  defaultLanguage: 'es',
  languages: ['es', 'en'],
} as const;

export function absoluteUrl(path: string): string {
  return new URL(path, siteConfig.origin).href;
}
