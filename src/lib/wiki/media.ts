import fs from 'node:fs/promises';
import path from 'node:path';
import type { Html, Image, Paragraph, Text } from 'mdast';
import { defaultSchema, type Options as SanitizeSchema } from 'rehype-sanitize';
import { escapeHtml, text, type Directive } from './ast';
import { decodePath } from './urls';
import type { MediaManifest, ReportDiagnostic, WikiPage } from './types';

export interface MediaContext {
  manifest: MediaManifest;
  exists: (source: string) => Promise<boolean>;
}

/** Attribute allowlists apply to generated embeds and author-supplied HTML. */
export const sanitizationSchema: SanitizeSchema = {
  ...defaultSchema,
  clobberPrefix: '',
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    'aside',
    'details',
    'summary',
    'video',
    'audio',
    'source',
    'iframe',
    'figure',
    'figcaption',
  ],
  attributes: {
    ...defaultSchema.attributes,
    '*': [...(defaultSchema.attributes?.['*'] ?? []), 'className'],
    a: [...(defaultSchema.attributes?.a ?? []), 'dataPreview', 'ariaLabel', 'rel', 'target'],
    img: [
      ...(defaultSchema.attributes?.img ?? []),
      'srcSet',
      'sizes',
      'loading',
      'decoding',
      'width',
      'height',
    ],
    aside: ['className', 'role'],
    details: ['className', 'open'],
    video: ['src', 'controls', 'preload', 'playsInline', 'poster', 'className', 'width', 'height'],
    audio: ['src', 'controls', 'preload', 'className'],
    source: ['src', 'type'],
    iframe: [
      [
        'src',
        /^https:\/\/www\.youtube-nocookie\.com\/embed\/[A-Za-z\d_-]{11}$/,
        /^https:\/\/www\.instagram\.com\/(p|reel|tv)\/[\w-]+\/embed\/$/,
      ],
      'title',
      'loading',
      'allow',
      'allowFullScreen',
      'sandbox',
      'referrerPolicy',
      'width',
      'height',
    ],
    div: [
      ...(defaultSchema.attributes?.div ?? []),
      'className',
      'dataEmbedRatio',
      ['style', /^aspect-ratio: [1-9]\d? \/ [1-9]\d?$/],
    ],
    span: [...(defaultSchema.attributes?.span ?? []), 'title', 'className'],
  },
};

