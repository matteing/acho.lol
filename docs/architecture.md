# Architecture

acho.lol is a static Astro site. A small content compiler turns bilingual
Markdown into a complete, validated set of pages and relationships before Astro
generates HTML. There is no database, runtime content service, or client framework.

## Project structure

```text
content/
  es/                         Spanish Markdown
  en/                         English Markdown
public/
  _attachments/               Shared original media
  <Section>/_attachments/     Original media grouped by subject
  brand/                      Existing logo assets
  fonts/                      Website fonts and licenses
  _media/                     Generated responsive images
  _social/                    Generated share cards
src/
  site.config.ts              Public identity, origin, and languages
  content.config.ts           Astro collection and shared schema
  components/
    article/                  Article body framing, contents, backlinks
    layout/                   Header, navigation, language switcher
    preview/                  Preview component, CSS, and browser behavior
    search/                   Search component, CSS, and browser behavior
    seo/                      Head metadata component
    ui/                       Shared visual primitives
  i18n/
    locales.ts                Locale types and URL helpers
    translate.ts              Typed message lookup and section labels
    messages/                 Spanish and English UI dictionaries
  layouts/                    Shared page shell
  lib/
    wiki/                     Content reading, resolution, rendering, queries
    seo/                      Metadata, structured data, sitemap, card schema
  pages/                      Thin static route entry points
  scripts/                    Browser startup, theme, and Mermaid loading
  styles/                     Design tokens, base styles, Markdown typography
scripts/
  prepare-media.ts            Responsive image generation
  prepare-social.ts           Share card generation
  audit-content.ts            Content diagnostics and original URL audit
  verify-build.py             Generated link, anchor, and asset checks
  verify-seo.py               Generated metadata and social image checks
  migration/                 One-time importer and original URL inventories
  assets/fonts/              Static fonts used to render share cards
tests/
  unit/                      Content, routing, SEO, and card tests
  browser/                   Production-browser regressions
  fixtures/                  Shared test data
docs/                         Contributor and operational guides
.agents/skills/               Six editorial workflows for coding agents
```

Keep markup, feature-specific CSS, and browser behavior together in the relevant
component folder. Shared styling stays in `src/styles/`; `src/scripts/site.ts`
only starts and coordinates the browser modules. Route files select content and
compose components rather than processing Markdown themselves. The `@/` import
alias refers to `src/`.

## Content pipeline

`src/lib/wiki/build-index.ts` coordinates three stages:

1. **Read every document.** `read-content.ts` validates frontmatter, parses Markdown
   into an AST, derives URLs, descriptions, and heading IDs, and excludes explicit
   drafts. It records all page metadata before resolving any links.
2. **Resolve and render.** `resolve-links.ts` indexes paths, titles, aliases, and
   translation keys. `render-markdown.ts` renders each AST with resolved links,
   callouts, footnotes, and media from `media.ts`. This records outgoing links and
   validates local destinations, heading fragments, and assets. HTML is sanitized.
3. **Derive backlinks and validate.** Outgoing relationships are inverted into
   backlinks, then every resulting page is checked against the shared page schema.

Resolution is language-aware. Unqualified wikilinks stay in the source language;
explicit language prefixes and absolute public URLs can cross languages.
Translation groups contain only actual counterparts. Duplicate routes, ambiguous
links, and new missing targets are errors. Exact inherited exceptions live in
`content-known-issues.json` and render as labeled text rather than broken links.

`loader.ts` publishes the finished snapshot to Astro's `wiki` collection. In
development, additions, edits, deletions, and manifest changes rebuild the whole
snapshot. All entries validate before the old snapshot is replaced, so HTML,
routes, and backlinks remain consistent after a rename or deletion.

`schema.ts` is the source of truth for frontmatter, compiled pages, media
manifests, and known issues. `types.ts` infers the corresponding TypeScript types
from Zod. Astro's collection uses the same page schema as the standalone compiler.
The social manifest has its shared schema and inferred types in
`src/lib/seo/social-image.ts`. Validate data read from JSON at these boundaries
instead of casting it to a desired type.

## Static output and browser features

`src/pages/[...path].astro` emits home, section, article, and frontmatter redirect
pages. Section indexes automatically list their children. The sibling
`[...path]/preview.json.ts` emits small preview records; `404.astro` and
`sitemap.xml.ts` handle their respective outputs.

Articles, navigation, translation links, and backlinks work without JavaScript.
Desktop pages have a contents rail with the current section highlighted. Mobile
pages prioritize the article and put backlinks after it. The UI deliberately
omits graph view, tag pages and pills, reading time, and reading mode. Imported
tags remain editorial metadata.

