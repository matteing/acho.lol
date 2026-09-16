import { readFile } from 'node:fs/promises';
import { buildWikiIndex } from '../src/lib/wiki/build-index';
import { z } from 'zod';
import { siteConfig } from '../src/site.config';

const index = await buildWikiIndex({ knownIssuesFile: 'content-known-issues.json' });
const baselineData: unknown = JSON.parse(
  await readFile(new URL('./migration/baseline-urls.json', import.meta.url), 'utf8'),
);
const baseline = z
  .object({ pages: z.array(z.object({ url: z.url() })).min(1) })
  .parse(baselineData);
const normalize = (url: string) =>
  decodeURIComponent(new URL(url, siteConfig.origin).pathname).replace(/\/$/, '') || '/';
const current = new Set(index.pages.map((page) => normalize(page.url)));
const missing = baseline.pages.filter((page) => !current.has(normalize(page.url)));
const gaps = index.pages.filter((page) => !page.translations[page.lang === 'es' ? 'en' : 'es']);
const errors = index.diagnostics.filter((issue) => issue.severity === 'error');
console.log(
  `${index.pages.length} content pages (${index.pages.filter((p) => p.lang === 'es').length} ES, ${index.pages.filter((p) => p.lang === 'en').length} EN)`,
);
console.log(
  `${index.pages.reduce((n, p) => n + p.outgoing.length, 0)} directed page relationships`,
);
console.log(
  `${baseline.pages.length - missing.length}/${baseline.pages.length} original sitemap URLs preserved (trailing slash normalized)`,
);
for (const page of gaps) console.log(`Missing translation: ${page.sourcePath}`);
for (const issue of index.diagnostics)
  console.log(`${issue.severity}: ${issue.source}: ${issue.target} (${issue.code})`);
for (const page of missing) console.error(`Original URL missing: ${page.url}`);
if (errors.length || missing.length) process.exitCode = 1;
