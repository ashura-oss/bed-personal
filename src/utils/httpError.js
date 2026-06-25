export function createHttpError(statusCode, error, message, details) {
  const httpError = new Error(message);
  httpError.statusCode = statusCode;
  httpError.error = error;

  if (details !== undefined) {
    httpError.details = details;
  }

  return httpError;
}

export function sendHttpError(res, error) {
  const statusCode = getStatusCode(error);

  if (statusCode >= 500) {
    console.error(error);
  }

  const payload = {
    error: error.error || getDefaultErrorTitle(statusCode),
    message: error.message || "An unexpected server error occurred."
  };

  if (error.details !== undefined) {
    payload.details = error.details;
  }

  res.status(statusCode).json(payload);
}

function getStatusCode(error) {
  if (Number.isInteger(error.statusCode)) {
    return error.statusCode;
  }

  if (Number.isInteger(error.status)) {
    return error.status;
  }

  if (error.type === "entity.parse.failed") {
    return 400;
  }

  return 500;
}

function getDefaultErrorTitle(statusCode) {
  if (statusCode === 400) {
    return "Bad Request";
  }

  if (statusCode === 401) {
    return "Unauthorized";
  }

  if (statusCode === 403) {
    return "Forbidden";
  }

  if (statusCode === 404) {
    return "Not Found";
  }

  if (statusCode === 409) {
    return "Conflict";
  }

  return "Internal Server Error";
}
