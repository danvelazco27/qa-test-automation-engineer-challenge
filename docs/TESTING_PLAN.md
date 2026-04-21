# Testing Plan — DemoQA Book Store Automation Framework

## 1. Framework Description & Technology Choices

### Overview
This framework automates UI end-to-end and REST API tests for the **DemoQA Book Store Application** (`https://demoqa.com/books`). It is built as a QA Engineer challenge submission demonstrating production-quality test architecture.

### Technology Stack

| Tool | Version | Rationale |
|---|---|---|
| **Node.js** | 24.14.1 | LTS runtime with native ESM and V8 coverage support |
| **Playwright** | 1.59.1 | Cross-browser automation + built-in `request` fixture for API testing — single framework for both suites, eliminating the need for separate tools like Cypress + Supertest |
| **TypeScript** | 5.8.x | Type safety accelerates POM development and prevents runtime errors from API shape mismatches |
| **Zod** | 3.24.x | Runtime schema validation for API responses — failures generate precise error messages pointing to the exact field mismatch |
| **ESLint 8** | 8.57.x | Enforces `no-wait-for-timeout`, `prefer-web-first-assertions`, and `no-explicit-any` across the suite |
| **@axe-core/playwright** | 4.10.x | WCAG 2.1 accessibility validation integrated directly into Playwright tests |
| **c8** | 10.x | V8 coverage reporting from Playwright's Chromium coverage API |

**Why Playwright over Cypress?**  
Playwright provides native TypeScript support without a separate compilation step, a built-in `request` fixture that handles both UI and API tests in the same runner/reporter, multi-browser support (Chromium, Firefox, WebKit) with a single config, Pixel 5 mobile viewport simulation, and the `playwright-cli` tool used during this exploration phase.

---

## 2. Architecture Diagram

```
┌──────────────────────────────── Test Layer ─────────────────────────────────┐
│                                                                              │
│   tests/e2e/*.spec.ts                    tests/api/**/*.spec.ts              │
│   (UI + accessibility tests)             (REST API tests)                    │
│                                                                              │
└───────────────┬─────────────────────────────────────┬────────────────────────┘
                │                                     │
                ▼                                     ▼
┌───────────────────────────┐           ┌─────────────────────────────────────┐
│      BookStore (Facade)   │           │  Playwright request fixture          │
│      pages/BookStore.ts   │           │  + Zod schema validation             │
└───┬───────────────────────┘           │  + tests/api/helpers.ts              │
    │                                   └─────────────────────────────────────┘
    │  injects as dependencies
    │
    ├── loginForm  : LoginFormPage
    ├── register   : RegisterPage
    ├── bookList   : BookListPage
    ├── bookDetail : BookDetailPage
    └── profile    : ProfilePage
             │
             ▼
     Playwright Page API
     (locators, actions, assertions)
             │
             ▼
    https://demoqa.com
    (React SPA + REST API)
```

---

## 3. Verified Locator Map

All selectors confirmed via live exploration with `playwright-cli` and programmatic DOM inspection.

### 3.1 Login Page (`/login`)

| Element | Selector | Type | Notes |
|---|---|---|---|
| Username input | `#userName` | `input[type=text]` | placeholder="UserName" |
| Password input | `#password` | `input[type=password]` | placeholder="Password" |
| Login button | `#login` | `button` | |
| New User button | `#newUser` | `button` | Navigates to /register |
| Error container | `#output` | `div` | Visible after failed login |
| Error text | `#name` | element inside `#output` | Text: "Invalid username or password!" |

### 3.2 Register Page (`/register`)

| Element | Selector | Type | Notes |
|---|---|---|---|
| First Name input | `#firstname` | `input[type=text]` | |
| Last Name input | `#lastname` | `input[type=text]` | |
| Username input | `#userName` | `input[type=text]` | |
| Password input | `#password` | `input[type=text]` | |
| Register button | `#register` | `button` | reCAPTCHA v3 score assessed silently on submit |
| Back to Login button | `#gotologin` | `button` | |
| Empty field error | HTML5 native validation | — | Browser shows "Please fill out this field." |
| Weak password error | `page.getByText(/Passwords must have/)` | `p/div` | React-rendered message text |

