# Editorial workflow

The Spanish encyclopedia lives in `content/es/`; English counterparts live in
`content/en/`. This is the working content tree. The preserved migration sources
are not part of the daily editing workflow.

Read the [Spanish language guide](<../content/es/Meta/Guía lingüística.md>) before
writing or translating. The [English guide](<../content/en/Meta/Guía lingüística.md>)
and the [contributor guide](<../content/es/Meta/¿Cómo contribuyo?.md>) explain the
voice and entry structure. Their cultural guidance remains authoritative;
section names in those reader-facing guides are relative to a language's content
folder.

## Voice and evidence

Keep acho.lol informal, jocose, precise, and recognizably Puerto Rican. Document
vulgar terms without censorship; preserve quotations, names, lyrics, and source
spellings. Prefer **tiraera / tiraeras**, except in quotations or discussion of
the alternate form. Use established Puerto Rican spellings without inventing a
phonetic dialect. English teaches the culture and preserves meaningful Spanish
terms rather than flattening them into literal equivalents.

Do not invent facts, etymologies, quotations, sources, dates, or authors. Mark
specific uncertainty with a callout. Preserve attribution and the limits of what
a source establishes. Avoid sensitive personal information without consent and
copyrighted passages beyond brief, attributed excerpts.

## Content and metadata

Use the exact spoken term for filenames; accents, ñ, and Spanish punctuation are
supported. Choose `Palabras`, `Dichos`, `Artículos`, `Personas`, `Fauna`,
`Controversias`, `Meta`, or `Pendientes` according to the material. Category
`index.md` files contain a title and brief introduction; Astro generates their
entry lists.

Use a useful `title` and `description`, relevant `tags`, and genuine alternate
names in `aliases`. Aliases resolve wiki targets; old public URL paths belong in
`redirects`, not `aliases`. Tags remain editorial metadata; the public site does
not render tag pills, tag pages, or tag search filters.

Pair translations with the same stable `translationKey`. Initially this can be
the relative path without the locale or `.md`, such as `Palabras/Combi`. Keep the
key when a page is renamed or moved. English counterparts normally retain the
same relative filename and use `lang: en`; Spanish uses `lang: es`.

Preserve existing dates and `dateSource`. Imported `dateSource: git-history`
values document repository history, not verified publication. Do not replace
dates with the current build time or invent publication metadata. Follow the
repository's date behavior when making real content changes.

`Pendientes` contains intentionally public unfinished entries. Their location or
`wip`/`stub` tag does not make them private. Use `draft: true` only when exclusion
from the generated site is intended. `Meta/Templates` remains publicly reachable
for contributors but is excluded from search-engine indexing and the sitemap.

## Links and media

Both standard Markdown links and wikilinks participate in backlinks. Prefer an
explicit target when a title or alias is ambiguous:

```md
[[Palabras/Combi|combi]]
[[en/Palabras/Combi|combi]]
[[Palabras/Combi#Uso|ejemplos]]
[Ejemplos](/Palabras/Combi/#uso)
```

Wiki targets omit `content/es/` and `content/en/`; `en/` selects English. An
ordinary Markdown link beginning `/` is a site URL: English URLs begin `/en/`.
Keep normal entry links in the reader's language unless crossing languages is
intentional. Backlinks are generated from outgoing links; do not maintain manual
backlink lists. Missing translations remain explicit rather than silently
linking to a different-language entry.

Store originals under `public/Section/_attachments/` or `public/_attachments/`
for genuinely shared assets. Both language versions use the same root-relative
media URL. Percent-encode spaces and non-ASCII characters in URLs; retain the
original spelling on disk. Use descriptive image alt text and existing assets.

```md
![Gongolí rojo enrollado sobre madera](/Fauna/_attachments/gongoli-enrollado.png)
::video{src="/_attachments/gilito-endemoniao.mp4"}
::audio{src="/_attachments/example.mp3"}
::youtube{id="vG_l9pB0sPY"}
::youtube{id="4qlSFQLRo2I" ratio="9/16"}
::instagram{url="https://www.instagram.com/reel/CxQSQaNrTjp/"}
```

The audio path illustrates syntax; use an actual file when adding content.
Use Markdown images and these directives rather than `![[media]]`, pasted embed
scripts, or arbitrary iframe markup. Builds generate responsive derivatives and
social cards; edit originals and content, not `dist/` or generated assets.
Callouts, fenced Mermaid diagrams, tables, and footnotes are supported.

## Validation and repository skills

Run `pnpm audit:content` for current links, media, translation gaps, and URL
preservation. Existing omissions are documented in `content-known-issues.json`;
do not add new exceptions merely to hide broken links. Run `git diff --check`
when working in a Git checkout.

For content, route, or media changes, run `pnpm build` and `pnpm verify`.
Use `pnpm verify:seo` after metadata or social-card changes. The build prepares
media and social cards; no manual edit of their manifests is needed.

The six migrated skills are available under `.agents/skills/`: `acho-create-content`,
`acho-translate-content`, `acho-link-entries`, `acho-audit-content`,
`acho-organize-attachments`, and `acho-publish-draft`. They retain the original
editorial purpose and now follow this Astro content layout.
