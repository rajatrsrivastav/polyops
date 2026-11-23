import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { reportInternalError } from '../lib/monitoring';
import { AppError } from '../lib/appError';
export const errorHandler: ErrorRequestHandler = (error: unknown, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  if (error instanceof ZodError) {
    res
      .status(400)
      .json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Check the highlighted fields',
          details: error.issues.map((issue) => ({ path: issue.path.join('.'), code: issue.code })),
        },
      });
    return;
  }
  if (error instanceof AppError) {
    res.status(error.status).json({ error: { code: error.code, message: error.message } });
    return;
  }
  const type = typeof error === 'object' && error !== null && 'type' in error ? error.type : '';
  if (type === 'entity.parse.failed') {
    res
      .status(400)
      .json({ error: { code: 'VALIDATION_ERROR', message: 'Request body must be valid JSON' } });
    return;
  }
  if (type === 'entity.too.large') {
    res
      .status(413)
      .json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body exceeds 100 kB' } });
    return;
  }
  // Do not log raw SDK/DB exceptions: messages can include credentials or submitted PII.
  req.log.error(
    { errorType: error instanceof Error ? error.name : 'UnknownError', requestId: req.id },
    'Unhandled request failure',
  );
  reportInternalError(String(req.id), error);
  res
    .status(500)
    .json({ error: { code: 'INTERNAL', message: 'Something went wrong. Please try again.' } });
};
