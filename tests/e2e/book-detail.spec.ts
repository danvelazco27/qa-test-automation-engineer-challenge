import { expect, test } from '@playwright/test';
import { BookStore } from '../../pages/BookStore';
import { TEST_ISBN } from './testData';

test.describe('Book Detail page', () => {
  let store: BookStore;

  test.beforeEach(async ({ page }) => {
    store = new BookStore(page);
  });

  test('BKD-001: all book metadata fields are visible and populated', async () => {
    await store.navigateToBookDetail('Git Pocket Guide');

    await expect(store.bookDetail.isbnValue).toBeVisible();
    await expect(store.bookDetail.titleValue).toBeVisible();
    await expect(store.bookDetail.subtitleValue).toBeVisible();
    await expect(store.bookDetail.authorValue).toBeVisible();
    await expect(store.bookDetail.publisherValue).toBeVisible();
    await expect(store.bookDetail.pagesValue).toBeVisible();
    await expect(store.bookDetail.websiteValue).toBeVisible();

    expect(await store.bookDetail.getISBN()).toBe(TEST_ISBN);
    expect(await store.bookDetail.getTitle()).toBe('Git Pocket Guide');
    expect(await store.bookDetail.getAuthor()).toContain('Richard E. Silverman');
    expect(await store.bookDetail.getPublisher()).toBe("O'Reilly Media");
  });

  test('BKD-002: Back To Book Store button returns to /books', async ({ page }) => {
    await store.navigateToBookDetail('Git Pocket Guide');

    await store.bookDetail.clickBack();

    await expect(page).toHaveURL(/\/books/);
    await expect(store.bookList.searchInput).toBeVisible();
  });

  test('BKD-003: unauthenticated login button on detail page redirects to /login', async ({ page }) => {
    await store.navigateToBookDetail('Git Pocket Guide');

    // When unauthenticated, DemoQA shows a "Login" button instead of
    // "Add To Your Collection". Clicking it navigates to /login.
    await store.bookDetail.clickLogin();

    await expect(page).toHaveURL(/\/login/);
  });

  test.describe('authenticated', () => {
    let userID = '';
    let userName = '';
    let password = '';
    let token = '';
    let expires = '';

    test.beforeAll(async ({ request }) => {
      userName = `test_bkd_${Date.now()}`;
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

    test.beforeEach(async () => {
      // store is already created by the outer beforeEach; inject auth cookies
      await store.setAuthState(userID, userName, token, expires);
    });

    test.afterAll(async ({ request }) => {
      if (userID && token) {
        await request.delete(`/Account/v1/User/${userID}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    });

    test('BKD-004: authenticated add to collection succeeds', async ({ page, request }) => {
      await store.navigateToBookDetail('Git Pocket Guide');

      // DemoQA fires a native alert "Book added to your collection." once the server
      // confirms the add. Using waitForEvent ensures we only proceed after the alert
      // is dismissed — guaranteeing the server-side add has completed before the
      // subsequent API assertion.
      const dialogPromise = page.waitForEvent('dialog');
      await store.bookDetail.clickAddToCollection();
      const dialog = await dialogPromise;
      await dialog.accept();

      // Verify via API that the book was added to the user's collection
      const userResp = await request.get(`/Account/v1/User/${userID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = (await userResp.json()) as {
        books: Array<{ isbn: string }>;
      };
      const bookAdded = userData.books.some((b) => b.isbn === TEST_ISBN);
      expect(bookAdded).toBe(true);
    });
  });
});
