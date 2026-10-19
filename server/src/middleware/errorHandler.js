export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err.name === 'ValidationError') {
    const errors = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message]));
    return res.status(400).json({ message: 'Validation failed', errors });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid ${err.path}: ${err.value}` });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ message: `A candidate with this ${field} already exists`, errors: { [field]: 'Already exists' } });
  }
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ message: status >= 500 ? 'Internal server error' : err.message });
}
