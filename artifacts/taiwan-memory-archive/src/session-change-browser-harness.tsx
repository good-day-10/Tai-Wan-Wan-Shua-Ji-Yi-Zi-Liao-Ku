import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Router as WouterRouter, useLocation } from 'wouter';
import { ArchiveHome } from './App';
import './index.css';

type TestAuth = {
  isLoaded: boolean;
  isSignedIn: boolean;
  sessionId: string | null;
  testMode: true;
};

function SessionChangeBrowserHarness() {
  const [location, navigate] = useLocation();
  const [auth, setAuth] = useState<TestAuth>({
    isLoaded: true,
    isSignedIn: true,
    sessionId: 'session-before-sign-out',
    testMode: true,
  });

  if (location === '/sign-in') {
    return <main className="min-h-dvh p-8" data-testid="test-sign-in-route">
      <h1 className="serif text-3xl font-bold">測試登入頁</h1>
      <button
        type="button"
        className="btn-primary mt-6"
        data-testid="button-test-sign-in"
        onClick={() => {
          setAuth({ isLoaded: true, isSignedIn: true, sessionId: 'session-after-sign-in', testMode: true });
          navigate('/');
        }}
      >
        登入測試編輯者
      </button>
    </main>;
  }

  return <>
    <div className="fixed right-4 top-4 z-50">
      {auth.isSignedIn && <button
        type="button"
        className="btn-outline"
        data-testid="button-test-sign-out"
        onClick={() => setAuth({ isLoaded: true, isSignedIn: false, sessionId: null, testMode: true })}
      >
        測試 Clerk 登出
      </button>}
    </div>
    <ArchiveHome auth={auth} />
  </>;
}

createRoot(document.getElementById('root')!).render(
  <WouterRouter>
    <SessionChangeBrowserHarness />
  </WouterRouter>,
);
