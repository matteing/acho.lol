---
name: acho-publish-draft
description: Promote an acho.lol draft from `Pendientes/` into the correct published section and complete its bilingual integration. Use when Codex is asked to publish, graduate, finish, or move a pending topic; do not publish an empty stub or guess missing factual content.
---

# Publish an acho.lol draft

1. Read the requested draft, `AGENTS.md`, the linguistic guide, and an analogous
   page in the likely destination section.
2. Determine whether the draft belongs in `Palabras/`, `Dichos/`, `Artículos/`,
   `Personas/`, or `Controversias/`. Ask only if the destination materially
   changes the intended page and cannot be inferred.
3. Require enough supported material for a useful published page. If the draft
   lacks core facts, examples, or context, keep it pending and report exactly
   what is needed instead of filling gaps with guesses.
4. Move the Spanish file to its final exact-title slug, normalize frontmatter
   and structure, and move associated media to the closest appropriate
   `_attachments/` directory.
5. Update references from `Pendientes/Temas por escribir.md` and directly
   related pages. Do not add a manual list to the destination `index.md`.
6. Create or update the matching English page with
   `$acho-translate-content`. Update both language trees' wikilinks and media
   paths.
7. Remove stale draft-only warnings or tags only when the published content now
   resolves them.
8. Verify old-path references are gone, new targets exist, both language pages
   are coherent, and `git diff --check` passes.
