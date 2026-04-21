import { expect, test } from '@playwright/test';
import { BookItemSchema, ApiErrorSchema, HttpStatus, UserMessage } from '../../../types';

/** ISBN of "Git Pocket Guide" — the primary test book. */
const VALID_ISBN = '9781449325862';

test.describe('GET /BookStore/v1/Book?ISBN= — Get Single Book', () => {
  test('BSGB-001: valid ISBN returns 200 with book matching schema', async ({
    request,
  }) => {
    const resp = await request.get(`/BookStore/v1/Book?ISBN=${VALID_ISBN}`);

    expect(resp.status()).toBe(HttpStatus.OK);

    const body: unknown = await resp.json();
    const parsed = BookItemSchema.parse(body);

    expect(parsed.isbn).toBe(VALID_ISBN);
    expect(parsed.title).toBe('Git Pocket Guide');
    expect(parsed.subTitle).toBe('A Working Introduction');
    expect(parsed.author).toContain('Richard E. Silverman');
    expect(parsed.publisher).toBe("O'Reilly Media");
    expect(parsed.pages).toBe(234);
  });

  test('BSGB-002: unknown ISBN returns 400 with appropriate error', async ({
    request,
  }) => {
    const resp = await request.get('/BookStore/v1/Book?ISBN=0000000000000');

    expect(resp.status()).toBe(HttpStatus.BAD_REQUEST);

    const body: unknown = await resp.json();
    const err = ApiErrorSchema.parse(body);
    expect(err.message).toBe(UserMessage.ISBN_NOT_IN_CATALOGUE);
  });

  test('BSGB-003: endpoint is accessible without authentication', async ({
    request,
  }) => {
    const resp = await request.get(`/BookStore/v1/Book?ISBN=${VALID_ISBN}`);
    expect(resp.status()).toBe(HttpStatus.OK);

    const body: unknown = await resp.json();
    BookItemSchema.parse(body);
  });
});
