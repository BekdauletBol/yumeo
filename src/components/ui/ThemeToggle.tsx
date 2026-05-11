'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

/**
 * Theme toggle component.
 * NOTE: For the pure black design system, we generally force dark mode,
 * but this is kept for user control while overriding default styles.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setState] = useState(false);

  useEffect(() => {
    setState(true);
    // Force dark theme as per redesign specs if not set
    if (theme !== 'dark') setTheme('dark');
  }, [theme, setTheme]);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-xl bg-bg-elevated border border-border-subtle text-text-secondary hover:text-text-primary transition-all"
      aria-label="Toggle appearance"
    >
      {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  );
}
