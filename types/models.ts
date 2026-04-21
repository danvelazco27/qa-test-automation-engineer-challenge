import { z } from 'zod';

// ─── Book schemas ────────────────────────────────────────────────────────────

/**
 * A single book from the DemoQA catalogue.
 * Source: GET /BookStore/v1/Books → books[] and GET /BookStore/v1/Book?ISBN=
 *
 * Field casing note: `subTitle` uses mixed case; `publish_date` uses snake_case.
 */
export const BookItemSchema = z.object({
  isbn: z.string(),
  title: z.string(),
  subTitle: z.string(),
  author: z.string(),
  publish_date: z.string(),
  publisher: z.string(),
  pages: z.number(),
  description: z.string(),
  website: z.string(),
});
export type BookItem = z.infer<typeof BookItemSchema>;

/**
 * Response body for GET /BookStore/v1/Books.
 * Returns the full catalogue regardless of authentication.
 */
export const BooksResponseSchema = z.object({
  books: z.array(BookItemSchema),
});
export type BooksResponse = z.infer<typeof BooksResponseSchema>;

// ─── User / Account schemas ──────────────────────────────────────────────────

/**
 * Request body for POST /Account/v1/User and POST /Account/v1/GenerateToken.
 */
export const UserCredentialsSchema = z.object({
  userName: z.string(),
  password: z.string(),
});
export type UserCredentials = z.infer<typeof UserCredentialsSchema>;

/**
 * Response body for POST /Account/v1/User (201 Created).
 *
 * Field casing note: `userID` (uppercase ID, not userId) in the CREATE response.
 * The GET /Account/v1/User/{UUID} response uses `userId` (lowercase d) instead.
 */
export const CreateUserResponseSchema = z.object({
  userID: z.string().uuid(),
  username: z.string(),
  books: z.array(z.unknown()),
});
export type CreateUserResponse = z.infer<typeof CreateUserResponseSchema>;

/**
 * Response body for GET /Account/v1/User/{UUID} (200 OK).
 *
 * Field casing note: `userId` (lowercase id) here, vs `userID` in the create response.
 */
export const UserResponseSchema = z.object({
  userId: z.string().uuid(),
  username: z.string(),
  books: z.array(BookItemSchema),
});
export type UserResponse = z.infer<typeof UserResponseSchema>;

// ─── Token schema ────────────────────────────────────────────────────────────

/**
 * Response body for POST /Account/v1/GenerateToken (always HTTP 200).
 * On success: token/expires are strings, status="Success".
 * On failure: token/expires are null, status="Failed".
 */
export const TokenResponseSchema = z.object({
  token: z.string().nullable(),
  expires: z.string().nullable(),
  status: z.string(),
  result: z.string(),
});
export type TokenResponse = z.infer<typeof TokenResponseSchema>;

// ─── Error schema ────────────────────────────────────────────────────────────

/**
 * Standard error response body returned by DemoQA API endpoints.
 * Source: any 4xx/5xx response with a JSON body.
 */
export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

// ─── BookStore operation schemas ─────────────────────────────────────────────

/**
 * Request body for POST /BookStore/v1/Books (add books to collection).
 */
export const AddBooksRequestSchema = z.object({
  userId: z.string().uuid(),
  collectionOfIsbns: z.array(z.object({ isbn: z.string() })),
});
export type AddBooksRequest = z.infer<typeof AddBooksRequestSchema>;

/**
 * Response body for POST /BookStore/v1/Books (201 Created).
 * Returns only the ISBNs that were added, not full book objects.
 */
export const AddBooksResponseSchema = z.object({
  books: z.array(z.object({ isbn: z.string() })),
});
export type AddBooksResponse = z.infer<typeof AddBooksResponseSchema>;

/**
 * Request body for PUT /BookStore/v1/Books/{ISBN} (replace a book in collection).
 */
export const ReplaceBookRequestSchema = z.object({
  userId: z.string().uuid(),
  isbn: z.string(),
});
export type ReplaceBookRequest = z.infer<typeof ReplaceBookRequestSchema>;

/**
 * Response body for POST /Account/v1/Authorized.
 * DemoQA returns a bare JSON boolean (not an object) — `true` when valid,
 * `false` is never actually returned; invalid credentials give 404 instead.
 */
export const AuthorizedResponseSchema = z.boolean();
export type AuthorizedResponse = z.infer<typeof AuthorizedResponseSchema>;
