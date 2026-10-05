import { expect, test } from '@playwright/test';

type ArchiveSnapshot = {
  version?: number;
  introduction: string;
  memories: Array<{ title: string; [key: string]: unknown }>;
  [key: string]: unknown;
};

type SaveBody = { archive: ArchiveSnapshot; expectedVersion?: number };

test('a version conflict lets the editor compare, choose content, cancel, and save with the latest version', async ({ page }) => {
  let latestArchive: ArchiveSnapshot | null = null;
  let compareRequests = 0;
  const submittedBodies: SaveBody[] = [];

  await page.route('**/mock/archive', async (route) => {
    if (!latestArchive) {
      await route.fulfill({ status: 503, body: 'Archive test server is not initialized' });
      return;
    }

    if (route.request().method() === 'GET') {
      compareRequests += 1;
      await route.fulfill({ json: latestArchive });
      return;
    }

    submittedBodies.push(route.request().postDataJSON() as SaveBody);
    if (submittedBodies.length === 1) {
      await route.fulfill({ status: 409, json: { error: 'Archive version conflict' } });
      return;
    }
    if (submittedBodies.length === 2) {
      latestArchive = {
        ...latestArchive,
        version: 10,
        introduction: '第二次衝突後伺服器更新的介紹',
      };
      await route.fulfill({ status: 409, json: { error: 'Archive version conflict' } });
      return;
    }

    const savedArchive = submittedBodies.at(-1)!.archive;
    latestArchive = {
      ...savedArchive,
      version: (latestArchive.version ?? 0) + 1,
    };
    await route.fulfill({ json: latestArchive });
  });

  await page.goto('/conflict-reload-browser-harness.html');
  const initialArchiveJson = await page.getByTestId('test-shared-archive').getAttribute('data-archive');
  expect(initialArchiveJson).not.toBeNull();
  const initialArchive = JSON.parse(initialArchiveJson!) as ArchiveSnapshot;
  latestArchive = structuredClone(initialArchive);
  latestArchive.version = 9;
  latestArchive.introduction = '伺服器更新的資料庫介紹';
  latestArchive.memories[0]!.title = '伺服器更新的標題';

  const draftTitle = `衝突後保留草稿-${Date.now()}`;
  const draftIntroduction = `衝突後保留的介紹-${Date.now()}`;
  await page.locator('[data-testid^="button-edit-memory-"]').first().click();
  const titleInput = page.locator('[data-testid^="input-memory-title-"]').first();
  await titleInput.fill(draftTitle);
  await page.getByTestId('textarea-introduction').fill(draftIntroduction);
  await page.getByTestId('button-save-archive').click();

  await expect(page.getByTestId('save-error-editor')).toContainText('這些修改仍保留在編輯器中');
  await expect(titleInput).toHaveValue(draftTitle);
  expect(submittedBodies).toHaveLength(1);
  expect(submittedBodies[0]?.archive.memories[0]?.title).toBe(draftTitle);
  expect(submittedBodies[0]?.expectedVersion).toBe(4);

  await page.getByTestId('button-reload-latest').click();
  await expect(page.getByTestId('conflict-resolution-dialog')).toBeVisible();
  await expect(page.getByTestId('conflict-item-0')).toContainText('資料庫介紹');
  await expect(page.getByTestId('conflict-value-server-0')).toContainText('伺服器更新的資料庫介紹');
  await expect(page.getByTestId('conflict-value-draft-0')).toContainText(draftIntroduction);
  await expect(page.getByTestId('conflict-item-1')).toContainText('伺服器更新的標題');
  await expect(page.getByTestId('conflict-value-draft-1')).toContainText(draftTitle);

  await page.getByTestId('button-cancel-conflict-resolution-footer').click();
  await expect(page.getByTestId('conflict-resolution-dialog')).toHaveCount(0);
  await expect(titleInput).toHaveValue(draftTitle);
  expect(submittedBodies).toHaveLength(1);
  expect(compareRequests).toBe(1);

  await page.getByTestId('button-reload-latest').click();
  await expect(page.getByTestId('conflict-resolution-dialog')).toBeVisible();
  await page.getByTestId('conflict-choice-server-0').check();
  await page.getByTestId('conflict-choice-draft-1').check();
  await page.getByTestId('button-confirm-conflict-resolution').click();

  await expect(page.getByTestId('save-error-editor')).toContainText('這些修改仍保留在編輯器中');
  await expect(titleInput).toHaveValue(draftTitle);
  expect(submittedBodies).toHaveLength(2);
  expect(submittedBodies[1]?.expectedVersion).toBe(9);
  expect(submittedBodies[1]?.archive.memories[0]?.title).toBe(draftTitle);

  await page.getByTestId('button-reload-latest').click();
  await expect(page.getByTestId('conflict-resolution-dialog')).toBeVisible();
  await expect(page.getByTestId('conflict-value-server-0')).toContainText('第二次衝突後伺服器更新的介紹');
  await page.getByTestId('conflict-choice-draft-1').check();
  await page.getByTestId('button-confirm-conflict-resolution').click();

  await expect(page.getByTestId('test-editor-closed')).toBeVisible();
  await expect(page.getByTestId('test-saved-title')).toHaveText(draftTitle);
  await expect(page.getByTestId('test-saved-version')).toHaveText('11');
  expect(compareRequests).toBe(3);
  expect(submittedBodies).toHaveLength(3);
  expect(submittedBodies[2]?.expectedVersion).toBe(10);
  expect(submittedBodies[2]?.archive.version).toBe(10);
  expect(submittedBodies[2]?.archive.introduction).toBe('第二次衝突後伺服器更新的介紹');
  expect(submittedBodies[2]?.archive.memories[0]?.title).toBe(draftTitle);
});
