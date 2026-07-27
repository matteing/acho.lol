---
name: acho-translate-content
description: Translate or synchronize acho.lol pages between Puerto Rican Spanish and the English learner edition. Use when Codex is asked to translate a page, add an English counterpart, refresh stale bilingual content, or check translation parity; preserve culturally important Spanish rather than translating literally.
---

# Translate acho.lol content

1. Read `AGENTS.md`, `Meta/Guía lingüística.md`, the complete Spanish source,
   and any existing English counterpart.
2. Place the English page at the identical relative slug under `en/`. Copy the
   meaningful frontmatter, add `lang: en`, and translate reader-facing metadata.
3. Preserve Puerto Rican terms, quotations, names, lyrics, place names, and
   references when their original language carries the culture. Explain meaning,
   tone, register, and context in natural English instead of substituting a flat
   literal equivalent.
4. Preserve the source's factual claims and uncertainty. Do not add unsupported
   explanations, etymologies, or universal rules about Puerto Rican speech.
5. Rewrite internal links for the English tree. Use explicit `en/` targets and
   translate display text when useful. Keep external URLs and citations intact.
6. Adjust attachment paths for the extra `en/` directory depth. Reuse the same
   media unless a language-specific asset is required.
7. Preserve useful structure, but allow English paragraphs and headings to read
   naturally. Keep examples in Spanish when they teach usage, followed by a
   concise explanation or translation.
8. Compare both versions for omitted sections, broken links, frontmatter drift,
   and accidental translation of protected cultural language. Run
   `git diff --check` before finishing.
