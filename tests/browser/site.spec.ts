import { test, expect } from '@playwright/test';

test('legacy alternate-name redirects preserve accented destinations', async ({ page }) => {
  for (const [alias, destination, title] of [
    ['/Cabrona/', '/en/Palabras/Cabr%C3%B3n/', 'Cabrón'],
    ['/Gongol%C3%B3/', '/Fauna/Gongol%C3%AD/', 'Gongolí'],
  ] as const) {
    await page.goto(alias);
    await expect(page).toHaveURL(`http://127.0.0.1:4321${destination}`);
    await expect(page.locator('h1')).toHaveText(title);
  }
});

test('Spanish home, original branding, working hover preview and English counterpart', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.locator('h1')).toHaveText('La enciclopedia bori pop');
  await expect(page.locator('.article-meta')).toHaveCount(0);
  const link = page
    .locator('.article-content a[data-preview]')
    .filter({ hasText: 'preservamos de todo' });
  await link.hover();
  const preview = page.locator('.page-preview');
  await expect(preview).toBeVisible();
  const previewTitle = preview.locator('h2 > a.preview-title-link');
  await expect(previewTitle).toHaveText('La misión');
  await expect(previewTitle).toHaveAttribute('href', (await link.getAttribute('href'))!);
  await expect(preview.locator(':scope > *')).toHaveCount(2);
  await expect(preview.locator('.preview-eyebrow, .tag-list, .preview-open, button')).toHaveCount(
    0,
  );
  expect((await preview.locator('.preview-excerpt').innerText()).length).toBeLessThanOrEqual(220);
  await page.keyboard.press('Escape');
  await expect(page.locator('.page-preview')).toBeHidden();
  await page.locator('.language-switch a').click();
  await expect(page).toHaveURL(/\/en\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.article-meta')).toHaveCount(0);
});

test('search matches alternate names, accents, and stays in the current language', async ({
  page,
}) => {
  for (const root of ['/', '/en/']) {
    await page.goto(root);
    await page.locator('.search-trigger').click();
    await page.locator('#search-input').fill('cabroncito');
    await expect(page.locator('.search-results a').first()).toBeVisible();
    await expect(page.locator('.search-results')).toContainText('Cabrón');
    const urls = await page
      .locator('.search-results a')
      .evaluateAll((links) =>
        links.map((link) => new URL((link as HTMLAnchorElement).href).pathname),
      );
    expect(
      urls.every((url) => (root === '/en/' ? url.startsWith('/en/') : !url.startsWith('/en/'))),
    ).toBeTruthy();
    await page.locator('#search-input').fill('cabron');
    await expect(page.locator('.search-results')).toContainText('Cabrón');
    await expect(page.locator('#search-section')).toBeVisible();
    await expect(page.locator('#search-tag')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(page.locator('#search-dialog')).not.toBeVisible();
  }
});

test('search keeps keyboard focus and scrolling results inside desktop and narrow mobile surfaces', async ({
  page,
}) => {
  await page.goto('/');
  const trigger = page.locator('.search-trigger');
  for (
    let tab = 0;
    tab < 12 && !(await trigger.evaluate((button) => button === document.activeElement));
    tab++
  ) {
    await page.keyboard.press('Tab');
  }
  await expect(trigger).toBeFocused();
  const focus = await trigger.evaluate((button) => {
    const style = getComputedStyle(button);
    return {
      visible: button.matches(':focus-visible'),
      offset: parseFloat(style.outlineOffset),
      width: parseFloat(style.outlineWidth),
    };
  });
  expect(focus.visible).toBeTruthy();
  expect(focus.width).toBeGreaterThan(0);
  expect(focus.offset).toBeLessThanOrEqual(0);
  await page.keyboard.press('Enter');

  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 320, height: 640 },
  ]) {
    await page.setViewportSize(viewport);
    if (viewport.width === 320) {
      await page.goto('/');
      await page.locator('.mobile-header [data-open-search]').click();
    }
    const dialog = page.locator('#search-dialog');
    const input = page.locator('#search-input');
    const results = page.locator('.search-results');
    await expect(input).toBeFocused();
    await input.fill('puerto');
    await expect(results.locator('a').first()).toBeVisible();
    await expect
      .poll(() => results.evaluate((list) => list.scrollHeight > list.clientHeight))
      .toBeTruthy();
    const bounds = (await dialog.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
    expect(
      await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth),
    ).toBeTruthy();
    const inputBeforeScroll = (await input.boundingBox())!;
    await results.evaluate((list) => {
      list.scrollTop = list.scrollHeight;
    });
    expect(await results.evaluate((list) => list.scrollTop)).toBeGreaterThan(0);
    await expect(input).toBeInViewport();
    expect((await input.boundingBox())!.y).toBeCloseTo(inputBeforeScroll.y, 1);

    const section = page.locator('#search-section');
    await expect(section).toHaveCSS('appearance', 'none');
    const chevron = page.locator('.search-section-filter > svg');
    await expect(chevron).toBeVisible();
    await expect(chevron).toHaveAttribute('aria-hidden', 'true');
    await expect(chevron).toHaveCSS('pointer-events', 'none');
    await section.selectOption({ label: 'Palabras' });
    await expect
      .poll(async () => {
        const urls = await results
          .locator('a')
          .evaluateAll((links) =>
            links.map((link) => new URL((link as HTMLAnchorElement).href).pathname),
          );
        return urls.length > 0 && urls.every((url) => url.startsWith('/Palabras/'));
      })
      .toBeTruthy();
    if (viewport.width === 320) {
      await results
        .locator('h3')
        .first()
        .evaluate((title) => {
          title.textContent = 'NombreLarguísimo'.repeat(20);
        });
      expect(await results.evaluate((list) => list.scrollWidth <= list.clientWidth)).toBeTruthy();
    }

    // Chromium's native clear button lives in a closed shadow tree; verify its hiding rule.
    expect(
      await page.evaluate(() => {
        const hidesCancel = (rules: CSSRuleList): boolean =>
          [...rules].some((rule) => {
            if (rule instanceof CSSStyleRule)
              return (
                rule.selectorText.includes('::-webkit-search-cancel-button') &&
                rule.style.display === 'none'
              );
            return 'cssRules' in rule && hidesCancel((rule as CSSGroupingRule).cssRules);
          });
        return [...document.styleSheets].some((sheet) => hidesCancel(sheet.cssRules));
      }),
    ).toBeTruthy();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  }
});

