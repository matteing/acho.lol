---
name: acho-audit-content
description: Audit acho.lol Markdown for broken wikilinks, invalid frontmatter, stale drafts, thin pages, bilingual mirror drift, language-crossing links, and attachment problems. Use for content QA, consistency reviews, migration checks, or pre-publication reports; remain read-only unless the user also asks for fixes.
---

# Audit acho.lol content

Treat an audit as read-only unless the user explicitly asks to fix findings.

1. Inventory published Spanish Markdown and English Markdown below `en/`.
   Exclude repository instructions, templates when appropriate, and generated or
   hidden tooling directories.
2. Check YAML frontmatter syntax, titles, useful tags, English `lang: en`, and
   same-slug Spanish/English parity. Do not require empty `aliases` arrays.
3. Extract Obsidian wikilinks while ignoring embeds, external URLs, code fences,
   and aliases after `|`. Resolve explicit paths and flag ambiguous title-only
   links separately from definitely missing targets.
4. Flag English pages that link into the Spanish tree unintentionally and
   Spanish pages that use `en/` unintentionally.
5. Report stale `#wip` or `#stub` markers, warning callouts that no longer match
   the page, near-empty published pages, and orphan pages with no inbound links.
6. Check attachments for missing references, unreferenced files, duplicate
   hashes, generic names, and placement far from their only consumers.
7. Check category indexes for a title and short introduction. Do not expect or
   recommend manual entry lists because Quartz generates folder listings.
8. Present evidence with file paths and line numbers, grouped as errors,
   warnings, and informational cleanup. Distinguish confirmed defects from
   suggestions and false-positive risks.
