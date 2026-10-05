import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Editor, loadArchive, type ArchiveData } from './App';
import './index.css';

type CloseOutcome = 'saved' | 'cancelled' | 'locked';

function UnsavedDialogBrowserHarness() {
  const [archive, setArchive] = useState<ArchiveData>(loadArchive);
  const [editing, setEditing] = useState(true);
  const [outcome, setOutcome] = useState<CloseOutcome | null>(null);

  if (!editing) {
    return <main className="p-6" data-testid="test-editor-closed">
      <p data-testid="test-close-outcome">{outcome}</p>
      <p data-testid="test-saved-title">{archive.memories[0]?.title}</p>
    </main>;
  }

  return <Editor
    archive={archive}
    onSave={async (nextArchive) => {
      setArchive(nextArchive);
      setOutcome('saved');
      setEditing(false);
    }}
    onCancel={() => {
      setOutcome('cancelled');
      setEditing(false);
    }}
    onLock={() => {
      setOutcome('locked');
      setEditing(false);
    }}
    onReloadLatest={async () => undefined}
  />;
}

createRoot(document.getElementById('root')!).render(<UnsavedDialogBrowserHarness />);
