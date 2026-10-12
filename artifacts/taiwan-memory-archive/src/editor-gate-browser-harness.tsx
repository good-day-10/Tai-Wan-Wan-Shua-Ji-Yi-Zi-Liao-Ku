import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { restoreEditorEntryFocus } from './App';
import './index.css';

function EditorGateBrowserHarness() {
  const [gateOpen, setGateOpen] = useState(false);
  const [entryVisible, setEntryVisible] = useState(true);
  const entryTriggerRef = useRef<HTMLButtonElement>(null);
  const isCustomPage = new URLSearchParams(window.location.search).get('view') === 'custom';

  const openGate = (event: React.MouseEvent<HTMLButtonElement>) => {
    entryTriggerRef.current = event.currentTarget;
    setGateOpen(true);
  };
  const closeGate = () => {
    setGateOpen(false);
    restoreEditorEntryFocus(entryTriggerRef.current);
  };

  return <main className="min-h-dvh p-6">
    <a href="#top" data-testid="link-home">台灣玩耍記憶資料庫</a>
    <h1 className="mt-8 text-2xl">{isCustomPage ? '自訂主題頁面' : '首頁'}</h1>
    {entryVisible && <footer className="mt-8">
      <button type="button" onClick={openGate} data-testid="button-footer-editor">進入編輯入口</button>
    </footer>}
    <button type="button" className="mt-8" onClick={() => setEntryVisible(false)} data-testid="button-unmount-entry">移除編輯入口</button>
    {gateOpen && <div className="detail-backdrop fixed inset-0 z-50 flex items-center justify-center p-5" role="dialog" aria-modal="true" aria-labelledby="gate-title">
      <div className="modal-panel rounded-3xl bg-[hsl(var(--background))] p-8">
        <h2 id="gate-title">編輯入口</h2>
        <button type="button" onClick={closeGate} data-testid="button-close-gate">關閉編輯入口</button>
      </div>
    </div>}
  </main>;
}

createRoot(document.getElementById('root')!).render(<EditorGateBrowserHarness />);
