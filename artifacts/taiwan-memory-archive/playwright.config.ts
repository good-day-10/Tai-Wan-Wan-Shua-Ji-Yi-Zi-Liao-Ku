import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
  },
  webServer: {
    command: 'PORT=4173 BASE_PATH=/ pnpm run dev -- --host 127.0.0.1',
    url: 'http://127.0.0.1:4173/unsaved-dialog-browser-harness.html',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
