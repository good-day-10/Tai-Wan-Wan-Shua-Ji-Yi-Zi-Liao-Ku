import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Editor, loadArchive, storeArchive, type ArchiveData } from './App';
import './index.css';

function createInitialArchive(): ArchiveData {
  const archive = loadArchive();
  return archive.version === undefined ? { ...archive, version: 4 } : archive;
}

function ConflictReloadBrowserHarness() {
  const [archive, setArchive] = useState<ArchiveData>(createInitialArchive);
  const [editing, setEditing] = useState(true);

  const reloadLatest = async () => {
    const response = await fetch('/mock/archive', { cache: 'no-store' });
    if (!response.ok) throw new Error('Latest shared archive could not be loaded');
    const latestArchive = await response.json() as ArchiveData;
    storeArchive(latestArchive);
    setArchive(latestArchive);
    return latestArchive;
  };

  return <main className="p-6">
    <output data-testid="test-shared-archive" data-archive={JSON.stringify(archive)}>
      {archive.memories[0]?.title}
    </output>
    {!editing && <button type="button" onClick={() => setEditing(true)} data-testid="test-editor-entry">
      重新進入編輯器
    </button>}
    {editing ? <Editor
      archive={archive}
      onDraftChange={() => undefined}
      onSave={async (nextArchive) => {
        const response = await fetch('/mock/archive', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            archive: nextArchive,
            ...(nextArchive.version !== undefined ? { expectedVersion: nextArchive.version } : {}),
          }),
        });
        if (response.status === 409) {
          const conflict = new Error('Shared archive version conflict');
          conflict.name = 'ArchiveConflictError';
          throw conflict;
        }
        if (!response.ok) throw new Error('Shared archive save failed');
        const savedArchive = await response.json() as ArchiveData;
        setArchive(savedArchive);
        setEditing(false);
      }}
      onCancel={() => setEditing(false)}
      onLock={() => setEditing(false)}
      onReloadLatest={reloadLatest}
    /> : <section data-testid="test-editor-closed">
      <p data-testid="test-saved-title">{archive.memories[0]?.title}</p>
      <p data-testid="test-saved-version">{archive.version}</p>
    </section>}
  </main>;
}

createRoot(document.getElementById('root')!).render(<ConflictReloadBrowserHarness />);
