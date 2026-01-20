/**
 * Organization-specific karaoke signup page
 * URL: /organizations/[slug]/sing
 * Example: tipjar.live/username/sing
 * 
 * This page allows anyone to sign up for karaoke for a specific DJ organization
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Mic, Users, Loader2, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { getGroupLabel, formatGroupDisplayName } from '@/types/karaoke';
import SongAutocomplete from '@/components/karaoke/SongAutocomplete';

export default function OrganizationKaraokePage() {
  const router = useRouter();
  const { slug, eventCode } = router.query;
  const supabase = createClientComponentClient();
  
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [groupSize, setGroupSize] = useState(1);
  const [groupMembers, setGroupMembers] = useState<string[]>(['']);
  const [singerName, setSingerName] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [singerEmail, setSingerEmail] = useState('');
  const [singerPhone, setSingerPhone] = useState('');
  const [isPriority, setIsPriority] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [signupId, setSignupId] = useState<string | null>(null);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [currentSinger, setCurrentSinger] = useState<any>(null);
  const [queueLength, setQueueLength] = useState(0);
  const [eventQrCode, setEventQrCode] = useState<string>('');

  // Load organization
  useEffect(() => {
    async function loadOrganization() {
      if (!slug) return;

      try {
        // Try exact match first
        let { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('slug', slug as string)
          .maybeSingle();

        // If not found, try normalized match
        if (!org && !orgError) {
          const { data: normalizedOrgs } = await supabase
            .rpc('get_organization_by_normalized_slug', { input_slug: slug as string });
          
          if (normalizedOrgs && normalizedOrgs.length > 0) {
            const matchedSlug = normalizedOrgs[0].slug;
            const { data: fullOrg } = await supabase
              .from('organizations')
              .select('*')
              .eq('slug', matchedSlug)
              .maybeSingle();
            
            if (fullOrg) {
              org = fullOrg;
            }
          }
        }

        if (orgError) {
          setError('Organization not found');
          setLoading(false);
          return;
        }

        if (!org) {
          setError('Organization not found');
          setLoading(false);
          return;
        }

        setOrganization(org);

        // Determine event QR code
        // Priority: 1) URL query param, 2) Most recent event, 3) Default to 'general'
        let eventCodeToUse = (eventCode as string) || null;
        
        if (!eventCodeToUse) {
          // Try to get most recent event for this organization
          const { data: recentEvent } = await supabase
            .from('contacts')
            .select('event_qr_code')
            .eq('organization_id', org.id)
            .not('event_qr_code', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (recentEvent?.event_qr_code) {
            eventCodeToUse = recentEvent.event_qr_code;
          } else {
            // Fallback to organization slug as event code
            eventCodeToUse = org.slug || 'general';
          }
        }

        setEventQrCode(eventCodeToUse || 'general');
        
        // Fetch queue info
        if (eventCodeToUse) {
          fetchQueue(eventCodeToUse, org.id);
        }

        setLoading(false);
      } catch (err: any) {
        console.error('Error loading organization:', err);
        setError('Failed to load organization');
        setLoading(false);
      }
    }

    loadOrganization();
  }, [slug, eventCode, supabase]);

  // Update group members array when group size changes
  useEffect(() => {
    if (groupSize > 1) {
      const newMembers = Array(groupSize).fill('').map((_, i) => groupMembers[i] || '');
      setGroupMembers(newMembers);
      if (!singerName && newMembers[0]) {
        setSingerName(newMembers[0]);
      }
    } else {
      setGroupMembers(['']);
      if (singerName) {
        setGroupMembers([singerName]);
      }
    }
  }, [groupSize]);

  const fetchQueue = async (eventCode: string, orgId: string) => {
    try {
      const response = await fetch(`/api/karaoke/queue?event_code=${eventCode}&organization_id=${orgId}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentSinger(data.current);
        setQueueLength(data.total_in_queue);
      }
    } catch (err) {
      console.error('Error fetching queue:', err);
    }
  };

  const handleGroupSizeChange = (size: number) => {
    setGroupSize(size);
    setError(null);
  };

  const handleMemberChange = (index: number, value: string) => {
    const newMembers = [...groupMembers];
    newMembers[index] = value;
    setGroupMembers(newMembers);
    
    if (index === 0) {
      setSingerName(value);
    }
  };

  const validateForm = (): boolean => {
    if (!singerName.trim()) {
      setError('Please enter your name');
      return false;
    }

    if (groupSize > 1) {
      const allMembersFilled = groupMembers.every(m => m.trim() !== '');
      if (!allMembersFilled) {
        setError(`Please enter all ${groupSize} group member names`);
        return false;
      }
    }

    if (!songTitle.trim()) {
      setError('Please enter a song title');
      return false;
    }

    if (!singerPhone.trim()) {
      setError('Phone number is required. We need it to notify you when you\'re next up!');
      return false;
    }

    // Validate phone number format (at least 10 digits)
    const phoneDigits = singerPhone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      setError('Please enter a valid phone number (at least 10 digits)');
      return false;
    }

    if (!organization) {
      setError('Organization not found');
      return false;
    }

    if (!eventQrCode) {
      setError('Event not found');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/karaoke/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_qr_code: eventQrCode,
          organization_id: organization.id,
          group_size: groupSize,
          singer_name: singerName.trim(),
          group_members: groupSize > 1 ? groupMembers.map(m => m.trim()) : [singerName.trim()],
          song_title: songTitle.trim(),
          song_artist: songArtist.trim() || null,
          singer_email: singerEmail.trim() || null,
          singer_phone: singerPhone.trim() || null,
          is_priority: isPriority,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || data.error || 'Failed to sign up. Please try again.');
        setSubmitting(false);
        return;
      }

      setSignupId(data.signup.id);
      setQueuePosition(data.signup.queue_position);
      setSuccess(true);

      // If priority payment required, redirect to checkout
      if (data.requires_payment) {
        const checkoutResponse = await fetch('/api/karaoke/priority-checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            signup_id: data.signup.id,
            organization_id: organization.id,
          }),
        });

        const checkoutData = await checkoutResponse.json();
        if (checkoutData.checkout_url) {
          window.location.href = checkoutData.checkout_url;
          return;
        }
      }

      // Refresh queue
      if (eventQrCode) {
        fetchQueue(eventQrCode, organization.id);
      }
    } catch (err: any) {
      console.error('Error submitting signup:', err);
      setError(err.message || 'Failed to sign up. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Karaoke Sign-Up | Loading...</title>
          <style>{`
            html, body, #__next {
              margin: 0;
              padding: 0;
            }
          `}</style>
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 pt-8 pb-8 px-4 relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>
          <div className="relative z-10">
            <Loader2 className="w-12 h-12 animate-spin text-cyan-600 dark:text-cyan-400" />
          </div>
        </div>
      </>
    );
  }

  if (error && !organization) {
    return (
      <>
        <Head>
          <title>Organization Not Found</title>
          <style>{`
            html, body, #__next {
              margin: 0;
              padding: 0;
            }
          `}</style>
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 pt-8 pb-8 px-4 relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>
          <div className="relative z-10 max-w-md w-full">
            <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 p-8 text-center">
              <div className="relative inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900 rounded-2xl mb-6">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                <div className="absolute inset-0 bg-red-400 rounded-2xl blur-md opacity-30"></div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Organization Not Found
              </h1>
              <p className="text-gray-600 dark:text-gray-300">{error}</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (success && signupId) {
    return (
      <>
        <Head>
          <title>Signed Up! | {organization?.name || 'Karaoke'}</title>
          <style>{`
            html, body, #__next {
              margin: 0;
              padding: 0;
            }
          `}</style>
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 pt-8 pb-8 px-4 relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>
          <div className="relative z-10 max-w-md w-full">
            <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 p-8 text-center">
              <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl mb-6 shadow-lg">
                <CheckCircle2 className="w-10 h-10 text-white" />
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl blur-md opacity-50"></div>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-4">
                You're On Stage!
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 font-medium">
                {formatGroupDisplayName(singerName, groupSize > 1 ? groupMembers : null, groupSize)}
              </p>
              <div className="backdrop-blur-sm bg-gradient-to-r from-slate-100/80 to-gray-100/80 dark:from-slate-800/80 dark:to-gray-800/80 rounded-2xl p-6 mb-6 border border-slate-200/50 dark:border-slate-700/50">
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">Your Song</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  🎵 "{songTitle}"
                </p>
                {songArtist && (
                  <p className="text-base text-gray-600 dark:text-gray-400 font-medium">by {songArtist}</p>
                )}
              </div>
            {queuePosition && (
              <div className="backdrop-blur-sm bg-gradient-to-r from-blue-50/80 to-cyan-50/80 dark:from-blue-900/10 dark:to-cyan-900/10 rounded-2xl p-6 mb-6 border border-blue-200/50 dark:border-blue-800/50">
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2 uppercase tracking-wider">Queue Position</p>
                <p className="text-4xl font-bold text-blue-800 dark:text-blue-200 mb-1">
                  #{queuePosition}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  {queuePosition === 1 ? "🎤 You're next!" : `${queuePosition - 1} ${queuePosition - 1 === 1 ? 'person' : 'people'} ahead of you`}
                </p>
              </div>
            )}

            {/* Status Check Link */}
            {signupId && (
              <div className="backdrop-blur-sm bg-gradient-to-r from-slate-100/80 to-gray-100/80 dark:from-slate-800/80 dark:to-gray-800/80 rounded-2xl p-6 mb-6 border border-slate-200/50 dark:border-slate-700/50">
                <p className="text-base font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wider">
                  Track Your Status
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Bookmark this link to check your queue position anytime:
                </p>
                <div className="flex gap-3 mb-4">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/karaoke/status/${signupId}`}
                    className="flex-1 h-10 px-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        navigator.clipboard.writeText(`${window.location.origin}/karaoke/status/${signupId}`);
                      }
                    }}
                    className="h-10 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-medium rounded-xl"
                  >
                    Copy
                  </Button>
                </div>
                <Button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.open(`/karaoke/status/${signupId}`, '_blank');
                    }
                  }}
                  variant="outline"
                  className="w-full h-10 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-300"
                >
                  Open Status Page
                </Button>
              </div>
            )}

              <div className="flex gap-4 mt-8">
                <Button
                  onClick={() => {
                    setSuccess(false);
                    setSingerName('');
                    setGroupMembers(['']);
                    setSongTitle('');
                    setSongArtist('');
                    setSingerEmail('');
                    setSingerPhone('');
                    setGroupSize(1);
                    setIsPriority(false);
                    setSignupId(null);
                    setQueuePosition(null);
                  }}
                  variant="outline"
                  className="flex-1 h-12 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-300"
                >
                  Sign Up Another
                </Button>
                {signupId && (
                  <Button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.location.href = `/karaoke/status/${signupId}`;
                      }
                    }}
                    className="flex-1 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    View Status
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Karaoke Sign-Up | {organization?.name || slug}</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 pt-8 pb-8 px-4 relative overflow-hidden">
        {/* Futuristic background elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-indigo-400 to-cyan-500 rounded-full blur-3xl opacity-20"></div>
        </div>

        <div className="max-w-2xl mx-auto relative z-10">
          <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 p-8 md:p-10">
            <div className="text-center mb-12">
              <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl mb-6 shadow-lg">
                <Mic className="w-10 h-10 text-white" />
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur-md opacity-50"></div>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-3">
                Karaoke Sign-Up
              </h1>
              {organization && (
                <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
                  {organization.name}
                </p>
              )}
              {eventQrCode && eventQrCode !== organization?.slug && (
                <p className="text-sm text-cyan-600 dark:text-cyan-400 mt-2 font-medium">
                  Event: {eventQrCode}
                </p>
              )}
            </div>

            {/* Current Singer Info */}
            {currentSinger && (
              <div className="backdrop-blur-sm bg-gradient-to-r from-cyan-500/10 to-blue-500/10 dark:from-cyan-500/5 dark:to-blue-500/5 rounded-2xl p-6 mb-8 border border-cyan-200/50 dark:border-cyan-800/50 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-sm font-semibold text-cyan-700 dark:text-cyan-300 uppercase tracking-wider">Now Performing</p>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {formatGroupDisplayName(
                    currentSinger.singer_name,
                    currentSinger.group_members,
                    currentSinger.group_size
                  )}
                </p>
                <p className="text-base text-gray-700 dark:text-gray-300 font-medium">
                  🎵 "{currentSinger.song_title}"
                  {currentSinger.song_artist && ` by ${currentSinger.song_artist}`}
                </p>
              </div>
            )}

            {/* Queue Length */}
            {queueLength > 0 && (
              <div className="backdrop-blur-sm bg-gradient-to-r from-slate-100/80 to-gray-100/80 dark:from-slate-800/80 dark:to-gray-800/80 rounded-xl p-4 mb-8 border border-slate-200/50 dark:border-slate-700/50 text-center">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  <span className="inline-flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    {queueLength} {queueLength === 1 ? 'person' : 'people'} ahead of you
                  </span>
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Group Size Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">
                  Group Size
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handleGroupSizeChange(size)}
                      className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                        groupSize === size
                          ? 'border-cyan-500 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 shadow-lg shadow-cyan-500/25'
                          : 'border-gray-200 dark:border-gray-700 hover:border-cyan-400 hover:bg-gradient-to-br hover:from-gray-50 hover:to-cyan-50 dark:hover:from-gray-800 dark:hover:to-cyan-900/10'
                      }`}
                    >
                      <div className={`absolute inset-0 rounded-2xl transition-opacity duration-300 ${
                        groupSize === size ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                      }`}>
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl blur-md opacity-20"></div>
                      </div>
                      <Users className={`w-8 h-8 mx-auto mb-3 transition-colors duration-300 ${
                        groupSize === size
                          ? 'text-cyan-600 dark:text-cyan-400'
                          : 'text-gray-400 dark:text-gray-500 group-hover:text-cyan-500'
                      }`} />
                      <p className={`text-sm font-semibold transition-colors duration-300 ${
                        groupSize === size
                          ? 'text-cyan-700 dark:text-cyan-300'
                          : 'text-gray-600 dark:text-gray-400 group-hover:text-cyan-400'
                      }`}>
                        {getGroupLabel(size)}
                      </p>
                    </button>
                  ))}
                </div>
                {groupSize > 4 && (
                  <div className="mt-3">
                    <Input
                      type="number"
                      min="5"
                      max="10"
                      value={groupSize}
                      onChange={(e) => handleGroupSizeChange(parseInt(e.target.value) || 5)}
                      className="w-32"
                      placeholder="5-10"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Enter group size (5-10)
                    </p>
                  </div>
                )}
              </div>

              {/* Group Member Names */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">
                  {groupSize === 1 ? 'Your Name' : 'Group Members'}
                </label>
                <div className="space-y-4">
                  {groupMembers.map((member, index) => (
                    <div key={index} className="relative">
                      <Input
                        type="text"
                        value={member}
                        onChange={(e) => handleMemberChange(index, e.target.value)}
                        placeholder={groupSize === 1 ? 'Enter your name' : `Member ${index + 1} name`}
                        required
                        className="w-full h-12 pl-4 pr-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-cyan-500 rounded-full opacity-0 transition-opacity duration-300 peer-focus:opacity-100"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Song Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">
                  Song Selection <span className="text-red-500">*</span>
                </label>
                <div className="space-y-4">
                  <SongAutocomplete
                    value={songTitle}
                    onChange={(value) => setSongTitle(value)}
                  onSelect={(song) => {
                    setSongTitle(song.title);
                    if (song.artist) {
                      setSongArtist(song.artist);
                    }
                  }}
                  placeholder="Search for a song..."
                  organizationId={organization?.id}
                  className="w-full"
                />

                  <Input
                    type="text"
                    value={songArtist}
                    onChange={(e) => setSongArtist(e.target.value)}
                    placeholder="Artist name (optional)"
                    className="w-full h-12 pl-4 pr-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">
                  Contact Information
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      type="email"
                      value={singerEmail}
                      onChange={(e) => setSingerEmail(e.target.value)}
                      placeholder="your@email.com (optional)"
                      className="w-full h-12 pl-4 pr-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                  </div>
                  <div>
                    <Input
                      type="tel"
                      value={singerPhone}
                      onChange={(e) => setSingerPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                      required
                      className="w-full h-12 pl-4 pr-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                    <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-2 font-medium">
                      📱 We'll text you when you're next up!
                    </p>
                  </div>
                </div>
              </div>

              {/* Priority Option */}
              <div className="backdrop-blur-sm bg-gradient-to-r from-yellow-50/80 to-amber-50/80 dark:from-yellow-900/10 dark:to-amber-900/10 border border-yellow-200/50 dark:border-yellow-800/50 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Zap className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                      <div className="absolute inset-0 bg-yellow-400 rounded-full blur-sm opacity-30"></div>
                    </div>
                    <div>
                      <p className="text-base font-bold text-gray-900 dark:text-white">
                        Priority Access
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Skip the queue for $10 • Instant performance
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={isPriority}
                    onCheckedChange={setIsPriority}
                    className="data-[state=checked]:bg-yellow-500"
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="backdrop-blur-sm bg-red-50/80 dark:bg-red-900/10 border border-red-200/50 dark:border-red-800/50 rounded-xl p-4 flex items-center gap-3 shadow-lg">
                  <div className="relative">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <div className="absolute inset-0 bg-red-400 rounded-full blur-sm opacity-30"></div>
                  </div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={submitting}
                className="group relative w-full h-14 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:hover:scale-100 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center gap-3">
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Signing Up...</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5" />
                      <span>Join the Stage</span>
                    </>
                  )}
                </div>
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
