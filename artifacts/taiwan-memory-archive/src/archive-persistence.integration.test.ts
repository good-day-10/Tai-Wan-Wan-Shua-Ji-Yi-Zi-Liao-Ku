import assert from 'node:assert/strict';
import test from 'node:test';
import { createClerkClient } from '@clerk/backend';
import { defaultSiteBlocks } from './site-content';

const apiBaseUrl = (process.env.ARCHIVE_TEST_BASE_URL ?? 'http://localhost:80/api').replace(/\/$/, '');
const configuredTestSessionCookie = process.env.ARCHIVE_TEST_SESSION_COOKIE?.trim();
const clerkSecretKey = process.env.CLERK_SECRET_KEY?.trim();
let testUserId = process.env.ARCHIVE_TEST_USER_ID?.trim();
const testUserEmail = process.env.ARCHIVE_TEST_USER_EMAIL?.trim() || 'archive-integration-test@example.com';
const shouldRun = process.env.RUN_ARCHIVE_INTEGRATION === '1'
  && Boolean(configuredTestSessionCookie || clerkSecretKey);
const canCreateAdditionalTestSession = Boolean(clerkSecretKey && (testUserId || !configuredTestSessionCookie));
const editorPassword = process.env.ARCHIVE_EDITOR_PASSWORD;
let testSessionCookie = configuredTestSessionCookie;
let editorCookie = testSessionCookie;
let editorAccessCookie: string | undefined;
let testSessionAuthorization: string | undefined;
let testSessionId: string | undefined;

async function assertSafeClerkTestEnvironment(
  secretKey: string | undefined,
  fetcher: typeof fetch = fetch,
): Promise<void> {
  if (secretKey && !secretKey.startsWith('sk_test_')) {
    throw new Error('Archive integration tests are blocked: CLERK_SECRET_KEY must belong to a Clerk test instance.');
  }

  let response: Response;
  try {
    response = await fetcher(`${apiBaseUrl}/archive/integration-test-safety`, {
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    throw new Error('Archive integration tests are blocked: unable to verify that the API server uses a Clerk test instance.');
  }

  if (!response.ok) {
    throw new Error('Archive integration tests are blocked: the API server must use Clerk test-instance keys.');
  }
}

async function requestJson(
  path: string,
  options?: RequestInit,
  cookie: string | null | undefined = editorCookie,
  authorization?: string | null,
): Promise<{ response: Response; body: Record<string, unknown> }> {
  const requestCookie = cookie ?? undefined;
  const requestAuthorization = authorization === undefined
    ? (requestCookie ? testSessionAuthorization : undefined)
    : authorization ?? undefined;
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(requestCookie ? { cookie: requestCookie } : {}),
      ...(requestAuthorization ? { authorization: requestAuthorization } : {}),
      ...(options?.headers ?? {}),
    },
  });
  return { response, body: (await response.json()) as Record<string, unknown> };
}

async function requestArchive(
  options?: RequestInit,
  cookie: string | null | undefined = editorCookie,
): Promise<Record<string, unknown>> {
  const { response, body } = await requestJson('/archive', options, cookie);
  assert.equal(response.ok, true, JSON.stringify(body));
  return body;
}

async function requestArchiveWithStatus(
  options?: RequestInit,
  cookie: string | null | undefined = editorCookie,
): Promise<{ response: Response; body: Record<string, unknown> }> {
  return requestJson('/archive', options, cookie);
}

function getSetCookieHeaders(response: Response): string[] {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  if (typeof headers.getSetCookie === 'function') return headers.getSetCookie();
  const header = response.headers.get('set-cookie');
  return header ? [header] : [];
}

async function getOrCreateTestSessionCookie(): Promise<string> {
  if (configuredTestSessionCookie) return configuredTestSessionCookie;
  assert.ok(clerkSecretKey, 'CLERK_SECRET_KEY is required when ARCHIVE_TEST_SESSION_COOKIE is not set');

  const clerk = createClerkClient({ secretKey: clerkSecretKey });
  let userId = testUserId;
  if (!userId) {
    const matchingUsers = await clerk.users.getUserList({
      emailAddress: [testUserEmail],
      limit: 1,
    });
    userId = matchingUsers.data[0]?.id;
    if (!userId) {
      const user = await clerk.users.createUser({
        emailAddress: [testUserEmail],
        skipPasswordRequirement: true,
      });
      userId = user.id;
    }
  }
  testUserId = userId;

  const session = await clerk.sessions.createSession({ userId });
  testSessionId = session.id;
  const token = await clerk.sessions.getToken(session.id);
  assert.ok(token.jwt, 'Clerk did not return a test session token');
  testSessionAuthorization = `Bearer ${token.jwt}`;
  return `__session=${token.jwt}`;
}

