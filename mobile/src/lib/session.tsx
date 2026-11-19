import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { QueryClient } from '@tanstack/react-query';
import { auth } from './firebase';
export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 10000, retry: false }, mutations: { retry: false } },
});
const Context = createContext<{ user: User | null; loading: boolean }>({
  user: null,
  loading: true,
});
export function SessionProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<{ user: User | null; loading: boolean }>({
    user: null,
    loading: Boolean(auth),
  });
  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (user) => {
      queryClient.clear();
      setValue({ user, loading: false });
    });
  }, []);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useSession() {
  return useContext(Context);
}
