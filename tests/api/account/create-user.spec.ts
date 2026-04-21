import { expect, test } from '@playwright/test';
import { createTestUser, deleteTestUser, generateToken } from '../helpers';
import {
  CreateUserResponseSchema,
  ApiErrorSchema,
  HttpStatus,
  UserMessage,
} from '../../../types';

test.describe('POST /Account/v1/User — Create User', () => {
  test('ACCU-001: valid credentials create a user and return correct schema (201)', async ({
    request,
  }) => {
    const user = await createTestUser(request, 'accu001');
    const token = await generateToken(request, user.userName, user.password);

    // Re-fetch the creation response shape by creating a second user
    const userName = `accu001b_${Date.now()}`;
    const password = 'Test@1234!';

    const resp = await request.post('/Account/v1/User', {
      data: { userName, password },
    });

    expect(resp.status()).toBe(HttpStatus.CREATED);

    const body: unknown = await resp.json();
    // Zod parse validates the exact response shape
    const parsed = CreateUserResponseSchema.parse(body);
    expect(parsed.username).toBe(userName);
    expect(parsed.books).toHaveLength(0);

    // Cleanup both users
    const token2 = await generateToken(request, userName, password);
    await deleteTestUser(request, parsed.userID, token2);
    await deleteTestUser(request, user.userID, token);
  });

  /**
   * ACCU-002 intentionally fails.
   * Swagger spec: POST /User with missing fields → 406
   * Actual server: → 400
   * This test documents the deviation; it will fail until the server is fixed.
   */
  test('ACCU-002 [EXPECTED FAIL — Swagger bug]: missing userName/password returns 406 per spec', async ({
    request,
  }) => {
    const resp = await request.post('/Account/v1/User', { data: {} });

    // Swagger defines 406 for this case; server actually returns 400.
    // Assertion is against the Swagger spec to document the deviation.
    expect(resp.status()).toBe(HttpStatus.NOT_ACCEPTABLE);

    const body: unknown = await resp.json();
    const err = ApiErrorSchema.parse(body);
    expect(err.message).toBe(UserMessage.USER_PASSWORD_REQUIRED);
  });

  /**
   * ACCU-003 intentionally fails.
   * Swagger spec: POST /User with a weak password → 406
   * Actual server: → 400
   * This test documents the deviation; it will fail until the server is fixed.
   */
  test('ACCU-003 [EXPECTED FAIL — Swagger bug]: weak password returns 406 per spec', async ({
    request,
  }) => {
    const resp = await request.post('/Account/v1/User', {
      data: { userName: `weak_${Date.now()}`, password: 'nospecial123' },
    });

    // Swagger defines 406 for this case; server actually returns 400.
    expect(resp.status()).toBe(HttpStatus.NOT_ACCEPTABLE);

    const body: unknown = await resp.json();
    const err = ApiErrorSchema.parse(body);
    expect(err.message).toBe(UserMessage.INVALID_PASSWORD);
  });

  test('ACCU-004: duplicate username returns 406 with "User exists!" message', async ({
    request,
  }) => {
    const user = await createTestUser(request, 'accu004');
    const token = await generateToken(request, user.userName, user.password);

    const resp = await request.post('/Account/v1/User', {
      data: { userName: user.userName, password: user.password },
    });

    expect(resp.status()).toBe(HttpStatus.NOT_ACCEPTABLE);
    const body: unknown = await resp.json();
    const err = ApiErrorSchema.parse(body);
    expect(err.message).toBe(UserMessage.USER_EXISTS);

    await deleteTestUser(request, user.userID, token);
  });
});