async function unlockForTest(): Promise<void> {
  assert.ok(editorPassword, 'ARCHIVE_EDITOR_PASSWORD is required for editor integration tests');
  assert.ok(testSessionCookie, 'A Clerk test session is required for editor integration tests');

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
  assert.ok(getSetCookieHeaders(response).some((value) => /HttpOnly/i.test(value)));
  editorAccessCookie = accessCookies[0];
  editorCookie = `${testSessionCookie}; ${accessCookies.join('; ')}`;
}

test('Clerk integration environment guard rejects production credentials without exposing them', async () => {
  let apiWasChecked = false;
  const liveSecretKey = 'sk_live_do_not_print';
  await assert.rejects(
    () => assertSafeClerkTestEnvironment(liveSecretKey, async () => {
      apiWasChecked = true;
      return new Response(null, { status: 204 });
    }),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /must belong to a Clerk test instance/);
      assert.equal(error.message.includes(liveSecretKey), false);
      return true;
    },
  );
  assert.equal(apiWasChecked, false);
});

test('Clerk integration environment guard rejects an API server that is not configured for test keys', async () => {
  const unsafeResponseBody = 'sk_live_sensitive_value';
  await assert.rejects(
    () => assertSafeClerkTestEnvironment('sk_test_safe_for_tests', async () => (
      new Response(unsafeResponseBody, { status: 503 })
    )),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /API server must use Clerk test-instance keys/);
      assert.equal(error.message.includes(unsafeResponseBody), false);
      return true;
    },
  );
});

test('Clerk integration environment guard permits a configured test session cookie with test API keys', async () => {
  let checkedUrl = '';
  await assert.doesNotReject(() => assertSafeClerkTestEnvironment(undefined, async (input) => {
    checkedUrl = String(input);
    return new Response(null, { status: 204 });
  }));
  assert.match(checkedUrl, /\/archive\/integration-test-safety$/);
});

test.before(async () => {
  if (!shouldRun) return;
  await assertSafeClerkTestEnvironment(clerkSecretKey);
  testSessionCookie = await getOrCreateTestSessionCookie();
  editorCookie = testSessionCookie;
  await unlockForTest();
});

test.after(async () => {
  if (!testSessionId || !clerkSecretKey) return;
  const clerk = createClerkClient({ secretKey: clerkSecretKey });
  await clerk.sessions.revokeSession(testSessionId);
});

