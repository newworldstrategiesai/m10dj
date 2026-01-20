'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Mic, Users, Loader2, AlertCircle, CheckCircle2, Clock, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatGroupDisplayName, getGroupLabel } from '@/types/karaoke';
import { formatEstimatedWait } from '@/utils/karaoke-queue';

export default function KaraokeStatusPage() {
  const router = useRouter();
  const { signupId } = router.query;

  const [signup, setSignup] = useState<any>(null);
  const [queueInfo, setQueueInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (signupId) {
      fetchStatus();
    }
  }, [signupId]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh || !signupId) return;

    const interval = setInterval(() => {
      fetchStatus();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, signupId]);

  const fetchStatus = async () => {
    if (!signupId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/karaoke/check-status?signup_id=${signupId}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || data.error || 'Failed to load status');
      }

      const data = await response.json();
      setSignup(data.signup);
      setQueueInfo(data.queue_info);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Error fetching status:', err);
      setError(err.message || 'Failed to load your queue status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'singing':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <Mic className="w-4 h-4" />
            Currently Singing
          </span>
        );
      case 'next':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
            <ArrowUp className="w-4 h-4" />
            Next Up!
          </span>
        );
      case 'queued':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
            <Clock className="w-4 h-4" />
            In Queue
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            <CheckCircle2 className="w-4 h-4" />
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  if (loading && !signup) {
    return (
      <>
        <Head>
          <title>Checking Status... | Karaoke Queue</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 dark:text-purple-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading your queue status...</p>
          </div>
        </div>
      </>
    );
  }

  if (error && !signup) {
    return (
      <>
        <Head>
          <title>Status Not Found | Karaoke Queue</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Status Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Your Queue Status | Karaoke</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full mb-4">
                <Mic className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Your Queue Status
              </h1>
              {lastUpdated && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>

            {/* Status Badge */}
            {signup && (
              <div className="flex justify-center mb-6">
                {getStatusBadge(signup.status)}
              </div>
            )}

            {/* Signup Info */}
            {signup && (
              <div className="space-y-6">
                {/* Your Info */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">You</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatGroupDisplayName(
                      signup.singer_name,
                      signup.group_members,
                      signup.group_size
                    )}
                  </p>
                  {signup.group_size > 1 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {getGroupLabel(signup.group_size)}
                    </p>
                  )}
                </div>

                {/* Song Info */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Song</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    "{signup.song_title}"
                  </p>
                  {signup.song_artist && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      by {signup.song_artist}
                    </p>
                  )}
                </div>

                {/* Queue Position */}
                {signup.status !== 'completed' && signup.queue_position && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 text-center border-2 border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">Your Position</p>
                    <p className="text-5xl font-bold text-blue-700 dark:text-blue-300 mb-2">
                      #{signup.queue_position}
                    </p>
                    {queueInfo && queueInfo.ahead_of_you > 0 && (
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        {queueInfo.ahead_of_you} {queueInfo.ahead_of_you === 1 ? 'person' : 'people'} ahead of you
                      </p>
                    )}
                    {signup.queue_position === 1 && signup.status === 'next' && (
                      <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mt-2">
                        You're next! Get ready! 🎤
                      </p>
                    )}
                    {signup.is_priority && (
                      <p className="text-xs text-blue-500 dark:text-blue-400 mt-2 flex items-center justify-center gap-1">
                        <ArrowUp className="w-3 h-3" />
                        Priority placement
                      </p>
                    )}
                  </div>
                )}

                {/* Completed Status */}
                {signup.status === 'completed' && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 text-center border-2 border-green-200 dark:border-green-800">
                    <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-2" />
                    <p className="text-lg font-semibold text-green-800 dark:text-green-300">
                      You've completed your performance!
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                      Thank you for participating!
                    </p>
                  </div>
                )}

                {/* Auto-refresh Toggle */}
                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Auto-refresh
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Updates every 10 seconds
                    </p>
                  </div>
                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      autoRefresh
                        ? 'bg-purple-600'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        autoRefresh ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Manual Refresh Button */}
                <Button
                  onClick={fetchStatus}
                  disabled={loading}
                  className="w-full"
                  variant="outline"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    'Refresh Status'
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
