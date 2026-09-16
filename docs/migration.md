# Content migration report

Source: `../acho.lol` at `19aae885d46b61f724592293645755128dacdfba`.

- Imported 112 Markdown pages: 57 Spanish and 55 English.
- Copied 33 shared attachment files without modifying originals.
- Kept all source prose, titles, tags, aliases, code examples, and article wikilinks.
- Included intentionally public `Pendientes` and `Meta/Templates`; excluded `README.md`, `AGENTS.md`, hidden files, and editor tooling.
- Added `lang` and stable `translationKey` metadata. Translation keys initially match source paths; retain them when renaming entries.
- Added missing `date` / `lastmod` from earliest / latest per-file `git log --follow` author timestamps, normalized to UTC. These dates reflect repository history, not independently verified publication dates.
- Replaced local media embeds with standard Markdown images or media directives; converted YouTube and Instagram markup to directives. Existing filenames and source assets remain unchanged.
- Alt text retained when supplied. Otherwise derived from existing attachment filenames; an editorial accessibility review can improve those labels.
- `scripts/prepare-media.ts` creates responsive WebP derivatives in `public/_media/` and records dimensions, preserving animated GIF originals.
- The home-cover artwork was available in the source. Separate logo and favicon files were absent from that content repository; the original published site's SVG branding and fonts were subsequently imported into `public/brand/`, `public/favicon.svg`, and `public/fonts/`.
- The source home `socialImage: acho-home-cover-og.png` referred to a missing source asset. The Astro site now generates dedicated share cards for every page with `scripts/prepare-social.ts`; it does not depend on that missing file.

## Embed conversions

- image: 25
- instagram: 1
- video: 14
- youtube: 24

## Missing translations

English:

- `Fauna/Gongolí.md`
- `Fauna/index.md`

Spanish:

- None.

No translations were generated. Missing counterparts must remain explicit in the language switcher.

## Unresolved media

- None.

## Unresolved article links (import inventory)

- Artículos/Las miles de maneras de dar una golpiza.md: [[Dar como una pandereta de pentecostal|dar como una pandereta de pentecostal]]
- Artículos/Las miles de maneras de dar una golpiza.md: [[Una galleta]]
- Artículos/Las miles de maneras de dar una golpiza.md: [[darle-como-pillo-de-pelicula]]
- Dichos/Coger de pendejo.md: [[Pendejo|pendejo]]
- Palabras/Combi.md: [[Chocha|chocha]]
- Palabras/Códigos.md: [[Ponerse bruto|Ponte bruto]]
- Palabras/Iupi.md: [[Residente]]
- Palabras/Iupi.md: [[Tempo]]
- Palabras/Iupi.md: [[Residente v. Tempo]]
- Palabras/Maleante.md: [[Mamao|mamao]]
- Personas/Fabio.md: [[Mora]]
- Personas/Fabio.md: [[Jhayco v. Mora|el famoso verso de 911 de Jhayco]]
- Personas/Fabio.md: [[Tiraera|tiraera]]
- Personas/Fabio.md: [[Ankhal]]
- en/index.md: [[en/Fauna/index|Wildlife]]

## Ambiguous article links (import inventory)

- None.

The Astro Markdown AST validator is authoritative for link resolution. This inventory excludes fenced and inline code, but does not validate external URLs or heading fragments.

## Re-running the import

`python3 scripts/migration/migrate-content.py` re-copies the source snapshot into this folder. It overwrites matching imported content, so review any post-migration edits before running it again. The source repository is read-only throughout.
