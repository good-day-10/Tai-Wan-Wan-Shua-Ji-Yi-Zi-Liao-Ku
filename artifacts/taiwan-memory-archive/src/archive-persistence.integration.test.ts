import assert from 'node:assert/strict';
import test from 'node:test';
import { defaultSiteBlocks } from './site-content';

const apiBaseUrl = (process.env.ARCHIVE_TEST_BASE_URL ?? 'http://localhost:80/api').replace(/\/$/, '');
const shouldRun = process.env.RUN_ARCHIVE_INTEGRATION === '1';

async function requestArchive(options?: RequestInit): Promise<Record<string, unknown>> {
  const response = await fetch(`${apiBaseUrl}/archive`, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options?.headers ?? {}) },
  });
  const body = (await response.json()) as Record<string, unknown>;
  assert.equal(response.ok, true, JSON.stringify(body));
  return body;
}

test('saved page content is returned to separate visitor reads', { skip: !shouldRun }, async () => {
  const original = await requestArchive();
  const originalBlocks = (original.siteContent as { blocks?: unknown[] } | undefined)?.blocks;
  const startingBlocks = Array.isArray(originalBlocks) ? originalBlocks : defaultSiteBlocks;

  const updatedBlocks = (startingBlocks as Array<Record<string, unknown>>).map((block) => {
    const updates: Record<string, unknown> = {
      'header.title': { html: '跨工作階段標題' },
      'hero.title': { html: '<strong>新版主視覺</strong>', x: 18, y: -9, width: 68, align: 'center' },
      'index.searchPlaceholder': { html: '搜尋最新內容…' },
      'category.童玩': { html: '新版分類' },
      'card.readMore': { html: '查看新故事' },
      'memory.detailLabel': { html: '新版詳情' },
    };
    return { ...block, ...(updates[block.id as string] ?? {}) };
  });

  try {
    await requestArchive({
      method: 'PUT',
      body: JSON.stringify({
        editorPassword: '00000',
        archive: { ...original, siteContent: { blocks: updatedBlocks } },
      }),
    });

    const firstVisitorRead = await requestArchive({ cache: 'no-store' });
    const secondVisitorRead = await requestArchive({ cache: 'no-store' });
    for (const visitorRead of [firstVisitorRead, secondVisitorRead]) {
      const blocks = (visitorRead.siteContent as { blocks: Array<Record<string, unknown>> }).blocks;
      for (const [id, expected] of Object.entries({
        'header.title': '跨工作階段標題',
        'index.searchPlaceholder': '搜尋最新內容…',
        'category.童玩': '新版分類',
        'card.readMore': '查看新故事',
        'memory.detailLabel': '新版詳情',
      })) {
        assert.equal(blocks.find((block) => block.id === id)?.html, expected, `Expected ${id} to be shared`);
      }
      assert.deepEqual(blocks.find((block) => block.id === 'hero.title'), {
        ...defaultSiteBlocks.find((block) => block.id === 'hero.title'),
        html: '<strong>新版主視覺</strong>',
        x: 18,
        y: -9,
        width: 68,
        align: 'center',
      });
    }
  } finally {
    await requestArchive({
      method: 'PUT',
      body: JSON.stringify({
        editorPassword: '00000',
        archive: { ...original, ...(Array.isArray(originalBlocks) ? { siteContent: { blocks: originalBlocks } } : {}) },
      }),
    });
  }
});