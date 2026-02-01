# Skill: audit

Audit the acho.lol encyclopedia content for completeness and consistency issues.

## Instructions

Run the following checks and present a report:

### 1. Index completeness
- Read each `index.md` file (Palabras, Dichos, Personas, etc.)
- Glob for all `.md` files in the corresponding folder
- Report entries that exist as files but are NOT listed in their index

### 2. Broken wikilinks
- Scan all markdown files for `[[...]]` wikilinks
- Check that each link target exists as a file
- Report broken links with the source file and target

### 3. Missing frontmatter
- Check all content files for YAML frontmatter
- Report files missing `title`, `tags`, or `aliases` fields

### 4. Stale WIP markers
- Find all files tagged `#wip` or `#stub`
- Report them grouped by folder

### 5. Empty or near-empty entries
- Find files with fewer than 5 lines of actual content (excluding frontmatter)
- Report as candidates for expansion or removal

### 6. Orphan entries
- Find content files that are not linked from any other file
- Report as candidates for linking

### 7. Attachment usage
- Find files in `_attachments/` folders
- Check which attachments are referenced and which are orphaned

## Output format

Present results as a structured report with actionable items, grouped by severity:
- **Errors** — Broken links, missing files
- **Warnings** — Missing frontmatter, stale WIPs, empty entries
- **Info** — Orphan entries, unused attachments, index gaps
