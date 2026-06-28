// Stores the success message and status code for the final response middleware.
// Controllers only set res.locals.data, then call next().
export function withMessage(message, status = 200) {
  return (_req, res, next) => {
    res.locals.message = message;
    res.locals.httpStatus = status;

    next();
  };
}

// Sends the final success response after a controller has completed its work.
// Routes with status 204 return no JSON body.
export function sendResponse(_req, res) {
  const status = res.locals.httpStatus || 200;

  if (status === 204) {
    return res.status(204).send();
  }

  const payload = {
    message: res.locals.message || "Success"
  };

  if (res.locals.data !== undefined) {
    payload.data = res.locals.data;
  }

  return res.status(status).json(payload);
}
