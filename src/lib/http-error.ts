export class HttpError extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string,
    public retryable = false,
    public details: unknown = {}
  ) {
    super(message);
  }
}

export const unauthorized = () => new HttpError("UNAUTHORIZED", 401, "Sign in required.");
export const notFound = (what = "Record") => new HttpError("NOT_FOUND", 404, `${what} was not found.`);
export const forbidden = () => new HttpError("FORBIDDEN", 403, "You do not have access.");
export const invalid = (message = "Invalid input.") => new HttpError("INVALID_INPUT", 400, message);
