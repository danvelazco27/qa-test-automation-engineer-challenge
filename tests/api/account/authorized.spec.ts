import { expect, test } from '@playwright/test';
import { createTestUser, deleteTestUser, generateToken } from '../helpers';
import {
  AuthorizedResponseSchema,
  ApiErrorSchema,
  HttpStatus,
  UserMessage,
} from '../../../types';

test.describe('POST /Account/v1/Authorized — Authorized', () => {
  let userID = '';
  let userName = '';
  let password = '';
  let cleanupToken = '';

  test.beforeAll(async ({ request }) => {
    const user = await createTestUser(request, 'acaz');
    userID = user.userID;
    userName = user.userName;
    password = user.password;
    cleanupToken = await generateToken(request, userName, password);
  });

  test.afterAll(async ({ request }) => {
    await deleteTestUser(request, userID, cleanupToken);
  });

  test('ACAZ-001: valid credentials return bare boolean true (200)', async ({
    request,
  }) => {
    const resp = await request.post('/Account/v1/Authorized', {
      data: { userName, password },
    });

    expect(resp.status()).toBe(HttpStatus.OK);

    // DemoQA returns a bare JSON boolean, not an object
    const body: unknown = await resp.json();
    const result = AuthorizedResponseSchema.parse(body);
    expect(result).toBe(true);
  });

  test('ACAZ-002: wrong password returns 404 with User not found error', async ({
    request,
  }) => {
    const resp = await request.post('/Account/v1/Authorized', {
      data: { userName, password: 'WrongPass@999' },
    });

    expect(resp.status()).toBe(HttpStatus.NOT_FOUND);

    const body: unknown = await resp.json();
    const err = ApiErrorSchema.parse(body);
    expect(err.message).toBe(UserMessage.USER_NOT_FOUND);
  });

  test('ACAZ-003: empty body returns 400 with missing fields error', async ({
    request,
  }) => {
    const resp = await request.post('/Account/v1/Authorized', { data: {} });

    expect(resp.status()).toBe(HttpStatus.BAD_REQUEST);

    const body: unknown = await resp.json();
    const err = ApiErrorSchema.parse(body);
    expect(err.message).toBe(UserMessage.USER_PASSWORD_REQUIRED);
  });
});
