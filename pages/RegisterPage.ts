import { type Locator, type Page } from '@playwright/test';

export class RegisterPage {
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly userNameInput: Locator;
  readonly passwordInput: Locator;
  readonly registerButton: Locator;
  readonly backToLoginButton: Locator;
  readonly outputMessage: Locator;

  constructor(private readonly page: Page) {
    this.firstNameInput = page.locator('#firstname');
    this.lastNameInput = page.locator('#lastname');
    this.userNameInput = page.locator('#userName');
    this.passwordInput = page.locator('#password');
    this.registerButton = page.locator('#register');
    this.backToLoginButton = page.locator('#gotologin');
    this.outputMessage = page.locator('#output');
  }

  /**
   * Navigates to the Registration page and waits for the register button to be visible.
   * @returns Promise that resolves when the page is ready for interaction.
   */
  async navigateTo(): Promise<void> {
    await this.page.goto('/register', { waitUntil: 'domcontentloaded' });
    await this.registerButton.waitFor({ state: 'visible' });
  }

  /**
   * Fills the First Name input field.
   * @param text - The first name value to enter.
   * @returns Promise that resolves when the field is filled.
   */
  async fillFirstName(text: string): Promise<void> {
    await this.firstNameInput.fill(text);
  }

  /**
   * Fills the Last Name input field.
   * @param text - The last name value to enter.
   * @returns Promise that resolves when the field is filled.
   */
  async fillLastName(text: string): Promise<void> {
    await this.lastNameInput.fill(text);
  }

  /**
   * Fills the Username input field.
   * @param text - The username value to enter.
   * @returns Promise that resolves when the field is filled.
   */
  async fillUserName(text: string): Promise<void> {
    await this.userNameInput.fill(text);
  }

  /**
   * Fills the Password input field.
   * @param text - The password value to enter.
   * @returns Promise that resolves when the field is filled.
   */
  async fillPassword(text: string): Promise<void> {
    await this.passwordInput.fill(text);
  }

  /**
   * Clicks the Register submit button.
   * The reCAPTCHA v3 score is assessed silently on submission;
   * the server may accept or reject the request based on that score.
   * @returns Promise that resolves when the click is complete.
   */
  async clickRegister(): Promise<void> {
    await this.registerButton.scrollIntoViewIfNeeded();
    await this.registerButton.click();
  }

  /**
   * Clicks the "Back to Login" button, navigating to /login.
   * @returns Promise that resolves when the click is complete.
   */
  async clickBackToLogin(): Promise<void> {
    await this.backToLoginButton.scrollIntoViewIfNeeded();
    await this.backToLoginButton.click();
  }

  /**
   * Waits for the React-rendered output message container to become visible.
   * Used to confirm that the server returned a validation error after form submission.
   * @returns Promise that resolves when the output element is displayed.
   */
  async waitForOutputMessage(): Promise<void> {
    await this.outputMessage.waitFor({ state: 'visible' });
  }

  /**
   * Returns the trimmed text content of the output message element.
   * Call {@link waitForOutputMessage} first to ensure the element is present.
   * @returns Promise resolving to the output message string.
   */
  async getOutputMessageText(): Promise<string> {
    return (await this.outputMessage.textContent())?.trim() ?? '';
  }
}
