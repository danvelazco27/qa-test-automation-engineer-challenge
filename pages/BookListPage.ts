import { type Locator, type Page } from '@playwright/test';

/**
 * Page Object for the Book List page (/books).
 * Provides methods for navigating, searching, and interacting with the book catalogue.
 *
 * ReactTable quirk: the search input has a debounce before the table updates.
 * After calling {@link search}, use {@link waitForBookCount} to let the table settle
 * rather than asserting row counts immediately.
 */
export class BookListPage {
  /** Search/filter input for narrowing books by title or author. */
  readonly searchInput: Locator;
  /** All row-group elements in the ReactTable body (one per visible book). */
  readonly bookRows: Locator;
  /** Anchor tags for each book title rendered in the table body. */
  readonly bookTitleLinks: Locator;
  /** "No rows found" empty-state banner displayed when a search yields zero results. */
  readonly emptyState: Locator;

  constructor(private readonly page: Page) {
    this.searchInput = page.locator('#searchBox');
    this.bookRows = page.locator('.rt-tbody .rt-tr-group');
    this.bookTitleLinks = page.locator('.rt-tbody .rt-td a');
    this.emptyState = page.locator('.rt-noData');
  }

  /**
   * Navigates to the Book List page and waits for the search input to be ready.
   * @returns Promise that resolves when the page is ready for interaction.
   */
  async navigateTo(): Promise<void> {
    await this.page.goto('/books', { waitUntil: 'domcontentloaded' });
    await this.searchInput.waitFor({ state: 'visible' });
  }

  /**
   * Types a search query into the search box.
   * The ReactTable applies a debounce before filtering; call {@link waitForBookCount}
   * after this method to wait for the result count to stabilise.
   * @param query - The text to search for (book title or author name).
   * @returns Promise that resolves when the input value has been set.
   */
  async search(query: string): Promise<void> {
    await this.searchInput.scrollIntoViewIfNeeded();
    await this.searchInput.fill(query);
  }

  /**
   * Clears the search input, restoring the full unfiltered book list.
   * @returns Promise that resolves when the field has been cleared.
   */
  async clearSearch(): Promise<void> {
    await this.searchInput.scrollIntoViewIfNeeded();
    await this.searchInput.clear();
  }

  /**
   * Returns the current count of book title anchor elements visible in the table.
   * This reflects the filtered result when a search query is active.
   * @returns Promise resolving to the number of visible book links.
   */
  async getBookCount(): Promise<number> {
    return this.bookTitleLinks.count();
  }

  /**
   * Waits until the book table contains exactly the specified number of book links.
   * Use after {@link search} or {@link clearSearch} to let the ReactTable debounce settle.
   * @param count - The expected number of book title links.
   * @param options - Optional wait configuration.
   * @param options.timeout - Maximum wait time in milliseconds (default: 10 000).
   * @returns Promise that resolves when the count matches.
   */
  async waitForBookCount(count: number, options?: { timeout?: number }): Promise<void> {
    await this.page.waitForFunction(
      ({ selector, expected }: { selector: string; expected: number }) =>
        document.querySelectorAll(selector).length === expected,
      { selector: '.rt-tbody .rt-td a', expected: count },
      { timeout: options?.timeout ?? 10_000 }
    );
  }

  /**
   * Clicks the book title link whose text matches the given title exactly.
   * Scrolls into view first to avoid ad-overlay interception.
   * @param title - The exact title of the book to click.
   * @returns Promise that resolves after the click action completes.
   */
  async clickBook(title: string): Promise<void> {
    const link = this.page.locator('.rt-tbody .rt-td a', { hasText: title });
    await link.scrollIntoViewIfNeeded();
    await link.click();
  }

  /**
   * Checks whether the empty-state "No rows found" banner is currently visible.
   * @returns Promise resolving to `true` when the no-data banner is displayed.
   */
  async isEmpty(): Promise<boolean> {
    return this.emptyState.isVisible();
  }
}
