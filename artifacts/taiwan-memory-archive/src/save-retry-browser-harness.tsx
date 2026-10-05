import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Editor, loadArchive, type ArchiveData } from './App';
import './index.css';

function SaveRetryBrowserHarness() {
  const [archive, setArchive] = useState<ArchiveData>(loadArchive);
  const [editing, setEditing] = useState(true);

  return <main className="p-6">
    <output data-testid="test-shared-archive" data-archive={JSON.stringify(archive)}>
      {archive.memories[0]?.title}
    </output>
    {editing ? <Editor
      archive={archive}
      onSave={async (nextArchive) => {
        const response = await fetch('/mock/archive', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            archive: nextArchive,
            ...(nextArchive.version !== undefined ? { expectedVersion: nextArchive.version } : {}),
          }),
        });
        if (!response.ok) throw new Error('Shared archive save failed');
        const savedArchive = await response.json() as ArchiveData;
        setArchive(savedArchive);
        setEditing(false);
      }}
      onCancel={() => setEditing(false)}
      onLock={() => setEditing(false)}
      onReloadLatest={async () => archive}
    /> : <div data-testid="test-editor-closed">
      <p data-testid="test-saved-title">{archive.memories[0]?.title}</p>
    </div>}
  </main>;
}

createRoot(document.getElementById('root')!).render(<SaveRetryBrowserHarness />);
