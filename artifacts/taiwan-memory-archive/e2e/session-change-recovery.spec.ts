import { expect, test } from '@playwright/test';

const sharedArchive = {
  version: 7,
  introduction: '資料庫原始介紹',
  memories: [{
    id: '01',
    title: '測試記憶標題',
    location: '台灣・測試地點',
    era: '測試年代',
    category: '童玩',
    storyteller: '測試說故事的人',
    excerpt: '原始摘錄',
    story: '原始故事',
    storyHtml: '<p>原始故事</p>',
    color: '#3e8090',
    mark: '測試',
    images: [],
  }],
  siteContent: { blocks: [], pages: [] },
};

test('a draft and its notice survive Clerk sign-out and sign-in route navigation', async ({ page }) => {
  let archiveOnServer = structuredClone(sharedArchive);
  const saveRequests: unknown[] = [];

  await page.route(/\/sign-in$/, (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<!doctype html><html lang="zh-Hant"><body><div id="root"></div><script type="module">import RefreshRuntime from "/@react-refresh"; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type; window.__vite_plugin_react_preamble_installed__ = true;</script><script type="module" src="/src/session-change-browser-harness.tsx"></script></body></html>',
    });
  });
  await page.route('**/api/archive', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: archiveOnServer });
      return;
    }

    saveRequests.push(route.request().postDataJSON());
    await route.fulfill({ json: archiveOnServer });
  });
  await page.route('**/api/editor/status', (route) => route.fulfill({
    json: { authenticated: true, owner: true },
  }));
  await page.route('**/api/editor/unlock', (route) => route.fulfill({
    json: { unlocked: true },
  }));

  await page.goto('/session-change-browser-harness.html');
  await expect(page.getByTestId('shared-archive-notice-loading')).toHaveCount(0);
  await page.getByTestId('button-footer-editor').click();
  await expect(page.locator('[role="dialog"]')).toBeVisible();
  await page.getByTestId('button-submit-owner-access').click();
  await page.locator('[data-testid^="button-edit-memory-"]').first().click();
  const draftTitle = `登出後恢復標題-${Date.now()}`;
  const draftExcerpt = `登出後恢復摘錄-${Date.now()}`;
  await page.locator('[data-testid^="input-memory-title-"]').first().fill(draftTitle);
  await page.locator('[data-testid^="textarea-memory-excerpt-"]').first().fill(draftExcerpt);

  await page.getByTestId('button-test-sign-out').click();
  await expect(page.getByTestId('session-change-notice')).toContainText('編輯模式已關閉');
  await expect(page.getByTestId('button-save-archive')).toHaveCount(0);
  expect(saveRequests).toHaveLength(0);

  const recoveryDraft = await page.evaluate(() => JSON.parse(
    sessionStorage.getItem('taiwan-memory-archive-recovery-draft') ?? 'null',
  ));
  expect(recoveryDraft.memories[0].title).toBe(draftTitle);
  expect(recoveryDraft.memories[0].excerpt).toBe(draftExcerpt);
  expect(await page.evaluate(() => sessionStorage.getItem('taiwan-memory-archive-session-change-notice'))).toBe('true');

  await page.getByTestId('link-reauthorize-draft').click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByTestId('test-sign-in-route')).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('taiwan-memory-archive-session-change-notice'))).toBe('true');
  expect(JSON.parse(await page.evaluate(() => sessionStorage.getItem('taiwan-memory-archive-recovery-draft')!)).memories[0].title).toBe(draftTitle);

  await page.getByTestId('button-test-sign-in').click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId('session-change-notice')).toBeVisible();
  await page.getByTestId('button-reauthorize-draft').click();
  await expect(page.locator('[role="dialog"]')).toBeVisible();
  await page.getByTestId('button-submit-owner-access').click();

  await page.locator('[data-testid^="button-edit-memory-"]').first().click();
  await expect(page.locator('[data-testid^="input-memory-title-"]').first()).toHaveValue(draftTitle);
  await expect(page.locator('[data-testid^="textarea-memory-excerpt-"]').first()).toHaveValue(draftExcerpt);
  await expect(page.getByTestId('session-change-notice')).toBeVisible();
  expect(saveRequests).toHaveLength(0);
  expect(archiveOnServer).toEqual(sharedArchive);
});
