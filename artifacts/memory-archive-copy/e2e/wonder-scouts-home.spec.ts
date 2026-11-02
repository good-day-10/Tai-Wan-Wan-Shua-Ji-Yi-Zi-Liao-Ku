import { expect, test, type Page } from '@playwright/test';
import { createDefaultSiteContent } from '../src/site-content';

const archive = {
  version: 9,
  introduction: '少年導覽隊網站瀏覽測試',
  memories: [{
    id: '01',
    title: '共享資料同步測試故事',
    location: '新竹',
    era: '2024–2026',
    category: '眷村文化',
    storyteller: '少年導覽隊',
    excerpt: '這則內容只來自本次共享資料回應。',
    story: '測試用的導覽故事。',
    color: '#b8803e',
    mark: '起點',
    image: '/wonder-scouts/image_1.avif',
  }],
  siteContent: {
    ...createDefaultSiteContent(),
    pages: [],
  },
};

async function prepareVisitorPage(page: Page) {
  let archiveReadCount = 0;
  await page.route('**/api/archive-copy', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fulfill({ status: 405, body: 'Browser test is read-only' });
      return;
    }
    archiveReadCount += 1;
    await route.fulfill({ json: archive });
  });
  await page.route('**/api/editor-copy/status', (route) => route.fulfill({
    json: { authenticated: false, owner: false },
  }));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '少年導覽隊' }).first()).toBeVisible();
  await expect(page.getByTestId('shared-archive-notice-loading')).toHaveCount(0);
  return () => archiveReadCount;
}

test('three results tabs switch between venues, videos, and public feedback', async ({ page }) => {
  const getArchiveReadCount = await prepareVisitorPage(page);
  const tabs = page.locator('.ws-tabs');

  await expect(page.getByRole('heading', { name: '共享資料同步測試故事' })).toBeVisible();
  await tabs.getByRole('button', { name: '精選影片' }).click();
  await expect(page.getByRole('button', { name: /影響力市集成果紀錄/ })).toBeVisible();
  await expect(page.locator('.ws-venue-grid')).toHaveCount(0);

  await tabs.getByRole('button', { name: '民眾回饋' }).click();
  await expect(page.locator('.ws-feedback-grid blockquote')).toHaveCount(6);
  await expect(page.locator('.ws-video-grid')).toHaveCount(0);

  await tabs.getByRole('button', { name: '導覽場域' }).click();
  await expect(page.getByRole('heading', { name: '共享資料同步測試故事' })).toBeVisible();
  expect(getArchiveReadCount()).toBe(1);
});

test('featured video opens a privacy-enhanced player and closes from its close button or backdrop', async ({ page }) => {
  await prepareVisitorPage(page);
  await page.locator('.ws-tabs').getByRole('button', { name: '精選影片' }).click();
  await page.getByRole('button', { name: /影響力市集成果紀錄/ }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('iframe')).toHaveAttribute(
    'src',
    'https://www.youtube-nocookie.com/embed/025HOvHCdP4?autoplay=1',
  );
  await dialog.getByRole('button', { name: '關閉影片' }).click();
  await expect(dialog).toHaveCount(0);

  await page.getByRole('button', { name: /影響力市集成果紀錄/ }).click();
  const modal = page.locator('.ws-video-modal');
  await expect(modal).toBeVisible();
  await modal.click({ position: { x: 4, y: 4 } });
  await expect(modal).toHaveCount(0);
});

test('desktop navigation links reach every major section', async ({ page }) => {
  await prepareVisitorPage(page);
  const destinations = [
    ['關於我們', 'about'],
    ['導覽成果', 'results'],
    ['場域合作', 'partner'],
    ['加入我們', 'join'],
    ['支持我們', 'donate'],
  ] as const;

  for (const [label, id] of destinations) {
    await page.locator('.ws-nav nav').getByRole('link', { name: label }).click();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect(page.locator(`#${id}`)).toBeInViewport();
  }
});

test('external partnership and join forms open their configured destinations', async ({ page }) => {
  await prepareVisitorPage(page);
  await page.context().route(/https:\/\/(docs\.google\.com\/forms|forms\.gle)\//, (route) =>
    route.fulfill({ contentType: 'text/html', body: '<main>Form destination test</main>' }),
  );

  const cases = [
    {
      name: '填寫合作表單',
      href: 'https://docs.google.com/forms/d/e/1FAIpQLSd3bYH1n5HX569WxzNzub4dR5kgBN8yGw9mLjVakEfFVzULEA/viewform',
    },
    { name: '立即填寫表單', href: 'https://forms.gle/2575hnCrJk556J3cA' },
  ];
  for (const item of cases) {
    const link = page.getByRole('link', { name: new RegExp(item.name) });
    await expect(link).toHaveAttribute('href', item.href);
    await expect(link).toHaveAttribute('target', '_blank');
    const popupPromise = page.context().waitForEvent('page');
    await link.click();
    const popup = await popupPromise;
    await expect(popup).toHaveURL(item.href);
    await expect(popup.getByText('Form destination test')).toBeVisible();
    await popup.close();
  }
});

test('mobile layout stays within the screen and its section calls to action still navigate', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prepareVisitorPage(page);

  await expect(page.locator('.ws-nav nav')).toBeHidden();
  expect(await page.locator('.ws-hero-grid').evaluate((element) =>
    getComputedStyle(element).gridTemplateColumns.split(' ').length,
  )).toBe(1);
  await expect(page.getByRole('link', { name: /場域合作提案/ }).first()).toBeVisible();

  await page.getByRole('link', { name: /場域合作提案/ }).first().click();
  await expect(page).toHaveURL(/#partner$/);
  await expect(page.locator('#partner')).toBeInViewport();
  await page.locator('.ws-tabs').getByRole('button', { name: '精選影片' }).click();
  expect(await page.locator('.ws-video-grid').evaluate((element) =>
    getComputedStyle(element).gridTemplateColumns.split(' ').length,
  )).toBe(1);

  const dimensions = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
});

test('signed-out visitors can open the editor entry and are directed to sign in', async ({ page }) => {
  await prepareVisitorPage(page);
  await page.getByRole('button', { name: '編輯本站' }).click();

  await expect(page.getByRole('dialog', { name: /想替這座資料庫/ })).toBeVisible();
  const signInLink = page.getByTestId('link-gate-sign-in');
  await expect(signInLink).toBeVisible();
  await expect(signInLink).toHaveAttribute('href', '/memory-archive-copy/sign-in');
  await expect(page.getByTestId('input-editor-password')).toHaveCount(0);
  await expect(page.getByTestId('button-submit-owner-access')).toHaveCount(0);
});
