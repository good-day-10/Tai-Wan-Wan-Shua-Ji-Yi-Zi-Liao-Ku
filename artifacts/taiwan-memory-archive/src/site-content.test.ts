import assert from 'node:assert/strict';
import test from 'node:test';
import { createDefaultSiteContent, defaultSiteBlocks, normalizeSiteContent } from './site-content';

test('legacy archive data without siteContent receives every default page block', () => {
  const normalized = normalizeSiteContent();

  assert.deepEqual(normalized, createDefaultSiteContent());
  assert.equal(normalized.blocks.length, defaultSiteBlocks.length);
  assert.equal(normalized.blocks.find((block) => block.id === 'header.title')?.html, '台灣玩耍記憶資料庫');
  assert.equal(normalized.blocks.find((block) => block.id === 'card.readMore')?.html, '閱讀故事');
  assert.equal(normalized.blocks.find((block) => block.id === 'memory.detailLabel')?.html, '故事詳頁');
});

test('saved page text and layout values survive normalization for a new visitor', () => {
  const normalized = normalizeSiteContent({
    blocks: [
      {
        ...defaultSiteBlocks.find((block) => block.id === 'hero.title')!,
        html: '<strong>最新主視覺</strong>',
        x: 24,
        y: -12,
        width: 72,
        align: 'center',
      },
      {
        ...defaultSiteBlocks.find((block) => block.id === 'category.童玩')!,
        html: '新版分類',
      },
      {
        ...defaultSiteBlocks.find((block) => block.id === 'memory.detailLabel')!,
        html: '新版詳情',
        align: 'right',
      },
    ],
  });

  assert.deepEqual(normalized.blocks.find((block) => block.id === 'hero.title'), {
    ...defaultSiteBlocks.find((block) => block.id === 'hero.title'),
    html: '<strong>最新主視覺</strong>',
    x: 24,
    y: -12,
    width: 72,
    align: 'center',
  });
  assert.equal(normalized.blocks.find((block) => block.id === 'category.童玩')?.html, '新版分類');
  assert.equal(normalized.blocks.find((block) => block.id === 'memory.detailLabel')?.align, 'right');
  assert.equal(normalized.blocks.find((block) => block.id === 'header.title')?.html, '台灣玩耍記憶資料庫');
});