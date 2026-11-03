import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FocusManagedDialog } from './components/focus-managed-dialog';
import './index.css';

const getHomeLink = () => document.querySelector<HTMLElement>('[data-testid="link-home"]');

function EditorGateBrowserHarness() {
  const [gateOpen, setGateOpen] = useState(false);
  const [entryVisible, setEntryVisible] = useState(true);
  const view = new URLSearchParams(window.location.search).get('view');
  const isCustomPage = view === 'custom';
  const isDraftRecovery = view === 'draft';

  const openGate = () => setGateOpen(true);
  const closeGate = () => {
    setGateOpen(false);
  };

  return <main className="min-h-dvh p-6">
    <a href="#top" data-testid="link-home">台灣玩耍記憶資料庫</a>
    <h1 className="mt-8 text-2xl">{isCustomPage ? '自訂主題頁面' : '首頁'}</h1>
    {entryVisible && !isDraftRecovery && <footer className="mt-8">
      <button type="button" onClick={openGate} data-testid="button-footer-editor">進入編輯入口</button>
    </footer>}
    {isDraftRecovery && <section className="mt-8">
      <p data-testid="session-change-notice">草稿已保留，重新授權後即可繼續編輯。</p>
      <button type="button" onClick={openGate} data-testid="button-reauthorize-draft">重新授權並恢復草稿</button>
    </section>}
    <button type="button" className="mt-8" onClick={() => setEntryVisible(false)} data-testid="button-unmount-entry">移除編輯入口</button>
    {gateOpen && <FocusManagedDialog
      labelledBy="gate-title"
      className="detail-backdrop fixed inset-0 z-50 flex items-center justify-center p-5"
      returnFocusFallback={getHomeLink}
    >
      <div className="modal-panel rounded-3xl bg-[hsl(var(--background))] p-8">
        <h2 id="gate-title">編輯入口</h2>
        <button type="button" onClick={closeGate} data-testid="button-close-gate">關閉編輯入口</button>
      </div>
    </FocusManagedDialog>}
  </main>;
}

createRoot(document.getElementById('root')!).render(<EditorGateBrowserHarness />);
