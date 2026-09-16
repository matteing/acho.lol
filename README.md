# acho.lol

A bilingual encyclopedia of Puerto Rican popular culture, built with Astro and
plain Markdown. Spanish lives at `/`, English at `/en/`.

The site keeps acho.lol's original logo, typography, colors, and artwork. It
includes wikilinks, backlinks, page previews, multilingual search, callouts,
responsive images, inline video and embeds, and generated social cards. Pages
and navigation are static HTML; small browser modules add the interactive parts.

## Quickstart

Use **Node.js 24 LTS, version 24.16.0 or newer within the 24.x line**, and
**pnpm 11.19.0**. `.nvmrc` selects Node 24; `package.json` records the pnpm
version. Python 3 is needed for output verification, but not development or builds.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open [localhost:4321](http://localhost:4321). The first start generates responsive
images and social cards. Editing Markdown rebuilds the complete content index,
including backlinks on other pages.

Search uses an index generated from production HTML. Test it with:

```sh
pnpm build
pnpm preview
```

## Contribute

Write entries in `content/es/` and `content/en/`; paired translations share a
stable `translationKey`. Preserve the site's Puerto Rican voice and documented
sources. See [Contributing](CONTRIBUTING.md) and these guides:

- [Authoring](docs/authoring.md): metadata, links, translations, Markdown, and media.
- [Editorial workflow](docs/editorial-workflow.md): voice, evidence, and repository skills.
- [Architecture](docs/architecture.md): project structure, content processing, and commands.
- [Deployment](docs/deployment.md): Vercel settings, URLs, and release verification.
- [Migration record](docs/migration.md): preserved content and known source gaps.

Run the full local checks before release:

```sh
pnpm validate
pnpm exec playwright install chromium
pnpm test:browser
```

`validate` includes formatting, linting, types, unit tests, content auditing, a
production build, and Python checks of the generated links and SEO. Browser tests
use that build and start the preview server automatically. An existing Chromium
installation can be selected with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

Application code is covered by [LICENSE](LICENSE). Preserve existing attribution
and rights for editorial content, quoted material, artwork, and third-party
assets. Font licenses are included in [public/fonts/licenses](public/fonts/licenses/).