> **reCAPTCHA v3 (invisible)**: Verified with `playwright-cli` — the `/register` page loads a **reCAPTCHA v3** script (`api.js?render=6LfupSksAAAAALHNQnHsBoy3J8S7I79ujAhpQJwy`), NOT reCAPTCHA v2. There is **no visible checkbox widget** and no `.g-recaptcha` element in the DOM. reCAPTCHA v3 runs silently and assigns a risk score to the submission, which the server evaluates. In a headless Playwright browser the score will be low; demoqa.com's server may accept or reject the submission at its discretion. UI form-validation tests (empty fields, weak password, back-to-login navigation) do not require a successful submission and are fully automatable. User creation for tests that require authenticated state still goes via `POST /Account/v1/User` API to avoid any server-side CAPTCHA score rejection.

### 3.3 Book List Page (`/books`)

| Element | Selector | Type | Notes |
|---|---|---|---|
| Search input | `#searchBox` | `input[type=text]` | ReactTable has debounce |
| Book title links | `.rt-tbody .rt-td a` | `a` | 8 total books |
| Book title spans | `#see-book-{title}` | `span` | e.g. `#see-book-Git Pocket Guide` |
| Table column headers | `.rt-thead .rt-th` | `div` | Image, Title, Author, Publisher |
| Empty state | `.rt-noData` | `div` | "No rows found" — visible when search yields 0 |
| Login button (nav) | `#login` | `button` | Visible when not authenticated |

**All 8 books in catalogue:**

| # | Title | ISBN | Author | Publisher |
|---|---|---|---|---|
| 1 | Git Pocket Guide | `9781449325862` | Richard E. Silverman | O'Reilly Media |
| 2 | Learning JavaScript Design Patterns | `9781449331818` | Addy Osmani | O'Reilly Media |
| 3 | Designing Evolvable Web APIs with ASP.NET | `9781449337711` | Glenn Block et al. | O'Reilly Media |
| 4 | Speaking JavaScript | `9781449365035` | Axel Rauschmayer | O'Reilly Media |
| 5 | You Don't Know JS | `9781491904244` | Kyle Simpson | O'Reilly Media |
| 6 | Programming JavaScript Applications | `9781491950296` | Eric Elliott | O'Reilly Media |
| 7 | Eloquent JavaScript, Second Edition | `9781593275846` | Marijn Haverbeke | No Starch Press |
| 8 | Understanding ECMAScript 6 | `9781593277574` | Nicholas C. Zakas | No Starch Press |

### 3.4 Book Detail Page (`/books?book={isbn}`)

| Element | Selector | Type | Notes |
|---|---|---|---|
| Page URL pattern | `/books?book={isbn}` | URL | React Router URL after clicking from list |
| Back to Book Store button | `#submit` | `button` | Text: "Back To Book Store" |
| Add to Collection button | `#addNewRecordButton` | `button` | Text: "Add To Your Collection" |
| Field labels | `#ISBN-label`, `#title-label`, `#subtitle-label`, `#author-label`, `#publisher-label`, `#totalPages-label`, `#description-label`, `#website-label` | `label` | Standard DemoQA pattern — verify in Phase 2 |

> **Navigation quirk**: Direct URL load of `/books?book={isbn}` renders the book LIST, not the detail view. Navigation must happen via click from the book list. Use `await bookList.clickBook('title')` → `await page.waitForURL(/books\?book=/)`.

### 3.5 Profile Page (`/profile`)

| Element | Selector | Type | Notes |
|---|---|---|---|
| Username display | `#userName-value` | `label` | Shows logged-in username |
| Books label | `#userName-label` | `label` | "Books :" text (DemoQA reuses same ID) |
| Logout button | `page.getByRole('button', { name: 'Logout' })` | `button` | `id="#submit"` (shared) |
| Delete Account button | `page.getByRole('button', { name: 'Delete Account' })` | `button` | `id="#submit"` (shared) |
| Delete All Books button | `page.getByRole('button', { name: 'Delete All Books' })` | `button` | `id="#submit"` (shared) |
| Go To Book Store button | `#gotoStore` | `button` | Navigates to /books |
| Book collection table | `.rt-tbody .rt-tr-group` | row group | ReactTable rows |
| Delete row button | SVG within row | `button > svg` | No ID — located via row context |

