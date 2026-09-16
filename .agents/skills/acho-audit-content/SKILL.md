---
name: acho-audit-content
description: Audit acho.lol Markdown for broken links, invalid frontmatter, stale drafts, thin pages, bilingual drift, unintended language-crossing links, and attachment problems. Use for content QA, consistency reviews, migration checks, or publication reports; remain read-only unless fixes are requested.
---

# Audit acho.lol content

Treat an audit as read-only unless fixes are requested. Read
[AGENTS.md](../../../AGENTS.md), the
[linguistic guide](<../../../content/es/Meta/Guía lingüística.md>), and the
[Astro editorial workflow](../../../docs/editorial-workflow.md).

1. Inventory Spanish pages in `content/es/` and English pages in `content/en/`.
   Exclude tooling and generated files. Include public `Pendientes` entries;
   distinguish `draft: true` exclusions and public-but-noindex templates.
2. Check frontmatter syntax, titles, descriptions, relevant tags, locale,
   genuine aliases, stable translation keys, and date provenance. Pair pages
   by `translationKey`; matching relative filenames remain the usual convention.
   Do not require empty metadata fields or invent a missing translation.
3. Run `pnpm audit:content` for the actual Markdown parser's link, heading,
   asset, translation, and baseline URL checks. It ignores literal code examples
   and distinguishes known source omissions from new errors. Do not expand
   `content-known-issues.json` just to make a failing audit pass.
4. Inspect ordinary links as well as wikilinks. Separate ambiguous titles from
   missing destinations and intentional cross-language references from mistakes.
5. Report stale editorial status, uncertainty callouts that no longer fit,
   near-empty public entries, and useful orphan-page connections. Tags such as
   `wip` and `stub` are metadata, not automatic publication controls.
6. Inspect originals in `public/**/_attachments/` for missing consumers,
   duplicate hashes, generic names, and misplaced assets. Both languages share
   root-relative URLs. Exclude generated derivatives and search the repository
   for non-Markdown consumers before reporting an orphan.
7. Category `index.md` files need a title and introduction. Astro generates the
   directory listing; do not recommend hand-maintained inventories.
8. Present evidence with file paths and line numbers. Separate confirmed errors,
   warnings, and optional cleanup, including false-positive risks. Existing
   `dist/` may be checked with `pnpm verify` and `pnpm verify:seo` when its
   build is known to match current content; do not mistake stale output for a
   source defect.
