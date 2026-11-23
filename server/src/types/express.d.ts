declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        shopId: string;
        role: 'owner' | 'staff';
        authUserId: string;
      };
    }
  }
}
export {};
