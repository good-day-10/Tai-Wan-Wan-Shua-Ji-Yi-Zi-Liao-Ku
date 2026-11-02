import assert from 'node:assert/strict';
import test from 'node:test';
import { getEarliestStoryDecade, getStoryDecade } from './archive-display';

test('story decade reads Western year formats', () => {
  assert.equal(getStoryDecade('1960 年代'), 1960);
  assert.equal(getStoryDecade('約 1987 年'), 1980);
});

test('story decade converts ROC decades to the matching Gregorian decade', () => {
  assert.equal(getStoryDecade('民國七十年代'), 1980);
  assert.equal(getStoryDecade('民國 60 年代'), 1970);
});

test('earliest story decade updates from the current archive stories', () => {
  assert.equal(getEarliestStoryDecade(['1990 年代', '民國七十年代', '1960 年代']), 1960);
  assert.equal(getEarliestStoryDecade(['年代不明']), undefined);
});
