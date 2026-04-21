import { type Locator, type Page } from '@playwright/test';

/**
 * Page Object for the User Profile page (/profile).
 * Provides methods to read the authenticated user's state and manage their book collection.
 *
 * Button quirk: The profile page renders three distinct buttons that all share
 * `id="submit"` — Logout, Delete Account, and Delete All Books. All button locators
 * in this class use `getByRole('button', { name: '...' })` to disambiguate.
 */
export class ProfilePage {
  /** Label element displaying the currently logged-in user's username. */
  readonly userNameValue: Locator;
  /** "Log out" button. */
  readonly logoutButton: Locator;
  /** "Delete Account" button. */
  readonly deleteAccountButton: Locator;
  /** "Delete All Books" button. */
  readonly deleteAllBooksButton: Locator;
  /** "Go To Book Store" navigation button (has a unique id). */
  readonly goToBookStoreButton: Locator;
  /** ReactTable body element that wraps the user's book collection rows. */
  readonly bookTableBody: Locator;
  /** All row-group elements in the book collection ReactTable. */
  readonly bookRows: Locator;

  constructor(private readonly page: Page) {
    this.userNameValue = page.locator('#userName-value');
    this.logoutButton = page.getByRole('button', { name: 'Log out' });
    this.deleteAccountButton = page.getByRole('button', { name: 'Delete Account' });
    this.deleteAllBooksButton = page.getByRole('button', { name: 'Delete All Books' });
    this.goToBookStoreButton = page.locator('#gotoStore');
    this.bookTableBody = page.locator('.rt-tbody');
    this.bookRows = page.locator('.rt-tbody .rt-tr-group');
  }

  /**
   * Navigates to the Profile page and waits for the username label to be visible.
   * If the user is unauthenticated, DemoQA will redirect to /login instead.
   * @returns Promise that resolves when the profile page is fully rendered.
   */
  async navigateTo(): Promise<void> {
    await this.page.goto('/profile', { waitUntil: 'domcontentloaded' });
    await this.userNameValue.waitFor({ state: 'visible' });
  }

  /**
   * Returns the trimmed text content of the username display label.
   * @returns Promise resolving to the displayed username string.
   */
  async getUserName(): Promise<string> {
    return (await this.userNameValue.textContent())?.trim() ?? '';
  }

  /**
   * Returns the number of row-group elements in the book collection ReactTable.
   * @returns Promise resolving to the row count.
   */
  async getBookCount(): Promise<number> {
    return this.bookRows.count();
  }

  /**
   * Checks whether a book with the given title is present in the collection table.
   * @param title - The book title to search for in the table rows.
   * @returns Promise resolving to `true` if the book is visible in the collection.
   */
  async isBookInCollection(title: string): Promise<boolean> {
    return this.page
      .locator('.rt-tbody .rt-tr-group', { hasText: title })
      .isVisible();
  }

  /**
   * Finds the table row matching the given book title and clicks its delete button.
   * The delete button is a span with `title="Delete Book"` containing an SVG icon.
   * @param title - Title of the book to remove from the collection.
   * @returns Promise that resolves when the delete button has been clicked.
   */
  async deleteBook(title: string): Promise<void> {
    const row = this.page.locator('.rt-tbody .rt-tr-group', { hasText: title });
    const deleteButton = row.locator('span[title="Delete Book"]');
    await deleteButton.scrollIntoViewIfNeeded();
    await deleteButton.click();
  }

  /**
   * Clicks the "Log out" button. Expect navigation to /login after this action.
   * @returns Promise that resolves when the button has been clicked.
   */
  async logout(): Promise<void> {
    await this.logoutButton.scrollIntoViewIfNeeded();
    await this.logoutButton.click();
  }

  /**
   * Clicks the "Delete Account" button.
   * @returns Promise that resolves when the button has been clicked.
   */
  async deleteAccount(): Promise<void> {
    await this.deleteAccountButton.scrollIntoViewIfNeeded();
    await this.deleteAccountButton.click();
  }

  /**
   * Clicks the "Delete All Books" button, clearing the entire book collection.
   * @returns Promise that resolves when the button has been clicked.
   */
  async deleteAllBooks(): Promise<void> {
    await this.deleteAllBooksButton.scrollIntoViewIfNeeded();
    await this.deleteAllBooksButton.click();
  }

  /**
   * Clicks the "Go To Book Store" navigation button.
   * @returns Promise that resolves when the button has been clicked.
   */
  async goToBookStore(): Promise<void> {
    await this.goToBookStoreButton.scrollIntoViewIfNeeded();
    await this.goToBookStoreButton.click();
  }
}
