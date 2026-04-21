# CLAUDE.md — DemoQA Book Store Test Automation Framework

This file is read automatically by Claude Code at the start of every session.
It contains everything an AI assistant needs to work effectively on this project.

---

## Project Overview

Full-stack test automation suite for **https://demoqa.com/books** (DemoQA Book Store).

- **UI tests**: Playwright + Page Object Model with `BookStore` facade
- **API tests**: Playwright `request` fixture + Zod runtime schema validation
- **Accessibility**: `@axe-core/playwright` — WCAG 2.1 AA on 5 key pages
- **Coverage**: V8 coverage via `c8` (Chromium only)
- **CI**: GitHub Actions — push to main, every PR, manual dispatch

---

## Quick Start

```bash
npm ci
npx playwright install --with-deps

npm run lint          # ESLint check
npm run test:api      # API tests only (33 tests)
npm run test:ui       # UI tests — Chromium + Mobile Chrome (31 tests × 2)
npm run test          # Full suite
npm run test:coverage # UI on Chromium with V8 coverage → reports/coverage/
npm run test:report   # Open last HTML report
```

---

## Architecture

```
tests/e2e/*.spec.ts          tests/api/**/*.spec.ts
        │                              │
        ▼                              ▼
BookStore (Facade)         Playwright request fixture
pages/BookStore.ts         + Zod schema validation
        │                  + tests/api/helpers.ts
        ├── loginForm  : LoginFormPage
        ├── register   : RegisterPage
        ├── bookList   : BookListPage
        ├── bookDetail : BookDetailPage
        └── profile    : ProfilePage
```

Every UI test starts with `new BookStore(page)` in `beforeEach`. No locator strings or navigation logic belong in test files — those live exclusively in page classes.

---

## Key Files

| Path | Purpose |
|---|---|
| `pages/BookStore.ts` | Facade — single entry point for all UI tests. All compound navigation methods live here. |
| `tests/api/helpers.ts` | `createTestUser`, `generateToken`, `deleteTestUser` |
| `tests/e2e/helpers.ts` | `buildAxe()`, `getCriticalViolations()` — shared a11y helpers |
| `tests/e2e/testData.ts` | `TEST_ISBN`, `TEST_TITLE` — shared test constants |
| `types/models.ts` | All Zod schemas for API responses |
| `types/enums.ts` | `HttpStatus`, `ApiEndpoints`, `UserMessage` |
| `playwright.config.ts` | Projects: chromium, firefox, webkit, mobile-chrome, api |
| `docs/TESTING_PLAN.md` | Full test strategy, locator map, API coverage matrix, known deviations |

---

## Coding Standards (Non-Negotiable)

### General
- **JSDoc on every method** — all POM methods, all exported helpers/utilities. Include `@param` and `@returns`. No exceptions.
- **No `waitForTimeout()`** — use Playwright web-first assertions (`toBeVisible`, `waitFor`, `toHaveCount`).
- **No inline locators in test files** — every `page.locator(...)` must be a `readonly` property on a page class.
- **No navigation logic in test files** — use `BookStore` compound methods or page class `navigateTo()`.
- **Typed return values** — all `async` methods declare explicit return types.
- **`{ force: true }` only with comment** — only when DemoQA ad iframes intercept pointer events; always add a comment explaining why.

### Page Classes
```typescript
// ✅ correct
export class BookListPage {
  readonly searchInput: Locator;

  constructor(private readonly page: Page) {
    this.searchInput = page.locator('#searchBox');
  }

  /**
   * Types a search term into the search box and waits for the table to stabilise.
   * @param term - The search string to enter.
   */
  async search(term: string): Promise<void> {
    await this.searchInput.fill(term);
  }
}

// ❌ wrong — locator inline in test file
await page.locator('#searchBox').fill('Git');
```

### Test Files — Hook Pattern
```typescript
// ✅ correct — store created in beforeEach, navigation per test
test.describe('Book List page', () => {
  let store: BookStore;

  test.beforeEach(async ({ page }) => {
    store = new BookStore(page);
    await store.navigateToBookStore();
  });

  test('BKL-001: ...', async () => {
    expect(await store.bookList.getBookCount()).toBe(8);
  });
});

// ❌ wrong — repeated instantiation inside every test
test('BKL-001', async ({ page }) => {
  const store = new BookStore(page);
  await store.navigateToBookStore();
  ...
});
```

### API Tests — Zod Validation Pattern
```typescript
// Every test that receives a JSON body must call schema.parse(body)
const body: unknown = await resp.json();
const parsed = UserResponseSchema.parse(body);      // success response
// OR
const err = ApiErrorSchema.parse(body);             // error response
```

### API Tests — Assert Swagger Spec, Not Actual Behavior
- Always check the Swagger spec at **https://demoqa.com/swagger** first.
- Write assertions against the Swagger-documented status code.
- If the server returns something different, the test **intentionally fails** — do NOT adjust assertions to match the actual behavior.
- Currently intentionally failing: **ACCU-002** (missing fields → Swagger 406, actual 400) and **ACCU-003** (weak password → Swagger 406, actual 400).

### Navigation — Buttons Over URLs
Use in-app navigation buttons wherever they exist. Use direct `goto()` only for entry points with no accessible button.

| Entry point | Method |
|---|---|
| Book store | `store.navigateToBookStore()` (uses `bookList.navigateTo()`) |
| Login page | `store.loginForm.navigateTo()` |
| Register page | `store.navigateToRegisterPage()` (login → click New User) |
| Book detail | `store.navigateToBookDetail('Title')` (books → click title) |
| Profile (unauth) | `store.navigateToProfileFromLogin()` |
| Profile (auth) | `store.navigateToProfileViaBookStore()` (requires auth cookies set first) |

