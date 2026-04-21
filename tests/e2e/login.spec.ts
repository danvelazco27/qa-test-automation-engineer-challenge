import { expect, test } from '@playwright/test';
import { BookStore } from '../../pages/BookStore';

test.describe('Login page', () => {
  let userID = '';
  let userName = '';
  let password = '';
  let cleanupToken = '';

  test.beforeAll(async ({ request }) => {
    userName = `test_login_${Date.now()}`;
    password = 'Test@1234!';

    const createResp = await request.post('/Account/v1/User', {
      data: { userName, password },
    });
    const created = (await createResp.json()) as { userID: string };
    userID = created.userID;

    const tokenResp = await request.post('/Account/v1/GenerateToken', {
      data: { userName, password },
    });
    const tokenData = (await tokenResp.json()) as { token: string };
    cleanupToken = tokenData.token;
  });

  test.afterAll(async ({ request }) => {
    if (userID && cleanupToken) {
      await request.delete(`/Account/v1/User/${userID}`, {
        headers: { Authorization: `Bearer ${cleanupToken}` },
      });
    }
  });

  test('LOG-001: valid credentials redirect to /profile and display username', async ({ page }) => {
    const store = new BookStore(page);
    await store.loginForm.navigateTo();

    await store.loginForm.login(userName, password);
    await store.loginForm.waitForSuccessfulLogin();

    await expect(page).toHaveURL(/\/profile/);
    await expect(store.profile.userNameValue).toHaveText(userName);
  });

  test('LOG-002: wrong password shows error and stays on /login', async ({ page }) => {
    const store = new BookStore(page);
    await store.loginForm.navigateTo();

    await store.loginForm.login(userName, 'WrongPass@99');
    await store.loginForm.waitForError();

    await expect(page).toHaveURL(/\/login/);
    await expect(store.loginForm.errorMessage).toContainText(
      'Invalid username or password!'
    );
  });

  test('LOG-003: non-existent username shows error', async ({ page }) => {
    const store = new BookStore(page);
    await store.loginForm.navigateTo();

    await store.loginForm.login('nonexistent_user_xyz999', 'Test@1234!');
    await store.loginForm.waitForError();

    await expect(page).toHaveURL(/\/login/);
    await expect(store.loginForm.errorMessage).toContainText(
      'Invalid username or password!'
    );
  });

  test('LOG-004: empty form does not redirect', async ({ page }) => {
    const store = new BookStore(page);
    await store.loginForm.navigateTo();

    await store.loginForm.loginButton.click();

    // HTML5 validation fires — page must remain on /login
    await expect(page).toHaveURL(/\/login/);
    await expect(store.loginForm.userNameInput).toHaveAttribute('required', '');
  });

  test('LOG-005: visiting /profile unauthenticated shows no data; logging in from /login lands on /profile', async ({
    page,
  }) => {
    // Navigate to /profile via the sidebar Profile link without auth cookies.
    // DemoQA does not redirect /profile to /login — it renders the page blank.
    const store = new BookStore(page);
    await store.navigateToProfileFromLogin();
    await expect(store.profile.userNameValue).toBeHidden();

    // Navigate to login and sign in with valid credentials
    await store.loginForm.navigateTo();
    await store.loginForm.login(userName, password);
    await store.loginForm.waitForSuccessfulLogin();

    // After login, user should be on /profile with user data visible
    await expect(page).toHaveURL(/\/profile/);
    await expect(store.profile.userNameValue).toBeVisible();
  });
});
