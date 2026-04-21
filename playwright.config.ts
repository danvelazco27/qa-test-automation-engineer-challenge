import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for the DemoQA Book Store test suite.
 *
 * Projects:
 *  - chromium, firefox, webkit, mobile-chrome: UI end-to-end tests (tests/e2e/)
 *  - api: API-only tests using the request fixture (tests/api/)
 *
 * Reporters:
 *  - html: interactive HTML report in reports/html/
 *  - junit: XML report for CI systems (Jenkins, GitHub Actions) in reports/junit/
 *
 * Debug aids (active on failure/retry):
 *  - screenshot: captured on test failure
 *  - trace: step-by-step trace on first retry
 *  - video: screen recording on first retry
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',

  /** Run all tests in parallel (API tests fully parallel; UI tests parallelised per worker) */
  fullyParallel: true,

  /** Fail CI immediately if a test uses `test.only` — prevents accidentally shipping focused tests */
  forbidOnly: !!process.env.CI,

  /** Retry flaky tests: 2 retries in CI (handles DemoQA ad overlay transients), 0 locally */
  retries: process.env.CI ? 2 : 0,

  /** Worker count: 4 in CI, 2 locally to avoid overwhelming the DemoQA shared server */
  workers: process.env.CI ? 4 : 2,

  reporter: [
    /** Interactive HTML report — open manually with `npm run test:report` */
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    /** JUnit XML for CI (GitHub Actions test-reporter, Jenkins) */
    ['junit', { outputFile: 'reports/junit/results.xml' }],
  ],

  use: {
    /** Base URL — overridable via BASE_URL env var for staging/docker runs */
    baseURL: process.env.BASE_URL ?? 'https://demoqa.com',

    /** Capture screenshot on test failure for debugging */
    screenshot: 'only-on-failure',

    /** Record a Playwright trace on the first retry for step-by-step debugging */
    trace: 'on-first-retry',

    /** Record video on the first retry to replay visual failures */
    video: 'on-first-retry',
  },

  /**
   * Per-test timeout: 60 s locally (DemoQA is a slow external site and button-based
   * navigation adds extra page loads). CI retains 60 s with 2 retries.
   */
  timeout: 60_000,

  /** Test artefacts (screenshots, videos, traces) land here */
  outputDir: 'test-results',

  projects: [
    // ─── Desktop browsers — UI tests ─────────────────────────────────────────
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /tests\/e2e\/.+\.spec\.ts/,
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: /tests\/e2e\/.+\.spec\.ts/,
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: /tests\/e2e\/.+\.spec\.ts/,
    },

    // ─── Mobile viewport — UI tests ──────────────────────────────────────────
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: /tests\/e2e\/.+\.spec\.ts/,
    },

    // ─── API tests — no browser launched ─────────────────────────────────────
    {
      name: 'api',
      testMatch: /tests\/api\/.+\.spec\.ts/,
    },
  ],
});
