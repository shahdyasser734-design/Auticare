import { createContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getSystemTheme = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const readStoredTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeMode>(readStoredTheme);

  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (effectiveTheme: 'light' | 'dark') => {
      root.classList.toggle('dark', effectiveTheme === 'dark');
      root.dataset.theme = effectiveTheme;
    };

    const effectiveTheme = theme === 'system' ? getSystemTheme() : theme;
    applyTheme(effectiveTheme);
    localStorage.setItem('theme', theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)') as MediaQueryList;
      const listener = (event: MediaQueryListEvent) => {
        applyTheme(event.matches ? 'dark' : 'light');
      };
      if ('addEventListener' in mediaQuery) {
        mediaQuery.addEventListener('change', listener);
      } else if ((mediaQuery as unknown as { addListener?: (fn: (e: MediaQueryListEvent) => void) => void }).addListener) {
        (mediaQuery as unknown as { addListener: (fn: (e: MediaQueryListEvent) => void) => void }).addListener(listener);
      }
      return () => {
        if ('removeEventListener' in mediaQuery) {
          mediaQuery.removeEventListener('change', listener);
        } else if ((mediaQuery as unknown as { removeListener?: (fn: (e: MediaQueryListEvent) => void) => void }).removeListener) {
          (mediaQuery as unknown as { removeListener: (fn: (e: MediaQueryListEvent) => void) => void }).removeListener(listener);
        }
      };
    }
    return undefined;
  }, [theme]);

  const setTheme = (mode: ThemeMode) => setThemeState(mode);
  const toggleTheme = () => setThemeState((current) => (current === 'dark' ? 'light' : 'dark'));

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme, isDark: theme === 'dark' || (theme === 'system' && getSystemTheme() === 'dark') }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export default ThemeContext;
