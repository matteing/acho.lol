import test from 'node:test';
import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildWikiIndex } from '../../src/lib/wiki/build-index';
import { publicUrl } from '../../src/lib/wiki/urls';

async function fixture(t: TestContext, sources: Record<string, string>) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'acho-wiki-'));
  const contentDir = path.join(directory, 'content');
  const publicDir = path.join(directory, 'public');
  await fs.mkdir(publicDir, { recursive: true });
  const write = async (filename: string, body: string) => {
    const full = path.join(contentDir, filename);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, body);
  };
  for (const [filename, body] of Object.entries(sources)) await write(filename, body);
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  return {
    directory,
    contentDir,
    publicDir,
    write,
    build: () => buildWikiIndex({ contentDir, publicDir }),
  };
}

void test('Quartz URLs preserve case, accents, punctuation rules, and section indexes', () => {
  assert.equal(
    publicUrl('Controversias/¿Empanadilla o pastelillo?', 'es'),
    '/Controversias/%C2%BFEmpanadilla-o-pastelillo/',
  );
  assert.equal(publicUrl('Meta/A & B 50%', 'en'), '/en/Meta/A--and--B-50-percent/');
  assert.equal(publicUrl('Artículos/index', 'es'), '/Art%C3%ADculos/');
  assert.equal(publicUrl('index', 'es'), '/');
  assert.equal(publicUrl('index', 'en'), '/en/');
});

void test('both link syntaxes and reference links form one graph; language aliases stay scoped', async (t) => {
  const f = await fixture(t, {
    'es/index.md':
      '[[cookie]] [ordinary](Palabras/Galleta.md#Ejemplos) [reference][g]\n\n[g]: /Palabras/Galleta/\n\n[[en/Words/Cookie|English]]',
    'es/Palabras/Galleta.md':
      '---\ntitle: Galleta\naliases: [cookie]\ntranslationKey: cookie\n---\n[[index|Inicio]]\n\n## Ejemplos\nUn golpe.',
    'en/Words/Cookie.md':
      '---\ntitle: Cookie\naliases: [cookie]\ntranslationKey: cookie\n---\n## Examples\nA slap.',
    'en/index.md': '[[cookie]]',
  });
  const index = await f.build();
  assert.deepEqual(index.diagnostics, []);
  const home = index.pages.find((p) => p.id === 'es/index')!;
  const spanish = index.pages.find((p) => p.id === 'es/Palabras/Galleta')!;
  const english = index.pages.find((p) => p.id === 'en/Words/Cookie')!;
  assert.deepEqual(home.outgoing, ['en/Words/Cookie', 'es/Palabras/Galleta']);
  assert.deepEqual(spanish.backlinks, ['es/index']);
  assert.deepEqual(home.backlinks, ['es/Palabras/Galleta']);
  assert.deepEqual(english.backlinks.sort(), ['en/index', 'es/index']);
  assert.deepEqual(spanish.translations, { en: 'en/Words/Cookie', es: 'es/Palabras/Galleta' });
  assert.match(
    home.html,
    /href="\/Palabras\/Galleta\/#ejemplos" data-preview="\/Palabras\/Galleta\/"/,
  );
});

void test('ambiguous aliases fail clearly and explicit paths disambiguate', async (t) => {
  const f = await fixture(t, {
    'es/index.md': '[[same]] [[One/Target|the first]]',
    'es/One/Target.md': '---\naliases: [same]\n---\nFirst.',
    'es/Two/Target.md': '---\naliases: [same]\n---\nSecond.',
  });
  const index = await f.build();
  assert.equal(index.diagnostics[0]!.code, 'ambiguous-link');
  assert.equal(index.diagnostics[0]!.severity, 'error');
  assert.deepEqual(index.pages.find((p) => p.id === 'es/index')!.outgoing, ['es/One/Target']);
  assert.match(index.pages.find((p) => p.id === 'es/index')!.html, /<span class="unresolved-link"/);
});

