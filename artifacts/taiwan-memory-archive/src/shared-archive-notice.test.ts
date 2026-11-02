import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('shared archive notice exposes loading, failure, retry, and online recovery', async () => {
  const componentSource = await readFile(new URL('./community-features.tsx', import.meta.url), 'utf8');

  assert.match(componentSource, /useState<'loading' \| 'error' \| 'ready'>\('loading'\)/);
  assert.match(componentSource, /data-testid=\{`shared-archive-notice-\$\{sharedStatus\}`\}/);
  assert.match(componentSource, /正在同步共享資料/);
  assert.match(componentSource, /共享資料暫時無法載入/);
  assert.match(componentSource, /目前畫面可能是此裝置保存的舊內容，尚未確認為最新版本。/);
  assert.match(componentSource, /data-testid="button-retry-shared-archive"/);
  assert.match(componentSource, /setSharedStatus\('loading'\);\s*void refresh\(\)/);
  assert.match(componentSource, /window\.addEventListener\('online', handleOnline\)/);
  assert.match(componentSource, /window\.removeEventListener\('online', handleOnline\)/);
  assert.match(componentSource, /window\.setInterval\(\(\) => void refresh\(\), 2500\)/);
});