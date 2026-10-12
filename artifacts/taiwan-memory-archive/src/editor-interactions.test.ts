import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { getDraggedPosition, hasArchiveDraftChanges, hasEditorSessionChanged } from './editor-interactions';

test('touch pointer movement keeps the original layout offset while dragging', () => {
  const drag = { startX: 120, startY: 240, x: 18, y: -9 };

  assert.deepEqual(getDraggedPosition(drag, 164, 205), { x: 62, y: -44 });
  assert.deepEqual(getDraggedPosition(drag, 101, 271), { x: -1, y: 22 });
});

test('Clerk sign-out and session replacement both invalidate the editor session', () => {
  assert.equal(hasEditorSessionChanged('session-a', 'session-a', true), false);
  assert.equal(hasEditorSessionChanged('session-a', 'session-b', true), true);
  assert.equal(hasEditorSessionChanged('session-a', null, true), true);
  assert.equal(hasEditorSessionChanged('session-a', null, false), true);
});

test('draft comparison identifies changed archive content without treating an unchanged copy as unsaved', () => {
  const archive = { introduction: '原始介紹', memories: [{ id: '01', title: '原標題' }] };

  assert.equal(hasArchiveDraftChanges(archive, structuredClone(archive)), false);
  assert.equal(hasArchiveDraftChanges(archive, { ...archive, introduction: '尚未保存的介紹' }), true);
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

test('session changes leave editing mode while keeping a recoverable draft and reauthorization path', async () => {
  const appSource = await readFile(new URL('./App.tsx', import.meta.url), 'utf8');
  const sessionChangeEffect = appSource.match(/if \(!editing \|\| !authLoaded\) return;([\s\S]*?)\n  \}, \[authLoaded, editing, isSignedIn, sessionId\]\);/);

  assert.ok(sessionChangeEffect, 'Home should observe Clerk session changes while editing');
  assert.match(appSource, /const \{ isLoaded: authLoaded, isSignedIn, sessionId \} = useAuth\(\)/);
  assert.match(sessionChangeEffect[1], /hasEditorSessionChanged\(editorSessionIdRef\.current, sessionId \?\? null, Boolean\(isSignedIn\)\)/);
  assert.match(sessionChangeEffect[1], /setEditing\(false\)/);
  assert.match(sessionChangeEffect[1], /setNeedsAuthorization\(true\)/);
  assert.match(sessionChangeEffect[1], /storeSessionChangeNotice\(true\)/);
  assert.match(appSource, /sessionStorage\.setItem\(recoveryDraftStorageKey, JSON\.stringify\(draft\)\)/);
  assert.match(appSource, /useState\(readSessionChangeNotice\)/);
  assert.match(appSource, /sessionStorage\.setItem\(sessionChangeNoticeStorageKey, 'true'\)/);
  assert.match(appSource, /initialDraft=\{recoveryDraft\} onDraftChange=\{persistRecoveryDraft\}/);
  assert.match(appSource, /data-testid="session-change-notice"/);
  assert.match(appSource, /data-testid="button-reauthorize-draft"/);
  assert.match(appSource, /data-testid="button-copy-recovery-draft"/);
});

test('editor gate only exposes the password field after Clerk confirms sign-in', async () => {
  const appSource = await readFile(new URL('./App.tsx', import.meta.url), 'utf8');
  const signedOutBranch = appSource.match(/!isSignedIn\s*\?\s*([\s\S]*?)\s*:\s*isOwner/);

  assert.ok(signedOutBranch, 'PasswordGate should have a dedicated signed-out branch');
  assert.match(signedOutBranch[1], /先登入再編輯/);
  assert.doesNotMatch(signedOutBranch[1], /input-editor-password|編輯密碼/);
  assert.match(appSource, /!isSignedIn\s*\?[\s\S]*?先登入再編輯[\s\S]*?:\s*isOwner[\s\S]*?:\s*<>\s*<p[^>]*>登入已確認/);
  assert.match(appSource, /data-testid="input-editor-password"/);
});

