---
name: acho-publish-draft
description: Promote an acho.lol pending entry into its final content section and complete bilingual integration. Use to finish, graduate, publish, or move a pending topic; do not publish an empty stub or guess missing facts. This manages repository content, not deployment by itself.
---

# Publish an acho.lol draft

Read the draft, [AGENTS.md](../../../AGENTS.md), the
[linguistic guide](<../../../content/es/Meta/Guía lingüística.md>), the
[editorial workflow](../../../docs/editorial-workflow.md), and an analogous page
in the likely destination section.

1. Infer the correct section in `content/es/`: `Palabras`, `Dichos`, `Artículos`,
   `Personas`, `Fauna`, or `Controversias`. Ask only when an unresolved choice
   materially changes the intended entry.
2. Require supported facts, examples, and context sufficient for a useful entry.
   Otherwise leave it pending and report the concrete gaps. `Pendientes` pages
   may already be publicly accessible; `draft: true` is the actual exclusion
   flag.
3. Move the Spanish file to its final exact-title path. Preserve its
   `translationKey` and date provenance, refine frontmatter and structure, and
   add its previous public URL to `redirects` when it was already published.
   Alternate names remain `aliases`; they are not redirect paths.
4. Move associated originals under `public/<Section>/_attachments/` only when
   useful and authorized by the promotion's scope. Update all consumers and
   retain shared root-relative URLs across languages.
5. Update `content/es/Pendientes/Temas por escribir.md` and directly related
   pages. The final category's `index.md` gets no manual entry list.
6. Create or update the English counterpart with `$acho-translate-content`.
   Move an existing counterpart, retain the shared translation key, preserve
   its old URL when needed, and repair references in both languages.
7. Remove obsolete status tags or warnings only when their uncertainty is
   resolved. Remove `draft: true` only when public generation is intended.
8. Run `pnpm audit:content`, `pnpm build`, and `pnpm verify`. Validate
   new destinations, translation switching, and old-URL redirects; run
   `git diff --check` in a Git checkout. If the migration URL baseline flags an
   intentional move, demonstrate that its old route redirects correctly before
   proposing a narrowly scoped baseline update—do not discard the check.
