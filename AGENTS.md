# Working on acho-astro

- Read [the architecture](docs/architecture.md) for code changes and [the editorial workflow](docs/editorial-workflow.md) for content changes. Use the relevant skills under `.agents/skills/`; they preserve the site's Puerto Rican voice, sources, and translation practices.
- Editorial Markdown belongs only in `content/es/` and `content/en/`. Preserve stable `translationKey` values and public URLs. `aliases` are alternate names; `redirects` are former URLs. Do not invent translations, citations, quotations, or etymologies.
- Follow the existing feature folders. Keep route files thin, browser behavior beside its component, and pure content processing in `src/lib/wiki/`. Infer content types from the shared schema; validate external data rather than casting it.
- Build the complete content index before resolving links and backlinks. Preserve standard Markdown, wikilinks, callouts, direct inline embeds, and language-aware previews/search. Tags, graph view, reading time, and reading mode are intentionally absent.
- Comments explain non-obvious decisions. Run Prettier; do not compress code into dense one-line expressions or add blanket lint suppressions.
- Keep factual descriptions and date provenance. Article schema images depict article content; branded cards are for social sharing. Templates and 404s remain noindex.
- Run `pnpm validate` before release; run `pnpm test:browser` for UI, routing, search, or preview changes. Production search requires `pnpm build` then `pnpm preview`.
- Generated assets are disposable. Never rerun `scripts/migration/migrate-content.py` over edited content without reviewing the resulting differences. The original sibling Quartz checkout is reference material, not an editing target.
