import assert from 'node:assert/strict';
import test from 'node:test';
import { createDefaultSiteContent, defaultSiteBlocks, defaultWonderScoutsContent, normalizeSiteContent } from './site-content';

test('legacy archive data without siteContent receives every default page block', () => {
  const normalized = normalizeSiteContent();

  assert.deepEqual(normalized, createDefaultSiteContent());
  assert.equal(normalized.blocks.length, defaultSiteBlocks.length);
  assert.equal(normalized.blocks.find((block) => block.id === 'header.title')?.html, '少年導覽隊');
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
  assert.equal(normalized.blocks.find((block) => block.id === 'header.title')?.html, '少年導覽隊');
});

test('legacy shared content receives the default videos, feedback, cooperation, join and donation data', () => {
  const normalized = normalizeSiteContent({ blocks: [] });

  assert.deepEqual(normalized.wonderScouts, defaultWonderScoutsContent);
  assert.equal(normalized.wonderScouts.videos[0]?.youtubeId, '025HOvHCdP4');
  assert.equal(normalized.wonderScouts.feedback.length, 6);
  assert.equal(normalized.wonderScouts.services.length, 3);
  assert.equal(normalized.wonderScouts.joinSteps.length, 3);
  assert.equal(normalized.wonderScouts.donation.purposes.length, 8);
});

test('saved structured site content and intentional empty lists survive normalization', () => {
  const saved = {
    videos: [{ place: '新場域', title: '新影片', youtubeId: 'newVideo123', image: '/new-cover.png' }],
    feedback: [],
    partnershipBenefits: ['新的合作價值'],
    squadBenefits: [],
    services: [{ number: 'A', title: '新服務', body: '服務說明', tags: '新標籤' }],
    joinSteps: [],
    donation: {
      organization: '新受款單位',
      intro: '新的捐款說明',
      url: 'https://example.org/donate',
      purposes: ['新用途'],
    },
    links: {
      partnershipForm: 'https://example.org/partner',
      joinForm: 'https://example.org/join',
      resultsVideo: 'https://example.org/results',
      digitalTour: 'https://example.org/tour',
    },
  };
  const normalized = normalizeSiteContent({ wonderScouts: saved });

  assert.deepEqual(normalized.wonderScouts, saved);
  assert.equal(normalized.wonderScouts.videos[0]?.title, '新影片');
  assert.deepEqual(normalized.wonderScouts.feedback, []);
  assert.deepEqual(normalized.wonderScouts.squadBenefits, []);
  assert.deepEqual(normalized.wonderScouts.joinSteps, []);
  assert.deepEqual(normalized.wonderScouts.donation.purposes, ['新用途']);
});