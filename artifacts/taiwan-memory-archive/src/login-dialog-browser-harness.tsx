import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LoginModal } from './App';
import './index.css';

function LoginDialogBrowserHarness() {
  const [open, setOpen] = useState(false);

  return (
    <main className="min-h-dvh p-6">
      <p data-testid="auth-state">目前未登入</p>
      <button type="button" onClick={() => setOpen(true)} data-testid="button-open-login-modal">
        開啟管理入口
      </button>
      <LoginModal open={open} onClose={() => setOpen(false)} />
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<LoginDialogBrowserHarness />);
