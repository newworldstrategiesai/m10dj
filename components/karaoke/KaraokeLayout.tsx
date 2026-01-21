'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@/utils/supabase/client';
import KaraokeHeader from './layout/KaraokeHeader';
import KaraokeSidebar from './layout/KaraokeSidebar';
import KaraokePlayerPanel from './layout/KaraokePlayerPanel';

interface KaraokeLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  currentPage?: 'discover' | 'playlists' | 'quizzes' | 'library' | 'favorites' | 'history' | 'my-songs';
  user?: any;
  subscriptionTier?: string;
}

export default function KaraokeLayout({
  children,
  title = 'Discover',
  showBackButton = false,
  currentPage = 'discover',
  user: propUser,
  subscriptionTier: propSubscriptionTier = 'free'
}: KaraokeLayoutProps) {
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isPlayerPanelVisible, setIsPlayerPanelVisible] = useState(true);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/signin');
  };

  const isPremium = propSubscriptionTier !== 'free';

  return (
    <div className="min-h-screen karaoke-gradient-bg karaoke-scrollbar">
      {/* Global Header */}
      <KaraokeHeader
        user={propUser}
        onSignOut={handleSignOut}
        isPremium={isPremium}
      />

      {/* Main Layout Container */}
      <div className="flex h-[calc(100vh-60px)]">
        {/* Left Sidebar */}
        <KaraokeSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          currentPage={currentPage}
          user={propUser}
          isPremium={isPremium}
        />

        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${
          isSidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}>
          {/* Content Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800/50">
            <div className="flex items-center gap-4">
              {showBackButton && (
                <button
                  onClick={() => router.back()}
                  className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <h1 className="text-2xl font-bold text-white">{title}</h1>
            </div>

            {/* Content Header Actions */}
            <div className="flex items-center gap-3">
              {/* Search could go here */}
              <button className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="relative">
              {children}
            </div>
          </div>
        </div>

        {/* Right Player Panel */}
        {isPlayerPanelVisible && (
          <KaraokePlayerPanel
            onClose={() => setIsPlayerPanelVisible(false)}
            isPremium={isPremium}
          />
        )}
      </div>
    </div>
  );
}