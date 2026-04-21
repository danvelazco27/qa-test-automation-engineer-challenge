import { expect, test } from '@playwright/test';
import { BookStore } from '../../pages/BookStore';

/** ISBN of "Git Pocket Guide" — used as the primary test book for collection tests. */
const TEST_ISBN = '9781449325862';
const TEST_TITLE = 'Git Pocket Guide';

test.describe('Profile page', () => {
  let userID = '';
  let userName = '';
  let password = '';
  let token = '';
  let expires = '';

  test.beforeAll(async ({ request }) => {
    userName = `test_profile_${Date.now()}`;
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

  // ── Unauthenticated tests (no auth injection) ────────────────────────────────

  test('PRF-002: unauthenticated /profile does not display user data', async ({ page }) => {
    // Navigate to /profile via the sidebar Profile link without auth cookies.
    // DemoQA's React SPA renders /profile without redirecting to /login —
    // the content area is blank and the username label is not populated.
    const store = new BookStore(page);
    await store.navigateToProfileFromLogin();
    await expect(store.profile.userNameValue).toBeHidden();
  });

  // ── Authenticated tests ──────────────────────────────────────────────────────

  test.describe('authenticated', () => {
    test.beforeEach(async ({ page }) => {
      // Inject auth cookies — context-scoped, no prior navigation required.
      // navigateToProfileViaBookStore() uses /books as the entry point because
      // DemoQA redirects authenticated users away from /login.
      const store = new BookStore(page);
      await store.setAuthState(userID, userName, token, expires);
    });

    test('PRF-001: authenticated username is displayed on profile', async ({ page }) => {
      const store = new BookStore(page);
      await store.navigateToProfileViaBookStore();

      await expect(store.profile.userNameValue).toHaveText(userName);
    });

    test('PRF-003: freshly created user has empty book collection', async ({ page }) => {
      const store = new BookStore(page);
      await store.navigateToProfileViaBookStore();

      expect(await store.profile.getBookCount()).toBe(0);
    });

    test('PRF-004: book added via API appears in profile collection table', async ({
      page,
      request,
    }) => {
      // Add a book via the REST API directly
      await request.post('/BookStore/v1/Books', {
        data: { userId: userID, collectionOfIsbns: [{ isbn: TEST_ISBN }] },
        headers: { Authorization: `Bearer ${token}` },
      });

      const store = new BookStore(page);
      await store.navigateToProfileViaBookStore();

      // Use web-first assertion so Playwright retries until the table renders
      await expect(store.profile.bookTableBody).toContainText(TEST_TITLE);

      // Cleanup: remove the book so it doesn't affect PRF-003 in other workers
      await request.delete('/BookStore/v1/Books', {
        params: { UserId: userID },
        headers: { Authorization: `Bearer ${token}` },
      });
    });

    test('PRF-005: deleting a book from the collection removes it from the table', async ({
      page,
      request,
    }) => {
      // Add the book via API first
      await request.post('/BookStore/v1/Books', {
        data: { userId: userID, collectionOfIsbns: [{ isbn: TEST_ISBN }] },
        headers: { Authorization: `Bearer ${token}` },
      });

      const store = new BookStore(page);
      await store.navigateToProfileViaBookStore();
      await expect(store.profile.bookTableBody).toContainText(TEST_TITLE);

      // deleteBook() clicks the delete icon then confirms the Bootstrap modal
      await store.profile.deleteBook(TEST_TITLE);

      await expect(store.profile.bookTableBody).not.toContainText(TEST_TITLE);
    });

    test('PRF-006: logout clears session and hides user data', async ({ page }) => {
      const store = new BookStore(page);
      await store.navigateToProfileViaBookStore();

      await store.profile.logout();

      // Logout should navigate away from /profile to /login
      await expect(page).toHaveURL(/\/login/);
      // After logout, navigating to /profile via sidebar should show no user data —
      // DemoQA renders the page without redirecting, but the content is empty.
      await store.navigateToProfileViaSidebar();
      await expect(store.profile.userNameValue).toBeHidden();
    });
  });
});
