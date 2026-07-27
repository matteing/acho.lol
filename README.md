# acho.lol

La enciclopedia bori pop — un wiki irreverente, jocoso y 100% boricua dedicado a preservar la cultura popular puertorriqueña.

## What's this?

Este repositorio contiene el contenido de [acho.lol](https://acho.lol), una enciclopedia colaborativa que documenta jerga, dichos, memes, personas y controversias de la cultura puertorriqueña.

El sitio se genera con [Quartz](https://quartz.jzhao.xyz/) y este repo se consume como git submodule.

## Estructura / Structure

```
├── Palabras/        Slang and vocabulary / Jerga y vocabulario
├── Dichos/          Sayings and expressions / Frases y expresiones
├── Artículos/       Semantic hubs grouping related concepts / Hubs semánticos
├── Personas/        Biographies and profiles / Biografías y perfiles
├── Fauna/           Puerto Rican animals / Animales de Puerto Rico
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

Ver [¿Cómo contribuyo?](Meta/¿Cómo%20contribuyo%3F.md) para la guía completa.

## Licencia / License

El contenido de este wiki es un esfuerzo comunitario para preservar la cultura popular puertorriqueña. No se permite copiar contenido con copyright ni incluir información personal sensible sin consentimiento.
