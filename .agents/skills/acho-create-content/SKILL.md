---
name: acho-create-content
description: Create or substantially expand acho.lol encyclopedia pages, including Puerto Rican words, sayings, articles, people, wildlife, and cultural controversies. Use for a new entry, profile, article, debate, or related bilingual content; not translation-only work or a read-only audit.
---

# Create acho.lol content

Read [AGENTS.md](../../../AGENTS.md), the
[linguistic guide](<../../../content/es/Meta/Guía lingüística.md>), the
[Astro editorial workflow](../../../docs/editorial-workflow.md), and one analogous
published page before editing.

1. Infer the content type from the request. Ask only for a missing choice that
   materially changes the page; otherwise create the best supported draft and
   mark specific uncertainty.
2. Place Spanish source at `content/es/<section>/<exact spoken term>.md`.
   Preserve accents and punctuation. Use the appropriate section, including
   `Fauna` for wildlife and its Puerto Rican names.
3. Write accurate frontmatter: `title`, a useful `description`, `lang: es`, a
   stable `translationKey`, relevant `tags`, and `aliases` only for real variants.
   Preserve existing date provenance; do not invent dates or authors.
4. Match the content type:
   - Word or saying: meaning, register, usage, variants, context or origin, and
     references when available.
   - Article: explain and compare related ideas. Add Mermaid when a hierarchy
     or decision path is clearer visually.
   - Person: tell the culturally relevant story with public sources; omit
     sensitive personal details.
   - Wildlife: explain the local name and identification with reliable sources;
     distinguish common names from precise species claims.
   - Controversy: explain positions and context fairly; humor does not replace
     evidence.
5. Add useful same-language links to existing entries and links from directly
   related pages when they improve navigation. Astro generates backlinks and
   category listings; do not maintain either by hand.
6. Keep shared media in `public/`, using standard Markdown images and documented
   media directives. Reuse media URLs across languages.
7. For a ready entry, create or update its counterpart in `content/en/` with
   `$acho-translate-content`. Otherwise keep it in `content/es/Pendientes/` and
   state what is missing. Pending entries are public unless `draft: true` is
   explicitly intended.
8. Inspect both language versions and changed links. Run `pnpm audit:content`,
   `pnpm build`, and `pnpm verify`; run `git diff --check` in a Git checkout.
