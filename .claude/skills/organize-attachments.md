# Skill: organize-attachments

Audit and organize media attachments across the encyclopedia.

## Instructions

### Step 1: Inventory all attachments

Glob all files in `_attachments/` directories recursively. For each file, note:
- Current path and filename
- File type (image, video, GIF, etc.)
- File size

### Step 2: Check references

For each attachment, grep all markdown files for references to it. Categorize each attachment as:
- **Referenced** — used by one or more markdown files
- **Orphaned** — not referenced anywhere (candidate for deletion)

### Step 3: Check for naming issues

Flag attachments with:
- Generic names (Screenshot, IMG_, Video, UUID-style names like `a1b2c3d4-...`)
- Spaces or special characters that could cause URL issues
- Names that don't describe their content

### Step 4: Check placement

Attachments should live in the `_attachments/` folder closest to the content that uses them:
- If an image is only used by files in `Personas/`, it should be in `Personas/_attachments/`
- If an image is used across multiple sections, it should be in the root `_attachments/`
- Flag misplaced attachments

### Step 5: Check for duplicates

Compare file sizes to find potential duplicate files across different `_attachments/` directories. Flag exact duplicates for consolidation.

### Step 6: Present report

```
## Attachment Audit Report

### Orphaned files (unreferenced)
- _attachments/old-file.png (450KB)

### Naming issues
- _attachments/IMG_1234.jpeg → suggest: descriptive-name.jpeg
  Referenced in: Personas/Fabio.md

### Misplaced files
- _attachments/mora-fabio-tweet.jpeg → should be in Personas/_attachments/
  Only referenced in: Personas/Fabio.md

### Duplicates
- Artículos/_attachments/file.png == Palabras/_attachments/file.png (883KB)
  Consolidate to: _attachments/file.png (shared) or keep in Artículos/_attachments/ (primary user)

### Summary
- Total attachments: X
- Total size: X MB
- Referenced: X
- Orphaned: X
- Needs renaming: X
- Misplaced: X
- Duplicates: X sets
```

### Step 7: Apply fixes (with confirmation)

Ask the user which fixes to apply:
- **Delete orphans** — remove unreferenced files
- **Rename** — rename generic files and update all markdown references
- **Relocate** — move files to the correct `_attachments/` folder and update references
- **Deduplicate** — remove duplicate copies, update references to point to a single location

Use `mv` via Bash to rename/move files, then Edit to update all markdown references. Always verify no broken references remain after changes.
