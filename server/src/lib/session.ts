import { getAuth } from './auth';
export async function verifyBearerToken(token: string): Promise<{ authUserId: string } | null> {
  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: new Headers({ authorization: `Bearer ${token}` }),
  });
  const authUserId = session?.user?.id;
  if (!authUserId) return null;
  return { authUserId };
}
