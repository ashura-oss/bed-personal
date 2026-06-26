// Global response/status middleware shared by all route files.
export function notFound(req, res) {
  res.status(404).json({
    error: "Not Found",
    message: `No route found for ${req.method} ${req.originalUrl}`
  });
}

// Store the route success message before the final response.
export function withMessage(message, status) {
  return (_req, res, next) => {
    res.locals.message = message;

    if (status) {
      res.locals.status = status;
    }

    next();
  };
}

// Send the final JSON success response.
export function sendResponse(_req, res) {
  const status = res.locals.status || 200;
  const message = res.locals.message || "Success";

  if (status === 204) {
    return res.sendStatus(204);
  }

  return res.status(status).json({
    message,
    data: res.locals.data || null
  });
}
