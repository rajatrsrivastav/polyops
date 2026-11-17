import { useEffect, useState } from 'react';

import { getBillPhotoSignedUrl } from '@/features/expenses/api';

export function useBillPhotoUrl(path: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(path));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!path) {
        setUrl(null);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const signed = await getBillPhotoSignedUrl(path);
        if (!cancelled) setUrl(signed);
      } catch (err) {
        if (!cancelled) {
          setUrl(null);
          setError(err instanceof Error ? err.message : 'Could not load photo');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [path]);

  return { url, isLoading, error };
}
