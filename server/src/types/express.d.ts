import type { Types } from 'mongoose';
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: Types.ObjectId;
        shopId: Types.ObjectId;
        role: 'owner' | 'staff';
        firebaseUid: string;
      };
    }
  }
}
export {};
