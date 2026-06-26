export function createError(statusCode, error, message, details) {
  const errorObject = new Error(message);
  errorObject.statusCode = statusCode;
  errorObject.error = error;

  if (details !== undefined) {
    errorObject.details = details;
  }

  return errorObject;
}

export function sendError(res, error) {
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