void test('escaped syntax and code remain literal; valid wiki syntax keeps formatting around it', async (t) => {
  const f = await fixture(t, {
    'es/index.md':
      '\\[[Missing]] \\[\\[Also missing]] `[[Code missing]]`\n\n```md\n[[Fence missing]]\n```\n\n**[[Target|good]]**',
    'es/Target.md': 'Target.',
  });
  const index = await f.build();
  assert.deepEqual(index.diagnostics, []);
  const home = index.pages.find((p) => p.id === 'es/index')!;
  assert.deepEqual(home.outgoing, ['es/Target']);
  assert.match(home.html, /<code>\[\[Code missing\]\]<\/code>/);
  assert.match(home.html, /<strong><a href="\/Target\/"/);
});

void test('heading links validate anchors and duplicate heading slugs; self links make no backlinks', async (t) => {
  const f = await fixture(t, {
    'es/index.md': '[[Target#Café|Coffee]] [[Target#café-1]] [[Target#Missing]]',
    'es/Target.md': '## Café\nFirst.\n\n## Café\nSecond. [[#Café]]',
  });
  const index = await f.build();
  assert.deepEqual(
    index.diagnostics.map((d) => d.code),
    ['missing-heading'],
  );
  const target = index.pages.find((p) => p.id === 'es/Target')!;
  assert.deepEqual(
    target.headings.map((h) => h.slug),
    ['café', 'café-1'],
  );
  assert.deepEqual(target.outgoing, []);
  assert.deepEqual(target.backlinks, ['es/index']);
  assert.match(index.pages.find((p) => p.id === 'es/index')!.html, /#caf%C3%A9-1/);
});

void test('wikilink labels render inline Markdown without changing destinations or creating nested links', async (t) => {
  const f = await fixture(t, {
    'en/index.md':
      'Read [[en/Palabras/Códigos|*los códigos*]], [[en/Palabras/Códigos|**strong _words_**]], [[en/Palabras/Códigos|~~old~~ `code`]], and [[en/Palabras/Códigos|\\*literal\\*]].\n\n[[en/Palabras/Códigos|<https://example.com>]] [[en/Palabras/Códigos|<em>literal HTML</em>]]',
    'en/Palabras/Códigos.md': 'The code.',
  });
  const index = await f.build();
  assert.deepEqual(index.diagnostics, []);
  const home = index.pages.find((page) => page.id === 'en/index')!;
  const destination = index.pages.find((page) => page.id === 'en/Palabras/Códigos')!;
  assert.deepEqual(home.outgoing, [destination.id]);
  assert.deepEqual(destination.backlinks, [home.id]);
  assert.match(home.html, /<em>los códigos<\/em><\/a>/);
  assert.match(home.html, /<strong>strong <em>words<\/em><\/strong><\/a>/);
  assert.match(home.html, /<del>old<\/del> <code>code<\/code><\/a>/);
  assert.match(home.html, />\*literal\*<\/a>/);
  assert.match(home.html, /&#x3C;https:\/\/example.com><\/a>/);
  assert.match(home.html, /&#x3C;em>literal HTML&#x3C;\/em><\/a>/);
  assert.equal((home.html.match(/<a /g) ?? []).length, 6);
  assert.equal((home.html.match(/href="\/en\/Palabras\/C%C3%B3digos\/"/g) ?? []).length, 6);
  assert.match(home.excerpt, /^Read los códigos, strong words, old code, and \*literal\*\./);
  assert.match(home.description, /^Read los códigos, strong words, old code, and \*literal\*\./);
});

void test('missing media and unsafe links fail without emitting broken media or unsafe markup', async (t) => {
  const f = await fixture(t, {
    'es/index.md':
      '![lost](/missing.png)\n\n::video{src="/gone.mp4"}\n\n[unsafe](javascript:alert)\n\n<script>alert(1)</script>\n<img src="x" onerror="alert(1)">',
  });
  const index = await f.build();
  assert.deepEqual(index.diagnostics.map((d) => d.code).sort(), [
    'missing-media',
    'missing-media',
    'unsafe-url',
  ]);
  assert.doesNotMatch(index.pages[0]!.html, /javascript:|<script|onerror|src="\/(missing|gone)/);
});

void test('known issues downgrade only exact references, leaving new broken links as errors', async (t) => {
  const f = await fixture(t, { 'es/index.md': '[[Old]] [[New]]' });
  const knownIssuesFile = path.join(f.directory, 'issues.json');
  await fs.writeFile(
    knownIssuesFile,
    JSON.stringify({ issues: [{ source: 'es/index.md', target: 'Old', code: 'missing-link' }] }),
  );
  const index = await buildWikiIndex({
    contentDir: f.contentDir,
    publicDir: f.publicDir,
    knownIssuesFile,
  });
  assert.equal(index.diagnostics.find((d) => d.target === 'Old')!.severity, 'warning');
  assert.equal(index.diagnostics.find((d) => d.target === 'New')!.severity, 'error');
});

void test('fresh builds propagate additions, title/alias edits, renames and deletion', async (t) => {
  const f = await fixture(t, { 'es/index.md': '[[Friend]]' });
  assert.equal((await f.build()).diagnostics[0]!.code, 'missing-link');
  await f.write('es/Original.md', '---\naliases: [Friend]\n---\nHello.');
  let index = await f.build();
  assert.deepEqual(index.diagnostics, []);
  assert.equal(index.pages.find((p) => p.id === 'es/Original')!.backlinks[0], 'es/index');
  await fs.rename(
    path.join(f.contentDir, 'es/Original.md'),
    path.join(f.contentDir, 'es/Renamed.md'),
  );
  index = await f.build();
  assert.match(index.pages.find((p) => p.id === 'es/index')!.html, /href="\/Renamed\/"/);
  assert.equal(
    index.pages.some((p) => p.id === 'es/Original'),
    false,
  );
  await f.write('es/Renamed.md', '---\ntitle: Friend\n---\nEdited.');
  assert.deepEqual((await f.build()).diagnostics, []);
  await fs.rm(path.join(f.contentDir, 'es/Renamed.md'));
  index = await f.build();
  assert.equal(index.diagnostics[0]!.code, 'missing-link');
  assert.deepEqual(index.pages[0]!.outgoing, []);
});

void test('callouts, responsive images, native media, inline embeds and Mermaid survive safe rendering', async (t) => {
  const f = await fixture(t, {
    'es/index.md':
      '> [!WARNING] Cuidado\n>\n> Texto.\n\n> [!TIP]- Pista\n>\n> Secreto.\n\n![photo](/photo.png)\n\n::video{src="/clip.mp4"}\n\n::audio{src="/sound.mp3"}\n\n::youtube{id="vG_l9pB0sPY" ratio="9/16"}\n\n::instagram{url="https://www.instagram.com/reel/abc/"}\n\n```mermaid\ngraph TD\n A-->B\n```',
  });
  await Promise.all(
    ['photo.png', 'clip.mp4', 'sound.mp3'].map((name) =>
      fs.writeFile(path.join(f.publicDir, name), 'asset'),
    ),
  );
  await fs.writeFile(
    path.join(f.publicDir, 'media-manifest.json'),
    JSON.stringify({
      '/photo.png': {
        width: 1000,
        height: 500,
        src: '/photo.webp',
        srcset: '/photo-small.webp 480w, /photo.webp 1000w',
      },
    }),
  );
  const index = await f.build();
  assert.deepEqual(index.diagnostics, []);
  const page = index.pages[0]!;
  assert.match(page.html, /<aside class="callout callout-warning">/);
  assert.match(
    page.html,
    /<details class="callout callout-tip"><summary class="callout-title">Pista<\/summary>/,
  );
  assert.match(page.html, /width="1000" height="500" srcset=/);
  assert.match(page.html, /<video class="native-media" controls preload="metadata" playsinline/);
  assert.match(
    page.html,
    /<iframe src="https:\/\/www.youtube-nocookie.com\/embed\/vG_l9pB0sPY" title="Video de YouTube"/,
  );
  assert.match(
    page.html,
    /<iframe src="https:\/\/www.instagram.com\/reel\/abc\/embed\/" title="Publicación de Instagram"/,
  );
  assert.match(page.html, /data-embed-ratio="9\/16"/);
  assert.match(page.html, /style="aspect-ratio: 9 \/ 16"/);
  assert.equal((page.html.match(/loading="lazy"/g) ?? []).length, 3); // Image and both provider frames.
  assert.match(
    page.html,
    /allowfullscreen sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox" referrerpolicy="strict-origin-when-cross-origin"/,
  );
  assert.doesNotMatch(page.html, /autoplay|data-embed-src|<button|Abrir en|Reproducir en/);
  assert.match(page.html, /<pre class="mermaid">graph TD/);
  assert.equal(page.hasMermaid, true);
});

void test('inline embeds reject unsupported providers and unsafe iframe attributes', async (t) => {
  const f = await fixture(t, {
    'en/index.md':
      '::youtube{id="invalid"}\n\n::instagram{url="https://evil.example/reel/abc/"}\n\n<iframe src="https://evil.example/embed" srcdoc="<script>alert(1)</script>" onload="alert(1)"></iframe>\n\n::youtube{id="vG_l9pB0sPY" ratio="0/0"}',
  });
  const index = await f.build();
  assert.deepEqual(
    index.diagnostics.map((issue) => issue.code),
    ['invalid-embed', 'invalid-embed'],
  );
  assert.doesNotMatch(index.pages[0]!.html, /evil\.example|srcdoc|onload|<script|aspect-ratio: 0/);
  assert.match(index.pages[0]!.html, /title="YouTube video"/);
  assert.match(index.pages[0]!.html, /style="aspect-ratio: 16 \/ 9"/);
});

void test('drafts and duplicate translation keys are explicit', async (t) => {
  const f = await fixture(t, {
    'es/index.md': '---\ntranslationKey: home\n---\nHi.',
    'es/Other.md': '---\ntranslationKey: home\n---\nAnother.',
    'es/Draft.md': '---\ndraft: true\n---\nPrivate.',
  });
  const index = await f.build();
  assert.equal(index.pages.length, 2);
  assert.equal(index.diagnostics[0]!.code, 'duplicate-translation');
  assert.equal(
    (
      await buildWikiIndex({
        contentDir: f.contentDir,
        publicDir: f.publicDir,
        includeDrafts: true,
      })
    ).pages.length,
    3,
  );
});

void test('callout bodies preserve inline markup after a title without a blank line', async (t) => {
  const f = await fixture(t, {
    'es/index.md':
      '> [!WARNING] A **rich** title\n> Honestly, [contribute](https://example.com) and **add** what you know.\n\n> [!NOTE]\n> Body with [[Target|a link]].',
    'es/Target.md': 'Hello.',
  });
  const index = await f.build();
  assert.deepEqual(index.diagnostics, []);
  const html = index.pages.find((p) => p.id === 'es/index')!.html;
  assert.match(
    html,
    /<p class="callout-title">A <strong>rich<\/strong> title<\/p>\s*<p>Honestly, <a/,
  );
  assert.match(html, /<p class="callout-title">Nota<\/p>\s*<p>Body with <a/);
  assert.match(html, /and <strong>add<\/strong> what you know\./);
});

void test('ordinary absolute links retain site-wide language semantics and relative links use the source directory', async (t) => {
  const f = await fixture(t, {
    'es/Words/Target.md': 'Spanish.',
    'en/Words/Target.md': 'English.',
    'en/Words/Source.md':
      '[Spanish](/Words/Target/) [English](Target.md) [English root](/en/Words/Target/) [[Target|local wiki]]',
  });
  const index = await f.build();
  assert.deepEqual(index.diagnostics, []);
  const source = index.pages.find((p) => p.id === 'en/Words/Source')!;
  assert.deepEqual(source.outgoing, ['en/Words/Target', 'es/Words/Target']);
  assert.match(source.html, /href="\/Words\/Target\/" data-preview="\/Words\/Target\/">Spanish/);
  assert.match(
    source.html,
    /href="\/en\/Words\/Target\/" data-preview="\/en\/Words\/Target\/">English/,
  );
});

void test('generated footnotes use the page language', async (t) => {
  const f = await fixture(t, {
    'es/index.md': 'Un detalle[^1].\n\n[^1]: La fuente.',
    'en/index.md': 'A detail[^1].\n\n[^1]: The source.',
  });
  const index = await f.build();
  assert.deepEqual(index.diagnostics, []);
  assert.match(index.pages.find((p) => p.lang === 'es')!.html, /Notas al pie/);
  assert.match(
    index.pages.find((p) => p.lang === 'es')!.html,
    /aria-label="Volver a la referencia 1"/,
  );
  assert.match(index.pages.find((p) => p.lang === 'en')!.html, /aria-label="Back to reference 1"/);
});

void test('editorial status remains metadata while rendered prose hides markers and keeps literal examples', async (t) => {
  const f = await fixture(t, {
    'es/Unfinished.md':
      '---\ntags: [culture, wip]\n---\n> [!WARNING] Incomplete. #wip\n\nA small **#stub**.\n\n#unrelated is ordinary prose.',
    'es/Guide.md':
      'Examples: `#wip` and `#stub`.\n\n```md\n#wip #stub\n```\n\nEscaped: \\#wip and \\#stub. Longer names: #wip-example #stubborn.',
  });
  const index = await f.build();
  assert.deepEqual(index.diagnostics, []);
  const unfinished = index.pages.find((p) => p.id === 'es/Unfinished')!;
  assert.deepEqual(unfinished.tags, ['culture', 'wip', 'stub']);
  assert.equal(unfinished.draft, false);
  assert.match(unfinished.body, /Incomplete\. #wip/);
  assert.match(unfinished.html, /Incomplete\./);
  assert.doesNotMatch(unfinished.html, /#wip|#stub|<hr/);
  assert.doesNotMatch(unfinished.excerpt, /#wip|#stub/);
  const guide = index.pages.find((p) => p.id === 'es/Guide')!;
  assert.deepEqual(guide.tags, []);
  assert.match(guide.html, /<code>#wip<\/code>/);
  assert.match(guide.html, /Escaped: #wip and #stub/);
});

void test('document previews use short plain prose and stop at complete words or sentences', async (t) => {
  const sentence =
    'Esta enciclopedia conserva palabras, historias y expresiones de la cultura popular puertorriqueña para compartirlas con nuevas generaciones.';
  const f = await fixture(t, {
    'es/Sentence.md': `> [!NOTE] **Una nota.**\n>\n> ${sentence}\n\n${'Más detalles interesantes sobre nuestra historia. '.repeat(8)}`,
    'es/Words.md':
      '[[Target|Una referencia]] y **muchas palabras** ' + 'puertorriqueñas '.repeat(30),
    'es/Short.md':
      '> [!WARNING] **Aviso**\n> Este texto tiene [un enlace](https://example.com) y `un término`.\n\n- Una cosa\n- Otra cosa\n\n```js\nnotPreviewContent()\n```\n\n::youtube{id="vG_l9pB0sPY"}',
    'es/Target.md': '## Definición\n\nEl destino.',
  });
  const index = await f.build();
  assert.deepEqual(index.diagnostics, []);
  const byId = new Map(index.pages.map((page) => [page.id, page]));
  assert.equal(byId.get('es/Target')!.excerpt, 'El destino.');
  const sentencePreview = byId.get('es/Sentence')!.excerpt;
  assert.ok(sentencePreview.length <= 220);
  assert.ok(sentencePreview.endsWith('. …'), sentencePreview);
  assert.ok(sentencePreview.startsWith('Una nota. Esta enciclopedia'));
  const wordPreview = byId.get('es/Words')!.excerpt;
  assert.ok(wordPreview.length <= 220);
  assert.ok(wordPreview.startsWith('Una referencia y muchas palabras'));
  assert.ok(wordPreview.endsWith('puertorriqueñas…'), wordPreview);
  assert.equal(
    byId.get('es/Short')!.excerpt,
    'Aviso Este texto tiene un enlace y un término. Una cosa Otra cosa',
  );
});

void test('content and JSON boundaries reject malformed metadata before rendering', async (t) => {
  const f = await fixture(t, { 'es/index.md': '---\ntags: [valid, 42]\n---\nHello.' });
  await assert.rejects(f.build(), /Invalid input/);
  await f.write('es/index.md', '---\ntitle: A valid page\n---\nHello.');
  await fs.writeFile(
    path.join(f.publicDir, 'media-manifest.json'),
    JSON.stringify({ '/photo.png': { width: 'wide' } }),
  );
  await assert.rejects(f.build(), /Invalid input/);
  await fs.writeFile(path.join(f.publicDir, 'media-manifest.json'), '{}');
  const knownIssuesFile = path.join(f.directory, 'invalid-issues.json');
  await fs.writeFile(knownIssuesFile, JSON.stringify({ issues: [{ source: 42 }] }));
  await assert.rejects(
    buildWikiIndex({ contentDir: f.contentDir, publicDir: f.publicDir, knownIssuesFile }),
    /Invalid input/,
  );
});
