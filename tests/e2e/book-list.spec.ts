import { expect, test } from '@playwright/test';
import { BookStore } from '../../pages/BookStore';

test.describe('Book List page', () => {
  let store: BookStore;

  test.beforeEach(async ({ page }) => {
    store = new BookStore(page);
    await store.navigateToBookStore();
  });

  test('BKL-001: default book list shows exactly 8 books', async () => {
    await store.bookList.waitForBookCount(8);
    expect(await store.bookList.getBookCount()).toBe(8);
  });

  test('BKL-002: search by exact title returns 1 result', async () => {
    await store.bookList.search('Git Pocket Guide');
    await store.bookList.waitForBookCount(1);

    expect(await store.bookList.getBookCount()).toBe(1);
    await expect(store.bookList.bookTitleLinks.first()).toContainText('Git Pocket Guide');
  });

  test('BKL-003: partial title search filters to multiple matching books', async () => {
    await store.bookList.search('JavaScript');
    // Catalogue has 4 books with "JavaScript" in their title:
    // Learning JavaScript Design Patterns, Speaking JavaScript,
    // Programming JavaScript Applications, Eloquent JavaScript
    await store.bookList.waitForBookCount(4);

    expect(await store.bookList.getBookCount()).toBe(4);
  });

  test('BKL-004: search by author name filters results', async () => {
    await store.bookList.search('Kyle Simpson');
    await store.bookList.waitForBookCount(1);

    await expect(store.bookList.bookTitleLinks.first()).toContainText("You Don't Know JS");
  });

  test('BKL-005: search with no match shows empty state', async () => {
    await store.bookList.search('xyznonexistent999abc');
    await store.bookList.waitForBookCount(0);

    expect(await store.bookList.getBookCount()).toBe(0);
    expect(await store.bookList.isEmpty()).toBe(true);
  });

  test('BKL-006: clicking a book title navigates to its detail URL', async ({ page }) => {
    await store.bookList.clickBook('Git Pocket Guide');

    // URL must contain the query-string book detail pattern
    await expect(page).toHaveURL(/\/books\?search=9781449325862/);
  });
});
