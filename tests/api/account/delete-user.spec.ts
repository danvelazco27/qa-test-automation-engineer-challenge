import { expect, test } from '@playwright/test';
import { createTestUser, generateToken } from '../helpers';
import {
  ApiErrorSchema,
  HttpStatus,
  UserMessage,
} from '../../../types';

test.describe('DELETE /Account/v1/User/{UUID} — Delete User', () => {
  test('ACDU-001: valid UUID and token delete the user (204)', async ({
    request,
  }) => {
    // Create a dedicated user to delete
    const user = await createTestUser(request, 'acdu001');
    const token = await generateToken(request, user.userName, user.password);

    const resp = await request.delete(`/Account/v1/User/${user.userID}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(resp.status()).toBe(HttpStatus.NO_CONTENT);
    // 204 No Content — body must be empty
    expect(await resp.text()).toBe('');
  });

  test('ACDU-002: missing auth token returns 401', async ({ request }) => {
    const user = await createTestUser(request, 'acdu002');
    const token = await generateToken(request, user.userName, user.password);

    const resp = await request.delete(`/Account/v1/User/${user.userID}`);

    expect(resp.status()).toBe(HttpStatus.UNAUTHORIZED);

    const body: unknown = await resp.json();
    const err = ApiErrorSchema.parse(body);
    expect(err.message).toBe(UserMessage.USER_NOT_AUTHORIZED);

    // Cleanup — user was not deleted, must clean up
    await request.delete(`/Account/v1/User/${user.userID}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  });

  test('ACDU-003: wrong UUID returns 200 with error body (Swagger-documented behaviour)', async ({
    request,
  }) => {
    const user = await createTestUser(request, 'acdu003');
    const token = await generateToken(request, user.userName, user.password);

    const resp = await request.delete(
      '/Account/v1/User/00000000-0000-0000-0000-000000000000',
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // DemoQA returns 200 (not 404) with an error body for an unknown UUID —
    // this is the documented Swagger behaviour for this endpoint.
    expect(resp.status()).toBe(HttpStatus.OK);

    const body: unknown = await resp.json();
    const err = ApiErrorSchema.parse(body);
    // DELETE /User returns "User Id not correct!" for unknown UUID (not "User not found!")
    expect(err.message).toBe(UserMessage.USER_ID_NOT_CORRECT);

    // Cleanup the real user
    await request.delete(`/Account/v1/User/${user.userID}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  });
});
