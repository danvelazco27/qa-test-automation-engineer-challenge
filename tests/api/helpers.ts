import type { APIRequestContext } from '@playwright/test';

/**
 * Describes the credentials and identity of a disposable test user.
 * Returned by {@link createTestUser} and consumed by clean-up calls.
 */
export interface TestUser {
  /** UUID assigned by the server on account creation. */
  userID: string;
  /** The username chosen for this test user. */
  userName: string;
  /** The plaintext password used to create this account. */
  password: string;
}

/**
 * Creates a disposable test user via `POST /Account/v1/User` with a
 * timestamp-based unique username and the standard test password.
 * Always call {@link deleteTestUser} in `afterAll` to avoid orphaned accounts.
 *
 * @param request - Playwright APIRequestContext from the test fixture.
 * @param prefix - Optional username prefix (default: `'api_test'`).
 * @returns Promise resolving to the new user's identity and credentials.
 */
export async function createTestUser(
  request: APIRequestContext,
  prefix = 'api_test'
): Promise<TestUser> {
  const userName = `${prefix}_${Date.now()}`;
  const password = 'Test@1234!';

  const resp = await request.post('/Account/v1/User', {
    data: { userName, password },
  });

  const body = (await resp.json()) as { userID: string };
  return { userID: body.userID, userName, password };
}

/**
 * Obtains a valid Bearer JWT token for an existing user via
 * `POST /Account/v1/GenerateToken`.
 *
 * @param request - Playwright APIRequestContext from the test fixture.
 * @param userName - The username of the target user.
 * @param password - The plaintext password of the target user.
 * @returns Promise resolving to the JWT token string.
 */
export async function generateToken(
  request: APIRequestContext,
  userName: string,
  password: string
): Promise<string> {
  const resp = await request.post('/Account/v1/GenerateToken', {
    data: { userName, password },
  });
  const body = (await resp.json()) as { token: string };
  return body.token;
}

/**
 * Deletes a test user account via `DELETE /Account/v1/User/{UUID}`.
 * Safe to call even if the user was never fully set up — checks guard against
 * empty `userID` or `token` strings before issuing the request.
 *
 * @param request - Playwright APIRequestContext from the test fixture.
 * @param userID - UUID of the user to delete.
 * @param token - Valid Bearer token for authentication.
 * @returns Promise that resolves when the deletion request completes.
 */
export async function deleteTestUser(
  request: APIRequestContext,
  userID: string,
  token: string
): Promise<void> {
  if (!userID || !token) return;
  await request.delete(`/Account/v1/User/${userID}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
