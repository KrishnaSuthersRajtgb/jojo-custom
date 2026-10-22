import type { ErrorRequestHandler } from 'express';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
  const error = err instanceof Error ? err : new Error(String(err));
  let status = (err as { status?: number }).status ?? 500;
  let message = error.message;

  // Handle Mongoose duplicate key error (code 11000)
  if ((err as { code?: number }).code === 11000) {
    status = 409;
    const keyPattern = (err as { keyPattern?: Record<string, unknown> }).keyPattern;
    const field = keyPattern ? Object.keys(keyPattern)[0] : 'field';
    message = `Duplicate value for ${field ?? 'item'}. It already exists.`;
  }

  // Handle Mongoose ValidationError
  if ((err as { name?: string }).name === 'ValidationError') {
    status = 422;
    message = error.message;
  }

  // Handle CastError (invalid ObjectId)
  if ((err as { name?: string }).name === 'CastError') {
    status = 400;
    message = 'Invalid resource identifier format';
  }

  console.error(`[error] ${status.toString()} — ${message}`);

  res.status(status).json({ error: message });
};
