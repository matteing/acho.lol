# Skill: link-entries

Scan content for opportunities to add wikilinks and automatically interlink entries.

## Instructions

Use a lightweight subagent (haiku) to perform this task efficiently.

### Step 1: Build a term index

Glob all `.md` files in Palabras/, Dichos/, Artículos/, Personas/, Controversias/. Build a list of all entry names (from filenames) and their aliases (from frontmatter). This is the "linkable terms" index.

### Step 2: Scan for linkable mentions

For each content file, scan the body text (below frontmatter) for mentions of terms from the index that are NOT already wrapped in `[[wikilinks]]`. A mention counts if:

- The exact term (case-insensitive) appears in running text
- It's not already inside `[[...]]` or `![[...]]`
- It's not inside a heading (`## ...`)
- It's not inside a code block or mermaid block

### Step 3: Present candidates

Present a grouped report of suggested links:

```
## Suggested wikilinks

### Palabras/Crical.md
- Line 4: "carajal" → [[Carajal]]
- Line 8: "revolú" → [[Revolú]]

### Artículos/Las miles de maneras de dar un golpe.md
- Line 12: "Fabio" → [[Personas/Fabio]]
```

### Step 4: Apply (with confirmation)

Ask the user which suggestions to apply (all, some, or none). Then use Edit to wrap the matched terms in wikilinks. When linking:

- Use `[[Term]]` if the mention matches the filename exactly
- Use `[[Term|matched text]]` if the case or form differs
- Use `[[Folder/Term|matched text]]` for cross-folder links only when needed to disambiguate
- Don't link a term more than once per file (first occurrence only)
- Never link a term to itself within its own page

## Implementation note

Launch the scanning work as a Task subagent with `model: "haiku"` for speed. The scan is read-only — only the final apply step modifies files, and that should be done in the main conversation with user confirmation.
