# Deployment

This project builds a static site for `https://acho.lol`. The repository target is
`matteing/acho.lol`; Vercel serves the generated `dist/` directory. Static Astro
deployment requires no Vercel adapter. See the
[official Astro deployment guide](https://docs.astro.build/en/guides/deploy/vercel/).

## Vercel settings

Import the repository and select the directory containing this project's
`package.json` and `vercel.json`. Use the repository root when the Astro project
occupies that root; use `acho-astro` only if it remains a subfolder in the Git
repository.

| Setting              | Value                                                  |
| -------------------- | ------------------------------------------------------ |
| Framework preset     | Astro                                                  |
| Node.js version      | 24.x; build runtime must satisfy Node 24.16.0 or newer |
| Package manager      | pnpm 11.19.0, from `package.json`                      |
| Build command        | `pnpm build`                                           |
| Output directory     | `dist`                                                 |
| Install command      | Default detection with Corepack enabled                |
| Environment variable | `ENABLE_EXPERIMENTAL_COREPACK=1`                       |

Set the Corepack variable for both preview and production builds so Vercel uses
the exact `packageManager` version. Do not rely on lockfile detection alone or
an unversioned install override to select pnpm 11.19.0. Verify the Node and pnpm
versions in the first build log. Vercel manages Node minor and patch versions
within the chosen major. These settings follow Vercel's
[Corepack instructions](https://vercel.com/docs/builds/configure-a-build#corepack),
[package-manager detection](https://vercel.com/docs/package-managers), and
[Node version documentation](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

`vercel.json` records the framework, build command, output directory, trailing
slashes, redirects, and immutable cache headers for hashed Astro, responsive
image, and social-card assets. The application needs no runtime environment
variables, database, or secret API keys. Python 3 is needed for verification in
local development and CI, but not for Vercel's `pnpm build`.

The build runs responsive media generation, social-card generation, Astro, then
Pagefind. Deploy the complete output, including `dist/pagefind/`, image variants,
social PNGs, and preview JSON. Commit original attachments and bundled fonts;
generated directories are rebuilt and should remain ignored.

## Domains and URLs

`src/site.config.ts` defines the production origin used by canonical URLs,
hreflang, structured data, the sitemap, and social image URLs. Preview deployments
keep `https://acho.lol` as their canonical origin. A fork publishing at a different
domain should update that configuration and `public/robots.txt` together.

Connect `acho.lol` to the Vercel project and apply the DNS records supplied by
Vercel for that project. Confirm the domain serves the intended production
deployment over HTTPS before checking share cards with external crawlers.
Localhost cannot be fetched by those crawlers. The apex domain serves the site;
`www.acho.lol` permanently redirects to `acho.lol` with HTTP 308 so hosting and
canonical URLs agree.

Spanish URLs have no language prefix; English URLs start with `/en/`. Public
content URLs use trailing slashes. The migration preserves all 112 original
content URLs apart from that normalization. The source inventory is in
`scripts/migration/baseline-urls.json`.

`vercel.json` retains 40 verified permanent redirects for old alternate-name
URLs. Their observed destinations are recorded in
`scripts/migration/legacy-redirects.json`, which Astro also reads to generate
static redirect fallbacks. Some historical root aliases already led to English
entries; those destinations are preserved. Both `source` and `destination` paths
in Vercel rules use percent-encoded Unicode. The edge router matches encoded
request paths, so a literal accented source would miss its HTTP redirect and
serve the static HTML fallback instead.

When moving an entry, keep its stable translation key, add its old URL to the
new page's frontmatter `redirects`, and add a matching permanent redirect to
`vercel.json`. Frontmatter produces a static HTML fallback; the host rule
provides the HTTP redirect. Preserve the migration inventory as a record of the
original site rather than rewriting it to conceal URL changes.

## Release checks

```sh
pnpm install --frozen-lockfile
pnpm validate
pnpm exec playwright install chromium
pnpm test:browser
```

After deployment, confirm a Spanish article, its English counterpart, a legacy
redirect, production search, an inline media page, `/sitemap.xml`, `/robots.txt`,
and an actual `/_social/` PNG. Check the final HTTP destination of redirects and
the status of an unknown URL as well as the rendered page.

`pnpm verify:seo` validates local output consistency, including canonical URLs,
real translation alternates, noindex policy, structured data, and PNG dimensions.
Public crawler checks verify delivery and caching separately. The
[migration record](migration.md) documents inherited content gaps; normal builds
do not require access to the old Quartz checkout.
