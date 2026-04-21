import { expect, test } from '@playwright/test';
import { createTestUser, deleteTestUser, generateToken } from '../helpers';
import {
  UserResponseSchema,
  ApiErrorSchema,
  HttpStatus,
  UserMessage,
} from '../../../types';
import { TEST_ISBN, REPLACEMENT_ISBN } from '../testData';

test.describe('PUT /BookStore/v1/Books/{ISBN} — Replace Book', () => {
  let userID = '';
  let token = '';

  test.beforeAll(async ({ request }) => {
    const user = await createTestUser(request, 'bsrb');
    userID = user.userID;
    token = await generateToken(request, user.userName, user.password);
  });

  test.afterAll(async ({ request }) => {
    await deleteTestUser(request, userID, token);
  });

  test.beforeEach(async ({ request }) => {
    // Start each test with a clean collection containing only the original book
    await request.delete(`/BookStore/v1/Books?UserId=${userID}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    await request.post('/BookStore/v1/Books', {
      data: { userId: userID, collectionOfIsbns: [{ isbn: TEST_ISBN }] },
      headers: { Authorization: `Bearer ${token}` },
    });
  });

  test('BSRB-001: valid replace returns 200 with updated user object', async ({
    request,
  }) => {
    const resp = await request.put(
      `/BookStore/v1/Books/${TEST_ISBN}`,
      {
        data: { userId: userID, isbn: REPLACEMENT_ISBN },
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    expect(resp.status()).toBe(HttpStatus.OK);

    const body: unknown = await resp.json();
    const parsed = UserResponseSchema.parse(body);

    expect(parsed.userId).toBe(userID);
    const replacedBook = parsed.books.find((b) => b.isbn === REPLACEMENT_ISBN);
    expect(replacedBook).toBeDefined();
    const originalBook = parsed.books.find((b) => b.isbn === TEST_ISBN);
    expect(originalBook).toBeUndefined();
  });

  test('BSRB-002: invalid replacement ISBN returns 400', async ({
    request,
  }) => {
    const resp = await request.put(
      `/BookStore/v1/Books/${TEST_ISBN}`,
      {
        data: { userId: userID, isbn: '0000000000000' },
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    expect(resp.status()).toBe(HttpStatus.BAD_REQUEST);

    const body: unknown = await resp.json();
    const err = ApiErrorSchema.parse(body);
    expect(err.message).toBe(UserMessage.ISBN_NOT_IN_CATALOGUE);
  });

  test('BSRB-003: missing auth token returns 401', async ({ request }) => {
    const resp = await request.put(
      `/BookStore/v1/Books/${TEST_ISBN}`,
      { data: { userId: userID, isbn: REPLACEMENT_ISBN } }
    );

    expect(resp.status()).toBe(HttpStatus.UNAUTHORIZED);

    const body: unknown = await resp.json();
    const err = ApiErrorSchema.parse(body);
    expect(err.message).toBe(UserMessage.USER_NOT_AUTHORIZED);
  });
});
