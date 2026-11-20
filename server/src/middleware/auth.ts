import type { RequestHandler, Request } from 'express';
import { User } from '../db/store';
import { AppError } from '../lib/appError';
import { verifyBearerToken } from '../lib/session';
export const auth: RequestHandler = async (req, _res, next) => {
  const match = /^Bearer\s+(\S+)\s*$/i.exec(req.headers.authorization ?? '');
  const token = match?.[1];
  if (!token) throw new AppError(401, 'UNAUTHENTICATED', 'A valid sign-in is required');
  let authUserId: string;
  try {
    const verified = await verifyBearerToken(token);
    if (!verified) throw new AppError(401, 'UNAUTHENTICATED', 'A valid sign-in is required');
    authUserId = verified.authUserId;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(503, 'AUTH_UNAVAILABLE', 'Sign-in verification is temporarily unavailable');
  }
  const user = await User.findByAuthUserId(authUserId);
  if (!user)
    throw new AppError(403, 'NOT_PROVISIONED', 'Your account has not been assigned to a shop');
  req.user = { id: user._id, shopId: user.shopId, role: user.role, authUserId };
  next();
};
export function currentUser(req: Request) {
  if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'A valid sign-in is required');
  return req.user;
}
export type Actor = ReturnType<typeof currentUser>;
