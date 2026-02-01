# CLAUDE.md — acho.lol

## Project overview

acho.lol is a wikilink-based encyclopedia of Puerto Rican popular culture. Content is written in Markdown with Obsidian-flavored wikilinks and rendered via Quartz. This repo contains only the content (no build tooling) — it's consumed as a git submodule by the Quartz site repo.

## Language and tone

- All content is in **Spanish** (Puerto Rican Spanish specifically).
- Tone is **informal and jocose** — this is not an academic encyclopedia. Memes, slang, and cultural references are welcome.
- Despite the informal tone, information must be **precise and verifiable**. If something can't be verified, mark it with `> [!WARNING]`.
- Vulgar language is documented openly — that's the point. Don't censor terms.

## Content structure

```
Palabras/        → Individual word/slang entries
Dichos/          → Sayings and expressions
Artículos/       → Semantic hubs grouping related terms
Personas/        → People profiles
Controversias/   → Cultural debates
Pendientes/      → Drafts and planned topics (not published)
Meta/            → Wiki documentation, templates, tasks
_attachments/    → Shared media (images, videos, GIFs)
```

Each content folder may have its own `_attachments/` subfolder for section-specific media.

## File conventions

- **Filenames** use the exact term as spoken: `Crical.md`, `La de los pastores.md`
- Accents (á, é, í, ó, ú), ñ, and ¿? are allowed and expected in filenames
- No abbreviations — use the full term
- Index files (`index.md`) serve as category landing pages
- Media files go in `_attachments/` directories

## Frontmatter

All content files should have YAML frontmatter:

```yaml
---
title: "Term or Title"
tags:
  - category    # palabras, dichos, personas, politica, comedia, etc.
  - descriptor  # insultos, expresiones, peyorativo, vulgar, humor, etc.
aliases:
  - Variant 1   # Alternative forms of the term
  - Variant 2
---
```

## Entry template (Palabras / Dichos)

```markdown
## Definición

(1-2 sentences: what it means)

## Equivalente en inglés

(Approximate English translation)

## Uso

- *Example sentence 1*
- *Example sentence 2*
- *Example sentence 3*

## Variantes

- *Variant 1*
- *Variant 2*

## Notas / Origen

(Optional: history or context)

## Referencias

- (External sources if available)
```

## Semantic hubs (Artículos)

Semantic hubs group related terms under a common concept. They typically include:
- A mermaid flowchart showing severity/decision hierarchy
- Links to individual entries (`[[Term]]`)
- Inline descriptions for terms that don't have their own page
- "¿Cuál palabra usar?" decision trees

Create a hub when there are 3+ related terms worth comparing. Individual entries link back to their hub.

## Wikilinks

- Internal links: `[[Page Name]]` or `[[Page Name|Display Text]]`
- Cross-folder links: `[[Folder/Page]]` or `[[Personas/Pelús|pelús de la iupi]]`
- Embedded media: `![[./_attachments/filename.ext]]`
- Embedded YouTube: `![[https://www.youtube.com/watch?v=ID]]`

## Status markers

- `#wip` tag → Work in progress
- `#stub` tag → Minimal entry needing expansion
- `> [!WARNING]` → Unverified or incomplete content
- `> [!NOTE]` → Informational callout

## Rules

- Never invent information. If unsure, mark it with a WARNING callout.
- Never copy copyrighted content.
- Never include sensitive personal information without consent.
- Index files (`index.md`) should only contain a title and brief description — Quartz auto-generates the entry listings via folder pages. Do NOT add article lists to index files.
- When creating a new entry that belongs to a semantic hub, add a link from the hub article.
- Keep the Pendientes folder for drafts/stubs that aren't ready for the main sections.

## Commands

Use the following slash commands for content operations:
- `/new-entrada` — Create a new Palabra or Dicho entry
- `/new-articulo` — Create a new semantic hub (Artículo)
- `/new-persona` — Create a new Persona profile
- `/new-controversia` — Create a new Controversia entry
- `/audit` — Audit content for completeness issues
- `/publish-pendiente` — Move a Pendiente draft to its proper section
- `/link-entries` — Scan content for missing wikilinks and auto-interlink entries (uses haiku subagent for speed)
- `/organize-attachments` — Audit media files for orphans, duplicates, naming issues, and misplacement
