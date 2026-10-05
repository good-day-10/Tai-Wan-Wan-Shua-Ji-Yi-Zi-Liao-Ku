import assert from 'node:assert/strict';
import test from 'node:test';
import { findArchiveConflicts, mergeArchiveConflictChoices, type ArchiveConflictChoice } from './archive-conflicts';

test('archive comparison keeps the latest version and merges independent choices by identified item', () => {
  const server = {
    version: 10,
    introduction: '伺服器介紹',
    memories: [
      { id: 'one', title: '伺服器標題', location: '伺服器地點' },
      { id: 'server-only', title: '伺服器新增' },
    ],
    siteContent: {
      blocks: [{ id: 'hero.title', label: '首頁標題', html: '伺服器首頁文字' }],
      pages: [],
    },
  };
  const draft = {
    version: 4,
    introduction: '草稿介紹',
    memories: [
      { id: 'one', title: '草稿標題', location: '原本地點' },
      { id: 'draft-only', title: '草稿新增' },
    ],
    siteContent: {
      blocks: [{ id: 'hero.title', label: '首頁標題', html: '草稿首頁文字' }],
      pages: [],
    },
  };

  const conflicts = findArchiveConflicts(server, draft);
  assert.ok(conflicts.some((conflict) => conflict.label === '資料庫介紹'));
  assert.ok(conflicts.some((conflict) => conflict.label === '記憶「伺服器標題」的標題'));
  assert.ok(conflicts.some((conflict) => conflict.label === '記憶「伺服器標題」的地點'));
  assert.ok(conflicts.some((conflict) => conflict.label === '首頁「首頁標題」的文字內容'));
  assert.ok(conflicts.some((conflict) => conflict.label === '記憶「伺服器新增」'));
  assert.ok(conflicts.some((conflict) => conflict.label === '記憶「草稿新增」'));

  const choices: Record<string, ArchiveConflictChoice> = Object.fromEntries(
    conflicts.map((conflict) => [conflict.id, 'server']),
  );
  choices[conflicts.find((conflict) => conflict.label === '記憶「伺服器標題」的標題')!.id] = 'draft';
  choices[conflicts.find((conflict) => conflict.label === '記憶「草稿新增」')!.id] = 'draft';
  choices[conflicts.find((conflict) => conflict.label === '首頁「首頁標題」的文字內容')!.id] = 'draft';

  const merged = mergeArchiveConflictChoices(server, conflicts, choices);
  assert.equal(merged.version, 10);
  assert.equal(merged.introduction, '伺服器介紹');
  assert.deepEqual(merged.memories, [
    { id: 'one', title: '草稿標題', location: '伺服器地點' },
    { id: 'server-only', title: '伺服器新增' },
    { id: 'draft-only', title: '草稿新增' },
  ]);
  assert.equal(merged.siteContent.blocks[0]?.html, '草稿首頁文字');
});

test('identified list order and deletions are independently selectable', () => {
  const server = {
    version: 7,
    memories: [{ id: 'a', title: 'A' }, { id: 'b', title: 'B' }, { id: 'server-only', title: '保留項目' }],
  };
  const draft = {
    version: 2,
    memories: [{ id: 'b', title: 'B' }, { id: 'a', title: 'A' }],
  };
  const conflicts = findArchiveConflicts(server, draft);
  const orderConflict = conflicts.find((conflict) => conflict.label === '記憶清單順序');
  const deletionConflict = conflicts.find((conflict) => conflict.label === '記憶「保留項目」');
  assert.ok(orderConflict);
  assert.ok(deletionConflict);

  const merged = mergeArchiveConflictChoices(server, conflicts, {
    [orderConflict.id]: 'draft',
    [deletionConflict.id]: 'draft',
  });
  assert.deepEqual(merged.memories, [{ id: 'b', title: 'B' }, { id: 'a', title: 'A' }]);
  assert.equal(merged.version, 7);
});
