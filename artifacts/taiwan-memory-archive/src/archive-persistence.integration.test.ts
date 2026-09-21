import assert from 'node:assert/strict';
import test from 'node:test';
import { defaultSiteBlocks } from './site-content';

const apiBaseUrl = (process.env.ARCHIVE_TEST_BASE_URL ?? 'http://localhost:80/api').replace(/\/$/, '');
const testSessionCookie = process.env.ARCHIVE_TEST_SESSION_COOKIE;
const shouldRun = process.env.RUN_ARCHIVE_INTEGRATION === '1' && Boolean(testSessionCookie);
const editorPassword = process.env.ARCHIVE_EDITOR_PASSWORD;
let editorCookie = testSessionCookie;

async function requestJson(
  path: string,
  options?: RequestInit,
  cookie: string | undefined = editorCookie,
): Promise<{ response: Response; body: Record<string, unknown> }> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(cookie ? { cookie } : {}),
      ...(options?.headers ?? {}),
    },
  });
  return { response, body: (await response.json()) as Record<string, unknown> };
}

async function requestArchive(
  options?: RequestInit,
  cookie: string | undefined = editorCookie,
): Promise<Record<string, unknown>> {
  const { response, body } = await requestJson('/archive', options, cookie);
  assert.equal(response.ok, true, JSON.stringify(body));
  return body;
}

async function requestArchiveWithStatus(
  options?: RequestInit,
  cookie: string | undefined = editorCookie,
): Promise<{ response: Response; body: Record<string, unknown> }> {
  return requestJson('/archive', options, cookie);
}

function getSetCookieHeaders(response: Response): string[] {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  if (typeof headers.getSetCookie === 'function') return headers.getSetCookie();
  const header = response.headers.get('set-cookie');
  return header ? [header] : [];
}

async function unlockForTest(): Promise<void> {
  assert.ok(editorPassword, 'ARCHIVE_EDITOR_PASSWORD is required for editor integration tests');
  assert.ok(testSessionCookie, 'ARCHIVE_TEST_SESSION_COOKIE is required for editor integration tests');

  const { response, body } = await requestJson(
    '/editor/unlock',
    {
      method: 'POST',
      body: JSON.stringify({ editorPassword }),
    },
    testSessionCookie,
  );
  assert.equal(response.ok, true, JSON.stringify(body));
  assert.deepEqual(body, { unlocked: true });

  const accessCookies = getSetCookieHeaders(response)
    .map((value) => value.split(';', 1)[0])
    .filter(Boolean);
  assert.ok(accessCookies.length > 0, 'Editor unlock should issue an access cookie');
  assert.match(getSetCookieHeaders(response).join('; '), /HttpOnly/i);
  editorCookie = `${testSessionCookie}; ${accessCookies.join('; ')}`;
}

test.before(async () => {
  if (shouldRun) await unlockForTest();
});

test('editor unlock rejects unauthenticated and incorrect credentials without revealing secrets', { skip: !shouldRun }, async () => {
  const unauthenticatedStatus = await requestJson('/editor/status', undefined, undefined);
  assert.deepEqual(unauthenticatedStatus.body, { authenticated: false, owner: false });

  const authenticatedStatus = await requestJson('/editor/status', undefined, testSessionCookie);
  assert.equal(authenticatedStatus.body.authenticated, true);

  const unauthenticated = await requestJson(
    '/editor/unlock',
    {
      method: 'POST',
      body: JSON.stringify({ editorPassword: 'wrong-editor-password' }),
    },
    undefined,
  );
  assert.equal(unauthenticated.response.status, 401, JSON.stringify(unauthenticated.body));
  assert.deepEqual(unauthenticated.body, { error: 'Authentication required' });

  const incorrect = await requestJson(
    '/editor/unlock',
    {
      method: 'POST',
      body: JSON.stringify({ editorPassword: 'wrong-editor-password' }),
    },
    testSessionCookie,
  );
  assert.equal(incorrect.response.status, 401, JSON.stringify(incorrect.body));
  assert.deepEqual(incorrect.body, { error: 'Invalid editor credentials' });
  assert.equal(JSON.stringify(incorrect.body).includes('wrong-editor-password'), false);
  if (editorPassword) assert.equal(JSON.stringify(incorrect.body).includes(editorPassword), false);
  assert.equal(getSetCookieHeaders(incorrect.response).length, 0);
});

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

    const firstVisitorRead = await requestArchive({ cache: 'no-store' }, undefined);
    const secondVisitorRead = await requestArchive({ cache: 'no-store' }, undefined);
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