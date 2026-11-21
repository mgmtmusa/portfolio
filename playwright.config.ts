import { defineConfig, devices } from '@playwright/test';

const PORT = 4322;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: process.env.BASE_URL ?? `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
  },
  // Tests run against the production build (`npm run build` first).
  webServer: process.env.BASE_URL
    ? undefined
    : { command: `npx astro preview --port ${PORT} --host 127.0.0.1`, port: PORT, reuseExistingServer: !process.env.CI },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    // Playwright's Firefox build fails to start on this macOS release ("Could not find profile folder").
    // Run it where it works with PW_FIREFOX=1 npm run test:e2e
    ...(process.env.PW_FIREFOX ? [{ name: 'firefox', use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 900 } } }] : []),
    { name: 'webkit', use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
  ],
});
