import { useState, useEffect, useCallback } from 'react';

/**
 * Theme hook for light/dark mode toggle
 * Fixed theme settings (cyan, neutral, 1.5 radius) are applied in index.jsx
 *
 * @returns {{theme: string, toggleTheme: () => void}}
 */
export const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;

    // Apply light/dark theme
    root.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);

    // Update theme when system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = e => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  return { theme, toggleTheme };
};
