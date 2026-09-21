import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { getDraggedPosition } from './editor-interactions';

test('touch pointer movement keeps the original layout offset while dragging', () => {
  const drag = { startX: 120, startY: 240, x: 18, y: -9 };

  assert.deepEqual(getDraggedPosition(drag, 164, 205), { x: 62, y: -44 });
  assert.deepEqual(getDraggedPosition(drag, 101, 271), { x: -1, y: 22 });
});

test('editor wiring keeps touch dragging and keyboard selection paths enabled', async () => {
  const appSource = await readFile(new URL('./App.tsx', import.meta.url), 'utf8');
  const cssSource = await readFile(new URL('./index.css', import.meta.url), 'utf8');

  assert.match(appSource, /onPointerDown=\{\(event\) => startDrag\(event, block\)\}/);
  assert.match(appSource, /onPointerMove=\{moveDraggedBlock\}/);
  assert.match(appSource, /onPointerCancel=\{stopDrag\}/);
  assert.match(appSource, /onLostPointerCapture=\{stopDrag\}/);
  assert.match(appSource, /onPointerDown=\{keepSelection\}/);
  assert.match(appSource, /onSelect=\{saveSelection\}/);
  assert.match(appSource, /scrollIntoView\(\{ block: 'center', inline: 'nearest' \}\)/);
  assert.match(cssSource, /\.layout-drag-handle\s*\{[^}]*touch-action:\s*none/);
  assert.match(cssSource, /\.editor-scroll-container\s*\{[^}]*scroll-padding-bottom:/);
  assert.match(cssSource, /\.rich-editor\s*\{[^}]*scroll-margin-block:/);
});