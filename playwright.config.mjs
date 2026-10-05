import { defineConfig } from '@playwright/test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Never attach these destructive fixture tests to an existing user's canvas.
const port = Number(process.env.CANVAS_TEST_PORT || 51910);
const baseURL = `http://127.0.0.1:${port}`;
// The canvas server writes its session record under HOME; keep it out of the real one.
const home = mkdtempSync(join(tmpdir(), 'archdraw-playwright-'));

export default defineConfig({
  testDir: './tests/browser',
  workers: 1,
  fullyParallel: false,
  timeout: 30000,
  expect: { timeout: 10000 },
  use: {
    baseURL,
    browserName: 'chromium',
    viewport: { width: 1280, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node dist/server.js',
    env: { HOST: '127.0.0.1', PORT: String(port), LOG_LEVEL: 'error', HOME: home, ARCHDRAW_PROJECT_ROOT: home },
    url: `${baseURL}/health`,
    reuseExistingServer: false,
    timeout: 15000,
  },
});
