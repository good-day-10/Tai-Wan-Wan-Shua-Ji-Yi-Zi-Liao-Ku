import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Editor, loadArchive, type ArchiveData } from './App';
import './index.css';

type CloseOutcome = 'saved' | 'cancelled' | 'locked';

function UnsavedDialogBrowserHarness() {
  const [archive, setArchive] = useState<ArchiveData>(loadArchive);
  const [editing, setEditing] = useState(true);
  const [outcome, setOutcome] = useState<CloseOutcome | null>(null);
  const editorEntryRef = useRef<HTMLButtonElement>(null);
  const useMockSaveApi = new URLSearchParams(window.location.search).has('mockSaveApi');

  const saveArchive = async (nextArchive: ArchiveData) => {
    if (useMockSaveApi) {
      const response = await fetch('/mock/archive', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          archive: nextArchive,
          ...(nextArchive.version !== undefined ? { expectedVersion: nextArchive.version } : {}),
        }),
      });
      if (!response.ok) throw new Error('Shared archive save failed');
      setArchive(await response.json() as ArchiveData);
    } else {
      setArchive(nextArchive);
    }
    closeEditor('saved');
  };

  const closeEditor = (nextOutcome: CloseOutcome) => {
    setOutcome(nextOutcome);
    setEditing(false);
    requestAnimationFrame(() => editorEntryRef.current?.focus());
  };

  return <main className="p-6">
    <button ref={editorEntryRef} type="button" onClick={() => setEditing(true)} data-testid="test-editor-entry">進入編輯器</button>
    <output data-testid="test-shared-archive" data-archive={JSON.stringify(archive)}>
      {archive.memories[0]?.title}
    </output>
    {!editing ? <div data-testid="test-editor-closed">
      <p data-testid="test-close-outcome">{outcome}</p>
      <p data-testid="test-saved-title">{archive.memories[0]?.title}</p>
    </div> : <Editor
      archive={archive}
      onDraftChange={() => undefined}
      onSave={saveArchive}
      onCancel={() => closeEditor('cancelled')}
      onLock={() => closeEditor('locked')}
      onReloadLatest={async () => archive}
    />}
  </main>;
}

createRoot(document.getElementById('root')!).render(<UnsavedDialogBrowserHarness />);
