import { expect, test } from '@playwright/test';

type ArchiveSnapshot = {
  version?: number;
  memories: Array<{ title: string; [key: string]: unknown }>;
  [key: string]: unknown;
};

type SaveBody = { archive: ArchiveSnapshot; expectedVersion?: number };

test('a version conflict preserves the draft until the user reloads the server version', async ({ page }) => {
  let latestArchive: ArchiveSnapshot | null = null;
  let reloadRequests = 0;
  const submittedBodies: SaveBody[] = [];

  await page.route('**/mock/archive', async (route) => {
    if (!latestArchive) {
      await route.fulfill({ status: 503, body: 'Archive test server is not initialized' });
      return;
    }

    if (route.request().method() === 'GET') {
      reloadRequests += 1;
      await route.fulfill({ json: latestArchive });
      return;
    }

    submittedBodies.push(route.request().postDataJSON() as SaveBody);
    if (submittedBodies.length === 1) {
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
  latestArchive.memories[0]!.title = '伺服器已更新的標題';

  const draftTitle = `衝突後保留草稿-${Date.now()}`;
  await page.locator('[data-testid^="button-edit-memory-"]').first().click();
  const titleInput = page.locator('[data-testid^="input-memory-title-"]').first();
  await titleInput.fill(draftTitle);
  await page.getByTestId('button-save-archive').click();

  await expect(page.getByTestId('save-error-editor')).toContainText('這些修改仍保留在編輯器中');
  await expect(titleInput).toHaveValue(draftTitle);
  await expect(page.getByTestId('button-save-archive')).toBeVisible();
  expect(submittedBodies).toHaveLength(1);
  expect(submittedBodies[0]?.archive.memories[0]?.title).toBe(draftTitle);
  expect(submittedBodies[0]?.expectedVersion).toBe(4);

  await page.getByTestId('button-reload-latest').click();
  await expect(page.getByTestId('test-editor-closed')).toBeVisible();
  await expect(page.getByTestId('test-saved-title')).toHaveText('伺服器已更新的標題');
  await expect(page.getByTestId('test-saved-version')).toHaveText('9');
  expect(reloadRequests).toBe(1);
  expect(submittedBodies).toHaveLength(1);
  expect(latestArchive?.memories[0]?.title).toBe('伺服器已更新的標題');

  await page.getByTestId('test-editor-entry').click();
  await page.locator('[data-testid^="button-edit-memory-"]').first().click();
  const reopenedTitleInput = page.locator('[data-testid^="input-memory-title-"]').first();
  await expect(reopenedTitleInput).toHaveValue('伺服器已更新的標題');
  const newDraftTitle = `採用最新版本後編輯-${Date.now()}`;
  await reopenedTitleInput.fill(newDraftTitle);
  await page.getByTestId('button-save-archive').click();

  await expect(page.getByTestId('test-editor-closed')).toBeVisible();
  await expect(page.getByTestId('test-saved-title')).toHaveText(newDraftTitle);
  expect(submittedBodies).toHaveLength(2);
  expect(submittedBodies[1]?.expectedVersion).toBe(9);
  expect(submittedBodies[1]?.archive.memories[0]?.title).toBe(newDraftTitle);
});
