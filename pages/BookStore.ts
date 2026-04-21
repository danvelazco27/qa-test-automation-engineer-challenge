import { type Page } from '@playwright/test';
import { BookDetailPage } from './BookDetailPage';
import { BookListPage } from './BookListPage';
import { LoginFormPage } from './LoginFormPage';
import { ProfilePage } from './ProfilePage';
import { RegisterPage } from './RegisterPage';

/**
 * BookStore facade — the single entry point for all UI test interactions.
 * Instantiates every page object and exposes them as named properties, so each
 * test only needs to create one `BookStore` instance from the `page` fixture.
 *
 * @example
 * ```typescript
 * test('search books', async ({ page }) => {
 *   const store = new BookStore(page);
 *   await store.bookList.navigateTo();
 *   await store.bookList.search('JavaScript');
 * });
 * ```
 */
export class BookStore {
  /** Page object for the Login form (/login). */
  readonly loginForm: LoginFormPage;
  /** Page object for the Registration form (/register). */
  readonly register: RegisterPage;
  /** Page object for the Book List and search (/books). */
  readonly bookList: BookListPage;
  /** Page object for the Book Detail view (/books?book={isbn}). */
  readonly bookDetail: BookDetailPage;
  /** Page object for the User Profile (/profile). */
  readonly profile: ProfilePage;

  constructor(private readonly page: Page) {
    this.loginForm = new LoginFormPage(page);
    this.register = new RegisterPage(page);
    this.bookList = new BookListPage(page);
    this.bookDetail = new BookDetailPage(page);
    this.profile = new ProfilePage(page);
  }

  /**
   * Injects authentication state into the page's localStorage so the React
   * application recognises the user as logged in on the next navigation.
   *
   * This method requires the page to already be on a `demoqa.com` origin
   * (navigate there first) and then reload or navigate again for the React app
   * to pick up the new storage values.
   *
   * NOTE: localStorage injection may not reliably authenticate DemoQA's React app
   * in all scenarios. If auth injection fails, fall back to real UI login via
   * {@link LoginFormPage.login} followed by `page.context().storageState()` to
   * serialise and reuse the session.
   *
   * @param userID - UUID string of the test user (from `POST /Account/v1/User`).
   * @param userName - Username string.
   * @param token - Bearer JWT token (from `POST /Account/v1/GenerateToken`).
   * @param expires - ISO 8601 expiry timestamp of the token.
   * @returns Promise that resolves when localStorage has been updated.
   */
  async setAuthState(
    userID: string,
    userName: string,
    token: string,
    expires: string
  ): Promise<void> {
    await this.page.evaluate(
      ({
        userID: id,
        userName: name,
        token: tok,
        expires: exp,
      }: {
        userID: string;
        userName: string;
        token: string;
        expires: string;
      }) => {
        localStorage.setItem('userID', id);
        localStorage.setItem('userName', name);
        localStorage.setItem('token', tok);
        localStorage.setItem('expires', exp);
      },
      { userID, userName, token, expires }
    );
  }

  /**
   * Removes all authentication keys from the page's localStorage, returning
   * the application to an unauthenticated state on the next navigation.
   * @returns Promise that resolves when the auth keys have been removed.
   */
  async clearAuthState(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.removeItem('userID');
      localStorage.removeItem('userName');
      localStorage.removeItem('token');
      localStorage.removeItem('expires');
    });
  }
}
