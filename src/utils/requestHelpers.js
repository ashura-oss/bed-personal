// Builds an error object for helpers that cannot respond with res directly.
// Controllers catch this object and turn the status code/message into a JSON response.
export function createHttpError(statusCode, error, message, details) {
  const httpError = new Error(message);
  httpError.statusCode = statusCode;
  httpError.error = error;

  if (details !== undefined) {
    httpError.details = details;
  }

  return httpError;
}

// Sends controller errors in one consistent JSON format.
// Expected errors keep their own status code and optional structured details.
export function sendErrorResponse(res, error) {
  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    console.error(error);
  }

  return res.status(statusCode).json({
    message: error.message || "Internal Server Error.",
    details: error.details
  });
}
