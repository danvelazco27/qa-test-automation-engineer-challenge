import { type Locator, type Page } from '@playwright/test';

export class ProfilePage {
  readonly userNameValue: Locator;
  readonly logoutButton: Locator;
  readonly deleteAccountButton: Locator;
  readonly deleteAllBooksButton: Locator;
  readonly goToBookStoreButton: Locator;
  readonly bookTableBody: Locator;
  readonly bookRows: Locator;

  constructor(private readonly page: Page) {
    this.userNameValue = page.locator('#userName-value');
    this.logoutButton = page.getByRole('button', { name: 'Logout' });
    this.deleteAccountButton = page.getByRole('button', { name: 'Delete Account' });
    this.deleteAllBooksButton = page.getByRole('button', { name: 'Delete All Books' }).first();
    this.goToBookStoreButton = page.locator('#gotoStore');
    this.bookTableBody = page.locator('tbody');
    this.bookRows = page.locator('tbody tr');
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
   * Returns the number of rows in the book collection table.
   * Returns 0 when the user's collection is empty.
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
    return (await this.page.locator('tbody tr', { hasText: title }).count()) > 0;
  }

  /**
   * Finds the table row matching the given book title, clicks its delete button,
   * and confirms the Bootstrap modal that DemoQA shows before deletion.
   * DemoQA uses a React-Bootstrap modal (not a native `window.confirm`) with
   * an OK button at `#closeSmallModal-ok`.
   * @param title - Title of the book to remove from the collection.
   * @returns Promise that resolves when the delete has been confirmed.
   */
  async deleteBook(title: string): Promise<void> {
    const row = this.page.locator('tbody tr', { hasText: title });
    const deleteButton = row.locator('span[id^="delete-record-"]');
    await deleteButton.scrollIntoViewIfNeeded();
    await deleteButton.click();
    // Confirm the "Delete Book" Bootstrap modal that appears after clicking delete
    await this.page.locator('#closeSmallModal-ok').waitFor({ state: 'visible' });
    await this.page.locator('#closeSmallModal-ok').click();
  }

  /**
   * Clicks the "Logout" button. Expect navigation to /login after this action.
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
   * Clicks the first "Delete All Books" button, clearing the entire book collection.
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
