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
