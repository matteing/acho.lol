import { defineConfig } from 'astro/config';
import legacy from './scripts/migration/legacy-redirects.json';
import { siteConfig } from './src/site.config';

export default defineConfig({
  site: siteConfig.origin,
  output: 'static',
  trailingSlash: 'always',
  redirects: Object.fromEntries(
    legacy.redirects.map(({ source, destination }) => [
      decodeURI(source),
      { destination: decodeURI(destination), status: 301 },
    ]),
  ),
  i18n: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
    routing: { prefixDefaultLocale: false },
  },
  server: { host: '127.0.0.1', port: 4321 },
});
