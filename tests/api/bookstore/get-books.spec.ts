import { expect, test } from '@playwright/test';
import { BooksResponseSchema, HttpStatus } from '../../../types';
import { TEST_ISBN } from '../testData';

test.describe('GET /BookStore/v1/Books — Get All Books', () => {
  test('BSGL-001: returns 200 with books array matching schema', async ({
    request,
  }) => {
    const resp = await request.get('/BookStore/v1/Books');

    expect(resp.status()).toBe(HttpStatus.OK);

    const body: unknown = await resp.json();
    const parsed = BooksResponseSchema.parse(body);

    // DemoQA catalogue always has exactly 8 books
    expect(parsed.books).toHaveLength(8);
  });

  test('BSGL-002: each book contains all required fields with correct types', async ({
    request,
  }) => {
    const resp = await request.get('/BookStore/v1/Books');
    const body: unknown = await resp.json();
    const parsed = BooksResponseSchema.parse(body);

    // Spot-check the well-known Git Pocket Guide entry
    const gitBook = parsed.books.find((b) => b.isbn === TEST_ISBN);
    expect(gitBook).toBeDefined();
    expect(gitBook?.title).toBe('Git Pocket Guide');
    expect(gitBook?.author).toBe('Richard E. Silverman');
    expect(gitBook?.publisher).toBe("O'Reilly Media");
    expect(gitBook?.pages).toBeGreaterThan(0);
    expect(gitBook?.isbn).toBe(TEST_ISBN);
  });

  test('BSGL-003: endpoint is accessible without authentication', async ({
    request,
  }) => {
    // No Authorization header — books catalogue is public
    const resp = await request.get('/BookStore/v1/Books');
    expect(resp.status()).toBe(HttpStatus.OK);

    const body: unknown = await resp.json();
    BooksResponseSchema.parse(body);
  });
});
