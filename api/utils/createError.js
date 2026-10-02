// Creates an Error with an HTTP status code, e.g. next(createError(404, "Not found"))
export const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};
