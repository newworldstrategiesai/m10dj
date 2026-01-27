'use client';

import { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
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
  signups?: any[];
  onSignupStatusChange?: (signupId: string, status: string) => void;
}

export interface KaraokeLayoutRef {
  registerDisplayWindow: (window: Window, video: { videoId: string; title: string; artist: string }) => void;
  changeDisplayVideo: (video: { videoId: string; title: string; artist: string }) => void;
  addSignupToQueue: (signup: any) => void;
  startPlayingSignup: (signup: any) => void;
  clearPlayerQueue: () => void;
}

const KaraokeLayout = forwardRef<KaraokeLayoutRef, KaraokeLayoutProps>(({
  children,
  title = 'Discover',
  showBackButton = false,
  currentPage = 'discover',
  user: propUser,
  subscriptionTier: propSubscriptionTier = 'free',
  signups = [],
  onSignupStatusChange
}: KaraokeLayoutProps, ref) => {
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isPlayerPanelVisible, setIsPlayerPanelVisible] = useState(true);

  // External display window tracking
  const [displayWindow, setDisplayWindow] = useState<Window | null>(null);
  const [displayVideo, setDisplayVideo] = useState<{
    videoId: string;
    title: string;
    artist: string;
    thumbnailUrl: string;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && (!displayWindow || displayWindow.closed)) {
      window.karaokeDisplayWindow = null;
    }
  }, [displayWindow]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/signin');
  };

  const isPremium = propSubscriptionTier !== 'free';

  // Expose methods to parent components
  useImperativeHandle(ref, () => ({
    registerDisplayWindow: (newWindow: Window, video: { videoId: string; title: string; artist: string }) => {
      console.log('🎬 Registering display window:', newWindow);
      setDisplayWindow(newWindow);
      // Store the display window reference globally for fallback access
      if (typeof window !== 'undefined') {
        (window as any).karaokeDisplayWindow = newWindow;
      }
      setDisplayVideo({
        videoId: video.videoId,
        title: video.title,
        artist: video.artist,
        thumbnailUrl: `https://img.youtube.com/vi/${video.videoId}/default.jpg`
      });

      // Request initial status update from the display window
      setTimeout(() => {
        if (newWindow && !newWindow.closed) {
          try {
            console.log('📡 Requesting initial status from display window');
            // Use '*' for same-origin windows
            newWindow.postMessage({
              type: 'VIDEO_CONTROL',
              data: { action: 'getStatus' }
            }, '*');
          } catch (error) {
            // Silently handle postMessage errors (window might be closed or on different origin)
            if (process.env.NODE_ENV === 'development') {
              console.warn('Could not request initial status:', error);
            }
          }
        }
      }, 2000); // Wait for video to load
    },
    changeDisplayVideo: (video: { videoId: string; title: string; artist: string }) => {
      // If window exists, send change command; otherwise just update local state
      if (displayWindow && !displayWindow.closed) {
        try {
          displayWindow.postMessage({
            type: 'VIDEO_CONTROL',
            data: { action: 'changeVideo', ...video }
          }, '*');
        } catch (error) {
          // Silently handle postMessage errors (window might be closed or on different origin)
          if (process.env.NODE_ENV === 'development') {
            console.warn('Could not send changeVideo command:', error);
          }
        }
      }
      setDisplayVideo({
        videoId: video.videoId,
        title: video.title,
        artist: video.artist,
        thumbnailUrl: `https://img.youtube.com/vi/${video.videoId}/default.jpg`
      });
    },
    addSignupToQueue: (signup: any) => {
      // This will be handled by the KaraokePlayerPanel
      console.log('Adding signup to player queue:', signup);
    },
    startPlayingSignup: (signup: any) => {
      // Start playing this signup immediately
      if (signup.video_data) {
        console.log('Starting to play signup:', signup);
        const videoData = {
          videoId: signup.video_data.youtube_video_id,
          title: signup.song_title,
          artist: signup.song_artist || '',
          thumbnailUrl: `https://img.youtube.com/vi/${signup.video_data.youtube_video_id}/default.jpg`,
          signupData: signup // Include signup data for mini player
        };

        // Update the display video state for the mini player (this makes it appear in the sidebar)
        setDisplayVideo(videoData);

        // Ensure display window is open, then send video command
        const windowName = 'karaokeVideoDisplay';
        let targetWindow = displayWindow;

        // Check if display window exists and is open
        if (!targetWindow || targetWindow.closed) {
          console.log('Display window not open, opening new window with video params...');
          // Open display window with URL parameters for reliable video loading
          const videoUrl = `/karaoke/video-display?videoId=${encodeURIComponent(videoData.videoId)}&title=${encodeURIComponent(videoData.title)}&artist=${encodeURIComponent(videoData.artist)}`;
          targetWindow = window.open(
            videoUrl,
            windowName,
            'width=1280,height=720,scrollbars=no,resizable=yes,status=no,toolbar=no,menubar=no,location=no,directories=no'
          );
          if (targetWindow) {
            setDisplayWindow(targetWindow);
            // Store the display window reference globally immediately
            if (typeof window !== 'undefined') {
              (window as any).karaokeDisplayWindow = targetWindow;
              console.log('🎬 Set global display window reference');
            }
          } else {
            console.error('Failed to open display window - popup may be blocked');
          }
        }

        // Video loads via URL parameters, no need to send changeVideo command
        console.log('✅ Display window opened with video URL parameters');
      }
    },
    clearPlayerQueue: () => {
      // This will be handled by the KaraokePlayerPanel
      console.log('Clearing player queue');
    }
  }));

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
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-4">
              {showBackButton && (
                <button
                  onClick={() => router.back()}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
            </div>

            {/* Content Header Actions */}
            <div className="flex items-center gap-3">
              {/* Search could go here */}
              <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
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
            displayWindow={displayWindow}
            displayVideo={displayVideo}
            onDisplayWindowChange={setDisplayWindow}
            onDisplayVideoChange={setDisplayVideo}
            signups={signups}
            onSignupStatusChange={onSignupStatusChange}
          />
        )}
      </div>
    </div>
  );
});

KaraokeLayout.displayName = 'KaraokeLayout';

export default KaraokeLayout;