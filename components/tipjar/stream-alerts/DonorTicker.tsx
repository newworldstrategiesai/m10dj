'use client';

import { useEffect, useState } from 'react';
import { getThemeStyles } from './themes';

interface RecentDonor {
  id: string;
  donor_name: string;
  amount: number | null;
  event_type: string;
  created_at: string;
}

interface DonorTickerProps {
  donors: RecentDonor[];
  theme: 'dark' | 'neon' | 'retro' | 'minimal' | 'pride';
}

export function DonorTicker({ donors, theme }: DonorTickerProps) {
  const [displayedDonors, setDisplayedDonors] = useState<RecentDonor[]>([]);

  useEffect(() => {
    // Animate donors appearing one by one
    let index = 0;
    const interval = setInterval(() => {
      if (index < donors.length) {
        setDisplayedDonors(prev => [...prev, donors[index]]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [donors]);

  const themeStyles = getThemeStyles(theme);

  // Determine text color based on theme - use dark text for light backgrounds
  const getTextColor = () => {
    if (theme === 'pride' || theme === 'minimal') {
      return 'text-gray-900'; // Dark text for light backgrounds
    }
    return 'text-white'; // White text for dark backgrounds
  };

  // Determine amount color based on theme
  const getAmountColor = () => {
    if (theme === 'pride' || theme === 'minimal') {
      return 'text-green-600'; // Darker green for light backgrounds
    }
    return 'text-green-400'; // Bright green for dark backgrounds
  };

  if (displayedDonors.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-4 overflow-hidden">
      {displayedDonors.map((donor, index) => (
        <div
          key={donor.id}
          className="px-4 py-2 rounded-lg backdrop-blur-sm animate-slide-in"
          style={{
            ...themeStyles.alertBox,
            animationDelay: `${index * 0.1}s`,
          }}
        >
          <div className={`flex items-center gap-2 text-sm font-semibold ${getTextColor()}`}>
            <span className="text-lg">💰</span>
            <span>{donor.donor_name}</span>
            {donor.amount && (
              <span className={getAmountColor()}>${parseFloat(donor.amount.toString()).toFixed(2)}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

