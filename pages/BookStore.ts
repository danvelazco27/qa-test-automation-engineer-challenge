import { type Locator, type Page } from '@playwright/test';
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
 * Sidebar navigation: DemoQA's left panel expands the "Book Store Application"
 * section automatically when any Book Store page is active. The sidebar links
 * {@link bookStoreNavLink} and {@link profileNavLink} are always visible on
 * /login, /books, /profile and related pages.
 *
 */
export class BookStore {
  /** Page object for the Login form (/login). */
  readonly loginForm: LoginFormPage;
  /** Page object for the Registration form (/register). */
  readonly register: RegisterPage;
  /** Page object for the Book List and search (/books). */
  readonly bookList: BookListPage;
  /** Page object for the Book Detail view (/books?search={isbn}). */
  readonly bookDetail: BookDetailPage;
  /** Page object for the User Profile (/profile). */
  readonly profile: ProfilePage;
  /**
   * Sidebar "Book Store" link — always visible on any Book Store Application page.
   * Navigates to /books when clicked.
   */
  readonly bookStoreNavLink: Locator;
  /**
   * Sidebar "Profile" link — always visible on any Book Store Application page.
   * Navigates to /profile when clicked.
   */
  readonly profileNavLink: Locator;

  constructor(private readonly page: Page) {
    this.loginForm = new LoginFormPage(page);
    this.register = new RegisterPage(page);
    this.bookList = new BookListPage(page);
    this.bookDetail = new BookDetailPage(page);
    this.profile = new ProfilePage(page);
    this.bookStoreNavLink = page.locator('.left-pannel a[href="/books"]');
    this.profileNavLink = page.locator('.left-pannel a[href="/profile"]');
  }

  /**
   * Clicks the sidebar "Book Store" link and waits for the book list search input
   * to be visible, confirming the /books page is fully rendered.
   * The sidebar is expanded by default on all Book Store Application pages.
   * @returns Promise that resolves when the book list is ready for interaction.
   */
  async navigateToBookListViaSidebar(): Promise<void> {
    await this.bookStoreNavLink.scrollIntoViewIfNeeded();
    // force: true bypasses DemoQA's fixed-position ad iframes that intermittently
    // overlap the sidebar link and intercept pointer events.
    await this.bookStoreNavLink.click({ force: true });
    await this.bookList.searchInput.waitFor({ state: 'visible' });
  }

  /**
   * Clicks the sidebar "Profile" link and waits for the URL to change to /profile.
   * When authenticated (cookies set) the profile renders with user data;
   * when unauthenticated the page renders without user data.
   * @returns Promise that resolves when the /profile URL is active.
   */
  async navigateToProfileViaSidebar(): Promise<void> {
    await this.profileNavLink.scrollIntoViewIfNeeded();
    // force: true bypasses DemoQA's fixed-position ad iframes that intermittently
    // overlap the sidebar link and intercept pointer events.
    await this.profileNavLink.click({ force: true });
    await this.page.waitForURL(/\/profile/);
  }

  /**
   * Navigates to the Book List (/books) — the Book Store entry point.
   * Used as the starting point for all tests that exercise the book catalogue.
   * DemoQA's sidebar "Book Store Application" accordion is only reliably
   * pre-expanded once a book-store page is active, so /books is navigated
   * directly rather than through the /login sidebar.
   * @returns Promise that resolves when the /books page is ready for interaction.
   */
  async navigateToBookStore(): Promise<void> {
    await this.bookList.navigateTo();
  }

  /**
   * Navigates to the Register page (/register) by clicking the "New User" button
   * on the Login page — the same path a real user would take.
   * @returns Promise that resolves when the /register URL is active.
   */
  async navigateToRegisterPage(): Promise<void> {
    await this.loginForm.navigateTo();
    await this.loginForm.clickNewUser();
    await this.page.waitForURL(/\/register/);
  }

  /**
   * Opens the book detail view for a given title by navigating to /books and then
   * clicking the matching book title link. Direct URL navigation is avoided because
   * `/books?search={isbn}` loaded directly renders the list, not the detail view.
   * Works for both authenticated and unauthenticated sessions.
   * @param title - The exact title of the book to open.
   * @returns Promise that resolves when the detail view is fully rendered.
   */
  async navigateToBookDetail(title: string): Promise<void> {
    await this.bookList.navigateTo();
    await this.bookList.clickBook(title);
    await this.page.waitForURL(/\/books\?search=/);
    await this.bookDetail.waitForReady();
  }

  /**
   * Navigates to the Profile page (/profile) from the Login page via the sidebar
   * "Profile" link. Use for unauthenticated tests that verify blank profile behavior.
   * DemoQA does not redirect /profile to /login — the page renders empty without auth.
   * @returns Promise that resolves when the /profile URL is active.
   */
  async navigateToProfileFromLogin(): Promise<void> {
    await this.loginForm.navigateTo();
    await this.navigateToProfileViaSidebar();
  }

  /**
   * Navigates to the Profile page (/profile) via /books and the sidebar "Profile"
   * link. This is the authenticated entry path: DemoQA redirects away from /login
   * when valid auth cookies are present, so /books is used as the safe entry point.
   * Requires auth cookies to be set before calling.
   * @returns Promise that resolves when the /profile URL is active.
   */
  async navigateToProfileViaBookStore(): Promise<void> {
    await this.bookList.navigateTo();
    await this.navigateToProfileViaSidebar();
  }

  /**
   * Injects authentication state into the browser context as cookies.
   * DemoQA's React application reads auth from four session cookies
   * (`userID`, `userName`, `token`, `expires`), not from localStorage.
   *
   * This method can be called before any page navigation — cookies are
   * context-scoped and will be sent automatically on the next request to
   * `demoqa.com`.
   *
   * @param userID - UUID of the test user (from `POST /Account/v1/User`).
   * @param userName - Username string.
   * @param token - Bearer JWT token (from `POST /Account/v1/GenerateToken`).
   * @param expires - ISO 8601 expiry timestamp of the token.
   * @returns Promise that resolves when the auth cookies have been set.
   */
  async setAuthState(
    userID: string,
    userName: string,
    token: string,
    expires: string
  ): Promise<void> {
    await this.page.context().addCookies([
      { name: 'userID', value: userID, domain: 'demoqa.com', path: '/' },
      { name: 'userName', value: userName, domain: 'demoqa.com', path: '/' },
      { name: 'token', value: token, domain: 'demoqa.com', path: '/' },
      { name: 'expires', value: expires, domain: 'demoqa.com', path: '/' },
    ]);
  }

  /**
   * Clears all cookies from the browser context, returning the application
   * to an unauthenticated state on the next navigation to demoqa.com.
   * @returns Promise that resolves when the context cookies have been cleared.
   */
  async clearAuthState(): Promise<void> {
    await this.page.context().clearCookies();
  }
}
