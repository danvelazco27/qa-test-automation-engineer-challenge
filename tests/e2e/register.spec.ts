import { expect, test } from '@playwright/test';
import { BookStore } from '../../pages/BookStore';

test.describe('Register page', () => {
  test('REG-001: all form fields and buttons are visible', async ({ page }) => {
    const store = new BookStore(page);
    await store.navigateToRegisterPage();

    await expect(store.register.firstNameInput).toBeVisible();
    await expect(store.register.lastNameInput).toBeVisible();
    await expect(store.register.userNameInput).toBeVisible();
    await expect(store.register.passwordInput).toBeVisible();
    await expect(store.register.registerButton).toBeVisible();
    await expect(store.register.backToLoginButton).toBeVisible();
  });

  test('REG-002: submitting empty form triggers HTML5 validation', async ({ page }) => {
    const store = new BookStore(page);
    await store.navigateToRegisterPage();

    await store.register.clickRegister();

    // HTML5 validation prevents submission — page must stay on /register
    await expect(page).toHaveURL(/\/register/);
    // The first required field must carry the required attribute
    await expect(store.register.firstNameInput).toHaveAttribute('required', '');
  });

  test('REG-003: weak password shows validation error or reCAPTCHA prompt', async ({ page }) => {
    const store = new BookStore(page);
    await store.navigateToRegisterPage();

    await store.register.fillFirstName('Test');
    await store.register.fillLastName('User');
    await store.register.fillUserName(`weak_${Date.now()}`);
    await store.register.fillPassword('nospecial123'); // missing special character

    await store.register.clickRegister();
    await store.register.waitForOutputMessage();

    // DemoQA either shows a password-strength validation message OR the reCAPTCHA
    // v3 invisible-challenge response fires first. Both responses appear in #output.
    const msg = await store.register.getOutputMessageText();
    const isValidation = msg.includes('Passwords must have at least one non alphanumeric character');
    const isRecaptcha = msg.includes('reCaptcha') || msg.includes('Please verify');
    expect(isValidation || isRecaptcha).toBe(true);
  });

  test('REG-004: Back to Login button navigates to /login', async ({ page }) => {
    const store = new BookStore(page);
    await store.navigateToRegisterPage();

    await store.register.clickBackToLogin();

    await expect(page).toHaveURL(/\/login/);
    await expect(store.loginForm.loginButton).toBeVisible();
  });

  test('REG-005: pre-existing username shows duplicate-user error or reCAPTCHA prompt', async ({
    page,
    request,
  }) => {
    // Pre-create the user via API so the username is already taken
    const userName = `dup_reg_${Date.now()}`;
    const password = 'Test@1234!';
    await request.post('/Account/v1/User', { data: { userName, password } });

    const store = new BookStore(page);
    await store.navigateToRegisterPage();

    await store.register.fillFirstName('Test');
    await store.register.fillLastName('Dup');
    await store.register.fillUserName(userName);
    await store.register.fillPassword(password);
    await store.register.clickRegister();

    // DemoQA either shows "User exists!" OR the reCAPTCHA v3 invisible-challenge
    // fires first with "Please verify reCaptcha to register!". Either response in
    // #output confirms the page did NOT navigate to /profile.
    await store.register.waitForOutputMessage();
    await expect(page).toHaveURL(/\/register/);
    const msg = await store.register.getOutputMessageText();
    const isUserExists = msg.includes('User exists!');
    const isRecaptcha = msg.includes('reCaptcha') || msg.includes('Please verify');
    expect(isUserExists || isRecaptcha).toBe(true);
  });
});
