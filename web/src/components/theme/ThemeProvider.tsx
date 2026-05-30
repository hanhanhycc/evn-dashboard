import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'system';
const KEY = 'evn-theme';

type Ctx = { theme: Theme; resolved: 'light' | 'dark'; setTheme: (t: Theme) => void };
const ThemeCtx = createContext<Ctx | null>(null);

function applyTheme(t: Theme): 'light' | 'dark' {
  const dark =
    t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
  return dark ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(KEY) as Theme) || 'system'
  );
  const [resolved, setResolved] = useState<'light' | 'dark'>(() => applyTheme(theme));

  useEffect(() => {
    setResolved(applyTheme(theme));
    localStorage.setItem(KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setResolved(applyTheme('system'));
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  return (
    <ThemeCtx.Provider value={{ theme, resolved, setTheme: setThemeState }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const v = useContext(ThemeCtx);
  if (!v) throw new Error('useTheme must be inside <ThemeProvider>');
  return v;
}
