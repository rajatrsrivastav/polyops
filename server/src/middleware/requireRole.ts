import type { RequestHandler } from 'express';
import { currentUser } from './auth';
import { AppError } from '../lib/appError';
export function requireRole(...roles: ('owner' | 'staff')[]): RequestHandler {
  return (req, _res, next) => {
    if (!roles.includes(currentUser(req).role))
      throw new AppError(403, 'FORBIDDEN', 'You do not have permission for this action');
    next();
  };
}
