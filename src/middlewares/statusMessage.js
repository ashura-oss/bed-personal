// Store the route success message before the final response.
export function withMessage(message, status) {
  return (_req, res, next) => {
    try {
      res.locals.message = typeof message === "function" ? message(res.locals) : message;

      if (status !== undefined) {
        res.locals.status = status;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

// Send the final JSON success response.
export function sendResponse(_req, res) {
  const status = res.locals.status || 200;
  const message = res.locals.message || "Success";

  if (status === 204) {
    return res.status(204).send();
  }

  return res.status(status).json({
    message,
    data: res.locals.data ?? null
  });
}

// Handles unexpected errors passed through next(error).
export function errorHandler(error, _req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  console.error(error);

  const status = Number.isInteger(error.status) ? error.status : 500;
  const message = status === 500 ? "Internal Server Error." : error.message;

  return res.status(status).json({
    message
  });
}
