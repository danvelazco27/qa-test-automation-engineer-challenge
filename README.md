# DemoQA Book Store — Test Automation Framework

Full-stack test automation suite for [https://demoqa.com/books](https://demoqa.com/books), built as a QA Engineer challenge submission.

---

## Why Playwright?

| Feature | How it helps |
|---|---|
| **Auto-wait** | Every action (click, fill, select) and every assertion automatically waits for the element to be ready. No manual `sleep` or explicit waits needed — tests are fast and reliable by default. |
| **Multi-browser & mobile** | Chromium, Firefox, and WebKit plus any device viewport (e.g. Pixel 5) are configured in a single `playwright.config.ts`. Switching or adding a browser/device is a one-liner. |
| **Parallel execution** | Tests run across multiple workers out of the box. Worker count is a single config value — `workers: 4` in CI, `workers: 2` locally. |
| **Retries** | `retries: 2` in CI automatically re-runs flaky tests before marking them as failed. Zero config beyond a single line. |
| **Docker image** | The official `mcr.microsoft.com/playwright` image ships with all browsers and OS dependencies pre-installed. Running the full suite in a container requires no extra setup beyond the two-stage `Dockerfile` in this repo. |
| **GitHub Actions integration** | Playwright outputs JUnit XML natively, which plugs directly into `dorny/test-reporter` for PR summaries. Browser caching via `actions/cache` works out of the box using the `package-lock.json` hash as the cache key. |
| **Built-in API testing** | The `request` fixture handles REST API calls in the same test runner, same config, and same HTML report as UI tests — no separate tool needed. |
| **Developer tooling** | `playwright codegen` generates test code by recording browser interactions. `playwright-cli` enables programmatic DOM inspection and API probing from the terminal. The Playwright MCP server integrates Playwright directly with AI assistants for test generation and exploration. |
| **Debugging — reports & artifacts** | `screenshot: 'only-on-failure'`, `video: 'on-first-retry'`, and `trace: 'on-first-retry'` are single config values. Every failure produces a screenshot, a video replay, and a step-by-step trace, all bundled in the HTML report. |
| **Debugging — UI Mode** | `npx playwright test --ui` opens a desktop application with a live test tree, time-travel trace viewer, locator inspector, and watch mode — all without leaving the terminal. |

---

## Prerequisites

- **Node.js** ≥ 24 — [https://nodejs.org](https://nodejs.org)
- **Docker** (optional, for containerised runs) — [https://docs.docker.com/get-docker](https://docs.docker.com/get-docker)

---

## Installation

```bash
npm ci
npx playwright install --with-deps
```

---

## Running the Tests

| Command | What it runs |
|---|---|
| `npm run lint` | ESLint — TypeScript + Playwright plugin rules |
| `npm run test:api` | All API tests (33 tests across 11 endpoints) |
| `npm run test:ui` | UI + accessibility tests on Chromium and Mobile Chrome |
| `npm run test` | Full suite — API + UI (all projects) |
| `npm run test:coverage` | UI tests on Chromium with V8 JS coverage — output in `reports/coverage/` |
| `npm run test:report` | Open the last HTML report in a browser |

### Run in Docker

```bash
docker build -t demoqa-tests .
docker run --rm demoqa-tests
```

Override the base URL at runtime:

```bash
docker run --rm -e BASE_URL=https://staging.example.com demoqa-tests
```

---

## What the Tests Cover

### API Tests (`tests/api/`) — 33 tests

Full coverage of the DemoQA REST API with runtime Zod schema validation on every JSON response body.

| File | Test IDs | Endpoint | Scenarios |
|---|---|---|---|
| `account/create-user.spec.ts` | ACCU-001…004 | `POST /Account/v1/User` | Create, missing fields, weak password, duplicate username |
| `account/generate-token.spec.ts` | ACGT-001…003 | `POST /Account/v1/GenerateToken` | Success, wrong password, empty body |
| `account/authorized.spec.ts` | ACAZ-001…003 | `POST /Account/v1/Authorized` | Valid credentials, wrong password, empty body |
| `account/get-user.spec.ts` | ACGU-001…003 | `GET /Account/v1/User/{UUID}` | Success, no token, wrong UUID |
| `account/delete-user.spec.ts` | ACDU-001…003 | `DELETE /Account/v1/User/{UUID}` | Success, no token, wrong UUID |
| `bookstore/get-books.spec.ts` | BSGL-001…003 | `GET /BookStore/v1/Books` | Schema, field spot-check, unauthenticated access |
| `bookstore/get-book.spec.ts` | BSGB-001…003 | `GET /BookStore/v1/Book?ISBN=` | Valid ISBN, unknown ISBN, unauthenticated access |
| `bookstore/add-books.spec.ts` | BSAB-001…003 | `POST /BookStore/v1/Books` | Add valid, invalid ISBN, no token |
| `bookstore/delete-all-books.spec.ts` | BSDA-001…002 | `DELETE /BookStore/v1/Books` | Clear collection, no token |
| `bookstore/replace-book.spec.ts` | BSRB-001…003 | `PUT /BookStore/v1/Books/{ISBN}` | Replace, invalid ISBN, no token |
| `bookstore/delete-book.spec.ts` | BSDB-001…003 | `DELETE /BookStore/v1/Book` | Delete owned, not in collection, no token |

**Intentionally failing tests**: ACCU-002 and ACCU-003 assert HTTP 406 per the Swagger contract. The server returns 400. These tests document a confirmed deviation between the Swagger spec and the implementation — they are expected to fail.

**Note on API test approach**: The challenge lists Postman and Swagger as bonus formats for API validation. This submission uses Playwright's `request` fixture with Zod schema validation instead. The coverage is equivalent — every endpoint, every status code, every response body is validated — and the results appear in the same HTML report as the UI tests.

### UI Tests (`tests/e2e/`) — 31 tests per project (Chromium + Mobile Chrome)

| File | Test IDs | Covers |
|---|---|---|
| `register.spec.ts` | REG-001…005 | Field visibility, empty form, weak password, back-to-login, duplicate username |
| `login.spec.ts` | LOG-001…005 | Valid login, wrong password, unknown user, empty form, redirect preservation |
| `book-list.spec.ts` | BKL-001…006 | Default 8 books, exact/partial/author search, empty state, click-to-detail |
| `book-detail.spec.ts` | BKD-001…004 | Metadata fields, back button, unauthenticated add redirect, authenticated add |
| `profile.spec.ts` | PRF-001…006 | Username display, unauthenticated redirect, empty collection, add/delete book, logout |
| `a11y.spec.ts` | A11Y-001…005 | WCAG 2.1 AA via axe-core on all 5 key pages |

**Multiple screen sizes**: UI tests run on `Desktop Chrome` (1280×720) and `Pixel 5` mobile viewport (`mobile-chrome`).

---

## Project Structure

```
tests/
  api/
    helpers.ts               ← createTestUser, generateToken, deleteTestUser
    account/                 ← 5 spec files (Account service)
    bookstore/               ← 6 spec files (BookStore service)
  e2e/
    utils.ts                 ← buildAxe(), getCriticalViolations() — shared accessibility helpers
    testData.ts              ← TEST_ISBN, TEST_TITLE — shared test constants
    a11y.spec.ts
    book-detail.spec.ts
    book-list.spec.ts
    login.spec.ts
    profile.spec.ts
    register.spec.ts
pages/
  BookStore.ts               ← Facade — entry point for all UI tests
  LoginFormPage.ts
  RegisterPage.ts
  BookListPage.ts
  BookDetailPage.ts
  ProfilePage.ts
types/
  models.ts                  ← Zod schemas for all API responses
  enums.ts                   ← HttpStatus, ApiEndpoints, UserMessage
  index.ts                   ← Barrel export
docs/
  TESTING_PLAN.md            ← Full test strategy, locator map, API matrix, known deviations
.github/
  workflows/ci.yml           ← GitHub Actions pipeline
Dockerfile
playwright.config.ts
```

---

## Architecture Notes

All UI tests use the **Page Object Model** with a `BookStore` facade as the single entry point:

```typescript
const store = new BookStore(page);
await store.navigateToBookStore();
await store.bookList.searchFor('Git Pocket Guide');
```

Every locator lives as a `readonly` class property. No selector strings appear in test files. Authentication is injected via cookies (`userID`, `userName`, `token`, `expires`) — DemoQA uses cookie-based auth, not localStorage.

See `docs/TESTING_PLAN.md` for the full architecture diagram, verified locator map, and API coverage matrix.

---

## Accessibility Testing — [`@axe-core/playwright`](https://www.npmjs.com/package/@axe-core/playwright) and WCAG

### What is a11y?

**a11y** is a numeronym for **accessibility**: the letter *a*, eleven letters, the letter *y*. It is the widely used shorthand in the web industry for building products that people with disabilities can use — visual, motor, cognitive, or auditory.

### What is WCAG?

**[WCAG (Web Content Accessibility Guidelines)](https://www.w3.org/WAI/standards-guidelines/wcag/)** is the international standard for web accessibility, published by the W3C. It is organised into:

| Level | Meaning |
|---|---|
| **A** | Minimum — the most basic requirements. A site that fails Level A has fundamental barriers for some users. |
| **AA** | Standard — the target for most legal compliance requirements (EU Accessibility Act, ADA, Section 508). |
| **AAA** | Enhanced — aspirational; not required for general conformance. |

WCAG is versioned. The tests in this suite target **WCAG 2.0 A + AA and WCAG 2.1 A + AA** simultaneously via `withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])`.

### What axe-core actually checks

`@axe-core/playwright` injects the axe-core engine into the live browser page and analyses the DOM against a catalogue of rules. Each rule maps to one or more WCAG success criteria. Examples of what runs:

| axe rule | WCAG criterion | What it catches |
|---|---|---|
| `image-alt` | 1.1.1 | `<img>` without an `alt` attribute — screen readers cannot describe the image |
| `label` | 1.3.1 | `<input>` without an associated `<label>` — form fields are unlabelled for screen readers |
| `color-contrast` | 1.4.3 | Text whose foreground/background contrast ratio is below 4.5:1 — unreadable for low-vision users |
| `aria-*` rules | 4.1.2 | Incorrect or missing ARIA roles and attributes — misled assistive technologies |
| `keyboard` / `focusable` | 2.1.1 | Interactive elements that cannot be reached or activated by keyboard alone |
| `link-name` | 4.1.2 | `<a>` tags with no accessible text — screen reader announces an empty or meaningless link |
| `aria-hidden-focus` | 4.1.2 | Focusable elements inside `aria-hidden` containers — keyboard focus disappears into a void |

### Impact levels and what this suite enforces

axe-core assigns every violation an impact level. This suite filters with `getCriticalViolations()` and only fails on:

| Impact | Tests fail? | Meaning |
|---|---|---|
| **critical** | Yes | Completely blocks access for some users (e.g. interactive element with no accessible name) |
| **serious** | Yes | Significant barrier; most users with the relevant disability are affected |
| **moderate** | No (informational) | Creates friction but workarounds exist |
| **minor** | No (informational) | Best-practice issue; minimal real-world impact |

### Why certain elements and rules are excluded

DemoQA is a third-party test site. Several violations exist in vendor-controlled parts of the page that this application cannot fix. Excluding them keeps the suite focused on *application-level* accessibility rather than flagging known vendor issues on every run:

| Exclusion | Reason |
|---|---|
| `header` | DemoQA's logo `<img>` has no `alt` text; the wrapping `<a>` has no accessible name — vendor HTML |
| `.left-pannel` | Sidebar accordion toggle has no `aria-label` or visible text — vendor navigation widget |
| `.btn-outline-secondary` | Search icon buttons contain only an SVG with no text label — vendor UI component |
| `color-contrast` rule | DemoQA's color scheme does not meet AA contrast ratios throughout — vendor CSS |
| `aria-command-name` rule | Left-panel accordion renders unnamed ARIA link widgets — vendor navigation markup |
| `iframe[id^="google_ads_iframe_"]` | Google Ads iframes contain `aria-hidden` violations and unnamed links — third-party ad content |

---

## Coverage Metrics — [`c8`](https://www.npmjs.com/package/c8)

### How V8 coverage works

**c8** uses the **V8 JavaScript engine's built-in coverage instrumentation** — the same engine that powers Chromium. When Playwright runs UI tests in Chromium, V8 tracks exactly which lines and branches of every JavaScript file were executed. `c8` reads those raw V8 coverage objects and converts them into human-readable reports.

Unlike Istanbul (which rewrites source code to add counters), V8 coverage is zero-overhead and requires no source transformation.

### What `npm run test:coverage` does

```
c8 --reporter=html --reporter=text --reports-dir=reports/coverage \
   npx playwright test tests/e2e --project=chromium
```

| Part | Role |
|---|---|
| `c8` | Wraps the command and collects V8 coverage data while it runs |
| `--reporter=html` | Generates a browsable HTML report at `reports/coverage/` showing covered (green) and uncovered (red) lines |
| `--reporter=text` | Prints a summary table to the terminal with `% stmts`, `% branch`, `% funcs`, `% lines` per file |
| `--reports-dir=reports/coverage` | Output directory |
| `--project=chromium` | Coverage is Chromium-only — V8 is the engine; Firefox and WebKit use different engines and do not emit V8 coverage |

### What the coverage measures

The coverage reflects **demoqa.com's own JavaScript** that was executed during the UI test run — not the test code itself. It answers: *"of all the client-side code paths on this site, how many did our tests actually exercise?"*

This is most useful for identifying untested user flows: a low-coverage branch signals a code path that no test currently reaches.

### Interpreting the metrics

| Metric | Measures |
|---|---|
| **Statements** | Individual executable statements hit at least once |
| **Branches** | Both sides of every `if/else`, ternary, and `&&`/`||` expression |
| **Functions** | Functions that were called at least once |
| **Lines** | Executable lines hit (similar to statements but line-granular) |

Open the HTML report with `npm run test:report` or by opening `reports/coverage/index.html` directly in a browser.

---

## CI/CD

GitHub Actions runs on every `push` to `main`, every pull request, and on-demand via `workflow_dispatch`.

Pipeline stages:
1. Lint
2. UI tests — Chromium
3. UI tests — Mobile Chrome
4. API tests
5. Upload `reports/` artifact (HTML report, JUnit XML, screenshots, traces, videos)
6. Publish test summary

All test steps use `continue-on-error: true` so the full report is generated regardless of failures. The uploaded artifact contains everything needed to debug any failing test.

---

## Known Limitations

| Limitation | Detail |
|---|---|
| **reCAPTCHA v3 on /register** | The register page uses invisible reCAPTCHA v3. There is no visible widget to interact with. Form-validation tests (empty fields, weak password, back-to-login) work fully. Tests requiring a real registered user go through the API (`POST /Account/v1/User`) to bypass CAPTCHA. |
| **DemoQA ad overlays** | Fixed-position Google Ad iframes occasionally intercept clicks. Sidebar navigation uses `{ force: true }` where documented. Some tests may be flaky in CI due to ad load timing. |
| **Shared `#submit` IDs** | Three profile-page buttons share `id="submit"`. All profile locators use `getByRole('button', { name: '...' })`. |
| **Intentionally failing tests** | ACCU-002 and ACCU-003 assert the Swagger-documented 406 status; the server returns 400. These failures document a real contract deviation. |

---

## What Could Be Improved

- **Visual regression**: `toHaveScreenshot()` for pixel-level comparison of key pages across releases.
- **Postman collection**: A parallel Postman collection would make API tests accessible to non-developer testers.
- **Contract testing**: Pact.js consumer-driven contract tests would catch Swagger deviations automatically at build time.
- **Performance budgets**: Playwright's `page.metrics()` could assert Time to Interactive thresholds.
- **Dedicated staging environment**: Running against a controlled environment would eliminate ad-overlay flakiness and CAPTCHA uncertainty entirely.
- **Firefox and WebKit in CI**: Currently only Chromium and Mobile Chrome run in CI. Firefox and WebKit are configured in `playwright.config.ts` and can be enabled by adding `--project=firefox --project=webkit` to the `test:ui` script.
