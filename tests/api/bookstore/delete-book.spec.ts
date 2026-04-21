import { expect, test } from '@playwright/test';
import { createTestUser, deleteTestUser, generateToken } from '../helpers';
import { ApiErrorSchema, HttpStatus, UserMessage } from '../../../types';

/** ISBN of "Git Pocket Guide" — the book used in all delete tests. */
const TEST_ISBN = '9781449325862';

test.describe('DELETE /BookStore/v1/Book — Delete Single Book', () => {
  let userID = '';
  let userName = '';
  let password = '';
  let token = '';

  test.beforeAll(async ({ request }) => {
    const user = await createTestUser(request, 'bsdb');
    userID = user.userID;
    userName = user.userName;
    password = user.password;
    token = await generateToken(request, userName, password);
  });

  test.afterAll(async ({ request }) => {
    await deleteTestUser(request, userID, token);
  });

  test('BSDB-001: book in collection is deleted and returns 204', async ({
    request,
  }) => {
    // Add the book first
    await request.post('/BookStore/v1/Books', {
      data: { userId: userID, collectionOfIsbns: [{ isbn: TEST_ISBN }] },
      headers: { Authorization: `Bearer ${token}` },
    });

    const resp = await request.delete('/BookStore/v1/Book', {
      data: { isbn: TEST_ISBN, userId: userID },
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(resp.status()).toBe(HttpStatus.NO_CONTENT);
    expect(await resp.text()).toBe('');
  });

  test('BSDB-002: ISBN not in collection returns 400', async ({ request }) => {
    // Ensure collection is empty
    await request.delete(`/BookStore/v1/Books?UserId=${userID}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const resp = await request.delete('/BookStore/v1/Book', {
      data: { isbn: TEST_ISBN, userId: userID },
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(resp.status()).toBe(HttpStatus.BAD_REQUEST);

    const body: unknown = await resp.json();
    const err = ApiErrorSchema.parse(body);
    expect(err.message).toBe(UserMessage.ISBN_NOT_IN_COLLECTION);
  });

  test('BSDB-003: missing auth token returns 401', async ({ request }) => {
    const resp = await request.delete('/BookStore/v1/Book', {
      data: { isbn: TEST_ISBN, userId: userID },
    });

    expect(resp.status()).toBe(HttpStatus.UNAUTHORIZED);

    const body: unknown = await resp.json();
    const err = ApiErrorSchema.parse(body);
    expect(err.message).toBe(UserMessage.USER_NOT_AUTHORIZED);
  });
});