Previews fetch their static JSON on hover or keyboard focus; touch devices retain
ordinary navigation. Search loads Pagefind when opened. `pnpm build` runs Pagefind
after Astro so it indexes the real article HTML, including alternate names.
Indexes follow the page's HTML language. Navigation and decorative content are
excluded. `pnpm dev` does not continually regenerate the search index, so search
verification belongs in a production preview.

Theme and mobile navigation are small browser modules. Mermaid loads only for
pages containing diagrams. Trusted YouTube and Instagram directives render inline
iframes with native lazy loading; local video and audio use native controls.
Embeds have no autoplay or activation button, and provider availability remains
outside this site's control.

## Media, metadata, and SEO

Both `dev` and `build` prepare media before Astro starts. `prepare-media.ts`
generates appropriately sized WebP files in `public/_media/` and records image
dimensions and `srcset` in `public/media-manifest.json`. It keeps original images
and animated GIFs intact and does not transcode video.

`prepare-social.ts` creates a 1200 × 630 PNG for every published content page in
`public/_social/`, with title, localized section, and existing branding. Sharp
renders committed fonts locally, with no browser or image service. Hashed filenames
include the relevant content and rendering inputs; unchanged cards are reused.
See [social image generation](../scripts/SOCIAL-CARDS.md) for font provenance.

These generated directories and manifests are disposable. After adding media or
changing card titles during a running development session, rerun the generators
and restart development as described in [Authoring](authoring.md).

`src/lib/seo/` derives canonical URLs, real translation alternates, Open Graph and
Twitter/X cards, and typed JSON-LD. `Seo.astro` renders that data. Indexable entries
describe the website, page, publisher, visible breadcrumbs, and an `Article` where
appropriate; sections use `CollectionPage`. An article's schema image comes from
its actual content, separately from the branded social card. Authors are not
invented, and a first Git commit is not asserted as a publication date.

The sitemap includes only indexable content and known modification dates.
Contributor templates and the 404 page use `noindex,follow`, without hreflang or
structured data. Social metadata remains available for contributor templates.
Descriptions prefer explicit localized frontmatter and otherwise use introductory
prose with a whole-word or sentence cutoff; media-only entries get a localized
fallback. [Authoring](authoring.md) explains date and description conventions.

## Toolchain and commands

Use Node 24 LTS at least 24.16.0 and pnpm 11.19.0. The package also permits Node
26.3.0 and newer, but `.nvmrc` and the documented deployment setup use 24 LTS.
Astro is pinned to 7.3.2. The lockfile resolves TypeScript to 6.0.3: the installed
`typescript-eslint` 8.70.0 declares support for TypeScript `>=4.8.4 <6.1.0`, so the
TypeScript 7 upgrade is deferred until the lint toolchain supports it. The
repository enables strict types, checked indexed access, and type-aware ESLint.

| Command                             | Purpose                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------- |
| `pnpm dev`                          | Prepare assets and start the editing server.                              |
| `pnpm build`                        | Prepare assets, render static pages, and build Pagefind.                  |
| `pnpm preview`                      | Serve the production output locally.                                      |
| `pnpm format` / `pnpm format:check` | Format files or check formatting.                                         |
| `pnpm lint`                         | Run type-aware ESLint with no warnings allowed.                           |
| `pnpm check`                        | Check Astro templates and TypeScript.                                     |
| `pnpm test`                         | Run unit tests.                                                           |
| `pnpm audit:content`                | Audit links, translations, media, and original URLs.                      |
| `pnpm verify`                       | Check generated local links, anchors, and assets with Python 3.           |
| `pnpm verify:seo`                   | Check output metadata, alternates, schema, sitemap, and PNG dimensions.   |
| `pnpm validate`                     | Run formatting, lint, types, unit tests, audit, build, and output checks. |
| `pnpm test:browser`                 | Run Playwright against the production preview.                            |

Install Chromium with `pnpm exec playwright install chromium`, or point
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` at an existing Chromium executable. Build
before browser tests; the test runner starts `pnpm preview` automatically. Tests
cover multilingual search, previews, navigation, themes, diagrams, inline embeds,
and reading without JavaScript.

Astro can run servers in the background in agent environments. Use
`pnpm exec astro dev stop` or `pnpm exec astro preview stop` to stop those servers;
foreground servers stop with Ctrl-C. The [deployment guide](deployment.md) covers
host configuration and the [migration record](migration.md) documents the source
snapshot. Normal builds never read the original Quartz checkout.
