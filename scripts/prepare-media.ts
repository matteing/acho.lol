#!/usr/bin/env node
/** Build responsive derivatives of shared attachments, never source content.
 * Manifest keys match encoded, root-relative Markdown image URLs.
 * Each entry is { original, src, width, height, srcset?, format }.
 * GIFs and SVGs retain their original files and have no srcset.
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

interface MediaImage {
  original: string;
  src: string;
  width: number;
  height: number;
  srcset?: string;
  format: string;
}

interface ResponsiveSource {
  src: string;
  width: number;
}

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(project, 'public');
const generatedDir = path.join(publicDir, '_media');
const manifestPath = path.join(publicDir, 'media-manifest.json');
const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg']);
const urlFor = (relative: string) =>
  '/' + relative.split(path.sep).map(encodeURIComponent).join('/');

async function walkAttachments(directory: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === '_media') continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walkAttachments(absolute)));
    else if (
      absolute.split(path.sep).includes('_attachments') &&
      imageExtensions.has(path.extname(entry.name).toLowerCase())
    )
      files.push(absolute);
  }
  return files.sort();
}

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

async function exists(file: string): Promise<boolean> {
  try {
    await stat(file);
    return true;
  } catch (error) {
    if (isMissingFile(error)) return false;
    throw error;
  }
}

await mkdir(generatedDir, { recursive: true });
const manifest: Record<string, MediaImage> = {};
let generated = 0;
for (const originalPath of await walkAttachments(publicDir)) {
  const relative = path.relative(publicDir, originalPath);
  const original = urlFor(relative);
  const source = await readFile(originalPath);
  const metadata = await sharp(source, { animated: false }).metadata();
  if (!metadata.width || !metadata.height)
    throw new Error(`Cannot read image dimensions: ${relative}`);
  const rotated =
    metadata.orientation !== undefined && metadata.orientation >= 5 && metadata.orientation <= 8;
  const width = rotated ? metadata.height : metadata.width;
  const height = rotated ? metadata.width : metadata.height;
  const entry: MediaImage = { original, src: original, width, height, format: metadata.format };

  // Preserve animation and SVG vectors intact. No generated content rasterizes them.
  if (!['gif', 'svg'].includes(metadata.format)) {
    const widths = [
      ...new Set([480, 960, 1440, Math.min(width, 1440)].filter((size) => size <= width)),
    ].sort((a, b) => a - b);
    const hash = createHash('sha256')
      .update(source)
      .update('acho-webp-v1-q82')
      .update(JSON.stringify(sharp.versions))
      .digest('hex')
      .slice(0, 16);
    const sources: ResponsiveSource[] = [];
    for (const size of widths) {
      const filename = `${hash}-${size}.webp`;
      const output = path.join(generatedDir, filename);
      if (!(await exists(output))) {
        await sharp(source)
          .rotate()
          .resize({ width: size, withoutEnlargement: true })
          .webp({ quality: 82, effort: 5 })
          .toFile(output);
        generated += 1;
      }
      const src = `/_media/${filename}`;
      sources.push({ src, width: size });
      entry.src = src;
    }
    entry.srcset = sources.map(({ src, width: size }) => `${src} ${size}w`).join(', ');
    entry.format = 'webp';
  }
  manifest[original] = entry;
}
const output = JSON.stringify(manifest, null, 2) + '\n';
const previous = await readFile(manifestPath, 'utf8').catch((error: unknown) => {
  if (isMissingFile(error)) return '';
  throw error;
});
if (output !== previous) await writeFile(manifestPath, output);
console.log(
  `Prepared ${Object.keys(manifest).length} images (${generated} responsive files generated).`,
);
