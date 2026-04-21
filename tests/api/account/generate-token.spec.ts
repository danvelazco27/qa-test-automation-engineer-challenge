import { expect, test } from '@playwright/test';
import { createTestUser, deleteTestUser, generateToken } from '../helpers';
import {
  TokenResponseSchema,
  ApiErrorSchema,
  HttpStatus,
  UserMessage,
} from '../../../types';

test.describe('POST /Account/v1/GenerateToken — Generate Token', () => {
  let userID = '';
  let userName = '';
  let password = '';
  let cleanupToken = '';

  test.beforeAll(async ({ request }) => {
    const user = await createTestUser(request, 'acgt');
    userID = user.userID;
    userName = user.userName;
    password = user.password;
    cleanupToken = await generateToken(request, userName, password);
  });

  test.afterAll(async ({ request }) => {
    await deleteTestUser(request, userID, cleanupToken);
  });

  test('ACGT-001: valid credentials return a token with correct schema (200)', async ({
    request,
  }) => {
    const resp = await request.post('/Account/v1/GenerateToken', {
      data: { userName, password },
    });

    expect(resp.status()).toBe(HttpStatus.OK);

    const body: unknown = await resp.json();
    const parsed = TokenResponseSchema.parse(body);

    expect(parsed.status).toBe('Success');
    expect(parsed.result).toBe(UserMessage.TOKEN_SUCCESS);
    expect(parsed.token).toBeTruthy();
    expect(parsed.expires).toBeTruthy();
  });

  test('ACGT-002: wrong password returns 200 with Failed status and null token', async ({
    request,
  }) => {
    const resp = await request.post('/Account/v1/GenerateToken', {
      data: { userName, password: 'WrongPass@999' },
    });

    // GenerateToken always returns 200, even on auth failure
    expect(resp.status()).toBe(HttpStatus.OK);

    const body: unknown = await resp.json();
    const parsed = TokenResponseSchema.parse(body);

    expect(parsed.status).toBe('Failed');
    expect(parsed.result).toBe(UserMessage.TOKEN_FAILED);
    expect(parsed.token).toBeNull();
    expect(parsed.expires).toBeNull();
  });

  test('ACGT-003: empty body returns 400 with missing fields error', async ({
    request,
  }) => {
    const resp = await request.post('/Account/v1/GenerateToken', { data: {} });

    expect(resp.status()).toBe(HttpStatus.BAD_REQUEST);

    const body: unknown = await resp.json();
    const err = ApiErrorSchema.parse(body);
    expect(err.message).toBe(UserMessage.USER_PASSWORD_REQUIRED);
  });
});
