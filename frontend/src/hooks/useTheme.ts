import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark';

const KEY = 'ev:color-scheme';

export function useTheme() {
  const [isDark, setIsDark] = useState(
    () => document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem(KEY)) {
        const next = !e.matches;
        setIsDark(next);
        document.documentElement.classList.toggle('dark', next);
      }
    };
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem(KEY, next ? 'dark' : 'light');
      return next;
    });
  }, []);

  return { isDark, toggle };
}
