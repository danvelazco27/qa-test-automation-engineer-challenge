import { expect, test } from '@playwright/test';
import { createTestUser, deleteTestUser, generateToken } from '../helpers';
import { ApiErrorSchema, HttpStatus, UserMessage } from '../../../types';

/** ISBN of "Git Pocket Guide" — added before each delete test. */
const TEST_ISBN = '9781449325862';

test.describe('DELETE /BookStore/v1/Books — Delete All Books', () => {
  let userID = '';
  let token = '';

  test.beforeAll(async ({ request }) => {
    const user = await createTestUser(request, 'bsda');
    userID = user.userID;
    token = await generateToken(request, user.userName, user.password);
  });

  test.afterAll(async ({ request }) => {
    await deleteTestUser(request, userID, token);
  });

  test('BSDA-001: valid userId clears the collection and returns 204', async ({
    request,
  }) => {
    // Add a book first so there is something to delete
    await request.post('/BookStore/v1/Books', {
      data: { userId: userID, collectionOfIsbns: [{ isbn: TEST_ISBN }] },
      headers: { Authorization: `Bearer ${token}` },
    });

    const resp = await request.delete(`/BookStore/v1/Books?UserId=${userID}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(resp.status()).toBe(HttpStatus.NO_CONTENT);
    expect(await resp.text()).toBe('');
  });

  test('BSDA-002: missing auth token returns 401', async ({ request }) => {
    const resp = await request.delete(`/BookStore/v1/Books?UserId=${userID}`);

    expect(resp.status()).toBe(HttpStatus.UNAUTHORIZED);

    const body: unknown = await resp.json();
    const err = ApiErrorSchema.parse(body);
    expect(err.message).toBe(UserMessage.USER_NOT_AUTHORIZED);
  });
});