test('unsaved changes prompt manages focus and stays reachable on short mobile screens', async () => {
  const appSource = await readFile(new URL('./App.tsx', import.meta.url), 'utf8');
  const cssSource = await readFile(new URL('./index.css', import.meta.url), 'utf8');

  assert.match(appSource, /unsaved-dialog-backdrop/);
  assert.match(appSource, /unsaved-dialog-panel[^>]*role="dialog"[^>]*aria-modal="true"/);
  assert.match(appSource, /type="button"[^>]*onClick=\{\(\) => void onSave\(\)\}[^>]*data-testid="button-save-before-close"/);
  assert.match(appSource, /type="button"[^>]*onClick=\{onDiscard\}[^>]*data-testid="button-discard-before-close"/);
  assert.match(appSource, /type="button"[^>]*onClick=\{onContinue\}[^>]*data-testid="button-continue-editing"/);
  assert.match(appSource, /const initialFocusTarget = continueButtonRef\.current\?\.\s*disabled \? firstAvailableAction : continueButtonRef\.current/);
  assert.match(appSource, /onKeyDown=\{keepFocusInDialog\}/);
  assert.match(appSource, /const continueEditing = \(\) => \{\s*setPendingCloseAction\(null\);\s*requestAnimationFrame\(\(\) => \{\s*if \(closeTriggerRef\.current\?\.isConnected\) closeTriggerRef\.current\.focus\(\)/);
  assert.match(appSource, /const restoreEditorEntryFocus = \(\) => \{\s*requestAnimationFrame\(\(\) => \{\s*const trigger = editorEntryTriggerRef\.current/);
  assert.match(appSource, /\(action === 'lock' \? onLock : onCancel\)\(\)/);
  assert.match(cssSource, /\.unsaved-dialog-backdrop\s*\{[^}]*overflow-y:\s*auto/);
  assert.match(cssSource, /\.unsaved-dialog-panel\s*\{[^}]*max-height:\s*calc\(100dvh - 2rem\)/);
  assert.match(cssSource, /\.unsaved-dialog-panel\s*\{[^}]*overflow-y:\s*auto/);
});

test('failed saves keep the draft and close choices available', async () => {
  const appSource = await readFile(new URL('./App.tsx', import.meta.url), 'utf8');

  assert.match(appSource, /const \[saveError, setSaveError\] = useState<string \| null>\(null\)/);
  assert.match(appSource, /setSaveError\(null\);\s*setSaveConflict\(false\);\s*try \{\s*await onSave\(dataToSave\)/);
  assert.match(appSource, /setSaveError\('保存失敗，這些修改仍保留在編輯器中。/);
  assert.match(appSource, /data-testid="save-error-before-close"[^>]*role="alert"/);
  assert.match(appSource, /pendingCloseAction && <UnsavedChangesDialog saving=\{saving\} error=\{saveError \?\? undefined\}/);
  assert.match(appSource, /data-testid="save-error-editor"[^>]*role="alert"/);
  assert.match(appSource, /finally \{\s*setSaving\(false\);\s*\}/);
});

test('conflict comparison fetches the latest archive without replacing or saving the draft', async () => {
  const appSource = await readFile(new URL('./App.tsx', import.meta.url), 'utf8');
  const reloadFlow = appSource.match(/const loadLatestArchiveForConflictResolution = async \(\): Promise<ArchiveData> => \{([\s\S]*?)\n  \};/);

  assert.ok(reloadFlow, 'the page should have an explicit latest-archive comparison flow');
  assert.match(reloadFlow[1], /getSharedArchive\(\{ cache: 'no-store' \}\)/);
  assert.match(reloadFlow[1], /return normalized/);
  assert.doesNotMatch(reloadFlow[1], /setArchive|closeEditor/);
  assert.doesNotMatch(reloadFlow[1], /saveSharedArchive/);
  assert.match(appSource, /findArchiveConflicts\(latestArchive, draft\)/);
  assert.match(appSource, /mergeArchiveConflictChoices\(conflictArchive, conflictDiffs, conflictChoices\)/);
  assert.match(appSource, /\.\.\.\(data\.version !== undefined \? \{ expectedVersion: data\.version \} : \{\}\)/);
});
