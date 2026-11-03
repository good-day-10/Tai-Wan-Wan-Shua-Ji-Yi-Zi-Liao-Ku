import { expect, test } from '@playwright/test';

test('signed-out management access dialog receives and contains keyboard focus', async ({ page }) => {
  await page.goto('/login-dialog-browser-harness.html');
  await expect(page.getByTestId('auth-state')).toHaveText('目前未登入');

  await page.getByTestId('button-open-login-modal').click();
  const dialog = page.getByRole('dialog', { name: '管理入口' });
  const closeButton = page.getByTestId('button-close-login-modal');
  const signInLink = page.getByTestId('link-login-from-modal');

  await expect(dialog).toBeVisible();
  await expect(closeButton).toBeFocused();

  await page.keyboard.press('Shift+Tab');
  await expect(signInLink).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(closeButton).toBeFocused();

  await closeButton.click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByTestId('button-open-login-modal')).toBeFocused();
});
