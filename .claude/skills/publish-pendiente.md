# Skill: publish-pendiente

Move a draft from Pendientes/ to its proper content section.

## Instructions

1. List all files in `Pendientes/` and show them to the user
2. Ask which draft to publish and which section it belongs to (Palabras, Dichos, Artículos, Personas, Controversias)
3. Read the current draft content
4. Determine what's needed:
   - If the draft has enough content, move it to the target folder
   - If it needs more content, ask the user to provide missing information and flesh it out using the appropriate template/structure
5. Move the file:
   - Create the file in the target folder with proper frontmatter and structure
   - Delete or empty the file in Pendientes/
   - Update the target folder's `index.md` to include the new entry
   - Update any semantic hubs in Artículos/ if applicable
   - Remove the entry from `Pendientes/Temas por escribir.md` if it was listed there

## Guidelines

- Don't publish truly empty stubs — they need at minimum a definition and 1-2 examples
- Add `#wip` tag if the entry still needs significant work after publishing
- Ensure wikilinks in the entry point to existing pages
- Move any associated attachments to the target folder's `_attachments/`
