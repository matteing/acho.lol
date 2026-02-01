# Skill: new-entrada

Create a new Palabra (word/slang) or Dicho (saying/expression) entry for the acho.lol encyclopedia.

## Instructions

1. Ask the user for:
   - The term or phrase (this becomes the filename)
   - Whether it's a Palabra or Dicho
   - A brief definition
   - Any context they want to provide (examples, origin, variants, related terms)

2. Determine the correct folder:
   - `Palabras/` for individual words and slang
   - `Dichos/` for sayings, expressions, and phrases

3. Create the file at `{folder}/{term}.md` with this structure:

```markdown
---
title: "{term}"
tags:
  - {palabras|dichos}
  - (additional relevant tags: insultos, expresiones, peyorativo, vulgar, humor, comida, politica, etc.)
aliases:
  - (variant forms if any)
---

## Definición

(1-2 sentences explaining what it means)

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

(Optional: history, context, regional notes)

## Referencias

- (External sources if available)
```

4. After creating the file:
   - Update the relevant `index.md` (e.g., `Palabras/index.md`) to add a wikilink to the new entry
   - If the term belongs to an existing semantic hub in `Artículos/`, add a link there too
   - If the user hasn't provided enough info for all sections, mark it with `#wip` in the tags and add a WARNING callout at the top

## Tone

Write in informal Puerto Rican Spanish. Be jocose but precise. Don't sanitize vulgar terms — document them as they're actually used.

## Example

For a term like "Bregar":
- File: `Palabras/Bregar.md`
- Tags: `palabras`, `expresiones`
- Definition describes the multiple meanings
- Usage examples show real conversational context
- Variants list related forms