> **Critical quirk**: The profile page uses `id="submit"` for THREE different buttons (Logout, Delete Account, Delete All Books). All locators must use `getByRole('button', { name: '...' })` not `#submit`.

> **Authentication strategy**: DemoQA's React app reads auth from **cookies**, not localStorage. Verified via live inspection after UI login: four session cookies are set — `userID`, `userName`, `token`, `expires`. Auth injection uses `page.context().addCookies([...])` which is context-scoped and can be called before any page navigation. `page.addInitScript()` localStorage injection does NOT work.

---

## 4. Test Cases

### 4.1 Register Component (`register.spec.ts`)

| ID | Scenario | Type | Inputs | Expected Result | Priority |
|---|---|---|---|---|---|
| REG-001 | All form fields are visible | Happy | Navigate to /register | `#firstname`, `#lastname`, `#userName`, `#password`, `#register`, `#gotologin` all visible | High |
| REG-002 | Empty form submission triggers validation | Edge | Click Register with all fields empty | HTML5 validation fires; form stays on /register | High |
| REG-003 | Weak password shows error message | Edge | Valid name/user + password="weakpass123" | Error text containing "Passwords must have at least one" visible | High |
| REG-004 | Back to Login button navigates to /login | Happy | Click `#gotologin` | URL becomes /login | Medium |
| REG-005 | Duplicate username shows error (via API + UI) | Edge | Pre-create user via API; fill same username + valid password; click Register | React error message shown (reCAPTCHA v3 is invisible — submission can be attempted; server may reject based on score; validate error message via API test ACCU-004 as fallback) | Medium |

### 4.2 Login Component (`login.spec.ts`)

| ID | Scenario | Type | Inputs | Expected Result | Priority |
|---|---|---|---|---|---|
| LOG-001 | Valid credentials redirect to /profile | Happy | API-created user credentials | URL becomes /profile; `#userName-value` shows username | High |
| LOG-002 | Wrong password shows error | Edge | Valid username + wrong password | `#output`/`#name` shows "Invalid username or password!"; URL stays /login | High |
| LOG-003 | Non-existent username shows error | Edge | Username not in system + any password | Same error message visible | High |
| LOG-004 | Empty form does not redirect | Edge | Click Login with empty fields | HTML5 validation fires; stays on /login | Medium |
| LOG-005 | Redirect preservation after login | Edge | Navigate to /profile → redirected to /login → login → | URL returns to /profile after successful login | Medium |

### 4.3 Book List Component (`book-list.spec.ts`)

| ID | Scenario | Type | Inputs | Expected Result | Priority |
|---|---|---|---|---|---|
| BKL-001 | Book list shows 8 books by default | Happy | Navigate to /books | `bookCount === 8`; all 8 titles visible | High |
| BKL-002 | Search by exact title returns 1 result | Happy | Search "Git Pocket Guide" | 1 row; title matches | High |
| BKL-003 | Search by partial title filters results | Happy | Search "JavaScript" | Multiple rows; all titles contain "JavaScript" | High |
| BKL-004 | Search by author filters results | Happy | Search "Kyle Simpson" | "You Don't Know JS" row visible | Medium |
| BKL-005 | Search with no match shows empty state | Edge | Search "xyznonexistent999" | `.rt-noData` visible; row count is 0 | High |
| BKL-006 | Clicking book title navigates to detail | Happy | Click "Git Pocket Guide" | URL matches `/books?book=9781449325862` | High |

### 4.4 Book Detail Component (`book-detail.spec.ts`)

| ID | Scenario | Type | Inputs | Expected Result | Priority |
|---|---|---|---|---|---|
| BKD-001 | All book metadata fields visible | Happy | Navigate to book detail | Title, author, publisher, ISBN, pages, website all visible with correct values | High |
| BKD-002 | Back button returns to book list | Happy | Click `#submit` (Back To Book Store) | URL returns to /books | High |
| BKD-003 | Unauthenticated add redirects to login | Edge | No auth state; click `#addNewRecordButton` | Redirect to /login | High |
| BKD-004 | Authenticated add to collection succeeds | Happy | Logged-in user; click Add To Your Collection | Success toast OR book appears in /profile collection | High |

### 4.5 Profile Component (`profile.spec.ts`)

