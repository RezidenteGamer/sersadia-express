import { useState, useCallback, useEffect } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'admin-desktop-theme';

function loadTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {}
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function useDesktopTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const t = loadTheme();
    applyTheme(t);
    return t;
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return { theme, toggleTheme, isDark: theme === 'dark' };
}
