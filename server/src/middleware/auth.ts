import type { RequestHandler, Request } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { User } from '../models';
import { AppError } from '../lib/appError';
export const auth: RequestHandler = async (req, _res, next) => {
  const match = /^Bearer\s+(\S+)\s*$/i.exec(req.headers.authorization ?? '');
  const token = match?.[1];
  if (!token) throw new AppError(401, 'UNAUTHENTICATED', 'A valid sign-in is required');
  let uid: string;
  try {
    uid = (await getAuth().verifyIdToken(token, true)).uid;
  } catch (error) {
    // Configuration and upstream outages are operational failures, not invalid credentials.
    const code =
      typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
    if (code === 'app/network-error' || code === 'auth/internal-error')
      throw new AppError(
        503,
        'AUTH_UNAVAILABLE',
        'Sign-in verification is temporarily unavailable',
      );
    throw new AppError(401, 'UNAUTHENTICATED', 'A valid sign-in is required');
  }
  const user = await User.findOne({ firebaseUid: uid }).lean();
  if (!user)
    throw new AppError(403, 'NOT_PROVISIONED', 'Your account has not been assigned to a shop');
  req.user = { id: user._id, shopId: user.shopId, role: user.role, firebaseUid: uid };
  next();
};
export function currentUser(req: Request) {
  if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'A valid sign-in is required');
  return req.user;
}
export type Actor = ReturnType<typeof currentUser>;
