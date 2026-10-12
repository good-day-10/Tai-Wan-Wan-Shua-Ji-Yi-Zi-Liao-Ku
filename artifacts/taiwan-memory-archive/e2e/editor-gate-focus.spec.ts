import { expect, test } from '@playwright/test';

for (const pageType of ['home', 'custom'] as const) {
  test(`${pageType} editor entry restores focus when the gate closes`, async ({ page }) => {
    await page.goto(`/editor-gate-browser-harness.html?view=${pageType}`);

    const entryButton = page.getByTestId('button-footer-editor');
    await entryButton.click();
    await expect(page.getByRole('dialog', { name: '編輯入口' })).toBeVisible();
    await page.getByTestId('button-close-gate').click();

    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(entryButton).toBeFocused();
  });
}

test('focus returns to the page home link if the editor entry was unmounted', async ({ page }) => {
  await page.goto('/editor-gate-browser-harness.html?view=custom');
  await page.getByTestId('button-footer-editor').click();
  await page.getByTestId('button-unmount-entry').evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.getByTestId('button-footer-editor')).toHaveCount(0);
  await page.getByTestId('button-close-gate').click();

  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByTestId('link-home')).toBeFocused();
});
