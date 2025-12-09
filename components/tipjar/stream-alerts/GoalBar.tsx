'use client';

import { getThemeStyles } from './themes';

interface GoalBarProps {
  title: string;
  current: number;
  target: number;
  theme: 'dark' | 'neon' | 'retro' | 'minimal' | 'pride';
}

export function GoalBar({ title, current, target, theme }: GoalBarProps) {
  const percentage = Math.min(100, (current / target) * 100);
  const themeStyles = getThemeStyles(theme);

  // Determine text color based on theme - use dark text for light backgrounds
  const getTextColor = () => {
    if (theme === 'pride' || theme === 'minimal') {
      return 'text-gray-900'; // Dark text for light backgrounds
    }
    return 'text-white'; // White text for dark backgrounds
  };

  return (
    <div
      className="px-6 py-4 rounded-lg backdrop-blur-sm"
      style={themeStyles.alertBox}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className={`text-lg font-bold ${getTextColor()}`}>{title}</h3>
        <span className={`text-lg font-bold ${getTextColor()}`}>
          ${current.toFixed(2)} / ${target.toFixed(2)}
        </span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            background: theme === 'neon' 
              ? 'linear-gradient(90deg, #00FFFF, #FF00FF)'
              : theme === 'pride'
              ? 'linear-gradient(90deg, #FF0000, #FF8C00, #FFD700, #008000, #0000FF, #4B0082)'
              : 'linear-gradient(90deg, #4ECDC4, #44A08D)',
            boxShadow: theme === 'neon' ? '0 0 10px rgba(0, 255, 255, 0.5)' : undefined,
          }}
        />
      </div>
    </div>
  );
}

