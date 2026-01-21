'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Home,
  ListMusic,
  Gamepad2,
  TrendingUp,
  Music,
  Calendar,
  Heart,
  Clock,
  Plus,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Lock,
  Crown
} from 'lucide-react';

interface KaraokeSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  currentPage: 'discover' | 'playlists' | 'quizzes' | 'library';
  user: any;
  isPremium: boolean;
}

export default function KaraokeSidebar({
  isCollapsed,
  onToggleCollapse,
  currentPage,
  user,
  isPremium
}: KaraokeSidebarProps) {
  const [playlistsExpanded, setPlaylistsExpanded] = useState(false);

  const navItems = [
    { id: 'discover', label: 'Discover', icon: Home, href: '/admin/karaoke' },
    { id: 'playlists', label: 'Playlists', icon: ListMusic, href: '/admin/karaoke/playlists' },
    { id: 'quizzes', label: 'Quizzes', icon: Gamepad2, href: '/admin/karaoke/quizzes' },
    { id: 'top', label: 'Top Charts', icon: TrendingUp, href: '/admin/karaoke/top' },
    { id: 'genres', label: 'Genres', icon: Music, href: '/admin/karaoke/genres' },
    { id: 'new', label: 'New Releases', icon: Calendar, href: '/admin/karaoke/new' },
  ];

  const personalItems = [
    { id: 'my-songs', label: 'My Songs', icon: Music, href: '/admin/karaoke/my-songs' },
    { id: 'favorites', label: 'Favorites', icon: Heart, href: '/admin/karaoke/favorites' },
    { id: 'history', label: 'History', icon: Clock, href: '/admin/karaoke/history' },
  ];

  return (
    <aside className={`fixed left-0 top-15 h-[calc(100vh-60px)] bg-gray-900/95 backdrop-blur-sm border-r border-gray-700/50 transition-all duration-300 z-40 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="flex flex-col h-full">
        {/* Premium Upsell Section */}
        {!isCollapsed && (
          <div className="p-4 border-b border-gray-800/50">
            <div className="bg-gradient-to-r from-pink-500/20 to-purple-600/20 rounded-lg p-3 border border-pink-500/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-pink-400" />
                  <span className="text-sm font-semibold text-pink-400">K Premium</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-xs text-gray-400 mt-1">Unlock full versions & premium features</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3 space-y-1">
            {/* Main Navigation */}
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-gradient-to-r from-pink-500/20 to-purple-600/20 text-pink-400 border-l-2 border-pink-500 shadow-lg shadow-pink-500/10'
                      : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                  } ${isCollapsed ? 'justify-center px-2' : ''}`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? '' : ''}`} />
                  {!isCollapsed && (
                    <span className="font-medium truncate">{item.label}</span>
                  )}
                </Link>
              );
            })}

            {/* Personal Section */}
            {!isCollapsed && (
              <div className="pt-6">
                <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Your Music
                </h3>
                {personalItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-gradient-to-r from-pink-500/20 to-purple-600/20 text-pink-400 border-l-2 border-pink-500'
                          : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* My Playlists Section */}
            {!isCollapsed && (
              <div className="pt-6">
                <div className="flex items-center justify-between px-3 mb-2">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    My Playlists
                  </h3>
                  <button
                    onClick={() => setPlaylistsExpanded(!playlistsExpanded)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {playlistsExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <Link
                  href="/admin/karaoke/playlists"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800/50 hover:text-white transition-colors"
                >
                  <ListMusic className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">View All Playlists</span>
                </Link>

                <Link
                  href="/admin/karaoke/create-playlist"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800/50 hover:text-white transition-colors"
                >
                  <Plus className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">Create Playlist</span>
                </Link>

                {playlistsExpanded && (
                  <div className="mt-2 space-y-1">
                    {/* Example playlists - in real app, these would come from API */}
                    <Link
                      href="/admin/karaoke/playlist/1"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800/50 hover:text-white transition-colors"
                    >
                      <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex-shrink-0" />
                      <span className="font-medium truncate">My Favorites</span>
                    </Link>
                    <Link
                      href="/admin/karaoke/playlist/2"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800/50 hover:text-white transition-colors"
                    >
                      <div className="w-5 h-5 bg-gradient-to-br from-green-500 to-teal-600 rounded flex-shrink-0" />
                      <span className="font-medium truncate">Party Hits</span>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>

        {/* Collapse Toggle */}
        <div className="p-3 border-t border-gray-800/50">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}