test('backlink cards, active contents, translated article, and missing translation are explicit', async ({
  page,
}) => {
  await page.goto('/Art%C3%ADculos/Las-miles-de-maneras-de-dar-un-golpe/');
  const backlinks = page.locator('.article-sidebar .backlinks');
  await expect(backlinks).toContainText('La enciclopedia bori pop');
  await expect(backlinks.locator('.backlink-card').first()).toBeVisible();
  await expect(backlinks.locator('.backlink-meta').first()).not.toBeEmpty();
  await expect(backlinks.locator('.backlink-count')).toHaveCount(0);
  await expect(page.locator('pre.mermaid svg')).toBeVisible();
  const firstHeading = page.locator('.article-sidebar .table-of-contents .toc-link').first();
  await firstHeading.click();
  await expect(firstHeading).toHaveAttribute('aria-current', 'location');
  await expect
    .poll(() =>
      firstHeading.evaluate((link) => {
        const marker = getComputedStyle(link, '::before').backgroundColor;
        return (
          link.getAttribute('aria-current') === 'location' &&
          marker !== 'rgba(0, 0, 0, 0)' &&
          marker === getComputedStyle(link).color
        );
      }),
    )
    .toBeTruthy();
  await page.locator('.language-switch a').click();
  await expect(page).toHaveURL(/\/en\/Art/);
  await expect(page.locator('.article-meta')).toContainText('Updated');
  await expect(page.locator('.article-meta')).not.toContainText('Read in');
  await expect(page.locator('.article-header .tag-list')).toHaveCount(0);
  await page.goto('/Fauna/Gongol%C3%AD/');
  await expect(page.locator('.translation-notice')).toContainText(
    'todavía no está disponible en inglés',
  );
  await expect(page.locator('.language-switch a')).toHaveCount(0);
});

test('mobile menu, search, article, and rich media fit a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('[data-open-menu]').click();
  await expect(page.locator('#site-sidebar')).toHaveAttribute('data-open', '');
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-open-menu]')).toHaveAttribute('aria-expanded', 'false');
  await page.locator('.mobile-header [data-open-search]').click();
  await expect(page.locator('#search-input')).toBeFocused();
  await page.keyboard.press('Escape');
  for (const url of [
    '/',
    '/Palabras/Combi/',
    '/Personas/Mi-Pana-Gilito/',
    '/Art%C3%ADculos/Las-miles-de-maneras-de-dar-un-golpe/',
  ]) {
    await page.goto(url);
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      .toBeTruthy();
    await expect(page.locator('.mobile-toc')).toHaveCount(0);
    await expect(page.locator('.table-of-contents')).not.toBeVisible();
  }
});

