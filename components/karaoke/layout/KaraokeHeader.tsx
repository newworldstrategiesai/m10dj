'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Settings, User } from 'lucide-react';

interface KaraokeHeaderProps {
  user: any;
  onSignOut: () => void;
  isPremium: boolean;
}

export default function KaraokeHeader({ user, onSignOut, isPremium }: KaraokeHeaderProps) {
  return (
    <header className="h-15 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 h-full">
        {/* Left side - Logo/Brand */}
        <div className="flex items-center gap-4">
          {/* K Logo */}
          <Link href="/admin/karaoke" className="flex items-center gap-3">
            <div className="w-10 h-10 karaoke-gradient-primary rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <span className="text-white font-bold text-xl hidden sm:block">Karaoke</span>
          </Link>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-3">
          {/* Settings */}
          <button className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors">
            <Settings className="w-5 h-5" />
          </button>

          {/* User Menu */}
          {user ? (
            <div className="flex items-center gap-3">
              {/* Premium Badge */}
              {isPremium && (
                <div className="px-2 py-1 karaoke-gradient-primary rounded-full text-xs font-semibold text-white">
                  Premium
                </div>
              )}

              {/* User Avatar */}
              <button className="w-8 h-8 karaoke-gradient-primary rounded-full flex items-center justify-center text-white font-semibold">
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </button>
            </div>
          ) : (
            <Button className="karaoke-btn-primary font-semibold">
              Sign In / Sign Up
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}