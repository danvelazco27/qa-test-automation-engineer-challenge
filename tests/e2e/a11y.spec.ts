import { expect, test, type Page } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { BookStore } from '../../pages/BookStore';
import type { Result } from 'axe-core';

/**
 * Filters axe violation results to only critical and serious impact levels.
 * Moderate and minor violations are informational only and do not fail the test.
 * @param violations - The full violations array from AxeBuilder.analyze().
 * @returns Violations with impact 'critical' or 'serious'.
 */
function getCriticalViolations(violations: Result[]): Result[] {
  return violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  );
}

/**
 * Returns an AxeBuilder configured with WCAG 2.1 AA tags and DemoQA-specific
 * exclusions for known vendor-side accessibility issues:
 *   - `header` — logo `<img>` without alt text; wrapping `<a>` without accessible text.
 *   - `.left-pannel` — sidebar nav toggle button without aria-label or visible text.
 *   - `.btn-outline-secondary` — search icon buttons that contain only SVG with no label.
 *   - `color-contrast` rule — DemoQA's colour scheme does not meet AA contrast ratios;
 *     this is a vendor styling issue outside the scope of this test suite.
 *   - `aria-command-name` rule — DemoQA renders unnamed ARIA link widgets in the
 *     left-panel accordion; vendor-side issue unrelated to application content.
 *   - `iframe[id^="google_ads_iframe_"]` — Google Ads iframes injected by DemoQA;
 *     they contain `aria-hidden` violations and unnamed links that are vendor/ad issues.
 * @param page - The Playwright Page instance to attach the builder to.
 * @returns A pre-configured AxeBuilder ready for `.analyze()`.
 */
function buildAxe(page: Page): AxeBuilder {
  return new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .exclude('header')
    .exclude('.left-pannel')
    .exclude('.btn-outline-secondary')
    .exclude('iframe[id^="google_ads_iframe_"]')
    .disableRules([
      'color-contrast',   // DemoQA colour scheme doesn't meet AA contrast ratios (vendor)
      'aria-command-name', // DemoQA renders unnamed ARIA links in its left-panel widgets (vendor)
    ]);
}

test.describe('Accessibility — WCAG 2.1 AA', () => {
  let userID = '';
  let userName = '';
  let password = '';
  let token = '';
  let expires = '';

  test.beforeAll(async ({ request }) => {
    userName = `test_a11y_${Date.now()}`;
    password = 'Test@1234!';

    const createResp = await request.post('/Account/v1/User', {
      data: { userName, password },
    });
    const created = (await createResp.json()) as { userID: string };
    userID = created.userID;

    const tokenResp = await request.post('/Account/v1/GenerateToken', {
      data: { userName, password },
    });
    const tokenData = (await tokenResp.json()) as { token: string; expires: string };
    token = tokenData.token;
    expires = tokenData.expires;
  });

  test.afterAll(async ({ request }) => {
    if (userID && token) {
      await request.delete(`/Account/v1/User/${userID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  });

  test('A11Y-001: book list page has no critical accessibility violations', async ({ page }) => {
    const store = new BookStore(page);
    await store.navigateToBookStore();

    const results = await buildAxe(page).analyze();

    const critical = getCriticalViolations(results.violations);
    expect(critical, `Critical/serious violations: ${JSON.stringify(critical, null, 2)}`).toHaveLength(0);
  });

  test('A11Y-002: login page has no critical accessibility violations', async ({ page }) => {
    const store = new BookStore(page);
    await store.loginForm.navigateTo();

    const results = await buildAxe(page).analyze();

    const critical = getCriticalViolations(results.violations);
    expect(critical, `Critical/serious violations: ${JSON.stringify(critical, null, 2)}`).toHaveLength(0);
  });

  test('A11Y-003: register page has no critical accessibility violations', async ({ page }) => {
    const store = new BookStore(page);
    await store.navigateToRegisterPage();

    const results = await buildAxe(page).analyze();

    const critical = getCriticalViolations(results.violations);
    expect(critical, `Critical/serious violations: ${JSON.stringify(critical, null, 2)}`).toHaveLength(0);
  });

  test('A11Y-004: book detail page has no critical accessibility violations', async ({ page }) => {
    const store = new BookStore(page);
    await store.navigateToBookDetail('Git Pocket Guide');

    const results = await buildAxe(page).analyze();

    const critical = getCriticalViolations(results.violations);
    expect(critical, `Critical/serious violations: ${JSON.stringify(critical, null, 2)}`).toHaveLength(0);
  });

  test('A11Y-005: profile page has no critical accessibility violations (authenticated)', async ({
    page,
  }) => {
    // Inject auth cookies then navigate via /books to avoid /login auth redirect
    const store = new BookStore(page);
    await store.setAuthState(userID, userName, token, expires);
    await store.navigateToProfileViaBookStore();

    const results = await buildAxe(page).analyze();

    const critical = getCriticalViolations(results.violations);
    expect(critical, `Critical/serious violations: ${JSON.stringify(critical, null, 2)}`).toHaveLength(0);
  });
});
