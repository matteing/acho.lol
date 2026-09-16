---
name: acho-translate-content
description: Translate or synchronize acho.lol pages between Puerto Rican Spanish and the English learner edition. Use to translate a page, add an English counterpart, refresh bilingual content, or check translation parity; preserve culturally important Spanish rather than translating literally.
---

# Translate acho.lol content

Read [AGENTS.md](../../../AGENTS.md), the
[linguistic guide](<../../../content/es/Meta/Guía lingüística.md>), the complete
Spanish source, and any existing English counterpart. Consult the
[editorial workflow](../../../docs/editorial-workflow.md) for Astro conventions.

1. A page at `content/es/Palabras/Combi.md` normally pairs with
   `content/en/Palabras/Combi.md`. Give both the same stable `translationKey`;
   preserve an existing key even after a rename. Use `lang: en` in the English
   page and translate reader-facing titles and descriptions.
2. Preserve Puerto Rican terms, quotations, names, lyrics, place names, and
   references when their original language carries the culture. Explain meaning,
   tone, register, and context in natural English rather than substituting a
   flat literal equivalent.
3. Preserve factual claims and uncertainty. Do not add unsupported explanations,
   etymologies, or universal rules about Puerto Rican speech.
4. Resolve internal links to actual English counterparts, using explicit wiki
   targets such as `[[en/Palabras/Combi|combi]]`. Ordinary root-relative Markdown
   page URLs need `/en/`. Translate display text where useful; keep external
   URLs and citations intact. If a counterpart is absent, report the gap rather
   than inventing a destination or silently changing languages.
5. Share the same root-relative media URLs from `public/` in both versions;
   there is no extra `../` path adjustment for English. Preserve source assets
   unless a language-specific asset is needed.
6. Keep useful structure, but let English paragraphs and headings read naturally.
   Retain Spanish examples when they teach usage, followed by concise explanations.
7. Compare sections, links, metadata, and culturally important phrasing. Keep
   genuine aliases, relevant tags, and existing date provenance; do not copy a
   Spanish publication date onto a newly translated page as an invented fact.
8. Run `pnpm audit:content`, `pnpm build`, and `pnpm verify`; inspect the
   paired language links and run `git diff --check` in a Git checkout.