| ID | Scenario | Type | Inputs | Expected Result | Priority |
|---|---|---|---|---|---|
| PRF-001 | Authenticated user's username is displayed | Happy | Login via UI | `#userName-value` text matches login username | High |
| PRF-002 | Unauthenticated access redirects to /login | Edge | Navigate to /profile without auth | URL becomes /login | High |
| PRF-003 | Freshly created user has empty collection | Happy | New user; navigate to /profile | ReactTable shows no book rows | Medium |
| PRF-004 | Book added via API appears in table | Happy | Add book via `POST /BookStore/v1/Books`; reload profile | Book title visible in `.rt-tbody .rt-tr-group` | High |
| PRF-005 | Delete book from collection removes it | Happy | Book in collection; click row delete button | Book row disappears after confirmation | High |
| PRF-006 | Logout clears session and redirects to /login | Happy | Click Logout button | URL becomes /login | High |

### 4.6 Accessibility (`a11y.spec.ts`)

| ID | Scenario | Type | Expected Result |
|---|---|---|---|
| A11Y-001 | Book list page has no critical axe violations | Accessibility | `checkA11y()` passes with no critical/serious violations |
| A11Y-002 | Login page has no critical axe violations | Accessibility | `checkA11y()` passes |
| A11Y-003 | Register page has no critical axe violations | Accessibility | `checkA11y()` passes |
| A11Y-004 | Book detail page has no critical axe violations | Accessibility | `checkA11y()` passes |
| A11Y-005 | Profile page has no critical axe violations | Accessibility | `checkA11y()` passes |

---

## 5. API Test Cases

### 5.1 Account Service

#### POST /Account/v1/User (`create-user.spec.ts`)

| ID | Status | Scenario | Validation | Passes? |
|---|---|---|---|---|
| ACCU-001 | 201 | Create user with valid credentials | `CreateUserResponseSchema.parse(body)` + `userID` is UUID + `username` matches input | ✅ |
| ACCU-002 | 406 | Missing userName and password | `code` present, `message` present | ⚠️ actual: 400 — **intentionally failing** |
| ACCU-003 | 406 | Weak password (no special chars/digits) | `code === "1300"`, password requirement message in `message` | ⚠️ actual: 400 — **intentionally failing** |
| ACCU-004 | 406 | Duplicate username | `code === "1204"`, `message === "User exists!"` | ✅ actual: 406 |

> **Swagger-defined error code for this endpoint is 406** (Not Acceptable). Tests ACCU-002 and ACCU-003 assert 406 per the Swagger spec; the actual implementation returns 400. These tests **intentionally fail**, documenting a divergence between the Swagger contract and the implementation.

#### POST /Account/v1/GenerateToken (`generate-token.spec.ts`)

| ID | Status | Scenario | Validation |
|---|---|---|---|
| TOK-001 | 200 | Valid credentials — success | `TokenResponseSchema.parse(body)` + `status === "Token Generated Successfully."` + `token` not null |
| TOK-002 | 200 | Wrong password — failure in body | `status === "Failed"` + `token === null` + `expires === null` |
| TOK-003 | 400 | Empty body | `code === "1200"`, `message === "UserName and Password required."` |

> **Quirk**: This endpoint ALWAYS returns HTTP 200. Auth failure is indicated by `body.status === "Failed"`, not by HTTP status code.

#### POST /Account/v1/Authorized (`authorized.spec.ts`)

| ID | Status | Scenario | Validation |
|---|---|---|---|
| AUT-001 | 200 | Valid credentials | `AuthorizedResponseSchema.parse(body)` → `true` (bare JSON boolean) |
| AUT-002 | 404 | Wrong password | `code === "1207"`, `message === "User not found!"` |
| AUT-003 | 400 | Empty body | `code === "1200"`, `message === "UserName and Password required."` |

> **Quirk**: Returns `404 "User not found!"` for wrong credentials — NOT `200 false` as swagger implies. Response for success is a BARE JSON boolean (`true`), not a JSON object.

#### GET /Account/v1/User/{UUID} (`get-user.spec.ts`)

