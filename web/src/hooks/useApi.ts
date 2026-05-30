import { useEffect, useRef, useState } from 'react';
import { api, ApiError } from '@/lib/api';

type State<T> = { data: T | null; loading: boolean; error: string | null };

export function useApi<T>(
  url: string | null,
  body: unknown,
  deps: ReadonlyArray<unknown>
): State<T> & { reload: () => void } {
  const [state, setState] = useState<State<T>>({ data: null, loading: !!url, error: null });
  const reqId = useRef(0);
  const [bump, setBump] = useState(0);

  useEffect(() => {
    if (!url) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    const id = ++reqId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    api<T>(url, body)
      .then((data) => {
        if (id === reqId.current) setState({ data, loading: false, error: null });
      })
      .catch((e) => {
        if (id !== reqId.current) return;
        const msg = e instanceof ApiError ? e.message : (e as Error).message || 'Lỗi không xác định';
        setState({ data: null, loading: false, error: msg });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, bump, ...deps]);

  return { ...state, reload: () => setBump((n) => n + 1) };
}
