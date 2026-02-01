# Skill: new-persona

Create a new Persona (person profile) entry for the acho.lol encyclopedia.

## Instructions

1. Ask the user for:
   - The person's name or known alias
   - Who they are and why they're culturally relevant
   - Any media (images, videos) to include
   - Related entries to link to

2. Create the file at `Personas/{name}.md` with this structure:

```markdown
---
title: "{name}"
tags:
  - personas
  - (relevant tags: comedia, musica, politica, memes, deportes, etc.)
aliases:
  - (nicknames or alternative names)
---

(Optional: embedded image at the top)

(Narrative biographical text. Informal, jocose tone. Focus on cultural relevance — why does this person matter to Puerto Rican popular culture?)

## Véase también

- [[Related Entry 1]]
- [[Related Entry 2]]

## Referencias

- (External sources, social media, articles)
```

3. After creating the file:
   - Update `Personas/index.md` to include the new entry
   - Link from any existing entries that reference this person

## Guidelines

- Personas entries are narrative, not template-based — tell the story
- Focus on cultural impact and why the person matters
- Include media where available (images go in `Personas/_attachments/`)
- Never include sensitive personal information without consent
- Use footnotes for references: `[^1]` style
- Write in informal Puerto Rican Spanish
