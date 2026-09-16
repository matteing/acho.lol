# Contributing

Use Node.js 24.16 or newer in the 24 LTS line and pnpm 11.19.0. Python 3 is needed for the generated-site verifiers. Install with `pnpm install --frozen-lockfile`, then run `pnpm dev`.

For content, start with [the editorial workflow](docs/editorial-workflow.md). Spanish and English live under `content/`; keep their stable translation keys paired. Preserve Puerto Rican spelling, quotations, sources, and the site's informal voice. Keep editorial changes separate from unrelated application changes when practical.

For code, read [the architecture](docs/architecture.md). Keep routes thin, browser behavior near its component, and content processing independent of Astro. Prefer inferred types from validated schemas at input boundaries, explicit type imports, named functions, and small modules. Comments should explain a decision or constraint, not narrate obvious statements. Avoid broad casts and disabled lint rules as substitutes for understanding a type.

Run `pnpm format` before submitting, then `pnpm validate`. For behavior, layout, routing, search, or preview changes, also run `pnpm exec playwright install chromium` and `pnpm test:browser`. Browser tests use the production build so Pagefind is available. Add focused tests for changed behavior rather than tests that simply repeat the implementation.

Husky installs local hooks during `pnpm install` in a Git checkout. The commit hook formats and lints staged code; the push hook runs type checks and unit tests. CI runs the full validation and browser suite. Generated assets, local environment files, build output, and browser traces are ignored by Git. Do not commit them.

Explain the problem and resulting behavior in a pull request. Include relevant validation and desktop/mobile screenshots for visual changes. Keep discussion respectful and specific. New application code uses MIT; content and media keep their own licensing and attribution as described in [the notices](THIRD_PARTY_NOTICES.md).
