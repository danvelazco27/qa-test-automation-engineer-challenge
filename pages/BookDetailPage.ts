import { type Locator, type Page } from '@playwright/test';

/**
 * Page Object for the Book Detail page (/books?book={isbn}).
 * Provides methods to read book metadata and interact with action buttons.
 *
 * Navigation quirk: directly loading `/books?book={isbn}` renders the book LIST,
 * not the detail view. Always arrive here via {@link BookListPage.clickBook} and then
 * `await page.waitForURL(/books\?book=/)` before using this class.
 */
export class BookDetailPage {
  /** "Back To Book Store" button (shares `id="submit"` on this page). */
  readonly backButton: Locator;
  /** "Add To Your Collection" action button. */
  readonly addToCollectionButton: Locator;
  /** Label element containing the book title value. */
  readonly titleValue: Locator;
  /** Label element containing the subtitle value. */
  readonly subtitleValue: Locator;
  /** Label element containing the author value. */
  readonly authorValue: Locator;
  /** Label element containing the publisher value. */
  readonly publisherValue: Locator;
  /** Label element containing the ISBN value. */
  readonly isbnValue: Locator;
  /** Label element containing the total pages value. */
  readonly pagesValue: Locator;
  /** Label element containing the description value. */
  readonly descriptionValue: Locator;
  /** Label element containing the website URL value. */
  readonly websiteValue: Locator;

  constructor(private readonly page: Page) {
    this.backButton = page.locator('#submit');
    this.addToCollectionButton = page.locator('#addNewRecordButton');
    this.titleValue = page.locator('#title-wrapper');
    this.subtitleValue = page.locator('#subtitle-wrapper');
    this.authorValue = page.locator('#author-wrapper');
    this.publisherValue = page.locator('#publisher-wrapper');
    this.isbnValue = page.locator('#ISBN-wrapper');
    this.pagesValue = page.locator('#pages-wrapper');
    this.descriptionValue = page.locator('#description-wrapper');
    this.websiteValue = page.locator('#website-wrapper');
  }

  /**
   * Waits until the "Add To Your Collection" button is visible, confirming the
   * detail view has fully rendered.
   * @returns Promise that resolves when the page is ready for interaction.
   */
  async waitForReady(): Promise<void> {
    await this.addToCollectionButton.waitFor({ state: 'visible' });
  }

  /**
   * Clicks the "Back To Book Store" button, navigating back to the book list.
   * @returns Promise that resolves when the click is complete.
   */
  async clickBack(): Promise<void> {
    await this.backButton.scrollIntoViewIfNeeded();
    await this.backButton.click();
  }

  /**
   * Clicks the "Add To Your Collection" button.
   * Unauthenticated users will be redirected to /login.
   * @returns Promise that resolves when the click is complete.
   */
  async clickAddToCollection(): Promise<void> {
    await this.addToCollectionButton.scrollIntoViewIfNeeded();
    await this.addToCollectionButton.click();
  }

  /**
   * Returns the book title text displayed on the detail page.
   * @returns Promise resolving to the trimmed title string.
   */
  async getTitle(): Promise<string> {
    return (await this.titleValue.textContent())?.trim() ?? '';
  }

  /**
   * Returns the subtitle text displayed on the detail page.
   * @returns Promise resolving to the trimmed subtitle string.
   */
  async getSubtitle(): Promise<string> {
    return (await this.subtitleValue.textContent())?.trim() ?? '';
  }

  /**
   * Returns the author text displayed on the detail page.
   * @returns Promise resolving to the trimmed author string.
   */
  async getAuthor(): Promise<string> {
    return (await this.authorValue.textContent())?.trim() ?? '';
  }

  /**
   * Returns the publisher text displayed on the detail page.
   * @returns Promise resolving to the trimmed publisher string.
   */
  async getPublisher(): Promise<string> {
    return (await this.publisherValue.textContent())?.trim() ?? '';
  }

  /**
   * Returns the ISBN text displayed on the detail page.
   * @returns Promise resolving to the trimmed ISBN string.
   */
  async getISBN(): Promise<string> {
    return (await this.isbnValue.textContent())?.trim() ?? '';
  }

  /**
   * Returns the total pages text displayed on the detail page.
   * @returns Promise resolving to the trimmed page-count string.
   */
  async getPages(): Promise<string> {
    return (await this.pagesValue.textContent())?.trim() ?? '';
  }

  /**
   * Returns the description text displayed on the detail page.
   * @returns Promise resolving to the trimmed description string.
   */
  async getDescription(): Promise<string> {
    return (await this.descriptionValue.textContent())?.trim() ?? '';
  }

  /**
   * Returns the website URL text displayed on the detail page.
   * @returns Promise resolving to the trimmed website string.
   */
  async getWebsite(): Promise<string> {
    return (await this.websiteValue.textContent())?.trim() ?? '';
  }
}
