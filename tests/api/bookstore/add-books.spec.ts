import { expect, test } from '@playwright/test';
import { createTestUser, deleteTestUser, generateToken } from '../helpers';
import {
  AddBooksResponseSchema,
  ApiErrorSchema,
  HttpStatus,
  UserMessage,
} from '../../../types';
import { TEST_ISBN } from '../testData';

test.describe('POST /BookStore/v1/Books — Add Books to Collection', () => {
  let userID = '';
  let userName = '';
  let password = '';
  let token = '';

  test.beforeAll(async ({ request }) => {
    const user = await createTestUser(request, 'bsab');
    userID = user.userID;
    userName = user.userName;
    password = user.password;
    token = await generateToken(request, userName, password);
  });

  test.afterAll(async ({ request }) => {
    await deleteTestUser(request, userID, token);
  });

  test.afterEach(async ({ request }) => {
    // Remove all books between tests to keep the collection clean
    await request.delete(`/BookStore/v1/Books?UserId=${userID}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  });

  test('BSAB-001: valid ISBN adds book and returns 201 with isbn list', async ({
    request,
  }) => {
    const resp = await request.post('/BookStore/v1/Books', {
      data: { userId: userID, collectionOfIsbns: [{ isbn: TEST_ISBN }] },
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(resp.status()).toBe(HttpStatus.CREATED);

    const body: unknown = await resp.json();
    const parsed = AddBooksResponseSchema.parse(body);
    expect(parsed.books).toHaveLength(1);
    expect(parsed.books[0].isbn).toBe(TEST_ISBN);
  });

  test('BSAB-002: invalid ISBN returns 400 with appropriate error', async ({
    request,
  }) => {
    const resp = await request.post('/BookStore/v1/Books', {
      data: { userId: userID, collectionOfIsbns: [{ isbn: '0000000000000' }] },
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(resp.status()).toBe(HttpStatus.BAD_REQUEST);

    const body: unknown = await resp.json();
    const err = ApiErrorSchema.parse(body);
    expect(err.message).toBe(UserMessage.ISBN_NOT_IN_CATALOGUE);
  });

  test('BSAB-003: missing auth token returns 401', async ({ request }) => {
    const resp = await request.post('/BookStore/v1/Books', {
      data: { userId: userID, collectionOfIsbns: [{ isbn: TEST_ISBN }] },
    });

    expect(resp.status()).toBe(HttpStatus.UNAUTHORIZED);

    const body: unknown = await resp.json();
    const err = ApiErrorSchema.parse(body);
    expect(err.message).toBe(UserMessage.USER_NOT_AUTHORIZED);
  });
});
