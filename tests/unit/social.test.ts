import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { prepareSocialCards } from '../../scripts/prepare-social';
import type { CardPage } from '../../scripts/prepare-social';
import type { SocialManifest } from '../../src/lib/seo/social-image';

function cardFor(manifest: SocialManifest, id: string) {
  const card = manifest[id];
  assert.ok(card, `Missing social card for ${id}`);
  return card;
}

void test('social cards fit platform dimensions, escape title markup, and cache by visible content', async (t) => {
  const publicDir = await fs.mkdtemp(path.join(os.tmpdir(), 'acho-social-'));
  t.after(() => fs.rm(publicDir, { recursive: true, force: true }));
  const pages: [CardPage, CardPage] = [
    {
      id: 'es/Artículos/Prueba',
      title: '¿Café & cultura? <Una historia de Puerto Rico>',
      lang: 'es',
      section: 'Artículos',
      kind: 'article',
    },
    {
      id: 'en/Artículos/Prueba',
      title: 'The many ways Puerto Rican popular culture brings people together',
      lang: 'en',
      section: 'Artículos',
      kind: 'article',
    },
  ];
  const first = await prepareSocialCards({ pages, publicDir });
  assert.equal(first.generated, 2);
  assert.equal(first.reused, 0);
  const { default: sharp } = await import('sharp');
  // A platform font fallback made both families identical before explicitly
  // selecting Pango's Fontconfig backend on macOS. Catch that regression.
  const renderFont = (family: string) =>
    sharp({ text: { text: 'La misión, café y letras', font: `${family} 40`, rgba: true } })
      .png()
      .toBuffer();
  const [displaySample, textSample] = await Promise.all([
    renderFont('Acho Social Display'),
    renderFont('Acho Social Text'),
  ]);
  assert.equal(
    displaySample.equals(textSample),
    false,
    'Both social fonts must resolve to their distinct bundled faces',
  );
  const original = cardFor(first.manifest, pages[0].id);
  const imagePath = path.join(publicDir, original.url);
  const manifestPath = path.join(publicDir, 'social-manifest.json');
  const imageStat = await fs.stat(imagePath);
  const manifestStat = await fs.stat(manifestPath);
  for (const page of pages) {
    const card = cardFor(first.manifest, page.id);
    assert.equal(card.width, 1200);
    assert.equal(card.height, 630);
    assert.ok(card.alt.includes(page.title));
    const metadata = await sharp(path.join(publicDir, card.url)).metadata();
    assert.equal(metadata.format, 'png');
    assert.equal(metadata.width, 1200);
    assert.equal(metadata.height, 630);
    assert.ok((await fs.stat(path.join(publicDir, card.url))).size < 500_000);
  }
  assert.match(original.alt, /la enciclopedia bori pop/);
  assert.match(
    cardFor(first.manifest, pages[1].id).alt,
    /the Puerto Rican pop culture encyclopedia/,
  );

  const second = await prepareSocialCards({ pages, publicDir });
  assert.deepEqual(second.manifest, first.manifest);
  assert.equal(second.generated, 0);
  assert.equal(second.reused, 2);
  assert.equal((await fs.stat(imagePath)).mtimeMs, imageStat.mtimeMs);
  assert.equal((await fs.stat(manifestPath)).mtimeMs, manifestStat.mtimeMs);

  const changed = await prepareSocialCards({
    pages: [{ ...pages[0], title: 'Un título nuevo' }, pages[1]],
    publicDir,
  });
  assert.equal(changed.generated, 1);
  assert.equal(changed.reused, 1);
  assert.notEqual(cardFor(changed.manifest, pages[0].id).url, original.url);
  assert.equal(
    cardFor(changed.manifest, pages[1].id).url,
    cardFor(first.manifest, pages[1].id).url,
  );
  await assert.rejects(fs.access(imagePath));
  assert.equal((await fs.readdir(path.join(publicDir, '_social'))).length, 2);
});
