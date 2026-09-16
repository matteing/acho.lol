import type { Loader } from 'astro/loaders';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { buildWikiIndex } from './build-index';

/** A complete snapshot keeps cached HTML, routes, and backlinks in agreement. */
export function wikiLoader(): Loader {
  return {
    name: 'acho-wiki',
    async load(context) {
      const { config, store, watcher, logger } = context;
      const root = fileURLToPath(config.root);
      const contentDir = path.join(root, 'content');
      const publicDir = fileURLToPath(config.publicDir);
      const knownIssuesFile = path.join(root, 'content-known-issues.json');
      async function refresh() {
        const index = await buildWikiIndex({ contentDir, publicDir, knownIssuesFile });
        const errors = index.diagnostics.filter((d) => d.severity === 'error');
        if (errors.length) {
          throw new Error(errors.map((d) => `${d.source}: ${d.message}`).join('\n'));
        }
        // Validate every entry before replacing the previous working snapshot.
        const entries = await Promise.all(
          index.pages.map(async (page) => {
            const filePath = path.posix.join('content', page.sourcePath);
            const data = await context.parseData({ id: page.id, data: { ...page }, filePath });
            return {
              id: page.id,
              data,
              filePath,
              body: page.body,
              digest: context.generateDigest(JSON.stringify(page)),
              rendered: { html: page.html, metadata: { headings: page.headings } },
            };
          }),
        );
        store.clear();
        for (const entry of entries) store.set(entry);
        logger.info(
          `${entries.length} pages; ${index.diagnostics.length} documented source warnings`,
        );
      }
      await refresh();
      if (!watcher) return;
      watcher.add([contentDir, knownIssuesFile, path.join(publicDir, 'media-manifest.json')]);
      let timer: ReturnType<typeof setTimeout> | undefined;
      let pending = Promise.resolve();
      function changed(changedPath: string) {
        const absolute = path.resolve(changedPath);
        if (
          !(absolute.startsWith(contentDir + path.sep) && absolute.endsWith('.md')) &&
          absolute !== knownIssuesFile &&
          absolute !== path.join(publicDir, 'media-manifest.json')
        )
          return;
        clearTimeout(timer);
        timer = setTimeout(() => {
          pending = pending.then(refresh).catch((error) => logger.error(String(error)));
        }, 100);
      }
      watcher.on('add', changed);
      watcher.on('change', changed);
      watcher.on('unlink', changed);
    },
  };
}
