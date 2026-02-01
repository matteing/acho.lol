# acho.lol

La enciclopedia bori pop — un wiki irreverente, jocoso y 100% boricua dedicado a preservar la cultura popular puertorriqueña.

The bori pop encyclopedia — an irreverent, humorous, and 100% Boricua wiki dedicated to preserving Puerto Rican popular culture.

---

## Qué es esto / What is this

**ES:** Este repositorio contiene el contenido de [acho.lol](https://acho.lol), una enciclopedia colaborativa que documenta jerga, dichos, memes, personas y controversias de la cultura puertorriqueña. El sitio se genera con [Quartz](https://quartz.jzhao.xyz/) y este repo se consume como git submodule.

**EN:** This repository contains the content for [acho.lol](https://acho.lol), a collaborative encyclopedia documenting slang, sayings, memes, people, and controversies from Puerto Rican culture. The site is built with [Quartz](https://quartz.jzhao.xyz/) and this repo is consumed as a git submodule.

El tono es informal y jocoso, pero la información debe ser precisa. No aspiramos a ser un proyecto académico — hay demasiados memes aquí pa' eso.

The tone is informal and humorous, but the information must be accurate. We don't aspire to be an academic project — there are too many memes here for that.

## Estructura / Structure

```
├── Palabras/        Slang and vocabulary / Jerga y vocabulario
├── Dichos/          Sayings and expressions / Frases y expresiones
├── Artículos/       Semantic hubs grouping related concepts / Hubs semánticos
├── Personas/        Biographies and profiles / Biografías y perfiles
├── Controversias/   The eternal Boricua debates / Las eternas peleas boricuas
├── Pendientes/      Drafts and planned topics / Borradores y temas por escribir
├── Meta/            Wiki docs, templates, tasks / Documentación, templates, tareas
└── _attachments/    Shared images and media / Imágenes y media compartidos
```

Cada carpeta de contenido puede tener su propia subcarpeta `_attachments/` para media específico a esa sección.

Each content folder may have its own `_attachments/` subfolder for section-specific media.

## Conceptos clave / Key concepts

### Semantic Hubs

**ES:** Los **Artículos** funcionan como "hubs semánticos" — páginas que agrupan términos relacionados bajo un concepto (e.g., "Las miles de maneras de decir que hay un caos"). Incluyen jerarquías de severidad, flowcharts de decisión y links a las entradas individuales.

**EN:** **Artículos** serve as "semantic hubs" — pages that group related terms under a single concept (e.g., "The thousand ways to say there's chaos"). They include severity hierarchies, decision flowcharts, and links to individual entries.

### Wikilinks

Todo el contenido usa wikilinks (`[[Página]]`) para crear una red navegable. Las entradas individuales enlazan a sus hubs, y los hubs enlazan a las entradas.

All content uses wikilinks (`[[Page]]`) to create a navigable network. Individual entries link to their hubs, and hubs link back to entries.

## Cómo contribuir / How to contribute

Ver [¿Cómo contribuyo?](Meta/¿Cómo%20contribuyo%3F.md) para la guía completa. En resumen:

See [¿Cómo contribuyo?](Meta/¿Cómo%20contribuyo%3F.md) for the full guide. In short:

| Tipo / Type | Carpeta / Folder | Template |
|---|---|---|
| Nueva palabra / New word | `Palabras/` | [Entrada](Meta/Templates/Entrada%20(Dichos%20y%20Palabras).md) |
| Nuevo dicho / New saying | `Dichos/` | [Entrada](Meta/Templates/Entrada%20(Dichos%20y%20Palabras).md) |
| Nuevo hub / New hub | `Artículos/` | — |
| Nueva persona / New person | `Personas/` | — |
| Nueva controversia / New controversy | `Controversias/` | — |

### Convenciones / Conventions

- Los nombres de archivo usan el término tal cual se dice: `Crical.md`, `La de los pastores.md`
  Filenames use the exact term as spoken: `Crical.md`, `La de los pastores.md`
- Acentos y caracteres especiales permitidos / Accents and special characters are allowed
- Media va en `_attachments/` / Media goes in `_attachments/`
- Contenido incompleto se marca con `#wip` o `#stub` / Incomplete content is tagged `#wip` or `#stub`
- Info no verificada se marca con `> [!WARNING]` / Unverified info is marked with `> [!WARNING]`

## Uso como submodule / Submodule usage

```bash
# Desde el repo de Quartz / From the Quartz repo
git submodule add <repo-url> content
git submodule update --init
```

## Licencia / License

**ES:** El contenido de este wiki es un esfuerzo comunitario para preservar la cultura popular puertorriqueña. No se permite copiar contenido con copyright ni incluir información personal sensible sin consentimiento.

**EN:** The content of this wiki is a community effort to preserve Puerto Rican popular culture. Copying copyrighted content or including sensitive personal information without consent is not permitted.