test('inline video, last-updated dates, and theme preference survive navigation', async ({
  page,
}) => {
  await page.route('https://www.youtube-nocookie.com/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<p>Player</p>' }),
  );
  await page.goto('/Palabras/C%C3%B3digos/');
  const players = page.locator('.media-embed iframe');
  await expect(players).toHaveCount(2);
  for (const [index, videoId] of ['cwfrH7JSsV8', 'HCE8EKmoBIg'].entries()) {
    await expect(players.nth(index)).toHaveAttribute(
      'src',
      `https://www.youtube-nocookie.com/embed/${videoId}`,
    );
    await expect(players.nth(index)).toHaveAttribute('loading', 'lazy');
  }
  await expect(
    page.locator('.media-embed button, .media-embed .embed-notice, .media-embed a'),
  ).toHaveCount(0);
  const metadata = page.locator('.article-meta');
  await expect(metadata).toContainText('Actualizado');
  // Códigos was published at 07:11:06; the displayed value must use its later lastmod.
  await expect(metadata.locator('time')).toHaveAttribute('datetime', '2026-02-24T07:18:07Z');
  await expect(metadata.locator('time')).toHaveText(/24.*feb.*2026/i);
  await expect(metadata).not.toContainText('Se lee en');
  await page.locator('[data-toggle-theme]').first().click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.goto('/Palabras/Combi/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('article links, backlinks, and mobile navigation remain available without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/Art%C3%ADculos/Las-miles-de-maneras-de-dar-un-golpe/');
  await expect(page.locator('h1')).toContainText('dar un golpe');
  await expect(page.locator('.article-header .tag-list')).toHaveCount(0);
  const homeBacklink = page
    .locator('.article-sidebar .backlink-card')
    .filter({ hasText: 'La enciclopedia bori pop' });
  await expect(homeBacklink).toBeVisible();
  await expect(homeBacklink).toHaveAttribute('href', '/');
  await homeBacklink.click();
  await expect(page).toHaveURL('http://127.0.0.1:4321/');
  const missionLink = page
    .locator('.article-content a[data-preview]')
    .filter({ hasText: 'preservamos de todo' });
  await expect(missionLink).toBeVisible();
  await missionLink.click();
  await expect(page.locator('h1')).toHaveText('La misión');
  await page.setViewportSize({ width: 390, height: 844 });
  const navigation = page.locator('.no-js-navigation');
  await expect(navigation).toBeVisible();
  await navigation.locator('summary').click();
  await expect(navigation.getByRole('link', { name: 'Palabras', exact: true })).toBeVisible();
  await expect(page.locator('.mobile-toc')).toHaveCount(0);
  await context.close();
});

test('simplified layout ignores stale reading preferences and has no tags or article counts', async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem('acho-reading', 'true'));
  await page.goto('/');
  await expect(page.locator('.site-sidebar')).toBeVisible();
  await expect(page.locator('.article-sidebar')).toBeVisible();
  await expect(page.locator('html')).not.toHaveAttribute('data-reading', 'true');
  await expect(page.locator('[data-toggle-reading], .reading-exit')).toHaveCount(0);
  await expect(page.locator('.tag-list, .all-tags-link, .tag-directory, #search-tag')).toHaveCount(
    0,
  );
  await expect(page.locator('.nav-count, .backlink-count')).toHaveCount(0);
  await expect(page.locator('a[href*="/tags/"]')).toHaveCount(0);
  const articleLink = page.locator('.article-content a[data-preview]').first();
  await articleLink.hover();
  expect(await articleLink.evaluate((link) => getComputedStyle(link).textDecorationLine)).toBe(
    'none',
  );
  expect(
    await page
      .locator('.section-navigation summary')
      .first()
      .evaluate((item) => getComputedStyle(item).textDecorationLine),
  ).toBe('none');
});

test('removed tag directories are absent from routes and the sitemap', async ({ request }) => {
  for (const url of ['/tags/', '/en/tags/', '/tags/palabras/']) {
    expect((await request.get(url)).status()).toBe(404);
  }
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.ok()).toBeTruthy();
  expect(await sitemap.text()).not.toContain('/tags/');
});