export function createMediaContext(publicDir: string, manifest: MediaManifest): MediaContext {
  const checks = new Map<string, Promise<boolean>>();
  return {
    manifest,
    exists(source) {
      if (/^https?:\/\//i.test(source)) return Promise.resolve(true);
      if (!source.startsWith('/') || source.startsWith('//') || source.includes('\\'))
        return Promise.resolve(false);
      const clean = decodePath(source.split(/[?#]/)[0] ?? '');
      const absolute = path.resolve(publicDir, `.${clean}`);
      if (!absolute.startsWith(`${publicDir}${path.sep}`)) return Promise.resolve(false);
      let check = checks.get(absolute);
      if (!check) {
        check = fs
          .stat(absolute)
          .then((stat) => stat.isFile())
          .catch(() => false);
        checks.set(absolute, check);
      }
      return check;
    },
  };
}

export async function renderImage(
  node: Image,
  page: WikiPage,
  media: MediaContext,
  report: ReportDiagnostic,
): Promise<Image | Paragraph> {
  const source = node.url;
  if (!(await media.exists(source))) {
    report(page, 'missing-media', source, 'Image file is missing or uses an unsupported URL.');
    return {
      type: 'paragraph',
      children: [
        text(
          node.alt?.length
            ? node.alt
            : page.lang === 'es'
              ? 'Imagen no disponible'
              : 'Image unavailable',
        ),
      ],
    };
  }
  const variant = media.manifest[source];
  return {
    ...node,
    url: variant?.src ?? node.url,
    data: {
      ...node.data,
      hProperties: {
        loading: 'lazy',
        decoding: 'async',
        ...(variant?.width && variant.height
          ? { width: variant.width, height: variant.height }
          : {}),
        ...(variant?.srcset
          ? { srcSet: variant.srcset, sizes: '(max-width: 760px) calc(100vw - 32px), 760px' }
          : {}),
      },
    },
  };
}

export async function renderDirective(
  node: Directive,
  page: WikiPage,
  media: MediaContext,
  report: ReportDiagnostic,
): Promise<Html | Paragraph | Text> {
  const attributes = node.attributes ?? {};
  const fail = (target: string, message: string, code = 'invalid-embed'): Paragraph | Text => {
    report(page, code, target, message);
    const content = text(page.lang === 'es' ? 'Contenido no disponible.' : 'Content unavailable.');
    return node.type === 'textDirective' ? content : { type: 'paragraph', children: [content] };
  };

  if (node.name === 'video' || node.name === 'audio') {
    const source = attributes.src ?? '';
    if (!(await media.exists(source))) {
      return fail(source, 'Media file is missing or uses an unsupported URL.', 'missing-media');
    }
    let poster = '';
    if (node.name === 'video' && attributes.poster) {
      if (await media.exists(attributes.poster))
        poster = ` poster="${escapeHtml(attributes.poster)}"`;
      else report(page, 'missing-media', attributes.poster, 'Video poster file is missing.');
    }
    return {
      type: 'html',
      value: `<${node.name} class="native-media" controls preload="metadata"${node.name === 'video' ? ' playsinline' : ''} src="${escapeHtml(source)}"${poster}><a href="${escapeHtml(source)}">${page.lang === 'es' ? 'Abrir archivo' : 'Open media file'}</a></${node.name}>`,
    };
  }

  if (node.name !== 'youtube' && node.name !== 'instagram') {
    return fail(node.name, `Unknown Markdown directive “${node.name}”.`);
  }

  let embed: string;
  if (node.name === 'youtube') {
    const id = attributes.id ?? '';
    if (!/^[A-Za-z\d_-]{11}$/.test(id))
      return fail(id, 'YouTube embeds require an 11-character video ID.');
    embed = `https://www.youtube-nocookie.com/embed/${id}`;
  } else {
    try {
      const url = new URL(attributes.url ?? '');
      if (
        url.protocol !== 'https:' ||
        !['www.instagram.com', 'instagram.com'].includes(url.hostname) ||
        !/^\/(p|reel|tv)\/[\w-]+\/?$/.test(url.pathname)
      ) {
        throw new Error('Unsupported Instagram post URL.');
      }
      embed = `https://www.instagram.com${url.pathname.replace(/\/$/, '')}/embed/`;
    } catch {
      return fail(attributes.url ?? '', 'Instagram embeds require a public post or reel URL.');
    }
  }

  const title = attributes.title?.length
    ? attributes.title
    : node.name === 'youtube'
      ? page.lang === 'es'
        ? 'Video de YouTube'
        : 'YouTube video'
      : page.lang === 'es'
        ? 'Publicación de Instagram'
        : 'Instagram post';
  const requestedRatio = attributes.ratio ?? '';
  const ratio = /^[1-9]\d?\/[1-9]\d?$/.test(requestedRatio)
    ? requestedRatio
    : node.name === 'instagram'
      ? '9/16'
      : '16/9';
  const [rawWidth = '16', rawHeight = '9'] = ratio.split('/');
  const width = Number(rawWidth);
  const height = Number(rawHeight);
  return {
    type: 'html',
    value: `<div class="media-embed media-embed-${node.name}" data-embed-ratio="${ratio}" style="aspect-ratio: ${width} / ${height}"><iframe src="${escapeHtml(embed)}" title="${escapeHtml(title)}" width="${width * 40}" height="${height * 40}" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`,
  };
}
