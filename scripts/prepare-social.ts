#!/usr/bin/env node
/** Render static, article-specific Open Graph cards with the site's own fonts. */
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildWikiIndex } from '../src/lib/wiki/build-index';
import { sectionLabel } from '../src/i18n/translate';
import type { WikiPage } from '../src/lib/wiki/types';
import type { Metadata } from 'sharp';
import type { SocialManifest } from '../src/lib/seo/social-image';
import { siteConfig } from '../src/site.config';

const scriptPath = fileURLToPath(import.meta.url);
const project = path.resolve(path.dirname(scriptPath), '..');
const width = 1200,
  height = 630;
const markupEntities: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};
const escapeMarkup = (value: string) =>
  value.replace(/[&<>"']/g, (character) => markupEntities[character] ?? character);

export type CardPage = Pick<WikiPage, 'id' | 'title' | 'lang' | 'section' | 'kind'>;

interface SocialCardsResult {
  manifest: SocialManifest;
  generated: number;
  reused: number;
}

interface Options {
  pages?: CardPage[];
  publicDir?: string;
  /** Tests may write to a temporary public directory while reusing site assets. */
  assetsDir?: string;
}

async function exists(filename: string): Promise<boolean> {
  try {
    return (await stat(filename)).isFile();
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return false;
    throw error;
  }
}

async function writeChanged(filename: string, value: string): Promise<void> {
  if ((await exists(filename)) && (await readFile(filename, 'utf8')) === value) return;
  await writeFile(filename, value);
}

function imageSize(metadata: Metadata): { width: number; height: number } {
  if (!metadata.width || !metadata.height)
    throw new Error('Cannot read rendered social image dimensions.');
  return { width: metadata.width, height: metadata.height };
}

export async function prepareSocialCards(options: Options = {}): Promise<SocialCardsResult> {
  const publicDir = path.resolve(options.publicDir ?? path.join(project, 'public'));
  const assetsDir = path.resolve(options.assetsDir ?? path.join(project, 'public'));
  const fontsDir = path.join(project, 'scripts', 'assets', 'fonts');
  const cacheDir = path.join(project, 'node_modules', '.cache', 'acho-social');
  await mkdir(cacheDir, { recursive: true });
  const fontConfig = path.join(cacheDir, 'fonts.conf');
  await writeChanged(
    fontConfig,
    `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><dir>${escapeMarkup(fontsDir)}</dir><cachedir>${escapeMarkup(cacheDir)}</cachedir></fontconfig>`,
  );
  // Use committed static TTF instances: some Pango builds silently substitute a
  // system font for WOFF2 input. No conversion or system font install at build.
  process.env.FONTCONFIG_FILE = fontConfig;
  // macOS otherwise selects CoreText, which ignores Fontconfig app fonts.
  process.env.PANGOCAIRO_BACKEND = 'fc';
  const { default: sharp } = await import('sharp');

  let pages = options.pages;
  if (!pages) {
    const index = await buildWikiIndex({
      contentDir: path.join(project, 'content'),
      publicDir,
      knownIssuesFile: path.join(project, 'config/content-known-issues.json'),
    });
    const errors = index.diagnostics.filter((diagnostic) => diagnostic.severity === 'error');
    if (errors.length)
      throw new Error(
        `Social cards require a valid content index:\n${errors.map((error) => `${error.source}: ${error.message}`).join('\n')}`,
      );
    pages = index.pages;
  }
  const logoPath = path.join(assetsDir, siteConfig.logo.replace(/^\/+/, ''));
  const headingFont = path.join(fontsDir, 'AchoSocialDisplay-Bold.ttf');
  const bodyFont = path.join(fontsDir, 'AchoSocialText-Medium.ttf');
  const [script, logo, display, body] = await Promise.all([
    readFile(scriptPath),
    readFile(logoPath),
    readFile(headingFont),
    readFile(bodyFont),
  ]);
  const templateHash = createHash('sha256')
    .update(script)
    .update(logo)
    .update(display)
    .update(body)
    .update(siteConfig.name)
    .update(JSON.stringify(sharp.versions))
    .digest('hex');
  const logoImage = await sharp(logo).resize({ width: 225 }).png().toBuffer();
  const outputDir = path.join(publicDir, '_social');
  await mkdir(outputDir, { recursive: true });

  const renderText = (
    text: string,
    fontSize: number,
    colour: string,
    displayFont = false,
    maxWidth = 1048,
  ) =>
    sharp({
      text: {
        text: `<span foreground="${colour}" font_family="${displayFont ? 'Acho Social Display' : 'Acho Social Text'}" weight="${displayFont ? 700 : 500}">${escapeMarkup(text)}</span>`,
        font: `${fontSize}`,
        fontfile: displayFont ? headingFont : bodyFont,
        width: maxWidth,
        wrap: 'word-char',
        rgba: true,
        dpi: 72,
      },
    })
      .png()
      .toBuffer();

  const background =
    Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="630" fill="#fdf9f4"/>
    <rect width="1200" height="9" fill="#24547b"/>
    <circle cx="1190" cy="638" r="134" fill="#f8e0e6"/>
    <circle cx="1190" cy="638" r="82" fill="#fdf9f4"/>
    <circle cx="79" cy="205" r="7" fill="#e94b73"/>
    <path d="M72 525H1128" stroke="#e9e2df" stroke-width="2"/>
    <rect x="993" y="65" width="135" height="42" rx="21" fill="#e6eef3"/>
  </svg>`);

  const manifest: SocialManifest = {};
  let generated = 0;
  const expectedFiles = new Set<string>();
  for (const page of [...pages].sort((a, b) => a.id.localeCompare(b.id))) {
    const label =
      page.kind === 'home'
        ? page.lang === 'es'
          ? 'LA ENCICLOPEDIA BORI POP'
          : 'PUERTO RICAN POP CULTURE'
        : sectionLabel(
            page.lang,
            page.section || (page.lang === 'es' ? 'Enciclopedia' : 'Encyclopedia'),
          ).toLocaleUpperCase(page.lang);
    const language = page.lang === 'es' ? 'Español' : 'English';
    const footer =
      page.lang === 'es'
        ? 'La cultura boricua, de todo un poco.'
        : 'Puerto Rican culture, a little of everything.';
    const data = { title: page.title, label, language, footer };
    const hash = createHash('sha256')
      .update(templateHash)
      .update(JSON.stringify(data))
      .digest('hex')
      .slice(0, 24);
    const filename = `${hash}.png`;
    const destination = path.join(outputDir, filename);
    expectedFiles.add(filename);
    manifest[page.id] = {
      url: `/_social/${filename}`,
      width,
      height,
      alt: `${page.title} — ${siteConfig.name}, ${page.lang === 'es' ? 'la enciclopedia bori pop' : 'the Puerto Rican pop culture encyclopedia'}.`,
    };
    if (await exists(destination)) continue;

    let titleImage: Buffer | undefined;
    let titleHeight = 0;
    for (let fontSize = 86; fontSize >= 36; fontSize -= 2) {
      const rendered = await renderText(page.title, fontSize, '#131318', true);
      const size = imageSize(await sharp(rendered).metadata());
      if (size.height <= 258 && size.width <= 1048) {
        titleImage = rendered;
        titleHeight = size.height;
        break;
      }
    }
    if (!titleImage) throw new Error(`Social card title does not fit safely: ${page.id}`);
    const [sectionImage, languageImage, domainImage, footerImage] = await Promise.all([
      renderText(label, 24, '#24547b'),
      renderText(language, 20, '#24547b', false, 110),
      renderText(siteConfig.name, 27, '#24547b', true),
      renderText(footer, 21, '#6b646a', false, 640),
    ]);
    const languageSize = imageSize(await sharp(languageImage).metadata());
    const footerSize = imageSize(await sharp(footerImage).metadata());
    await sharp(background)
      .composite([
        { input: logoImage, left: 69, top: 47 },
        {
          input: languageImage,
          left: Math.round(1060.5 - languageSize.width / 2),
          top: Math.round(86 - languageSize.height / 2),
        },
        { input: sectionImage, left: 101, top: 192 },
        {
          input: titleImage,
          left: 72,
          top: 250 + Math.round((238 - Math.min(titleHeight, 238)) / 5),
        },
        { input: domainImage, left: 72, top: 550 },
        { input: footerImage, left: 1128 - footerSize.width, top: 553 },
      ])
      .png({ compressionLevel: 9, palette: true, quality: 100, colours: 192 })
      .toFile(destination);
    generated++;
  }
  // This directory contains generated images only; remove superseded hashes.
  for (const filename of await readdir(outputDir)) {
    if (/^[a-f\d]{24}\.png$/.test(filename) && !expectedFiles.has(filename))
      await unlink(path.join(outputDir, filename));
  }
  await writeChanged(
    path.join(publicDir, 'social-manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
  );
  return { manifest, generated, reused: pages.length - generated };
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const result = await prepareSocialCards();
  console.log(
    `Social cards: ${Object.keys(result.manifest).length} pages; ${result.generated} rendered, ${result.reused} unchanged.`,
  );
}
