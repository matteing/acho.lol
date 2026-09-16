# Social image generation

`node --import tsx scripts/prepare-social.ts` creates one 1200 × 630 PNG for every
published content page. Build and development startup run it before Astro. The
manifest at `public/social-manifest.json` is keyed by the content page ID and
contains `{ url, width, height, alt }`.

Images use the existing acho.lol logo, cream/blue/pink palette, Bricolage Grotesque
headings, and Instrument Sans labels. Spanish and English cards have localized
section labels and descriptions. Titles wrap and reduce their font size when
needed; a title that cannot fit fails the build instead of being clipped.

The PNG filename hashes the rendered text, generator source, logo, and font files.
Unchanged files and manifests retain their modification time. Changes to an
article body do not regenerate its card unless its visible card data changes.
Superseded generated PNGs are removed automatically.

Sharp's bundled Pango/FreeType renderer uses the static TTF instances committed
in `scripts/assets/fonts/`. These were derived once from the existing site WOFF2
files with FontTools 4.65.0; `scripts/convert-social-fonts.py` reproduces the
conversion if the source fonts change. Bricolage Grotesque uses weight 700,
optical size 72, width 100; Instrument Sans uses weight 500 and width 100.
The derived family names are "Acho Social Display" and "Acho Social Text".
Normal builds need no Python, browser, system font installation, network request,
or conversion. Pango explicitly uses its Fontconfig backend, including on macOS,
with a project-local cache under `node_modules/.cache`.

The existing font licenses are retained unchanged alongside the TTF files:

- Bricolage Grotesque: `public/fonts/licenses/BricolageGrotesque-OFL.txt`, copyright
  2022 The Bricolage Grotesque Project Authors, SIL Open Font License 1.1.
- Instrument Sans: `public/fonts/licenses/InstrumentSans-OFL.txt`, copyright
  2022 The Instrument Sans Project Authors, SIL Open Font License 1.1.
