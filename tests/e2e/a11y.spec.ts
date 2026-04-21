import { expect, test } from '@playwright/test';
import { BookStore } from '../../pages/BookStore';
import { buildAxe, getCriticalViolations } from './helpers';

test.describe('Accessibility — WCAG 2.1 AA', () => {
  let store: BookStore;
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

  test.beforeEach(async ({ page }) => {
    store = new BookStore(page);
  });

  test('A11Y-001: book list page has no critical accessibility violations', async ({ page }) => {
    await store.navigateToBookStore();

    const results = await buildAxe(page).analyze();

    const critical = getCriticalViolations(results.violations);
    expect(critical, `Critical/serious violations: ${JSON.stringify(critical, null, 2)}`).toHaveLength(0);
  });

  test('A11Y-002: login page has no critical accessibility violations', async ({ page }) => {
    await store.loginForm.navigateTo();

    const results = await buildAxe(page).analyze();

    const critical = getCriticalViolations(results.violations);
    expect(critical, `Critical/serious violations: ${JSON.stringify(critical, null, 2)}`).toHaveLength(0);
  });

  test('A11Y-003: register page has no critical accessibility violations', async ({ page }) => {
    await store.navigateToRegisterPage();

    const results = await buildAxe(page).analyze();

    const critical = getCriticalViolations(results.violations);
    expect(critical, `Critical/serious violations: ${JSON.stringify(critical, null, 2)}`).toHaveLength(0);
  });

  test('A11Y-004: book detail page has no critical accessibility violations', async ({ page }) => {
    await store.navigateToBookDetail('Git Pocket Guide');

    const results = await buildAxe(page).analyze();

    const critical = getCriticalViolations(results.violations);
    expect(critical, `Critical/serious violations: ${JSON.stringify(critical, null, 2)}`).toHaveLength(0);
  });

  test('A11Y-005: profile page has no critical accessibility violations (authenticated)', async ({
    page,
  }) => {
    // Inject auth cookies then navigate via /books to avoid /login auth redirect
    await store.setAuthState(userID, userName, token, expires);
    await store.navigateToProfileViaBookStore();

    const results = await buildAxe(page).analyze();

    const critical = getCriticalViolations(results.violations);
    expect(critical, `Critical/serious violations: ${JSON.stringify(critical, null, 2)}`).toHaveLength(0);
  });
});
