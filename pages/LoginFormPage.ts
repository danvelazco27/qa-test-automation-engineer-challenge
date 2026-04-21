import { type Locator, type Page } from '@playwright/test';

/**
 * Page Object for the Login form page (/login).
 * Handles credential input, form submission, and login error/success state reading.
 */
export class LoginFormPage {
  /** Username text input field. */
  readonly userNameInput: Locator;
  /** Password input field. */
  readonly passwordInput: Locator;
  /** Login submit button. */
  readonly loginButton: Locator;
  /** "New User" button that navigates to /register. */
  readonly newUserButton: Locator;
  /** Container element that becomes visible after a failed login attempt. */
  readonly errorOutput: Locator;
  /** Element inside {@link errorOutput} containing the error message text. */
  readonly errorMessage: Locator;

  constructor(private readonly page: Page) {
    this.userNameInput = page.locator('#userName');
    this.passwordInput = page.locator('#password');
    this.loginButton = page.locator('#login');
    this.newUserButton = page.locator('#newUser');
    this.errorOutput = page.locator('#output');
    this.errorMessage = page.locator('#name');
  }

  /**
   * Navigates to the Login page and waits for the login button to be visible.
   * @returns Promise that resolves when the page is ready for interaction.
   */
  async navigateTo(): Promise<void> {
    await this.page.goto('/login', { waitUntil: 'domcontentloaded' });
    await this.loginButton.waitFor({ state: 'visible' });
  }

  /**
   * Fills the username and password fields and submits the login form.
   * Does not assert the outcome — use {@link waitForSuccessfulLogin} or
   * {@link waitForError} to verify the result.
   * @param userName - The username to enter.
   * @param password - The password to enter.
   * @returns Promise that resolves when the form has been submitted.
   */
  async login(userName: string, password: string): Promise<void> {
    await this.userNameInput.fill(userName);
    await this.passwordInput.fill(password);
    await this.loginButton.scrollIntoViewIfNeeded();
    await this.loginButton.click();
  }

  /**
   * Waits until the page URL changes to /profile, confirming a successful login.
   * @returns Promise that resolves when the /profile route is active.
   */
  async waitForSuccessfulLogin(): Promise<void> {
    await this.page.waitForURL(/\/profile/, { waitUntil: 'domcontentloaded' });
  }

  /**
   * Waits for the error output container to become visible after a failed login attempt.
   * @returns Promise that resolves when the error container is displayed.
   */
  async waitForError(): Promise<void> {
    await this.errorOutput.waitFor({ state: 'visible' });
  }

  /**
   * Returns the trimmed text of the error message element.
   * Call {@link waitForError} first to ensure the element is present.
   * @returns Promise resolving to the error message string.
   */
  async getErrorText(): Promise<string> {
    return (await this.errorMessage.textContent())?.trim() ?? '';
  }

  /**
   * Clicks the "New User" button, navigating to the registration page.
   * @returns Promise that resolves when the click is complete.
   */
  async clickNewUser(): Promise<void> {
    await this.newUserButton.scrollIntoViewIfNeeded();
    await this.newUserButton.click();
  }
}
