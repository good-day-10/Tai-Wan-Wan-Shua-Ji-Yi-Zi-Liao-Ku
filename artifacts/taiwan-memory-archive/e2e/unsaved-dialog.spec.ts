import { expect, test, type Locator, type Page } from '@playwright/test';

const viewportScenarios = [
  { name: 'desktop', width: 1440, height: 900, input: 'mouse' },
  { name: 'tablet', width: 820, height: 1180, input: 'keyboard' },
  { name: 'mobile', width: 375, height: 667, input: 'touch' },
] as const;

type InputMethod = (typeof viewportScenarios)[number]['input'];

const closeScenarios = [
  { name: 'save changes', closeButton: 'button-cancel-editor', choiceButton: 'button-save-before-close', outcome: 'saved' },
  { name: 'discard after cancel', closeButton: 'button-cancel-editor', choiceButton: 'button-discard-before-close', outcome: 'cancelled' },
  { name: 'discard after locking', closeButton: 'button-lock-editor', choiceButton: 'button-discard-before-close', outcome: 'locked' },
  { name: 'continue editing', closeButton: 'button-cancel-editor', choiceButton: 'button-continue-editing', outcome: null },
  { name: 'continue editing after locking', closeButton: 'button-lock-editor', choiceButton: 'button-continue-editing', outcome: null },
] as const;

async function activate(page: Page, locator: Locator, input: InputMethod) {
  await locator.scrollIntoViewIfNeeded();
  if (input === 'mouse') {
    await locator.click();
    return;
  }
  if (input === 'keyboard') {
    await locator.focus();
    await expect(locator).toBeFocused();
    await page.keyboard.press('Enter');
    return;
  }

  const bounds = await locator.boundingBox();
  expect(bounds, 'touch target must have visible screen coordinates').not.toBeNull();
  if (!bounds) throw new Error('Touch target is not visible');
  await page.touchscreen.tap(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
}

async function expectDialogActionsReachable(page: Page, viewportHeight: number) {
  const dialog = page.getByRole('dialog', { name: '還有尚未保存的修改' });
  await expect(dialog).toBeVisible();
  await expect(page.getByTestId('button-continue-editing')).toBeFocused();

  for (const testId of [
    'button-save-before-close',
    'button-discard-before-close',
    'button-continue-editing',
  ]) {
    const button = page.getByTestId(testId);
    await expect(button).toBeVisible();
    await button.scrollIntoViewIfNeeded();
    const bounds = await button.boundingBox();
    expect(bounds, `${testId} must have visible screen coordinates`).not.toBeNull();
    if (!bounds) throw new Error(`${testId} is not visible`);
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewportHeight);
  }
}

for (const viewport of viewportScenarios) {
  for (const scenario of closeScenarios) {
    test(`${viewport.name}: ${scenario.name} works in the unsaved changes prompt`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        hasTouch: viewport.input === 'touch',
        isMobile: viewport.input === 'touch',
      });
      const page = await context.newPage();
      try {
        await page.goto('/unsaved-dialog-browser-harness.html');
        const memoryButton = page.locator('[data-testid^="button-edit-memory-"]').first();
        await activate(page, memoryButton, viewport.input);

        const titleInput = page.locator('[data-testid^="input-memory-title-"]').first();
        await expect(titleInput).toBeVisible();
        const originalTitle = await titleInput.inputValue();
        const draftTitle = `瀏覽器草稿-${viewport.name}-${scenario.name}`;
        await titleInput.fill(draftTitle);

        await activate(page, page.getByTestId(scenario.closeButton), viewport.input);
        await expectDialogActionsReachable(page, viewport.height);
        await activate(page, page.getByTestId(scenario.choiceButton), viewport.input);

        if (scenario.outcome) {
          await expect(page.getByTestId('test-editor-closed')).toBeVisible();
          await expect(page.getByTestId('test-close-outcome')).toHaveText(scenario.outcome);
          await expect(page.getByTestId('test-saved-title')).toHaveText(
            scenario.outcome === 'saved' ? draftTitle : originalTitle,
          );
          await expect(page.getByTestId('test-editor-entry')).toBeFocused();
          return;
        }

        await expect(page.getByRole('dialog', { name: '還有尚未保存的修改' })).toHaveCount(0);
        await expect(page.getByTestId(scenario.closeButton)).toBeFocused();
        await expect(titleInput).toHaveValue(draftTitle);
        await expect(page.getByTestId('test-editor-closed')).toHaveCount(0);
        await expect(page.getByTestId(scenario.closeButton)).toBeVisible();
        await activate(page, page.getByTestId(scenario.closeButton), viewport.input);
        await expectDialogActionsReachable(page, viewport.height);
        await expect(titleInput).toHaveValue(draftTitle);
      } finally {
        await context.close();
      }
    });
  }
}

test('keyboard focus stays inside the unsaved changes prompt', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/unsaved-dialog-browser-harness.html');
  await page.locator('[data-testid^="button-edit-memory-"]').first().click();
  await page.locator('[data-testid^="input-memory-title-"]').first().fill('鍵盤焦點測試');
  await page.getByTestId('button-cancel-editor').click();
  await expectDialogActionsReachable(page, 900);

  await page.keyboard.press('Tab');
  await expect(page.getByTestId('button-save-before-close')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByTestId('button-continue-editing')).toBeFocused();
});

for (const closeButton of ['button-cancel-editor', 'button-lock-editor'] as const) {
  test(`Escape continues editing after ${closeButton === 'button-cancel-editor' ? 'cancel' : 'locking'} without losing the draft`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/unsaved-dialog-browser-harness.html');
    await page.locator('[data-testid^="button-edit-memory-"]').first().click();

    const titleInput = page.locator('[data-testid^="input-memory-title-"]').first();
    const draftTitle = `Escape 草稿-${closeButton}`;
    await titleInput.fill(draftTitle);
    await page.getByTestId(closeButton).click();
    await expectDialogActionsReachable(page, 900);

    await page.keyboard.press('Escape');

    await expect(page.getByRole('dialog', { name: '還有尚未保存的修改' })).toHaveCount(0);
    await expect(page.getByTestId(closeButton)).toBeFocused();
    await expect(titleInput).toHaveValue(draftTitle);
    await expect(page.getByTestId('test-editor-closed')).toHaveCount(0);

    await page.getByTestId(closeButton).click();
    await expectDialogActionsReachable(page, 900);
    await expect(titleInput).toHaveValue(draftTitle);
  });
}
