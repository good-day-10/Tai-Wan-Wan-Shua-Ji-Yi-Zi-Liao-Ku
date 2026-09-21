import assert from 'node:assert/strict';
import test from 'node:test';
import { defaultSiteBlocks } from './site-content';

const apiBaseUrl = (process.env.ARCHIVE_TEST_BASE_URL ?? 'http://localhost:80/api').replace(/\/$/, '');
const testSessionCookie = process.env.ARCHIVE_TEST_SESSION_COOKIE;
const shouldRun = process.env.RUN_ARCHIVE_INTEGRATION === '1' && Boolean(testSessionCookie);

async function requestArchive(options?: RequestInit): Promise<Record<string, unknown>> {
  const response = await fetch(`${apiBaseUrl}/archive`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(testSessionCookie ? { cookie: testSessionCookie } : {}),
      ...(options?.headers ?? {}),
    },
  });
  const body = (await response.json()) as Record<string, unknown>;
  assert.equal(response.ok, true, JSON.stringify(body));
  return body;
}

async function requestArchiveWithStatus(options?: RequestInit): Promise<{ response: Response; body: Record<string, unknown> }> {
  const response = await fetch(`${apiBaseUrl}/archive`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(testSessionCookie ? { cookie: testSessionCookie } : {}),
      ...(options?.headers ?? {}),
    },
  });
  return { response, body: (await response.json()) as Record<string, unknown> };
}

test('saved page content is returned to separate visitor reads', { skip: !shouldRun }, async () => {
  const original = await requestArchive();
  const originalSiteContent = (original.siteContent ?? {}) as { blocks?: unknown[]; pages?: unknown[] };
  const originalBlocks = originalSiteContent.blocks;
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
        archive: { ...original, siteContent: { blocks: updatedBlocks } },
        expectedVersion: original.version,
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
    const current = await requestArchive({ cache: 'no-store' });
    await requestArchive({
      method: 'PUT',
      body: JSON.stringify({
        archive: {
          ...original,
          ...(original.siteContent === undefined ? {} : { siteContent: originalSiteContent }),
        },
        expectedVersion: current.version,
      }),
    });
  }
});

test('saved custom pages remain available to visitors and disappear after deletion', { skip: !shouldRun }, async () => {
  const original = await requestArchive();
  const originalSiteContent = (original.siteContent ?? {}) as {
    blocks?: unknown[];
    pages?: Array<Record<string, unknown>>;
  };
  const originalBlocks = Array.isArray(originalSiteContent.blocks) ? originalSiteContent.blocks : defaultSiteBlocks;
  const originalPages = Array.isArray(originalSiteContent.pages) ? originalSiteContent.pages : [];
  const uniqueSuffix = Date.now();
  const pageId = `integration-page-${uniqueSuffix}`;
  const pageSlug = `integration-page-${uniqueSuffix}`;
  const page = {
    id: pageId,
    title: '我們的理念',
    slug: pageSlug,
    backgroundImage: 'data:image/png;base64,ZmFrZS1iYWNrZ3JvdW5k',
    blocks: [
      {
        id: `${pageId}.body`,
        label: '頁面內容',
        section: '頁面內容',
        html: '<p><strong>一起保存遊戲記憶</strong>，讓故事被看見。</p>',
        x: 18,
        y: -11,
        width: 72,
        align: 'center',
      },
    ],
  };
  const archiveWithPage = {
    ...original,
    siteContent: {
      blocks: originalBlocks,
      pages: [...originalPages, page],
    },
  };

  try {
    const savedWithPage = await requestArchive({
      method: 'PUT',
      body: JSON.stringify({ archive: archiveWithPage, expectedVersion: original.version }),
    });

    const visitorReads = await Promise.all([
      requestArchive({ cache: 'no-store' }),
      requestArchive({ cache: 'no-store' }),
    ]);
    for (const visitorRead of visitorReads) {
      const pages = ((visitorRead.siteContent as { pages?: Array<Record<string, unknown>> } | undefined)?.pages ?? []);
      assert.deepEqual(pages.find((savedPage) => savedPage.id === pageId), page);
    }

    await requestArchive({
      method: 'PUT',
      body: JSON.stringify({
        archive: {
          ...original,
          siteContent: {
            blocks: originalBlocks,
            pages: originalPages,
          },
        },
        expectedVersion: savedWithPage.version,
      }),
    });
    const afterDeletion = await requestArchive({ cache: 'no-store' });
    const pagesAfterDeletion = ((afterDeletion.siteContent as { pages?: Array<Record<string, unknown>> } | undefined)?.pages ?? []);
    assert.equal(pagesAfterDeletion.some((savedPage) => savedPage.id === pageId || savedPage.slug === pageSlug), false);
  } finally {
    const current = await requestArchive({ cache: 'no-store' });
    await requestArchive({
      method: 'PUT',
      body: JSON.stringify({
        archive: {
          ...original,
          ...(original.siteContent === undefined ? {} : { siteContent: originalSiteContent }),
        },
        expectedVersion: current.version,
      }),
    });
  }
});

test('stale archive versions are rejected without removing another editor page', { skip: !shouldRun }, async () => {
  const original = await requestArchive();
  const originalSiteContent = (original.siteContent ?? {}) as { blocks?: unknown[]; pages?: Array<Record<string, unknown>> };
  const originalBlocks = Array.isArray(originalSiteContent.blocks) ? originalSiteContent.blocks : defaultSiteBlocks;
  const originalPages = Array.isArray(originalSiteContent.pages) ? originalSiteContent.pages : [];
  const uniqueSuffix = Date.now();
  const currentPage = {
    id: `concurrent-page-${uniqueSuffix}`,
    title: '另一位編輯者的新頁面',
    slug: `concurrent-page-${uniqueSuffix}`,
    blocks: [],
  };
  const currentArchive = {
    ...original,
    siteContent: { blocks: originalBlocks, pages: [...originalPages, currentPage] },
  };

  try {
    const firstSave = await requestArchiveWithStatus({
      method: 'PUT',
      body: JSON.stringify({ archive: currentArchive, expectedVersion: original.version }),
    });
    assert.equal(firstSave.response.ok, true, JSON.stringify(firstSave.body));
    assert.equal(typeof firstSave.body.version, 'string');

    const staleSave = await requestArchiveWithStatus({
      method: 'PUT',
      body: JSON.stringify({ archive: original, expectedVersion: original.version }),
    });
    assert.equal(staleSave.response.status, 409, JSON.stringify(staleSave.body));

    const visitorRead = await requestArchive({ cache: 'no-store' });
    const pages = ((visitorRead.siteContent as { pages?: Array<Record<string, unknown>> } | undefined)?.pages ?? []);
    assert.deepEqual(pages.find((page) => page.id === currentPage.id), currentPage);
  } finally {
    const current = await requestArchive({ cache: 'no-store' });
    await requestArchive({
      method: 'PUT',
      body: JSON.stringify({
        archive: {
          ...original,
          ...(original.siteContent === undefined ? {} : { siteContent: originalSiteContent }),
        },
        expectedVersion: current.version,
      }),
    });
  }
});