---

## DemoQA-Specific Quirks

### Authentication
- Auth uses **cookies**, NOT localStorage. Set with `page.context().addCookies([...])`.
- Cookie names: `userID`, `userName`, `token`, `expires` on domain `demoqa.com`.
- `store.setAuthState(userID, userName, token, expires)` wraps `addCookies`.
- Valid auth cookies cause `/login` to **redirect to `/profile`** — the `#login` button never appears. Use `/books` as the authenticated entry point.

### Registration
- `/register` uses **reCAPTCHA v3 (invisible)** — no visible checkbox, no `.g-recaptcha`. The score is assessed silently on submit. Tests may receive either the password validation message OR a reCAPTCHA challenge message. Always `expect(isValidation || isRecaptcha).toBe(true)`.
- All user creation for test setup goes through `POST /Account/v1/User` (API) — never through the register UI.

### Sidebar Navigation
- The left-panel accordion is **only pre-expanded** on `/books` and `/profile`. It is NOT reliable on `/login`.
- Sidebar clicks use `{ force: true }` (documented exception) because DemoQA ad iframes intercept pointer events.

### Profile Page
- Three buttons share `id="submit"`: Logout, Delete Account, Delete All Books.
- Always use `getByRole('button', { name: 'Logout' })` etc. — never `#submit`.

### Book Detail
- Direct URL (`/books?search={isbn}`) loads the book LIST, not detail view.
- Navigate via `store.navigateToBookDetail('Title')` which clicks from the list.
- URL pattern after navigation: `/books?search={isbn}` (uses `?search=`, not `?book=`).

### Delete Book — Bootstrap Modal
- Clicking the delete row icon opens a React-Bootstrap modal, NOT a native `window.confirm`.
- Confirm by clicking `#closeSmallModal-ok`. Do NOT use `page.once('dialog', ...)`.

### Add to Collection — Native Alert
- Clicking "Add To Your Collection" fires a native `alert`. Use `page.waitForEvent('dialog')` before clicking to capture it.

### API Quirks
| Endpoint | Quirk |
|---|---|
| `POST /GenerateToken` | Always returns HTTP 200; check `body.status === "Failed"` for auth failure |
| `POST /Authorized` | Returns bare JSON `true`/`false`, NOT an object; on wrong password returns **404** not 400 |
| `DELETE /User/{UUID}` (wrong UUID) | Returns **200** (not 404) with `{"message":"User Id not correct!"}` |
| `GET /User/{UUID}` (wrong UUID) | Returns **401** (not 404) with `"User not found!"` |
| `DELETE /BookStore/v1/Books` | `UserId` must be a **query param** (`?UserId=`), not in the request body |

### Accessibility
- Exclude from axe scans: `header`, `.left-pannel`, `.btn-outline-secondary`, `iframe[id^="google_ads_iframe_"]`
- Disable rules: `color-contrast`, `aria-command-name` (all vendor-side issues)
- Only fail on `critical` and `serious` impact — use `getCriticalViolations()` from `tests/e2e/helpers.ts`

---

## Test ID Naming Convention

| Suite | Prefix | Example |
|---|---|---|
| Account — Create User | `ACCU` | `ACCU-001` |
| Account — Generate Token | `ACGT` | `ACGT-001` |
| Account — Authorized | `ACAZ` | `ACAZ-001` |
| Account — Get User | `ACGU` | `ACGU-001` |
| Account — Delete User | `ACDU` | `ACDU-001` |
| BookStore — Get Books | `BSGL` | `BSGL-001` |
| BookStore — Get Book | `BSGB` | `BSGB-001` |
| BookStore — Add Books | `BSAB` | `BSAB-001` |
| BookStore — Delete All | `BSDA` | `BSDA-001` |
| BookStore — Replace Book | `BSRB` | `BSRB-001` |
| BookStore — Delete Book | `BSDB` | `BSDB-001` |
| UI — Register | `REG` | `REG-001` |
| UI — Login | `LOG` | `LOG-001` |
| UI — Book List | `BKL` | `BKL-001` |
| UI — Book Detail | `BKD` | `BKD-001` |
| UI — Profile | `PRF` | `PRF-001` |
| UI — Accessibility | `A11Y` | `A11Y-001` |

---

## Adding New Tests

### New API Test
1. Use `createTestUser` + `generateToken` + `deleteTestUser` from `tests/api/helpers.ts` in `beforeAll`/`afterAll`.
2. Declare only the variables actually used in test bodies at describe level (inline `user.userName`, `user.password` if only needed in `beforeAll`).
3. Every JSON response body: `const body: unknown = await resp.json(); Schema.parse(body)`.
4. Assert the Swagger status code, not the observed one.

### New UI Test
1. Declare `let store: BookStore` at describe level.
2. Assign in `test.beforeEach(async ({ page }) => { store = new BookStore(page); })`.
3. Add any shared navigation to `beforeEach` if all tests in the describe start at the same page.
4. No locator strings or navigation calls inside test bodies — only POM method calls and assertions.
5. Import shared constants from `tests/e2e/testData.ts`.
6. Import shared utilities from `tests/e2e/helpers.ts`.

### New Page Class Method
1. Add locator as a `readonly` property in the constructor.
2. Add JSDoc with `@param` + `@returns` before the method.
3. Use `scrollIntoViewIfNeeded()` before clicks.
4. Use web-first assertions inside action methods when waiting is needed.
5. Never use `waitForTimeout()`.
