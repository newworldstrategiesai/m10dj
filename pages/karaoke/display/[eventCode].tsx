'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Mic, Users, Music, Loader2, Play, ArrowUp, Zap } from 'lucide-react';
import { formatGroupDisplayName, getGroupLabel } from '@/types/karaoke';

export default function KaraokeDisplayPage() {
  const router = useRouter();
  const { eventCode } = router.query;

  const [currentSinger, setCurrentSinger] = useState<any>(null);
  const [nextSinger, setNextSinger] = useState<any>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string>('');

  useEffect(() => {
    if (eventCode && organizationId) {
      fetchQueue();
      // Auto-refresh every 3 seconds for TV display
      const interval = setInterval(fetchQueue, 3000);
      return () => clearInterval(interval);
    }
  }, [eventCode, organizationId]);

  const fetchQueue = async () => {
    if (!organizationId) return;

    try {
      // If eventCode is "all", fetch all organization karaoke, otherwise fetch specific event
      const queryParams = eventCode === 'all'
        ? `organization_id=${organizationId}`
        : `event_code=${eventCode}&organization_id=${organizationId}`;

      const response = await fetch(`/api/karaoke/queue?${queryParams}`);

      if (response.ok) {
        const data = await response.json();
        setCurrentSinger(data.current);
        setNextSinger(data.next);
        setQueue(data.queue || []);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching queue:', error);
    }
  };

  // Get organization ID
  useEffect(() => {
    async function getOrganization() {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const orgId = urlParams.get('org_id');

        if (orgId) {
          setOrganizationId(orgId);
          // For "all" events, we don't need an organization name, but for specific events we can try to get it
          if (eventCode !== 'all') {
            // Look up via event info API (shared with crowd-requests)
            const lookupResponse = await fetch(`/api/crowd-request/event-info?code=${eventCode}`);
            if (lookupResponse.ok) {
              const eventData = await lookupResponse.json();
              setOrganizationName(eventData.organization_name || eventData.organization?.name || '');
            }
          }
        }
      } catch (error) {
        console.error('Error getting organization:', error);
      }
    }
    getOrganization();
  }, [eventCode]);

  if (loading && !organizationId) {
    return (
      <>
        <Head>
          <title>Karaoke Queue Display</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        </Head>
        <div className="fixed inset-0 bg-black flex items-center justify-center">
          <Loader2 className="w-24 h-24 animate-spin text-white" />
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Karaoke Queue | {eventCode === 'all' ? (organizationName || 'All Events') : eventCode}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <style>{`
          /* TV Display Optimizations */
          html, body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            height: 100%;
            width: 100%;
          }
          /* Prevent text selection for cleaner TV display */
          * {
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
          }
          /* Smooth transitions for updates */
          .queue-item {
            transition: all 0.3s ease;
          }
        `}</style>
      </Head>
      <div className="fixed inset-0 bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 text-white overflow-hidden">
        <div className="h-full w-full flex flex-col">
          {/* Header - Compact for TV */}
          <div className="flex-shrink-0 text-center py-4 px-6 bg-black/30 backdrop-blur-sm border-b-4 border-purple-500">
            <div className="flex items-center justify-center gap-4">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <Mic className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-1">
                  {eventCode === 'all' ? 'ALL EVENTS KARAOKE' : 'KARAOKE QUEUE'}
                </h1>
                {organizationName && (
                  <p className="text-2xl sm:text-3xl text-purple-300 font-bold">
                    {eventCode === 'all' ? organizationName : `${organizationName} - ${eventCode}`}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area - Optimized for Landscape TV */}
          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-4 p-4 lg:p-6">
            {/* Left Side - Current & Next (Takes 60% on large screens) */}
            <div className="flex-1 lg:w-3/5 flex flex-col gap-4 min-w-0">
              {/* Current Singer - DOMINANT DISPLAY */}
              {currentSinger ? (
                <div className="flex-1 bg-gradient-to-br from-green-600 to-green-700 rounded-3xl p-8 lg:p-12 shadow-2xl border-4 border-green-300 flex flex-col justify-center items-center min-h-0">
                  <div className="text-center w-full">
                    <div className="flex items-center justify-center gap-4 mb-6">
                      <Play className="w-12 h-12 lg:w-16 lg:h-16" />
                      <h2 className="text-4xl lg:text-6xl font-black tracking-wide">NOW SINGING</h2>
                    </div>
                    <p className="text-6xl lg:text-8xl xl:text-9xl font-black mb-6 leading-tight break-words">
                      {formatGroupDisplayName(
                        currentSinger.singer_name,
                        currentSinger.group_members,
                        currentSinger.group_size
                      )}
                    </p>
                    {currentSinger.group_size > 1 && (
                      <p className="text-3xl lg:text-4xl text-green-100 mb-8 font-bold">
                        {getGroupLabel(currentSinger.group_size)}
                      </p>
                    )}
                    <div className="mt-8">
                      <Music className="w-16 h-16 lg:w-20 lg:h-20 mx-auto mb-6 text-green-100" />
                      <p className="text-4xl lg:text-6xl xl:text-7xl font-bold mb-4 leading-tight break-words">
                        &ldquo;{currentSinger.song_title}&rdquo;
                      </p>
                      {currentSinger.song_artist && (
                        <p className="text-3xl lg:text-5xl xl:text-6xl text-green-100 font-semibold">
                          by {currentSinger.song_artist}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 bg-gray-800 rounded-3xl flex items-center justify-center min-h-0">
                  <div className="text-center">
                    <Mic className="w-32 h-32 mx-auto mb-6 text-gray-600" />
                    <p className="text-5xl font-bold text-gray-500">No one singing</p>
                  </div>
                </div>
              )}

              {/* Next Up - Prominent but smaller */}
              {nextSinger ? (
                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 lg:p-8 shadow-xl border-4 border-yellow-300 flex-shrink-0">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <ArrowUp className="w-8 h-8 lg:w-10 lg:h-10" />
                      <h3 className="text-3xl lg:text-4xl font-black">NEXT UP</h3>
                    </div>
                    <p className="text-4xl lg:text-5xl xl:text-6xl font-black mb-3 leading-tight break-words">
                      {formatGroupDisplayName(
                        nextSinger.singer_name,
                        nextSinger.group_members,
                        nextSinger.group_size
                      )}
                    </p>
                    <p className="text-2xl lg:text-3xl xl:text-4xl font-semibold leading-tight break-words">
                      &ldquo;{nextSinger.song_title}&rdquo;
                      {nextSinger.song_artist && (
                        <span className="block text-xl lg:text-2xl xl:text-3xl text-yellow-100 mt-2">
                          by {nextSinger.song_artist}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-800 rounded-2xl p-6 flex items-center justify-center flex-shrink-0">
                  <p className="text-3xl font-bold text-gray-500">No one next</p>
                </div>
              )}
            </div>

            {/* Right Side - Queue List (Takes 40% on large screens) */}
            <div className="flex-1 lg:w-2/5 bg-gray-900/80 backdrop-blur-sm rounded-3xl p-4 lg:p-6 shadow-2xl border-4 border-gray-700 flex flex-col min-w-0">
              <h3 className="text-3xl lg:text-4xl font-black text-center mb-4 lg:mb-6 pb-3 border-b-4 border-gray-600">
                QUEUE
              </h3>
              <div className="flex-1 overflow-y-auto">
                {queue.length > 0 ? (
                  <div className="space-y-3 lg:space-y-4">
                    {queue.slice(0, 12).map((signup, index) => {
                      const queueNum = index + 1 + (currentSinger ? 1 : 0) + (nextSinger ? 1 : 0);
                      return (
                        <div
                          key={signup.id}
                          className="queue-item bg-gray-800 rounded-xl p-4 lg:p-5 border-2 border-gray-600 hover:border-purple-500 transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              <p className="text-4xl lg:text-5xl font-black text-purple-400 leading-none">
                                #{queueNum}
                              </p>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-2xl lg:text-3xl xl:text-4xl font-bold mb-1 leading-tight break-words">
                                {formatGroupDisplayName(
                                  signup.singer_name,
                                  signup.group_members,
                                  signup.group_size
                                )}
                              </p>
                              {signup.group_size > 1 && (
                                <p className="text-lg lg:text-xl text-gray-300 mb-2">
                                  {getGroupLabel(signup.group_size)}
                                </p>
                              )}
                              <p className="text-xl lg:text-2xl xl:text-3xl text-gray-300 leading-tight break-words">
                                &ldquo;{signup.song_title}&rdquo;
                                {signup.song_artist && (
                                  <span className="block text-lg lg:text-xl text-gray-400 mt-1">
                                    by {signup.song_artist}
                                  </span>
                                )}
                              </p>
                              {signup.is_priority && (
                                <div className="mt-2 inline-flex items-center gap-1 bg-orange-500 text-white px-3 py-1 rounded-full text-lg lg:text-xl font-bold">
                                  <Zap className="w-5 h-5" />
                                  Priority
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {queue.length > 12 && (
                      <div className="text-center py-4">
                        <p className="text-3xl lg:text-4xl text-gray-400 font-bold">
                          +{queue.length - 12} more in queue
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Mic className="w-24 h-24 mx-auto mb-4 text-gray-600" />
                      <p className="text-3xl lg:text-4xl font-bold text-gray-400">Queue is empty</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Empty State - Full Screen */}
          {!currentSinger && !nextSinger && queue.length === 0 && !loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Mic className="w-48 h-48 mx-auto mb-8 text-gray-600" />
                <p className="text-7xl lg:text-8xl font-black text-gray-400 mb-4">NO ONE IN QUEUE</p>
                <p className="text-4xl lg:text-5xl text-gray-500">Scan the QR code to sign up!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
