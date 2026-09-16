import assert from 'node:assert/strict';
import test from 'node:test';
import { isIndexable, translationsFor } from '../../src/lib/seo/metadata';
import { structuredData } from '../../src/lib/seo/structured-data';
import { sitemap } from '../../src/lib/seo/sitemap';
import { wikiPage } from '../fixtures/page';

void test('structured data escapes script terminators and uses a representative content image', () => {
  const title = '</script><script>alert(1)</script>';
  const page = wikiPage({
    title,
    html: '<img src="/_attachments/photo.jpg">',
    lastmod: '2026-09-16',
  });
  const json = structuredData(
    page,
    {
      canonical: 'https://acho.lol/Palabras/Prueba/',
      indexable: true,
      article: true,
      translations: [page],
      defaultTranslation: page,
      breadcrumbs: [],
      image: { url: 'https://acho.lol/_social/card.png', width: 1200, height: 630, alt: 'Prueba' },
      published: undefined,
    },
    title,
    page.description,
  );
  assert.ok(!json.includes('</script>'));
  assert.ok(json.includes('\\u003c/script>'));
  assert.ok(json.includes('https://acho.lol/_attachments/photo.jpg'));
  assert.ok(!json.includes('/_social/'));
  assert.ok(!json.includes('datePublished'));
  assert.ok(json.includes('"dateModified":"2026-09-16"'));
});

void test('indexing and language alternates omit author templates and unavailable translations', () => {
  const page = wikiPage();
  const template = wikiPage({ logicalPath: 'Meta/Templates/Entry' });
  assert.equal(isIndexable(template), false);
  assert.deepEqual(translationsFor(page, [page]), [page]);
  const xml = sitemap([page, template]);
  assert.equal((xml.match(/<url>/g) ?? []).length, 1);
  assert.ok(xml.includes('hreflang="es"'));
  assert.ok(xml.includes('hreflang="x-default"'));
  assert.ok(!xml.includes('hreflang="en"'));
});
