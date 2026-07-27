# Codex content guide

## Scope

This repository contains the Markdown source for acho.lol, a bilingual
encyclopedia of Puerto Rican popular culture. Spanish pages live at the
repository root. English counterparts use the same relative path below `en/`.

Before writing or translating content, read `Meta/Guía lingüística.md` and use
an analogous published page as a structural reference.

## Editorial rules

- Preserve the wiki's informal, jocose Puerto Rican voice while remaining
  precise. Vulgar terms are documented without censorship.
- Never invent facts, quotations, etymologies, or sources. Mark uncertain
  material with a Quartz warning callout and explain what remains unverified.
- Preserve quotations, names, lyrics, and source spelling. Do not “correct” a
  speaker's voice.
- Use **tiraera / tiraeras** by default, not _tiradera / tiraderas_, except in
  quotations or when discussing the variant.
- Use recognizable Puerto Rican spellings where established, but do not add
  decorative phonetic spellings to make prose sound Boricua.
- Do not include sensitive personal information without consent or reproduce
  copyrighted material beyond brief, properly attributed excerpts.

## Bilingual structure

- Spanish is the source language. A published page at `Palabras/Cabrón.md` maps
  to `en/Palabras/Cabrón.md`; keep filenames and folder slugs aligned.
- Add `lang: en` to English frontmatter. Spanish pages use the default locale
  and do not need a `lang` field.
- When changing a published Spanish page that already has an English mirror,
  update the mirror in the same task unless the user explicitly limits scope.
- English teaches culture rather than replacing it. Keep Puerto Rican terms,
  quotations, names, lyrics, and cultural references in Spanish; explain their
  meaning, register, context, and humor naturally in English.
- English wikilinks must remain under `en/`, for example
  `[[en/Palabras/Combi|combi]]`. Spanish links must not use that prefix.
- Keep English and Spanish media paths valid from their different directory
  depths. Prefer shared attachments instead of duplicated files.

## Content conventions

- Use exact spoken terms for filenames. Accents, `ñ`, and Spanish punctuation
  are expected.
- Use YAML frontmatter with a `title`, useful `tags`, and `aliases` when a page
  has genuine alternate names. Do not add empty metadata only to satisfy a
  template.
- Use Obsidian wikilinks: `[[Page]]`, `[[Folder/Page|label]]`, and
  `![[./_attachments/file.ext]]`.
- Category `index.md` files need only frontmatter and a short introduction;
  Quartz generates folder listings. Do not maintain manual entry inventories.
- Put unfinished drafts in `Pendientes/`. Use `#wip` or `#stub` and a warning
  callout only when the status is genuinely useful to readers or editors.
- Put media in the closest relevant `_attachments/` directory. Use the root
  attachment directory only for assets shared across sections.

## Repository skills

Use the matching repo skill for repeatable work:

- `$acho-create-content`: create words, sayings, articles, people, or debates.
- `$acho-translate-content`: create or refresh English counterparts.
- `$acho-audit-content`: check structure, links, parity, and attachments.
- `$acho-link-entries`: find and apply useful wikilinks.
- `$acho-organize-attachments`: audit or reorganize media safely.
- `$acho-publish-draft`: move a viable draft out of `Pendientes/`.

## Validation

- Inspect changed Markdown and run `git diff --check`.
- Search changed wikilink targets with `rg --files`; do not assume title-only
  links resolve when duplicate names exist.
- For structural, routing, or broad content changes, run the Quartz production
  build from the parent repository.
- Keep `AGENTS.md`, `.agents/`, `.codex/`, repository metadata, and draft-only
  tooling excluded from Quartz output.

## Code review rules

- Flag fabricated or unattributed claims presented as fact.
- Flag cultural terms or quotations flattened into literal English when the
  original wording is important to the lesson.
- Flag broken same-language wikilinks and Spanish/English mirror drift.
- Flag manual index lists, duplicated attachments, and tooling files that would
  be emitted by Quartz.
