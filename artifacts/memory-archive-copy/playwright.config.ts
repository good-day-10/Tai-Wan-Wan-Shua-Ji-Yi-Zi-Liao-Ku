import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4174/memory-archive-copy/',
    browserName: 'chromium',
    launchOptions: process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : {},
  },
  webServer: {
    command: 'PORT=4174 BASE_PATH=/memory-archive-copy/ pnpm run dev -- --host 127.0.0.1',
    url: 'http://127.0.0.1:4174/memory-archive-copy/',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
