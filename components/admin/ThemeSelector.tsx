'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Moon, Sun, Monitor, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface ThemeSelectorProps {
  onThemeChange?: (theme: string) => void;
}

export default function ThemeSelector({ onThemeChange }: ThemeSelectorProps) {
  const [theme, setTheme] = useState<string>('dark'); // Default to dark
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTheme();
  }, []);

  async function loadTheme() {
    try {
      setLoading(true);
      const supabase = createClientComponentClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin-settings?settingKey=app_theme', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        // The API returns { settings: { app_theme: '...' } } for GET
        const themeValue = data.settings?.app_theme;
        if (themeValue && (themeValue === 'light' || themeValue === 'dark' || themeValue === 'system')) {
          setTheme(themeValue);
        }
      }
    } catch (err) {
      console.error('Error loading theme:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleThemeChange(newTheme: string) {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const supabase = createClientComponentClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('You must be logged in to change the theme');
        setSaving(false);
        return;
      }

      const response = await fetch('/api/admin-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          settingKey: 'app_theme',
          settingValue: newTheme,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save theme preference');
      }

      setTheme(newTheme);
      setSuccess('Theme preference saved successfully');
      
      // Apply theme immediately
      if (typeof window !== 'undefined') {
        const root = document.documentElement;
        if (newTheme === 'dark') {
          root.classList.add('dark');
        } else if (newTheme === 'light') {
          root.classList.remove('dark');
        } else {
          // System theme - check system preference
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (prefersDark) {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
        }
      }

      if (onThemeChange) {
        onThemeChange(newTheme);
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save theme preference');
      setTimeout(() => setError(null), 5000);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
      </div>
    );
  }

  const themes = [
    { value: 'light', label: 'Light', icon: Sun, description: 'Always use light mode' },
    { value: 'dark', label: 'Dark', icon: Moon, description: 'Always use dark mode' },
    { value: 'system', label: 'System', icon: Monitor, description: 'Follow system preference' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          App Theme
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Choose the default theme for your entire application
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          <span className="text-sm text-green-800 dark:text-green-200">{success}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
        </div>
      )}

      {/* Theme Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {themes.map((themeOption) => {
          const Icon = themeOption.icon;
          const isSelected = theme === themeOption.value;
          
          return (
            <button
              key={themeOption.value}
              onClick={() => handleThemeChange(themeOption.value)}
              disabled={saving}
              className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? 'border-purple-600 dark:border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 hover:shadow-sm'
              } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  isSelected
                    ? 'bg-purple-600 dark:bg-purple-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-white mb-1">
                    {themeOption.label}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {themeOption.description}
                  </div>
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="w-5 h-5 rounded-full bg-purple-600 dark:bg-purple-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {saving && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Saving theme preference...</span>
        </div>
      )}
    </div>
  );
}