| ID | Status | Scenario | Validation |
|---|---|---|---|
| GUS-001 | 200 | Valid user + valid token | `UserResponseSchema.parse(body)` + `userId` matches + `username` matches |
| GUS-002 | 401 | No Authorization header | `code === "1200"`, `message === "User not authorized!"` |
| GUS-003 | 401 | Wrong UUID with valid token | `code === "1207"`, `message === "User not found!"` — NOTE: returns 401 not 404 |

> **Field name quirk**: Create response returns `userID` (capital D) but GET response returns `userId` (lowercase d). Create returns `username` (lowercase n). Zod schemas must match the actual endpoint.

#### DELETE /Account/v1/User/{UUID} (`delete-user.spec.ts`)

| ID | Status | Scenario | Validation |
|---|---|---|---|
| DEL-001 | 204 | Valid delete with token | Empty response body |
| DEL-002 | 401 | No Authorization header | `code === "1200"` |
| DEL-003 | 401 | Wrong UUID | `code === "1207"`, `message === "User not found!"` — NOTE: returns 401 not 404 |

### 5.2 BookStore Service

#### GET /BookStore/v1/Books (`get-books.spec.ts`)

| ID | Status | Scenario | Validation |
|---|---|---|---|
| GBK-001 | 200 | Get all books | `BooksResponseSchema.parse(body)` + `books.length === 8` + first book has all 9 fields |

#### GET /BookStore/v1/Book?ISBN= (`get-book.spec.ts`)

| ID | Status | Scenario | Validation |
|---|---|---|---|
| SBK-001 | 200 | Valid ISBN `9781449325862` | `BookItemSchema.parse(body)` + `title === "Git Pocket Guide"` |
| SBK-002 | 400 | Invalid ISBN string | `code === "1205"`, `message === "ISBN supplied is not available in Books Collection!"` |
| SBK-003 | 500 | Missing ISBN parameter | Response is HTML (not JSON) — assert status 500 + use `.text()` |

> **Quirk**: Missing ISBN param returns HTTP 500 with HTML SPA page, not a JSON error.

#### POST /BookStore/v1/Books (`add-books.spec.ts`)

| ID | Status | Scenario | Validation |
|---|---|---|---|
| ADD-001 | 201 | Add valid book to collection | Response `books` array contains added ISBN |
| ADD-002 | 400 | Duplicate book (already in collection) | `code === "1210"`, `message === "ISBN already present in the User's Collection!"` |
| ADD-003 | 400 | Invalid ISBN | `code === "1205"` |
| ADD-004 | 401 | No Authorization header | `code === "1200"` or `"1207"` |

#### PUT /BookStore/v1/Books/{ISBN} (`replace-book.spec.ts`)

| ID | Status | Scenario | Validation |
|---|---|---|---|
| RPL-001 | 200 | Replace owned book with valid ISBN | User object returned with updated books array |
| RPL-002 | 400 | Replace with invalid target ISBN | `code === "1205"` |
| RPL-003 | 400 | Replace ISBN not in user's collection | `code === "1206"`, `message === "ISBN supplied is not available in User's Collection!"` |
| RPL-004 | 401 | No Authorization header | `code === "1200"` |

#### DELETE /BookStore/v1/Book (`delete-book.spec.ts`)

| ID | Status | Scenario | Validation |
|---|---|---|---|
| BSDB-001 | 204 | Delete owned book | Empty response body |
| BSDB-002 | 400 | Delete ISBN not in collection | `ApiErrorSchema.parse(body)` + `message === "ISBN supplied is not available in User's Collection!"` |
| BSDB-003 | 401 | No Authorization header | `ApiErrorSchema.parse(body)` + `message === "User not authorized!"` |

#### DELETE /BookStore/v1/Books (`delete-all-books.spec.ts`)

| ID | Status | Scenario | Validation |
|---|---|---|---|
| DLA-001 | 204 | Delete all books via query param | `DELETE /BookStore/v1/Books?UserId={userID}` → 204 + empty body |
| DLA-002 | 401 | No Authorization header | `code === "1200"` |

> **Critical quirk**: The DELETE all books endpoint requires `UserId` as a **query parameter** (`?UserId={userID}`), NOT in the request body. Sending `userId` in the body returns 401 "User Id not correct!".

---

## 6. Edge Cases & Error Handling Summary

