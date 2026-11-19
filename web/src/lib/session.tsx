import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './firebase';
import { queryClient } from './queryClient';
const SessionContext = createContext<{ user: User | null; loading: boolean }>({
  user: null,
  loading: true,
});
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<{ user: User | null; loading: boolean }>({
    user: null,
    loading: Boolean(auth),
  });
  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (user) => {
      queryClient.clear();
      setSession({ user, loading: false });
    });
  }, []);
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}
export function useSession() {
  return useContext(SessionContext);
}
