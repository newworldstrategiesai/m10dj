'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';

export default function ThemeToggle({ className = '', variant = 'button' }) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState('system');

  useEffect(() => {
    setMounted(true);
    if (theme) {
      setCurrentTheme(theme);
    }
  }, [theme]);

  // Handle theme changes from external sources
  useEffect(() => {
    if (theme && theme !== currentTheme) {
      setCurrentTheme(theme);
    }
  }, [theme, currentTheme]);

  if (!mounted) {
    return (
      <div className={`w-9 h-9 rounded-lg ${className}`} />
    );
  }

  const cycleTheme = () => {
    if (currentTheme === 'light') {
      setTheme('dark');
    } else if (currentTheme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  // Determine which icon to show based on resolved theme
  const getResolvedTheme = () => {
    if (currentTheme === 'system') {
      // Check system preference
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'light';
    }
    return currentTheme;
  };

  const resolvedTheme = getResolvedTheme();

  const getIcon = () => {
    if (resolvedTheme === 'dark') {
      return <Moon className="w-5 h-5" />;
    } else {
      return <Sun className="w-5 h-5" />;
    }
  };

  const getLabel = () => {
    if (currentTheme === 'light') {
      return 'Light mode';
    } else if (currentTheme === 'dark') {
      return 'Dark mode';
    } else {
      return 'System mode';
    }
  };

  if (variant === 'mobile') {
    return (
      <button
        onClick={cycleTheme}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full text-left ${className}`}
        aria-label={getLabel()}
      >
        {getIcon()}
        <span className="font-medium">Theme: {getLabel()}</span>
      </button>
    );
  }

  return (
    <button
      onClick={cycleTheme}
      className={`flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${className}`}
      aria-label={getLabel()}
      title={getLabel()}
    >
      {getIcon()}
    </button>
  );
}

