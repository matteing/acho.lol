---
name: acho-link-entries
description: Find and add useful wikilinks or Markdown links between existing acho.lol entries. Use to interlink pages, identify unlinked term mentions, repair internal navigation, or suggest backlinks; not general prose editing or external link research.
---

# Link acho.lol entries

Follow [AGENTS.md](../../../AGENTS.md) and the link conventions in the
[editorial workflow](../../../docs/editorial-workflow.md).

1. Build a term index from filenames, titles, and genuine aliases in
   `content/es/` and `content/en/`. Keep language targets separate and include
   intentionally public pending entries; exclude `draft: true` pages.
2. Scan body prose for unlinked mentions. Ignore frontmatter, headings, code,
   Mermaid, existing links, media directives, URLs, quotations where editing
   changes the source, and a page's own title.
3. Link the first useful occurrence per page. Prefer meaningful connections over
   repeated common words or a large number of links.
4. Use `[[Target]]` for an unambiguous local target and
   `[[Folder/Target|matched text]]` to disambiguate or change display text.
   English targets use `[[en/Folder/Target|label]]`; `content/` and the physical
   `es/` folder are not part of wiki targets. Standard Markdown links also
   contribute to backlinks.
5. An audit or request for suggestions gets candidates with source paths, line
   numbers, and proposed targets. A request to add or repair links authorizes
   the unambiguous edits. Report material unresolved choices without blocking
   the rest of the work.
6. Verify every target and any heading fragment, avoid self-links, and inspect
   sentences for natural reading. Backlinks are generated; do not edit a manual
   backlinks section or generated HTML.
7. Run `pnpm audit:content`, then `pnpm build` and `pnpm verify` after
   edits. Run `git diff --check` in a Git checkout. Existing known issues are
   not permission to introduce new unresolved targets.
