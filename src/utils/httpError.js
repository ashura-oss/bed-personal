export function createHttpError(statusCode, error, message, details) {
  const httpError = new Error(message);
  httpError.statusCode = statusCode;
  httpError.error = error;

  if (details !== undefined) {
    httpError.details = details;
  }

  return httpError;
}
