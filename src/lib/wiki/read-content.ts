import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import GithubSlugger from 'github-slugger';
import type { Nodes, Root } from 'mdast';
import { toString } from 'mdast-util-to-string';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import { visit } from 'unist-util-visit';
import { publicUrl } from './urls';
import { frontmatterSchema } from './schema';
import { remarkWikilinks, splitWikilink } from './wikilinks';
import type { ReportDiagnostic, WikiPage } from './types';

export interface ParsedPage {
  page: WikiPage;
  tree: Root;
}

export async function readJson(filename: string, fallback: unknown): Promise<unknown> {
  try {
    const value: unknown = JSON.parse(await fs.readFile(filename, 'utf8'));
    return value;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return fallback;
    throw error;
  }
}

async function markdownFiles(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries
      .filter((entry) => !entry.name.startsWith('.'))
      .map(async (entry) => {
        const filename = path.join(directory, entry.name);
        if (entry.isDirectory()) return markdownFiles(filename);
        return entry.isFile() && entry.name.endsWith('.md') ? [filename] : [];
      }),
  );
  return nested.flat().sort();
}

export async function readContent(
  contentDir: string,
  includeDrafts: boolean,
  report: ReportDiagnostic,
): Promise<ParsedPage[]> {
  const parser = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDirective)
    .use(remarkWikilinks);
  const parsed: ParsedPage[] = [];

  for (const filename of await markdownFiles(contentDir)) {
    const sourcePath = path.relative(contentDir, filename).split(path.sep).join('/');
    const [lang, ...segments] = sourcePath.split('/');
    if (lang !== 'es' && lang !== 'en') continue;
    const logicalPath = segments.join('/').replace(/\.md$/, '');
    const source = matter(await fs.readFile(filename, 'utf8'));
    const rawFrontmatter: unknown = source.data;
    const data = frontmatterSchema.parse(rawFrontmatter);
    if (data.draft && !includeDrafts) continue;

    const tags = new Set(data.tags.map((tag) => tag.replace(/^#/, '')));
    const tree = stripEditorialMarkers(source.content, parser.parse.bind(parser), tags);
    const headings: WikiPage['headings'] = [];
    const slugger = new GithubSlugger();
    visit(tree, 'heading', (node) => {
      const label = plainText(node);
      const slug = slugger.slug(label);
      node.data = { ...node.data, hProperties: { ...node.data?.hProperties, id: slug } };
      headings.push({ depth: node.depth, slug, text: label });
    });

    const basename = path.posix.basename(logicalPath);
    const kind = logicalPath === 'index' ? 'home' : basename === 'index' ? 'section' : 'article';
    const title =
      data.title ??
      (kind === 'section' ? path.posix.basename(path.posix.dirname(logicalPath)) : basename);
    const introduction: Root = {
      type: 'root',
      children: tree.children.filter((node) => node.type === 'paragraph'),
    };
    const fallbackDescription =
      lang === 'es'
        ? `Descubre ${data.title ?? basename} en acho.lol, la enciclopedia de cultura popular puertorriqueña.`
        : `Explore ${data.title ?? basename} on acho.lol, the encyclopedia of Puerto Rican popular culture.`;
    const introductoryText = documentExcerpt(introduction, 170);
    const description = (
      data.description?.length
        ? data.description
        : introductoryText.length
          ? introductoryText
          : fallbackDescription
    )
      .replace(/\s+/g, ' ')
      .trim();
    const prose = plainText(tree)
      .replace(/\[![\w-]+\][+-]?/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const page: WikiPage = {
      id: `${lang}/${logicalPath}`,
      sourcePath,
      logicalPath,
      lang,
      url: publicUrl(logicalPath, lang),
      title,
      translationKey: data.translationKey ?? logicalPath,
      kind,
      section: segments.length > 1 ? (segments[0] ?? '') : '',
      tags: [...tags],
      aliases: data.aliases,
      redirects: data.redirects,
      description,
      excerpt: documentExcerpt(tree),
      body: source.content,
      html: '',
      headings,
      outgoing: [],
      backlinks: [],
      translations: {},
      readingMinutes: Math.max(1, Math.ceil(prose.split(/\s+/).length / 220)),
      date: data.date ?? data.created,
      lastmod: data.lastmod ?? data.modified,
      dateSource: data.dateSource,
      hasMermaid: false,
      draft: data.draft,
    };
    if (data.lang && data.lang !== lang) {
      report(
        page,
        'invalid-language',
        data.lang,
        `Frontmatter language must match ${lang}/ directory.`,
      );
    }
    parsed.push({ page, tree });
  }
  return parsed;
}

function stripEditorialMarkers(
  content: string,
  parse: (value: string) => Root,
  tags: Set<string>,
): Root {
  let tree = parse(content);
  const markers: [number, number][] = [];
  visit(tree, 'text', (node) => {
    // Source spans exclude code and retain backslashes on escaped examples.
    const start = node.position?.start.offset;
    const end = node.position?.end.offset;
    if (start === undefined || end === undefined) return;
    for (const match of content
      .slice(start, end)
      .matchAll(/(?:^|\s)#(wip|stub)(?![\p{L}\p{N}_/-])/gu)) {
      const tag = match[1];
      if (!tag) continue;
      tags.add(tag);
      const markerEnd = start + match.index + match[0].length;
      markers.push([markerEnd - tag.length - 1, markerEnd]);
    }
  });
  if (!markers.length) return tree;

  // A temporary word preserves structure such as **#wip** while reparsing.
  let placeholder = 'ACHOHIDDENEDITORIALMARKER';
  while (content.includes(placeholder)) placeholder += 'X';
  let visibleContent = content;
  for (const [start, end] of markers.sort((a, b) => b[0] - a[0])) {
    visibleContent = visibleContent.slice(0, start) + placeholder + visibleContent.slice(end);
  }
  tree = parse(visibleContent);
  visit(tree, 'text', (node) => {
    node.value = node.value.replaceAll(placeholder, '');
  });
  return tree;
}

export function plainText(node: Nodes): string {
  if (node.type === 'wikiLink') return splitWikilink(node.value).label;
  if (
    node.type === 'code' ||
    node.type === 'html' ||
    node.type === 'definition' ||
    node.type.endsWith('Directive')
  )
    return '';
  if ('children' in node) return node.children.map(plainText).join(node.type === 'root' ? ' ' : '');
  return toString(node);
}

export function documentExcerpt(tree: Root, limit = 220): string {
  const blockContainers = new Set(['root', 'blockquote', 'list', 'listItem', 'table', 'tableRow']);
  const ignored = new Set([
    'heading',
    'code',
    'html',
    'definition',
    'image',
    'imageReference',
    'footnoteDefinition',
    'footnoteReference',
  ]);
  const extract = (node: Nodes): string => {
    if (node.type === 'wikiLink') return splitWikilink(node.value).label;
    if (ignored.has(node.type) || node.type.endsWith('Directive')) return '';
    if (node.type === 'text') return node.value.replace(/^\[![\w-]+\][+-]?[ \t]*/, '');
    if (node.type === 'break') return ' ';
    if ('children' in node)
      return node.children
        .map(extract)
        .filter(Boolean)
        .join(blockContainers.has(node.type) ? ' ' : '');
    return toString(node);
  };
  const content = extract(tree).replace(/\s+/g, ' ').trim();
  if (content.length <= limit) return content;

  const prefix = content.slice(0, limit - 2);
  const sentence = [...prefix.matchAll(/[.!?…]["'»”’)]?(?=\s|$)/g)].at(-1);
  if (sentence && sentence.index + sentence[0].length >= limit * 0.6) {
    return `${prefix.slice(0, sentence.index + sentence[0].length)} …`;
  }
  const boundary = prefix.lastIndexOf(' ');
  const firstSpace = content.indexOf(' ');
  const end = boundary > 0 ? boundary : firstSpace > 0 ? firstSpace : content.length;
  return `${content.slice(0, end)}…`;
}
