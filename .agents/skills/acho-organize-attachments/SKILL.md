---
name: acho-organize-attachments
description: Audit, rename, relocate, deduplicate, or remove media in acho.lol `_attachments` folders while preserving Markdown references. Use when Codex is asked to organize images or media, find unused attachments, fix attachment paths, or reduce duplicates; default to a report for deletion candidates unless deletion is explicitly authorized.
---

# Organize acho.lol attachments

1. Inventory files under every `_attachments/` directory with path, type, byte
   size, and a content hash. Do not inspect generated output.
2. Search Markdown for Obsidian embeds and ordinary image links. Resolve paths
   relative to each source page, including the additional depth below `en/`.
3. Classify files as referenced, missing, apparently orphaned, duplicated,
   generically named, or misplaced. Treat dynamic or non-Markdown consumers as
   a false-positive risk and search the whole repository before calling a file
   orphaned.
4. Keep section-specific media in the closest section `_attachments/` folder
   and genuinely shared media in the root `_attachments/` folder.
5. Report proposed moves, names, consolidations, or deletions before destructive
   changes unless the user already authorized those exact actions.
6. When applying changes, move rather than copy where practical, update every
   reference in both language trees, preserve extensions unless conversion was
   requested, and never overwrite a different file silently.
7. Re-scan references after edits, confirm no changed embed is broken, and run
   `git diff --check`.
