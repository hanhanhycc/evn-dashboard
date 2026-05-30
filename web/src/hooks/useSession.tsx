import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, ApiError } from '@/lib/api';
import type { Customer, MeResp } from '@/lib/types';

type SessionState = {
  ready: boolean;
  authed: boolean;
  listPE: Customer[];
  currentMakh: string | null;
  setCurrentMakh: (m: string) => void;
  currentCustomer: Customer | null;
  login: (sdt: string, password: string, remember: boolean) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<SessionState | null>(null);

const MAKH_KEY = 'evn-current-makh';

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [listPE, setListPE] = useState<Customer[]>([]);
  const [currentMakh, setCurrentMakhState] = useState<string | null>(null);

  const adopt = useCallback((list: Customer[]) => {
    setListPE(list);
    const saved = localStorage.getItem(MAKH_KEY);
    const initial = (saved && list.find((p) => p.MA_KHANG === saved)?.MA_KHANG) || list[0]?.MA_KHANG || null;
    setCurrentMakhState(initial);
  }, []);

  const setCurrentMakh = useCallback((m: string) => {
    setCurrentMakhState(m);
    localStorage.setItem(MAKH_KEY, m);
  }, []);

  const login = useCallback(
    async (sdt: string, password: string, remember: boolean) => {
      const data = await api<{ ok: true; listPE: Customer[] }>('/api/login', {
        sdt,
        password,
        remember: remember ? 1 : 0,
      });
      adopt(data.listPE || []);
    },
    [adopt]
  );

  const logout = useCallback(async () => {
    try {
      await api('/api/logout', {});
    } catch {
      /* ignore */
    }
    setListPE([]);
    setCurrentMakhState(null);
    localStorage.removeItem(MAKH_KEY);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const me = await api<MeResp>('/api/me');
        adopt(me.listPE || []);
      } catch (e) {
        if (!(e instanceof ApiError) || e.status !== 401) {
          // network or unexpected; still mark ready so login screen can show
        }
      } finally {
        setReady(true);
      }
    })();
  }, [adopt]);

  const currentCustomer = listPE.find((p) => p.MA_KHANG === currentMakh) || null;

  return (
    <Ctx.Provider
      value={{
        ready,
        authed: listPE.length > 0,
        listPE,
        currentMakh,
        setCurrentMakh,
        currentCustomer,
        login,
        logout,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useSession() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSession must be inside <SessionProvider>');
  return v;
}
