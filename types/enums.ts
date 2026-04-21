/**
 * HTTP status codes used across API test assertions.
 * Always assert against these constants rather than raw numbers so that
 * a changed expectation is a single-line diff.
 */
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  NOT_ACCEPTABLE = 406,
  INTERNAL_SERVER_ERROR = 500,
}

/**
 * DemoQA REST API endpoint paths.
 * Centralises path strings so that a renamed route is a single-line fix.
 */
export enum ApiEndpoints {
  USER = '/Account/v1/User',
  GENERATE_TOKEN = '/Account/v1/GenerateToken',
  AUTHORIZED = '/Account/v1/Authorized',
  BOOKS = '/BookStore/v1/Books',
  BOOK = '/BookStore/v1/Book',
}

/**
 * Known API response message strings from DemoQA.
 * Used in test assertions to verify exact error/success messages.
 */
export enum UserMessage {
  USER_EXISTS = 'User exists!',
  USER_PASSWORD_REQUIRED = 'UserName and Password required.',
  USER_NOT_AUTHORIZED = 'User not authorized!',
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
  TOKEN_SUCCESS = 'User authorized successfully.',
  TOKEN_FAILED = 'User authorization failed.',
  ISBN_NOT_IN_CATALOGUE = 'ISBN supplied is not available in Books Collection!',
  ISBN_NOT_IN_COLLECTION = "ISBN supplied is not available in User's Collection!",
}
