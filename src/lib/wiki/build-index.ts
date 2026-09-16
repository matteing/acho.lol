import path from 'node:path';
import { readContent, readJson } from './read-content';
import { createLinkResolver, populateBacklinks } from './resolve-links';
import { createMediaContext } from './media';
import { renderPage } from './render-markdown';
import { knownIssuesSchema, mediaManifestSchema, wikiPageSchema } from './schema';
import type { ReportDiagnostic, WikiBuildOptions, WikiDiagnostic, WikiIndex } from './types';

/**
 * Build a fresh snapshot in three stages: metadata, rendered links, backlinks.
 * Nothing survives between calls, so a rename or deletion updates every page.
 */
export async function buildWikiIndex(options: WikiBuildOptions = {}): Promise<WikiIndex> {
  const contentDir = path.resolve(options.contentDir ?? 'content');
  const publicDir = path.resolve(options.publicDir ?? 'public');
  const [rawIssues, rawManifest] = await Promise.all([
    options.knownIssuesFile ? readJson(options.knownIssuesFile, []) : Promise.resolve([]),
    readJson(path.join(publicDir, 'media-manifest.json'), {}),
  ]);
  const knownIssues = knownIssuesSchema.parse(rawIssues);
  const manifest = mediaManifestSchema.parse(rawManifest);
  const diagnostics: WikiDiagnostic[] = [];

  const report: ReportDiagnostic = (page, code, target, message) => {
    const known = knownIssues.some(
      (issue) =>
        issue.source === page.sourcePath &&
        issue.target === target &&
        (!issue.code || issue.code === code),
    );
    const duplicate = diagnostics.some(
      (issue) => issue.source === page.sourcePath && issue.code === code && issue.target === target,
    );
    if (!duplicate) {
      diagnostics.push({
        severity: known ? 'warning' : 'error',
        code,
        source: page.sourcePath,
        target,
        message,
      });
    }
  };

  const documents = await readContent(contentDir, options.includeDrafts ?? false, report);
  const pages = documents.map(({ page }) => page);
  const resolve = createLinkResolver(pages, report);
  const media = createMediaContext(publicDir, manifest);
  for (const { page, tree } of documents) {
    await renderPage(page, tree, { resolve, media, report });
  }
  populateBacklinks(pages);

  return { pages: pages.map((page) => wikiPageSchema.parse(page)), diagnostics };
}
