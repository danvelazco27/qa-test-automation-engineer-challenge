/**
 * HTTP status codes used across API test assertions.
 * Always assert against these constants rather than raw numbers so that
 * a changed expectation is a single-line diff.
 */
export enum HttpStatus {
  /** Request succeeded; body contains the resource. */
  OK = 200,
  /** Resource created successfully. */
  CREATED = 201,
  /** Request succeeded with no body to return. */
  NO_CONTENT = 204,
  /** Request body was malformed or contained invalid values. */
  BAD_REQUEST = 400,
  /** Caller is not authenticated or the token is invalid. */
  UNAUTHORIZED = 401,
  /** Caller is authenticated but lacks permission for the resource. */
  FORBIDDEN = 403,
  /** The requested resource does not exist (also used for auth failures). */
  NOT_FOUND = 404,
  /** Request could not be processed due to a conflict with current state. */
  NOT_ACCEPTABLE = 406,
  /** Server encountered an unexpected condition. */
  INTERNAL_SERVER_ERROR = 500,
}

/**
 * DemoQA REST API endpoint paths.
 * Centralises path strings so that a renamed route is a single-line fix.
 */
export enum ApiEndpoints {
  /** Create a new user account. */
  CREATE_USER = '/Account/v1/User',
  /** Generate a Bearer JWT token for an existing user. */
  GENERATE_TOKEN = '/Account/v1/GenerateToken',
  /** Check whether a user's credentials are valid (returns bare boolean). */
  AUTHORIZED = '/Account/v1/Authorized',
  /** Get or delete a specific user by UUID. */
  USER_BY_ID = '/Account/v1/User',
  /** Get the full book catalogue. */
  GET_BOOKS = '/BookStore/v1/Books',
  /** Add books to a user's collection. */
  ADD_BOOKS = '/BookStore/v1/Books',
  /** Delete all books from a user's collection (requires UserId query param). */
  DELETE_ALL_BOOKS = '/BookStore/v1/Books',
  /** Get or replace a book by ISBN. */
  BOOK_BY_ISBN = '/BookStore/v1/Book',
  /** Get a single book by ISBN query parameter. */
  GET_BOOK = '/BookStore/v1/Book',
  /** Delete a single book from a user's collection. */
  DELETE_BOOK = '/BookStore/v1/Book',
}

/**
 * Known API response message strings from DemoQA.
 * Used in test assertions to verify exact error/success messages.
 */
export enum UserMessage {
  /** Returned when attempting to create a user with an existing username. */
  USER_EXISTS = 'User exists!',
  /** Returned when userName or password is missing from the request body. */
  USER_PASSWORD_REQUIRED = 'UserName and Password required.',
  /** Returned when credentials are missing or invalid for auth endpoints. */
  USER_NOT_AUTHORIZED = 'User not authorized!',
  /** Returned when the specified user UUID does not exist (GET /User and Authorized endpoints). */
  USER_NOT_FOUND = 'User not found!',
  /**
   * Returned by DELETE /Account/v1/User/{UUID} when the UUID is not found.
   * Note: this endpoint returns HTTP 200 with this error body (Swagger-documented).
   */
  USER_ID_NOT_CORRECT = 'User Id not correct!',
  /**
   * Returned when the password does not meet complexity requirements.
   * Swagger: POST /User returns 406; actual server returns 400.
   */
  INVALID_PASSWORD = "Passwords must have at least one non alphanumeric character, one digit ('0'-'9'), one uppercase ('A'-'Z'), one lowercase ('a'-'z'), one special character and Password must be eight characters or longer.",
  /** Returned by GenerateToken on success. */
  TOKEN_SUCCESS = 'User authorized successfully.',
  /** Returned by GenerateToken on failure. */
  TOKEN_FAILED = 'User authorization failed.',
  /** Returned when the requested ISBN is not in the book catalogue. */
  ISBN_NOT_IN_CATALOGUE = 'ISBN supplied is not available in Books Collection!',
  /** Returned when the ISBN is not in the user\'s collection. */
  ISBN_NOT_IN_COLLECTION = "ISBN supplied is not available in User's Collection!",
}
