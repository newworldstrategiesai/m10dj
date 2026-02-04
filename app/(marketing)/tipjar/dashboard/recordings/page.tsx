'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Download, Video, Mic, Calendar } from 'lucide-react';
import { isSuperAdminEmail } from '@/utils/auth-helpers/super-admin';

interface Recording {
  id: string;
  type: 'meet' | 'voice';
  mediaType: 'video' | 'audio';
  url: string;
  title: string;
  date: string;
  username?: string;
  clientPhone?: string;
  durationSeconds?: number;
}

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const isM10Domain = typeof window !== 'undefined' && window.location.hostname.includes('m10djcompany.com');

  useEffect(() => {
    async function load() {
      try {
        const { data: { user }, error } = await createClient().auth.getUser();
        if (error || !user) {
          router.push(isM10Domain ? '/signin?redirect=/dashboard/recordings' : '/tipjar/signin?redirect=/tipjar/dashboard/recordings');
          return;
        }
        if (isM10Domain && !isSuperAdminEmail(user.email)) {
          router.push('/admin');
          return;
        }

        const res = await fetch('/api/livekit/recordings');
        if (res.ok) {
          const data = await res.json();
          setRecordings(data.recordings ?? []);
        }
      } catch (err) {
        console.error('Error loading recordings:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router, isM10Domain]);

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatDuration(sec?: number) {
    if (sec == null) return '';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="flex flex-col items-center text-white">
          {isM10Domain ? (
            <Image src="/assets/m10 dj company logo white.gif" alt="M10" width={128} height={128} className="mb-4" />
          ) : (
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
          )}
          <p className="text-lg">Loading recordings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-10 border-b border-gray-800 bg-black/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={isM10Domain ? '/dashboard/meet' : '/tipjar/dashboard/meet'}
              className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              title="Back to Meet"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            {isM10Domain && (
              <Image src="/assets/m10 dj company logo white.gif" alt="M10" width={36} height={36} className="flex-shrink-0" />
            )}
            <div>
              <h1 className="text-xl font-bold">Recordings</h1>
              <p className="text-sm text-gray-400">Video meetings and voice calls</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {recordings.length === 0 ? (
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-12 text-center">
            <div className="inline-flex p-4 rounded-full bg-gray-800 mb-4">
              <Video className="h-8 w-8 text-gray-500" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">No recordings yet</h2>
            <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
              Recordings from video meetings and voice calls will appear here after they finish processing.
            </p>
            <Link
              href={isM10Domain ? '/dashboard/meet' : '/tipjar/dashboard/meet'}
              className={`inline-flex items-center px-4 py-2 rounded-lg font-medium ${
                isM10Domain ? 'bg-[#fcba00] text-black hover:bg-[#e5a800]' : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              Go to Meet
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recordings.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-gray-800 bg-gray-900/50 hover:bg-gray-900/70 transition-colors overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4">
                  <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg bg-gray-800">
                    {r.mediaType === 'video' ? (
                      <Video className="h-6 w-6 text-[#fcba00]" />
                    ) : (
                      <Mic className="h-6 w-6 text-emerald-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-medium text-white truncate">{r.title}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          r.type === 'meet'
                            ? isM10Domain ? 'bg-[#fcba00]/20 text-[#fcba00]' : 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {r.type === 'meet' ? (r.mediaType === 'video' ? 'Meeting' : 'Meeting (audio)') : 'Voice call'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(r.date)}
                      </span>
                      {r.durationSeconds != null && r.durationSeconds > 0 && (
                        <span>{formatDuration(r.durationSeconds)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isM10Domain
                          ? 'bg-[#fcba00]/20 text-[#fcba00] hover:bg-[#fcba00]/30'
                          : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                      }`}
                    >
                      <Play className="h-4 w-4" />
                      Play
                    </a>
                    <a
                      href={r.url}
                      download
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
