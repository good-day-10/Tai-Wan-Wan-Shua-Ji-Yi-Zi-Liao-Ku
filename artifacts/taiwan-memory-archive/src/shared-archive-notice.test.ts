import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('shared archive notice exposes loading, failure, and ready branches', async () => {
  const appSource = await readFile(new URL('./App.tsx', import.meta.url), 'utf8');
  const cssSource = await readFile(new URL('./index.css', import.meta.url), 'utf8');

  assert.match(appSource, /if \(status === 'ready'\) return null/);
  assert.match(appSource, /data-testid=\{`shared-archive-notice-\$\{status\}`\}/);
  assert.match(appSource, /正在同步共享資料/);
  assert.match(appSource, /共享資料暫時無法載入/);
  assert.match(appSource, /目前畫面可能是此裝置保存的舊內容，尚未確認為最新版本。/);
  assert.match(appSource, /data-testid="button-retry-shared-archive"/);
  assert.match(appSource, /setSharedStatus\('loading'\);\s*setLoadAttempt/);
  assert.match(cssSource, /\.shared-archive-retry\s*\{[^}]*min-height:\s*2\.75rem/);
  assert.match(cssSource, /@media \(max-width: 767px\) \{[\s\S]*?\.shared-archive-notice-inner\s*\{[^}]*flex-direction:\s*column/);
  assert.match(cssSource, /@media \(max-width: 767px\) \{[\s\S]*?\.shared-archive-retry\s*\{[^}]*width:\s*100%/);
});