import { type Locator, type Page } from '@playwright/test';
export class BookDetailPage {
  readonly backButton: Locator;
  readonly addToCollectionButton: Locator;
  readonly loginButton: Locator;
  readonly titleValue: Locator;
  readonly subtitleValue: Locator;
  readonly authorValue: Locator;
  readonly publisherValue: Locator;
  readonly isbnValue: Locator;
  readonly pagesValue: Locator;
  readonly descriptionValue: Locator;
  readonly websiteValue: Locator;

  constructor(private readonly page: Page) {
    this.backButton = page.getByRole('button', { name: 'Back To Book Store' });
    this.addToCollectionButton = page.getByRole('button', { name: 'Add To Your Collection' });
    this.loginButton = page.locator('#login-wrapper button');
    this.titleValue = page.locator('#title-wrapper .col-md-9 label');
    this.subtitleValue = page.locator('#subtitle-wrapper .col-md-9 label');
    this.authorValue = page.locator('#author-wrapper .col-md-9 label');
    this.publisherValue = page.locator('#publisher-wrapper .col-md-9 label');
    this.isbnValue = page.locator('#ISBN-wrapper .col-md-9 label');
    this.pagesValue = page.locator('#pages-wrapper .col-md-9 label');
    this.descriptionValue = page.locator('#description-wrapper .col-md-9 label');
    this.websiteValue = page.locator('#website-wrapper .col-md-9 label');
  }

  /**
   * Waits until the "Back To Book Store" button is visible, confirming the
   * detail view has fully rendered. This button is present in both authenticated
   * and unauthenticated states.
   * @returns Promise that resolves when the page is ready for interaction.
   */
  async waitForReady(): Promise<void> {
    await this.backButton.waitFor({ state: 'visible' });
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
   * Clicks the "Login" button shown in the `#login-wrapper` area when the user
   * is unauthenticated. Navigates to /login.
   * @returns Promise that resolves when the click is complete.
   */
  async clickLogin(): Promise<void> {
    await this.loginButton.scrollIntoViewIfNeeded();
    await this.loginButton.click();
  }

  /**
   * Clicks the "Add To Your Collection" button.
   * Only available when the user is authenticated.
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
