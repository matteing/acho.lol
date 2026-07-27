---
name: acho-create-content
description: Create or substantially expand acho.lol encyclopedia pages, including Puerto Rican words, sayings, semantic articles, people, and cultural controversies. Use when Codex is asked to add an entry, profile, article, debate, or related bilingual content; do not use for translation-only work or a read-only audit.
---

# Create acho.lol content

1. Read `AGENTS.md`, `Meta/Guía lingüística.md`, and one analogous published
   page before editing.
2. Infer the content type from the request. Ask only for a missing choice that
   would materially change the page; otherwise create the best supported draft
   and mark specific uncertainty.
3. Use the exact term or title as the filename in the appropriate folder:
   `Palabras/`, `Dichos/`, `Artículos/`, `Personas/`, or `Controversias/`.
4. Write accurate frontmatter. Use `title` and relevant `tags`; add `aliases`
   only for real variants. Do not invent metadata.
5. Match the content type:
   - Word or saying: meaning, register, usage, variants, context or origin, and
     references when available.
   - Article: explain and compare at least three related ideas; add Mermaid only
     when a hierarchy or decision path is genuinely clearer visually.
   - Person: tell the culturally relevant story and cite public sources; omit
     sensitive personal details.
   - Controversy: explain the positions and context fairly, with humor that does
     not replace evidence.
6. Add useful wikilinks to existing pages and backlinks from directly related
   pages when they improve navigation. Do not manually list entries in an
   `index.md` file.
7. If the page is ready to publish, create or update the same-slug English page
   with `$acho-translate-content`. If it is not ready, keep it in `Pendientes/`
   and state what is missing.
8. Run `git diff --check`, verify new wikilink targets, and inspect both language
   versions before finishing.
