# Skill: new-articulo

Create a new semantic hub (Artículo) for the acho.lol encyclopedia.

## Instructions

1. Ask the user for:
   - The topic/concept the hub will cover
   - The title (typically follows the pattern "Las miles de maneras de...")
   - Which terms/entries it should group together
   - Any severity/hierarchy they want to establish

2. Create the file at `Artículos/{title}.md` with this structure:

```markdown
---
title: "{title}"
tags:
  - articulos
  - (topic-specific tags)
---

> [!WARNING] Esta página está incompleta. #wip
> Estoy en el proceso de completar y categorizar esta página.

(Brief intro paragraph explaining the concept)

## La jerarquía de severidad

\```mermaid
flowchart TD
  A["Concept"]
  A --> P["Palabras"]
  A --> D["Dichos"]
  (... hierarchy nodes ...)
\```

## ¿Cuál palabra usar?

\```mermaid
flowchart TD
  S["¿Starting question?"]
  (... decision tree ...)
\```

## Palabras

### Con páginas propias

- [[Term 1]]
- [[Term 2]]

### Otros (sin página propia)

- **Term** — brief inline description.

## Dichos

- [[Saying 1]]
- [[Saying 2]]
```

3. After creating the hub:
   - Ensure all referenced entries exist (create stubs if needed using the new-entrada pattern)
   - Update any existing entries to link back to this hub
   - The mermaid flowcharts should show severity levels and decision paths

## Guidelines

- Hubs should group 3+ related terms minimum
- Include both terms with their own pages and inline-only terms
- The severity hierarchy should combine intensity + how vulgar the term sounds in casual conversation
- Decision flowcharts help readers pick the right word for their context
- Write in informal Puerto Rican Spanish