| Category | Edge Case | Mitigation |
|---|---|---|
| **reCAPTCHA v3** | `/register` loads invisible reCAPTCHA v3 — no visible widget | No UI interaction needed; form-validation tests work; API used for user creation |
| **Ad overlays** | Fixed-position Google Ad iframes may intercept clicks | `scrollIntoViewIfNeeded()` before all clicks; `{ force: true }` documented when necessary |
| **ReactTable debounce** | Search input has debounce before table updates | `await page.waitForFunction(() => ...)` or wait for row count stabilization |
| **Shared `#submit` IDs** | 3 different buttons share `id="submit"` on profile page | Always use `getByRole('button', { name: '...' })` for profile buttons |
| **Direct URL book detail** | `/books?book={isbn}` direct load shows list, not detail | Navigate via click from list; use `waitForURL(/books\?book=/)` |
| **Token always 200** | `/GenerateToken` returns 200 even for failures | Assert `body.status === "Token Generated Successfully."` not just HTTP status |
| **Field name inconsistency** | Create user returns `userID` (capital D) but GET returns `userId` (lowercase d) | Use separate Zod schemas per endpoint |
| **DELETE single book** | `DELETE /BookStore/v1/Book` returns HTTP 500 for all scenarios (Swagger: 204) | Tests intentionally fail; documented in Known API Deviations section |
| **DELETE all books** | Requires `UserId` as query param, not request body | Use `params: { UserId: userID }` in Playwright request options |
| **GET /Book (no ISBN)** | Returns HTTP 500 + HTML page | Test asserts status 500; does not call `.json()` |
| **Profile auth** | DemoQA uses **cookies** (not localStorage) for auth: `token`, `expires`, `userID`, `userName` | Use `page.context().addCookies([...])` — context-scoped, works before any navigation |
| **Password requirements** | Minimum 8 chars + upper + lower + digit + special char | Test user passwords: `Test@1234!` format |

---

## 7. API Coverage Matrix

Tests assert **Swagger-defined** status codes. Rows marked ⚠️ will intentionally fail where actual behavior diverges.

| Endpoint | Method | Swagger Success | Swagger Error | Intentionally Fails? | Schema |
|---|---|---|---|---|---|
| /Account/v1/User | POST | ✅ 201 | 406 weak/dup ⚠️ actual: 400 for weak | ACCU-002, ACCU-003 | ✅ CreateUserResponseSchema |
| /Account/v1/GenerateToken | POST | ✅ 200 | ✅ 400 empty | — | ✅ TokenResponseSchema |
| /Account/v1/Authorized | POST | ✅ 200 true | ✅ 400 empty / 404 nonexistent | — | ✅ z.boolean() |
| /Account/v1/User/{UUID} | GET | ✅ 200 | ✅ 401 no token / wrong UUID | — | ✅ UserResponseSchema |
| /Account/v1/User/{UUID} | DELETE | ✅ 204 | ✅ 401 no token / wrong UUID | — | — |
| /BookStore/v1/Books | GET | ✅ 200 | — | — | ✅ BooksResponseSchema |
| /BookStore/v1/Books | POST | ✅ 201 | ✅ 400 invalid/dup / 401 no token | — | response array |
| /BookStore/v1/Books | DELETE | ✅ 204 | ✅ 401 no token | — | — |
| /BookStore/v1/Book | GET | ✅ 200 | ✅ 400 invalid ISBN | — | ✅ BookItemSchema |
| /BookStore/v1/Books/{ISBN} | PUT | ✅ 200 | ✅ 400 invalid/not owned / 401 no token | — | ✅ UserResponseSchema |
| /BookStore/v1/Book | DELETE | ✅ 204 | ✅ 400 not in collection / 401 no token | — | — |

---

## 8. Known API Deviations (Swagger vs Implementation)

> **Testing philosophy**: All API tests assert the **Swagger-contract response** (not the observed implementation behavior). Where the implementation deviates from the Swagger spec, the test **intentionally fails** — this documents the bug as a first-class artefact in the test report.

Deviations identified via `playwright-cli` exploration and direct API probing:

