---
name: acho-organize-attachments
description: Audit, rename, relocate, deduplicate, or remove acho.lol media originals under public/_attachments and public/Section/_attachments while preserving content references. Use for media organization, missing assets, or duplicate cleanup; report deletion candidates unless removal is requested.
---

# Organize acho.lol attachments

Read the media conventions in the
[editorial workflow](../../../docs/editorial-workflow.md).

1. Inventory original files under `public/**/_attachments/` by path, type,
   size, and content hash. Exclude `public/_media/`, `public/_social/`,
   manifests, caches, and `dist/`; these are derived or generated output.
2. Search both `content/es/` and `content/en/` for Markdown images, media
   directives, and ordinary attachment links. A URL like
   `/Fauna/_attachments/gongoli-enrollado.png` resolves beneath `public/`.
   Decode URL-encoded filenames; English uses the same shared media URL.
3. Classify referenced, missing, apparently orphaned, duplicate, generically
   named, or misplaced assets. Check components, styles, metadata, social-card
   code, and other non-Markdown consumers before declaring anything unused.
4. Keep section media in `public/<Section>/_attachments/` and shared media in
   `public/_attachments/`. Reuse one original across translations.
5. Apply the moves, renames, or deduplication already authorized by the user.
   When deletion was not requested, report candidates rather than removing
   them. Do not overwrite a different file silently.
6. Move rather than duplicate where practical, update every consumer in both
   languages, and preserve extensions unless conversion was requested. Keep
   media type and useful alt text intact.
7. Run `pnpm audit:content`, `pnpm build`, and `pnpm verify`; the build
   recreates optimized derivatives and manifests. Inspect changed images or
   media players and run `git diff --check` in a Git checkout.
