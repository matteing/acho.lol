# Authoring

Write ordinary Markdown in `content/es/` and `content/en/`. Read the
[editorial workflow](editorial-workflow.md) for voice, evidence, and translation
standards; this guide covers how content becomes a page.

## Pages and translations

Home and section introductions use `index.md`; sections list their entries
automatically. Spanish publishes at `/` and English at `/en/`. Keep accents, ñ,
and the original term in filenames. A page's path determines its public URL.

Translations share a stable `translationKey`, including when their titles differ:

```yaml
---
title: Cabrón
lang: es
translationKey: Palabras/Cabrón
description: Una descripción breve y factual de esta entrada.
aliases:
  - Cabrona
  - Cabrones
---
```

Use `lang: en` for its English counterpart and keep the same translation key.
The key defaults to the relative path without a locale or `.md`, but explicit
keys survive future moves. Do not change a key when renaming a file. The language
switcher links to the actual counterpart; missing translations remain explicit.
UI messages live in `src/i18n/messages/es.ts` and `en.ts`.

`aliases` lists alternate names for wikilinks and search. It does not create URL
redirects. If renaming or moving a page, add its old root-relative URL to the new
page's `redirects` array and preserve the translation key. Include the matching
permanent host redirect as described in [Deployment](deployment.md).

`draft: true` excludes a page from the generated site. `Pendientes` is intentionally
public; its location and editorial tags do not hide an entry. Contributor pages
in `Meta/Templates` remain reachable but are excluded from search-engine indexing
and the sitemap. No translations are generated automatically.

## Links, previews, and backlinks

Both standard Markdown links and wikilinks create backlinks:

```md
[[Palabras/Combi]]
[[Palabras/Cabrón|cabrón]]
[[Palabras/Cabrón#Definición|definición]]
[La misión](../Meta/La%20misión.md)
```

Unqualified wikilinks resolve in the page's language through paths, titles, and
aliases. Use a section-qualified path when names are ambiguous. Explicit `es/`
and `en/` prefixes can cross languages. Absolute standard Markdown links refer
to their actual public destination: English URLs begin `/en/`.

Heading fragments must exist on the target. Code examples and escaped wikilinks
stay literal; block transclusion is not supported. Backlinks are generated, so
there is no manual backlink list to update. Internal page links also receive
previews on hover or keyboard focus; touch devices use ordinary navigation.

New missing or ambiguous destinations and missing headings fail builds. The
15 unwritten references inherited from Quartz are documented in
`config/content-known-issues.json`; they display as labeled text. Remove an exception
when its target is written. The migration also records two missing English Fauna
counterparts. See [Migration](migration.md) for the original inventory.

## Rich Markdown

Tables, footnotes, task lists, fenced code, callouts, and Mermaid diagrams work in
ordinary `.md` files. Callouts use this form:

```md
> [!WARNING] Un dato por verificar
> El texto del aviso va aquí.
```

Use a fenced code block with the `mermaid` language for diagrams; the renderer
loads only when a page contains one. Article headings automatically populate the
contents rail. Mobile readers see the article first, then backlinks.

Tags are retained as editorial metadata. The public site has no tag pills, tag
navigation, tag pages, or tag search filters. Inline `#wip` and `#stub` markers
are omitted from rendered prose, while code examples stay literal. Reading time,
reading mode, and the graph are not part of the UI.

## Images, video, audio, and embeds

Place originals in `public/_attachments/` or
`public/<Section>/_attachments/`. Both translations reference the same file with
a root-relative URL. Percent-encode spaces and non-ASCII characters in that URL
while retaining the original filename on disk. Write useful image alt text.

```md
![Describe the image](/_attachments/photo.webp)

::video{src="/_attachments/clip.mp4"}

::audio{src="/_attachments/recording.mp3"}

::youtube{id="vG_l9pB0sPY"}

::youtube{id="4qlSFQLRo2I" ratio="9/16"}

::instagram{url="https://www.instagram.com/reel/CxQSQaNrTjp/"}
```

The local paths above illustrate syntax; add the actual files you reference.
Use these directives for media rather than `![[media]]`, copied embed scripts, or
arbitrary iframes. Plain `.md` files do not import Astro components. External
players render inline, with native lazy loading and no autoplay. A provider can
still restrict or remove a particular video or post.

`scripts/prepare-media.ts` creates responsive image derivatives and dimensions.
It preserves originals, including animated GIFs, and does not transcode video.
Generated `public/_media/` files and `public/media-manifest.json` are disposable.

Build and development startup run media preparation automatically. After adding
or changing assets during a running development session, rerun it:

```sh
node --import tsx scripts/prepare-media.ts
```

## Descriptions, dates, and share cards

Give each language a short, factual frontmatter `description`. This feeds search
engine and social metadata. Without one, the site uses introductory prose,
omitting headings and editing callouts, and ends at a word or sentence boundary.
Entries with only media receive a localized fallback.

Article and section headers show `lastmod` as the last-updated date; homepages
show no date. `modified` is accepted as a fallback for `lastmod`. Preserve
existing dates and update them only for actual editorial changes; the build does
not substitute today's date.

Imported `dateSource: git-history` records the provenance of `date` and `lastmod`.
The first Git commit does not establish first publication, so those imported
`date` values are omitted from publication metadata. Verified publication dates
can be recorded in `date` with accurate provenance; never remove the history
marker merely to make a publication date appear. `created` is a fallback for
`date`. Known modification dates feed metadata and the sitemap.

Each published content page gets a 1200 × 630 PNG share card using its title,
localized section, and acho.lol's branding. Cards are generated locally before
dev/build; they need no image service. After changing card titles during a running
session, run `node --import tsx scripts/prepare-social.ts` and restart development.
`public/_social/` and `public/social-manifest.json` are disposable.

Article structured data uses an actual content image when available. It does not
use the branded card as a photograph of the subject or invent an author. See
[social image generation](../scripts/SOCIAL-CARDS.md) for rendering details.

## Check changes

```sh
pnpm audit:content
pnpm build
pnpm verify
pnpm verify:seo
```

The audit checks content relationships and original URLs; the build catches new
broken references; output verification checks actual HTML, assets, metadata, and
cards. Python 3 is required for the two `verify` commands. Use `pnpm preview` to
check production search. Run the broader checks in
[Contributing](../.github/CONTRIBUTING.md) when changing application code.

Edit `content/` and original assets, not `dist/` or generated manifests. Normal
editing does not use the importer in `scripts/migration/`; rerunning it overwrites
imported files and requires reviewing the resulting differences.
