import { expect, test } from '@playwright/test';
import { createTestUser, deleteTestUser, generateToken } from '../helpers';
import {
  UserResponseSchema,
  ApiErrorSchema,
  HttpStatus,
  UserMessage,
} from '../../../types';

test.describe('GET /Account/v1/User/{UUID} — Get User', () => {
  let userID = '';
  let userName = '';
  let password = '';
  let token = '';

  test.beforeAll(async ({ request }) => {
    const user = await createTestUser(request, 'acgu');
    userID = user.userID;
    userName = user.userName;
    password = user.password;
    token = await generateToken(request, userName, password);
  });

  test.afterAll(async ({ request }) => {
    await deleteTestUser(request, userID, token);
  });

  test('ACGU-001: valid UUID and token return user schema (200)', async ({
    request,
  }) => {
    const resp = await request.get(`/Account/v1/User/${userID}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(resp.status()).toBe(HttpStatus.OK);

    const body: unknown = await resp.json();
    const parsed = UserResponseSchema.parse(body);
    expect(parsed.userId).toBe(userID);
    expect(parsed.username).toBe(userName);
    expect(parsed.books).toHaveLength(0);
  });

  test('ACGU-002: missing auth token returns 401', async ({ request }) => {
    const resp = await request.get(`/Account/v1/User/${userID}`);

    expect(resp.status()).toBe(HttpStatus.UNAUTHORIZED);

    const body: unknown = await resp.json();
    const err = ApiErrorSchema.parse(body);
    expect(err.message).toBe(UserMessage.USER_NOT_AUTHORIZED);
  });

  test('ACGU-003: non-existent UUID returns 401 with User not found', async ({
    request,
  }) => {
    const resp = await request.get(
      '/Account/v1/User/00000000-0000-0000-0000-000000000000',
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // DemoQA returns 401 (not 404) when the UUID is not found
    expect(resp.status()).toBe(HttpStatus.UNAUTHORIZED);

    const body: unknown = await resp.json();
    const err = ApiErrorSchema.parse(body);
    expect(err.message).toBe(UserMessage.USER_NOT_FOUND);
  });
});
