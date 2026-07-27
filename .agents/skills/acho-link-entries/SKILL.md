---
name: acho-link-entries
description: Find and add useful Obsidian wikilinks between existing acho.lol entries. Use when Codex is asked to interlink pages, identify unlinked term mentions, repair internal navigation, or suggest backlinks; do not use for general prose editing or external link research.
---

# Link acho.lol entries

1. Build a term index from published filenames, titles, and genuine aliases in
   both language trees. Keep Spanish and English targets separate.
2. Scan body prose for unlinked mentions. Ignore frontmatter, headings, code,
   Mermaid, existing `[[wikilinks]]`, embeds, URLs, quotations where editing
   would alter the source, and a page's own title.
3. Prefer high-value semantic links. Link the first useful occurrence per page;
   do not turn repeated common words into visual noise.
4. Use `[[Target]]` for an exact unambiguous local target and
   `[[Folder/Target|matched text]]` when display text differs or disambiguation
   is needed. English targets must start with `en/`.
5. If the user asked for suggestions or an audit, return candidates with file
   paths, line numbers, and proposed targets without editing. If the user asked
   to add or fix links, apply the unambiguous candidates and report any choices
   that still need confirmation.
6. Verify every changed target exists, avoid self-links, run
   `git diff --check`, and inspect the resulting sentences for natural reading.