| # | Endpoint | Scenario | Swagger Expects | Actual Response | Test IDs Affected | Severity |
|---|---|---|---|---|---|---|
| 1 | `POST /Account/v1/User` | Weak password (no special char) | **406** Not Acceptable | **400** Bad Request | ACCU-003 | Medium — wrong HTTP status code; error body is still present |
| 2 | `POST /Account/v1/User` | Missing userName/password | **406** Not Acceptable | **400** Bad Request | ACCU-002 | Medium — same as above |

**Notes on deviations discovered but within Swagger-documented codes:**
- `DELETE /Account/v1/User/{UUID}` with an invalid token returns **200** with `{"code":"1207","message":"User Id not correct!"}` — unusual (200 for an error), but Swagger explicitly documents a 200 response for this endpoint alongside 204 and 401.
- `GET /Account/v1/User/{UUID}` with a wrong UUID returns **401** with `"User not found!"` — semantically it should be 404, but Swagger only documents 200 and 401, so this is within spec.
- `POST /Account/v1/Authorized` with wrong password returns **404** — Swagger documents 200, 400, and 404, so 404 is within the documented contract.

---

## 9. Accessibility Coverage

Accessibility checks via `@axe-core/playwright` run against 5 key pages:

| Page | Auth Required | Violations Scope |
|---|---|---|
| `/books` | No | Book list, search, navigation |
| `/login` | No | Form inputs, labels, error messages |
| `/register` | No | Form inputs, labels |
| `/books?book=9781449325862` | No | Book detail fields, buttons |
| `/profile` | Yes (UI login) | Table, buttons, navigation |

Tests configured to fail on `critical` and `serious` violations only, allowing `moderate` and `minor` to be informational.

---

## 10. Coverage Metrics Approach

### Functional Coverage (Primary)
The test case tables above represent the **full identified test inventory**. Coverage % is calculated as:
```
Automated tests / Total identified test cases × 100
```

Current target (all phases complete):
- **UI functional**: 26 tests / 26 identified = **100%**
- **Accessibility**: 5 tests / 5 pages = **100%**
- **API**: ~36 tests covering 11 endpoints × 3–4 status codes = **100%**

### V8 JavaScript Coverage (Secondary)
Run `npm run test:coverage` to collect Chromium V8 coverage of demoqa.com's JavaScript during UI test execution. `c8` generates an HTML report at `reports/coverage/`. This shows which application code paths were exercised.

---

## 11. CI/CD Integration

### GitHub Actions Workflow (`.github/workflows/ci.yml`)
Triggers:
- `push` to `main`
- All pull requests
- Manual (`workflow_dispatch`) with choice of `all | ui | api`

Stages:
1. Setup Node 24 + cache
2. `npm ci`
3. Cache Playwright browsers
4. `npx playwright install --with-deps`
5. Lint
6. UI tests — Chromium (`continue-on-error: true`)
7. UI tests — Mobile Chrome (`continue-on-error: true`)
8. API tests (`continue-on-error: true`)
9. Upload `reports/` artifact (screenshots, traces, videos) — always runs
10. Publish JUnit summary via `dorny/test-reporter@v1` — always runs

All test steps use `continue-on-error: true` so the full report is generated regardless of failures.

### Debugging Failing Tests
Playwright is configured with:
- `screenshot: 'only-on-failure'` — visual snapshot at point of failure
- `trace: 'on-first-retry'` — step-by-step trace viewer (open with `npx playwright show-trace`)
- `video: 'on-first-retry'` — replay the test execution

All artefacts are uploaded to GitHub Actions as workflow artefacts retained for 30 days.

---

## 12. Test Data

### Test Users
All test users created dynamically in `beforeAll` hooks via `POST /Account/v1/User`:
- Username format: `test_{category}_{timestamp}` (e.g., `test_login_1776731746743`)
- Password: `Test@1234!` (satisfies: ≥8 chars, upper, lower, digit, special)
- Cleaned up in `afterAll` via `DELETE /Account/v1/User/{UUID}`

### Known ISBNs (seeded data — does not change)
Use `9781449325862` (Git Pocket Guide) as the primary test ISBN for add/remove operations.

### Password Policy
```
Minimum 8 characters
At least 1 uppercase letter (A–Z)
At least 1 lowercase letter (a–z)
At least 1 digit (0–9)
At least 1 special character (non-alphanumeric)
```

Weak password examples (for negative tests): `weakpass`, `weakpass123`, `WEAKPASS!`
