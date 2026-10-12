import { expect, test } from '@playwright/test';

type ArchiveSnapshot = {
  version?: number;
  memories: Array<{ title: string; [key: string]: unknown }>;
  [key: string]: unknown;
};

test('a rejected save keeps the same draft available for retry', async ({ page }) => {
  let sharedArchive: ArchiveSnapshot | null = null;
  const submittedBodies: Array<{ archive: ArchiveSnapshot; expectedVersion?: number }> = [];

  await page.route('**/mock/archive', async (route) => {
    if (!sharedArchive) {
      await route.fulfill({ status: 503, body: 'Archive test server is not initialized' });
      return;
    }

    if (route.request().method() === 'GET') {
      await route.fulfill({ json: sharedArchive });
      return;
    }

    submittedBodies.push(route.request().postDataJSON() as { archive: ArchiveSnapshot; expectedVersion?: number });
    if (submittedBodies.length === 1) {
      await route.abort('failed');
      return;
    }

    const submittedArchive = submittedBodies.at(-1)!.archive;
    sharedArchive = {
      ...submittedArchive,
      version: (sharedArchive.version ?? 0) + 1,
    };
    await route.fulfill({ json: sharedArchive });
  });

  await page.goto('/save-retry-browser-harness.html');
  const initialArchiveJson = await page.getByTestId('test-shared-archive').getAttribute('data-archive');
  expect(initialArchiveJson).not.toBeNull();
  sharedArchive = JSON.parse(initialArchiveJson!) as ArchiveSnapshot;
  const initialSharedArchive = structuredClone(sharedArchive);
  const draftTitle = `網路中斷後重試-${Date.now()}`;

  await page.locator('[data-testid^="button-edit-memory-"]').first().click();
  const titleInput = page.locator('[data-testid^="input-memory-title-"]').first();
  await titleInput.fill(draftTitle);
  await page.getByTestId('button-save-archive').click();

  await expect(page.getByTestId('save-error-editor')).toContainText('這些修改仍保留在編輯器中');
  await expect(titleInput).toHaveValue(draftTitle);
  await expect(page.getByTestId('button-save-archive')).toBeVisible();
  await expect(page.getByTestId('test-editor-closed')).toHaveCount(0);
  expect(submittedBodies).toHaveLength(1);

  const sharedArchiveAfterFailure = await page.evaluate(async () => {
    const response = await fetch('/mock/archive');
    return response.json();
  }) as ArchiveSnapshot;
  expect(sharedArchiveAfterFailure).toEqual(initialSharedArchive);

  await page.getByTestId('button-save-archive').click();
  await expect(page.getByTestId('test-editor-closed')).toBeVisible();
  await expect(page.getByTestId('test-saved-title')).toHaveText(draftTitle);
  expect(submittedBodies).toHaveLength(2);
  expect(submittedBodies[1]).toEqual(submittedBodies[0]);

  const sharedArchiveAfterRetry = await page.evaluate(async () => {
    const response = await fetch('/mock/archive');
    return response.json();
  }) as ArchiveSnapshot;
  expect(sharedArchiveAfterRetry.memories[0]?.title).toBe(draftTitle);
});

test('save and leave can be retried from the unsaved changes prompt after a rejected request', async ({ page }) => {
  let sharedArchive: ArchiveSnapshot | null = null;
  const submittedBodies: Array<{ archive: ArchiveSnapshot; expectedVersion?: number }> = [];

  await page.route('**/mock/archive', async (route) => {
    if (!sharedArchive) {
      await route.fulfill({ status: 503, body: 'Archive test server is not initialized' });
      return;
    }

    if (route.request().method() === 'GET') {
      await route.fulfill({ json: sharedArchive });
      return;
    }

    submittedBodies.push(route.request().postDataJSON() as { archive: ArchiveSnapshot; expectedVersion?: number });
    if (submittedBodies.length === 1) {
      await route.abort('failed');
      return;
    }

    const submittedArchive = submittedBodies.at(-1)!.archive;
    sharedArchive = {
      ...submittedArchive,
      version: (sharedArchive.version ?? 0) + 1,
    };
    await route.fulfill({ json: sharedArchive });
  });

  await page.goto('/unsaved-dialog-browser-harness.html?mockSaveApi=1');
  const initialArchiveJson = await page.getByTestId('test-shared-archive').getAttribute('data-archive');
  expect(initialArchiveJson).not.toBeNull();
  sharedArchive = JSON.parse(initialArchiveJson!) as ArchiveSnapshot;
  const initialSharedArchive = structuredClone(sharedArchive);
  const draftTitle = `未保存提示網路中斷重試-${Date.now()}`;

  await page.locator('[data-testid^="button-edit-memory-"]').first().click();
  const titleInput = page.locator('[data-testid^="input-memory-title-"]').first();
  await titleInput.fill(draftTitle);
  await page.getByTestId('button-cancel-editor').click();

  const unsavedDialog = page.getByRole('dialog', { name: '還有尚未保存的修改' });
  const saveAndLeaveButton = page.getByTestId('button-save-before-close');
  await expect(unsavedDialog).toBeVisible();
  await saveAndLeaveButton.click();

  await expect(page.getByTestId('save-error-before-close')).toContainText('保存失敗');
  await expect(page.getByTestId('save-error-before-close')).toContainText('這些修改仍保留在編輯器中');
  await expect(unsavedDialog).toBeVisible();
  await expect(titleInput).toHaveValue(draftTitle);
  await expect(page.getByTestId('button-save-archive')).toBeVisible();
  await expect(page.getByTestId('test-editor-closed')).toHaveCount(0);
  expect(submittedBodies).toHaveLength(1);

  const sharedArchiveAfterFailure = await page.evaluate(async () => {
    const response = await fetch('/mock/archive');
    return response.json();
  }) as ArchiveSnapshot;
  expect(sharedArchiveAfterFailure).toEqual(initialSharedArchive);

  await expect(saveAndLeaveButton).toBeEnabled();
  await saveAndLeaveButton.click();
  await expect(page.getByTestId('test-editor-closed')).toBeVisible();
  await expect(page.getByTestId('test-saved-title')).toHaveText(draftTitle);
  expect(submittedBodies).toHaveLength(2);
  expect(submittedBodies[1]).toEqual(submittedBodies[0]);

  const sharedArchiveAfterRetry = await page.evaluate(async () => {
    const response = await fetch('/mock/archive');
    return response.json();
  }) as ArchiveSnapshot;
  expect(sharedArchiveAfterRetry.memories[0]?.title).toBe(draftTitle);
});
