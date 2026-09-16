import type { Blockquote, Definition, Link, PhrasingContent, Root, RootContent } from 'mdast';
import { unified } from 'unified';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import { escapeHtml, text, type Callout, type UnresolvedLink } from './ast';
import { plainText } from './read-content';
import type { ResolveLink } from './resolve-links';
import { renderDirective, renderImage, sanitizationSchema, type MediaContext } from './media';
import type { Language, ReportDiagnostic, WikiPage } from './types';
import { splitWikilink } from './wikilinks';

interface RenderContext {
  resolve: ResolveLink;
  media: MediaContext;
  report: ReportDiagnostic;
}

export async function renderPage(
  page: WikiPage,
  tree: Root,
  context: RenderContext,
): Promise<void> {
  const { resolve, media, report } = context;
  const definitions = new Map<string, Definition>();
  visit(tree, 'definition', (node) => {
    definitions.set(node.identifier.toUpperCase(), node);
  });
  const pending: Promise<void>[] = [];
  const outgoing = new Set<string>();

  visit(tree, (original, index, parent) => {
    if (index === undefined || !parent) return;
    const replace = (replacement: RootContent) => {
      parent.children[index] = replacement;
    };
    let node = original;
    let wiki = false;

    if (node.type === 'wikiLink') {
      const { target, label } = splitWikilink(node.value);
      node = { type: 'link', url: target, children: [text(label)] };
      wiki = true;
      replace(node);
    } else if (node.type === 'linkReference' || node.type === 'imageReference') {
      const definition = definitions.get(node.identifier.toUpperCase());
      if (definition) {
        node =
          node.type === 'linkReference'
            ? {
                type: 'link',
                url: definition.url,
                title: definition.title,
                children: node.children,
              }
            : { type: 'image', url: definition.url, title: definition.title, alt: node.alt };
        replace(node);
      }
    }

    if (node.type === 'link') {
      const raw = node.url;
      if (/^(?:https?:|mailto:|tel:)/i.test(raw)) {
        if (/^https?:/i.test(raw)) {
          node.data = {
            ...node.data,
            hProperties: { rel: ['noopener', 'noreferrer'], target: '_blank' },
          };
        }
        return;
      }
      if (/^[a-z][a-z\d+.-]*:/i.test(raw) || raw.startsWith('//')) {
        report(
          page,
          'unsafe-url',
          raw,
          'Only HTTP, HTTPS, email, telephone, and local links are supported.',
        );
        replace(unresolvedLink(node, page.lang));
        return;
      }
      if (/\.(?:pdf|zip|mp4|webm|mp3|ogg|wav|png|jpe?g|gif|webp|svg)(?:[?#].*)?$/i.test(raw)) {
        pending.push(renderAssetLink(node, page, media, report).then(replace));
        return;
      }
      const resolved = resolve(page, raw, wiki);
      if (resolved) {
        node.url = resolved.url;
        node.data = { ...node.data, hProperties: { dataPreview: resolved.page.url } };
        if (resolved.page.id !== page.id) outgoing.add(resolved.page.id);
      } else replace(unresolvedLink(node, page.lang));
    } else if (node.type === 'image') {
      pending.push(renderImage(node, page, media, report).then(replace));
    } else if (node.type === 'blockquote') {
      const callout = createCallout(node, page.lang);
      if (callout) {
        // The visitor still traverses the original node after replacement.
        node.children = callout.children;
        replace(callout);
      }
    } else if (node.type === 'code' && node.lang === 'mermaid') {
      page.hasMermaid = true;
      replace({ type: 'html', value: `<pre class="mermaid">${escapeHtml(node.value)}</pre>` });
    } else if (
      node.type === 'leafDirective' ||
      node.type === 'containerDirective' ||
      node.type === 'textDirective'
    ) {
      pending.push(renderDirective(node, page, media, report).then(replace));
    }
  });
  await Promise.all(pending);
  page.outgoing = [...outgoing].sort();

  const processor = unified()
    .use(remarkRehype, {
      allowDangerousHtml: true,
      footnoteLabel: page.lang === 'es' ? 'Notas al pie' : 'Footnotes',
      footnoteBackLabel: (reference, occurrence) => {
        const label = page.lang === 'es' ? 'Volver a la referencia' : 'Back to reference';
        return `${label} ${reference + 1}${occurrence > 1 ? `-${occurrence}` : ''}`;
      },
    })
    .use(rehypeRaw)
    .use(rehypeSanitize, sanitizationSchema)
    .use(rehypeStringify);
  const htmlTree = await processor.run(tree);
  visit(htmlTree, 'element', (node) => {
    const href = node.properties.href;
    if (node.tagName === 'a' && typeof href === 'string' && /^https?:\/\//.test(href)) {
      node.properties.rel = ['noopener', 'noreferrer'];
      node.properties.target = '_blank';
    }
  });
  page.html = processor.stringify(htmlTree);
}

async function renderAssetLink(
  node: Link,
  page: WikiPage,
  media: MediaContext,
  report: ReportDiagnostic,
): Promise<Link | UnresolvedLink> {
  if (await media.exists(node.url)) return node;
  report(page, 'missing-media', node.url, 'Linked file is missing.');
  return unresolvedLink(node, page.lang);
}

function unresolvedLink(node: Link, lang: Language): UnresolvedLink {
  return {
    type: 'unresolvedLink',
    children: node.children,
    data: {
      hName: 'span',
      hProperties: {
        className: ['unresolved-link'],
        title:
          lang === 'es'
            ? 'Esta entrada todavía no está disponible.'
            : 'This entry is not available yet.',
      },
    },
  };
}

function createCallout(node: Blockquote, lang: Language): Callout | undefined {
  const paragraph = node.children[0];
  if (paragraph?.type !== 'paragraph') return;
  const first = paragraph.children[0];
  if (first?.type !== 'text') return;
  const match = /^\[!([\w-]+)\]([+-])?[ \t]*/.exec(first.value);
  const type = match?.[1]?.toLowerCase();
  if (!match || !type) return;

  const labels: Record<string, readonly [string, string]> = {
    note: ['Nota', 'Note'],
    warning: ['Aviso', 'Warning'],
    danger: ['Peligro', 'Danger'],
    tip: ['Consejo', 'Tip'],
    info: ['Información', 'Information'],
    important: ['Importante', 'Important'],
    caution: ['Precaución', 'Caution'],
    success: ['Éxito', 'Success'],
    question: ['Pregunta', 'Question'],
    quote: ['Cita', 'Quote'],
    example: ['Ejemplo', 'Example'],
    abstract: ['Resumen', 'Summary'],
    todo: ['Por hacer', 'To do'],
  };
  first.value = first.value.slice(match[0].length);
  const { before, after } = splitFirstLine(paragraph.children);
  const title = before.some((child) => plainText(child).trim())
    ? before
    : [text(labels[type]?.[lang === 'es' ? 0 : 1] ?? type)];
  const children = node.children.slice(1);
  if (after.length) children.unshift({ type: 'paragraph', children: after });
  children.unshift({
    type: 'paragraph',
    data: {
      hName: match[2] ? 'summary' : 'p',
      hProperties: { className: ['callout-title'] },
    },
    children: title,
  });
  return {
    type: 'callout',
    data: {
      hName: match[2] ? 'details' : 'aside',
      hProperties: {
        className: ['callout', `callout-${type}`],
        ...(match[2] === '+' ? { open: true } : {}),
      },
    },
    children,
  };
}

interface SplitLine {
  before: PhrasingContent[];
  after: PhrasingContent[];
  found: boolean;
}

/** Keep inline emphasis and links on the correct side of a callout's title. */
function splitFirstLine(children: PhrasingContent[]): SplitLine {
  const before: PhrasingContent[] = [];
  const after: PhrasingContent[] = [];
  let found = false;
  for (const child of children) {
    if (found) {
      after.push(child);
      continue;
    }
    if (child.type === 'break') {
      found = true;
      continue;
    }
    if (child.type === 'text' && child.value.includes('\n')) {
      const offset = child.value.indexOf('\n');
      if (offset) before.push({ ...child, value: child.value.slice(0, offset) });
      if (offset + 1 < child.value.length)
        after.push({ ...child, value: child.value.slice(offset + 1) });
      found = true;
    } else if ('children' in child) {
      const parts = splitFirstLine(child.children);
      if (parts.before.length) before.push({ ...child, children: parts.before });
      if (parts.after.length) after.push({ ...child, children: parts.after });
      found = parts.found;
    } else before.push(child);
  }
  return { before, after, found };
}
