'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

/**
 * Theme toggle component.
 * Allows switching between light and dark mode. Preference is saved to localStorage by next-themes.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-xl transition-all hover:opacity-70"
      style={{ 
        background: 'var(--bg-elevated)', 
        border: '1px solid var(--border-subtle)',
        color: 'var(--text-secondary)' 
      }}
      aria-label="Toggle appearance"
    >
      {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  );
}
