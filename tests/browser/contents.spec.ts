import { expect, test } from '@playwright/test';

test('homepage contents tracks manual scrolling and clamped anchor targets in both languages', async ({
  page,
}) => {
  for (const path of ['/', '/en/']) {
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    const links = page.locator('.table-of-contents .toc-link');
    await expect(links).toHaveCount(3);
    await expect(links.first()).toHaveAttribute('aria-current', 'location');

    // Both home sections are too near the footer to align with the top of this viewport.
    await page.mouse.move(800, 500);
    await page.mouse.wheel(0, 10_000);
    await expect(links.last()).toHaveAttribute('aria-current', 'location');
    await links.nth(1).click();
    await expect(links.nth(1)).toHaveAttribute('aria-current', 'location');

    await page.mouse.move(800, 500);
    await page.mouse.wheel(0, -10_000);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(links.first()).toHaveAttribute('aria-current', 'location');
    await page.mouse.wheel(0, 10_000);
    await expect(links.last()).toHaveAttribute('aria-current', 'location');

    await links.nth(1).click();
    await page.reload();
    await expect(links.nth(1)).toHaveAttribute('aria-current', 'location');
    await links.last().click();
    await expect(links.last()).toHaveAttribute('aria-current', 'location');
  }
});

test('article contents includes every heading and follows boundaries and layout shifts', async ({
  page,
}) => {
  await page.route('https://www.youtube-nocookie.com/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<p>Player</p>' }),
  );
  await page.setViewportSize({ width: 1440, height: 500 });
  await page.goto('/Palabras/Chota/');
  await page.addStyleTag({
    content: ':root { scroll-behavior: auto !important; overflow-anchor: none; }',
  });
  await page.evaluate(() => document.fonts.ready);
  const links = page.locator('.table-of-contents .toc-link');
  const ids = await page
    .locator('.article-content :is(h1, h2, h3, h4, h5, h6):not(.sr-only)')
    .evaluateAll((headings) => headings.map((heading) => heading.id));
  expect(ids.length).toBeGreaterThan(3);
  expect(
    await links.evaluateAll((anchors) =>
      anchors.map((anchor) => decodeURIComponent((anchor.getAttribute('href') ?? '').slice(1))),
    ),
  ).toEqual(['main-content', ...ids]);

  const targetId = ids[2]!;
  await page.evaluate((id) => {
    const heading = document.getElementById(id)!;
    const offset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop);
    window.scrollTo(0, window.scrollY + heading.getBoundingClientRect().top - offset - 12);
  }, targetId);
  await expect(links.nth(2)).toHaveAttribute('aria-current', 'location');
  await page.evaluate(() => window.scrollBy(0, 24));
  await expect(links.nth(3)).toHaveAttribute('aria-current', 'location');

  // A loaded image or diagram can move a section without any scroll event.
  await page.evaluate((id) => {
    const spacer = document.createElement('div');
    spacer.id = 'layout-shift-fixture';
    spacer.style.height = '120px';
    document.getElementById(id)!.before(spacer);
  }, targetId);
  await expect(links.nth(2)).toHaveAttribute('aria-current', 'location');
  await page.evaluate(() => document.getElementById('layout-shift-fixture')!.remove());
  await expect(links.nth(3)).toHaveAttribute('aria-current', 'location');

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(links.last()).toHaveAttribute('aria-current', 'location');
  await expect
    .poll(() =>
      links.last().evaluate((link) => {
        const rail = link.closest('.article-sidebar')!.getBoundingClientRect();
        const item = link.getBoundingClientRect();
        return item.top >= rail.top && item.bottom <= rail.bottom;
      }),
    )
    .toBeTruthy();

  const previousSection = links.nth(ids.length - 1);
  await previousSection.click();
  await expect(previousSection).toHaveAttribute('aria-current', 'location');
  const rail = page.locator('.article-sidebar');
  const railPosition = await rail.evaluate((element) => element.scrollTop);
  const pagePosition = await page.evaluate(() => window.scrollY);
  expect(railPosition).toBeGreaterThan(0);
  await rail.hover();
  await page.mouse.wheel(0, -60);
  await expect.poll(() => rail.evaluate((element) => element.scrollTop)).toBeLessThan(railPosition);
  expect(await page.evaluate(() => window.scrollY)).toBe(pagePosition);
  await expect(previousSection).toHaveAttribute('aria-current', 'location');

  await page.keyboard.press('ControlOrMeta+k');
  await expect(page.locator('#search-dialog')).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await expect(previousSection).toHaveAttribute('aria-current', 'location');
  await page.keyboard.press('Escape');
  await page.goto(`/Palabras/Chota/#${targetId}`);
  await expect(links.nth(3)).toHaveAttribute('aria-current', 'location');
});