test('editor unlock rejects unauthenticated and incorrect credentials without revealing secrets', { skip: !shouldRun }, async () => {
  const unauthenticatedStatus = await requestJson('/editor/status', undefined, null);
  assert.deepEqual(unauthenticatedStatus.body, { authenticated: false, owner: false });

  const authenticatedStatus = await requestJson('/editor/status', undefined, testSessionCookie);
  assert.equal(authenticatedStatus.body.authenticated, true);

  const unauthenticated = await requestJson(
    '/editor/unlock',
    {
      method: 'POST',
      body: JSON.stringify({ editorPassword: 'wrong-editor-password' }),
    },
    null,
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

test('an old editor cookie cannot save after sign-out or a Clerk session change', { skip: !shouldRun }, async () => {
  assert.ok(editorAccessCookie);
  const original = await requestArchive({ cache: 'no-store' }, undefined);
  const saveOptions = {
    method: 'PUT',
    body: JSON.stringify({
      archive: original,
      expectedVersion: original.version,
    }),
  };

  const signedOutSave = await requestJson('/archive', saveOptions, editorAccessCookie, null);
  assert.equal(signedOutSave.response.status, 401);
  assert.deepEqual(signedOutSave.body, { error: 'Authentication required' });

  const publicRead = await requestArchive({ cache: 'no-store' }, undefined);
  assert.equal(publicRead.version, original.version);

  if (!canCreateAdditionalTestSession || !testUserId || !clerkSecretKey) return;

  const clerk = createClerkClient({ secretKey: clerkSecretKey });
  const nextSession = await clerk.sessions.createSession({ userId: testUserId });
  try {
    const token = await clerk.sessions.getToken(nextSession.id);
    assert.ok(token.jwt);

    const sessionChangedSave = await requestJson(
      '/archive',
      saveOptions,
      editorAccessCookie,
      `Bearer ${token.jwt}`,
    );
    assert.equal(sessionChangedSave.response.status, 401);
    assert.deepEqual(sessionChangedSave.body, { error: 'Editor access required' });
  } finally {
    await clerk.sessions.revokeSession(nextSession.id);
  }
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
    assert.equal(typeof firstSave.body.version, 'number');

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

test('archive revisions are unique and increase across back-to-back saves', { skip: !shouldRun }, async () => {
  const original = await requestArchive();
  assert.equal(typeof original.version, 'number');
  let expectedVersion = original.version as number;

  try {
    for (let index = 0; index < 3; index += 1) {
      const save = await requestArchiveWithStatus({
        method: 'PUT',
        body: JSON.stringify({
          archive: { ...original, introduction: `連續保存測試 ${index}` },
          expectedVersion,
        }),
      });
      assert.equal(save.response.status, 200, JSON.stringify(save.body));
      assert.equal(typeof save.body.version, 'number');
      assert.equal(save.body.version, expectedVersion + 1);
      expectedVersion = save.body.version as number;
    }
  } finally {
    const current = await requestArchive({ cache: 'no-store' });
    await requestArchive({
      method: 'PUT',
      body: JSON.stringify({
        archive: original,
        expectedVersion: current.version,
      }),
    });
  }
});

test('concurrent saves with one expected revision have one winner and one conflict', { skip: !shouldRun }, async () => {
  const original = await requestArchive();
  assert.equal(typeof original.version, 'number');
  const uniqueSuffix = Date.now();
  const archives = [
    {
      ...original,
      introduction: `並發保存測試 A ${uniqueSuffix}`,
    },
    {
      ...original,
      introduction: `並發保存測試 B ${uniqueSuffix}`,
    },
  ];

  try {
    const results = await Promise.all(
      archives.map((archive) => requestArchiveWithStatus({
        method: 'PUT',
        body: JSON.stringify({ archive, expectedVersion: original.version }),
      })),
    );
    assert.equal(results.filter(({ response }) => response.status === 200).length, 1);
    assert.equal(results.filter(({ response }) => response.status === 409).length, 1);
    const winner = results.find(({ response }) => response.status === 200);
    assert.ok(winner);
    assert.equal(typeof winner.body.version, 'number');
    assert.equal(winner.body.version, (original.version as number) + 1);
  } finally {
    const current = await requestArchive({ cache: 'no-store' });
    await requestArchive({
      method: 'PUT',
      body: JSON.stringify({
        archive: original,
        expectedVersion: current.version,
      }),
    });
  }
});

test('a failed save can retry the same draft after refreshing its version', { skip: !shouldRun }, async () => {
  const original = await requestArchive();
  const originalSiteContent = (original.siteContent ?? {}) as { blocks?: unknown[]; pages?: Array<Record<string, unknown>> };
  const originalBlocks = Array.isArray(originalSiteContent.blocks) ? originalSiteContent.blocks : defaultSiteBlocks;
  const originalPages = Array.isArray(originalSiteContent.pages) ? originalSiteContent.pages : [];
  const uniqueSuffix = Date.now();
  const firstPage = {
    id: `retry-current-page-${uniqueSuffix}`,
    title: '先被其他編輯者保存的頁面',
    slug: `retry-current-page-${uniqueSuffix}`,
    blocks: [],
  };
  const retryPage = {
    id: `retry-draft-page-${uniqueSuffix}`,
    title: '失敗後仍要保留的草稿',
    slug: `retry-draft-page-${uniqueSuffix}`,
    blocks: [],
  };
  const currentArchive = {
    ...original,
    siteContent: { blocks: originalBlocks, pages: [...originalPages, firstPage] },
  };
  const draftArchive = {
    ...original,
    siteContent: { blocks: originalBlocks, pages: [...originalPages, retryPage] },
  };

  try {
    const firstSave = await requestArchiveWithStatus({
      method: 'PUT',
      body: JSON.stringify({ archive: currentArchive, expectedVersion: original.version }),
    });
    assert.equal(firstSave.response.ok, true, JSON.stringify(firstSave.body));

    const failedSave = await requestArchiveWithStatus({
      method: 'PUT',
      body: JSON.stringify({ archive: draftArchive, expectedVersion: original.version }),
    });
    assert.equal(failedSave.response.status, 409, JSON.stringify(failedSave.body));

    const latest = await requestArchive({ cache: 'no-store' });
    const retriedArchive = {
      ...draftArchive,
      siteContent: { blocks: originalBlocks, pages: [...originalPages, firstPage, retryPage] },
    };
    const retried = await requestArchiveWithStatus({
      method: 'PUT',
      body: JSON.stringify({ archive: retriedArchive, expectedVersion: latest.version }),
    });
    assert.equal(retried.response.ok, true, JSON.stringify(retried.body));

    const visitorRead = await requestArchive({ cache: 'no-store' });
    const pages = ((visitorRead.siteContent as { pages?: Array<Record<string, unknown>> } | undefined)?.pages ?? []);
    assert.deepEqual(pages.find((page) => page.id === firstPage.id), firstPage);
    assert.deepEqual(pages.find((page) => page.id === retryPage.id), retryPage);
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