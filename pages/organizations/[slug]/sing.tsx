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
import { Mic, Users, Loader2, AlertCircle, CheckCircle2, Zap, Plus, X } from 'lucide-react';
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
  const [karaokeSettings, setKaraokeSettings] = useState<any>(null);

  // Mobile UX state
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [viewportHeight, setViewportHeight] = useState('100vh');

  // Mobile keyboard and viewport handling
  useEffect(() => {
    const handleResize = () => {
      // Detect keyboard by checking if viewport height changed significantly
      const currentHeight = window.innerHeight;
      const initialHeight = window.visualViewport?.height || currentHeight;

      if (Math.abs(currentHeight - initialHeight) > 150) {
        setIsKeyboardVisible(true);
        // Adjust viewport for keyboard
        setViewportHeight(`${currentHeight}px`);
      } else {
        setIsKeyboardVisible(false);
        setViewportHeight('100dvh');
      }
    };

    const handleFocus = (e: FocusEvent) => {
      // Scroll focused input into view on mobile
      if (window.innerWidth <= 768) {
        setTimeout(() => {
          (e.target as HTMLElement)?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }, 300);
      }
    };

    const handleTouchStart = () => {
      // Hide keyboard when tapping outside inputs
      if (document.activeElement && 'blur' in document.activeElement) {
        (document.activeElement as HTMLElement).blur();
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('touchstart', handleTouchStart);

    // Initial viewport setup
    setViewportHeight('100dvh');

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

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

        // Load karaoke settings
        const { data: settings } = await supabase
          .from('karaoke_settings')
          .select('*')
          .eq('organization_id', org.id)
          .single();

        if (settings) {
          setKaraokeSettings(settings);
        }

        // Determine event QR code
        // Priority: 1) URL query param, 2) Most recent event, 3) Default to 'general'
        let eventCodeToUse = (eventCode as string) || null;
        
        if (!eventCodeToUse) {
          // Try to get most recent event for this organization
          const { data: recentEvent } = await supabase
            .from('crowd_requests')
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

  // Add a new group member
  const addMember = () => {
    setGroupMembers([...groupMembers, '']);
  };

  // Remove a group member
  const removeMember = (index: number) => {
    if (groupMembers.length > 1) {
      const newMembers = groupMembers.filter((_, i) => i !== index);
      setGroupMembers(newMembers);
    }
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
    // Check that all non-empty member fields are filled
    const filledMembers = groupMembers.filter(m => m.trim() !== '');
    if (filledMembers.length === 0) {
      setError('Please enter at least your name');
      return false;
    }

    // Check that all entered names are non-empty (no half-filled forms)
    const allEnteredNamesFilled = groupMembers.slice(0, filledMembers.length).every(m => m.trim() !== '');
    if (!allEnteredNamesFilled) {
      setError('Please fill in all singer names or remove empty fields');
      return false;
    }

    if (!songTitle.trim()) {
      setError('Please enter a song title');
      return false;
    }

    if (!songArtist.trim()) {
      setError('Please enter the artist name');
      return false;
    }

    if ((karaokeSettings?.phone_field_mode || 'required') === 'required') {
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
    } else if ((karaokeSettings?.phone_field_mode || 'required') === 'optional' && singerPhone.trim()) {
      // If optional and provided, validate format
      const phoneDigits = singerPhone.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        setError('Please enter a valid phone number (at least 10 digits)');
        return false;
      }
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
          group_size: groupMembers.filter(m => m.trim() !== '').length,
          singer_name: groupMembers[0]?.trim() || '',
          group_members: groupMembers.slice(1).filter(m => m.trim() !== ''),
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
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
          <style>{`
            html, body, #__next {
              margin: 0;
              padding: 0;
              height: 100vh;
              height: 100dvh; /* Dynamic viewport height for mobile browsers */
            }
          `}</style>
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 py-4 px-4 relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-10 left-5 w-24 h-24 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute bottom-10 right-5 w-32 h-32 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full blur-2xl animate-pulse delay-1000"></div>
          </div>
          <div className="relative z-10 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-600 dark:text-cyan-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
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
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
          <style>{`
            html, body, #__next {
              margin: 0;
              padding: 0;
              height: 100vh;
              height: 100dvh; /* Dynamic viewport height for mobile browsers */
            }
          `}</style>
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 py-4 px-4 relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-10 left-5 w-24 h-24 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute bottom-10 right-5 w-32 h-32 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full blur-2xl animate-pulse delay-1000"></div>
          </div>
          <div className="relative z-10 max-w-sm w-full mx-4">
            <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 rounded-2xl shadow-xl border border-white/30 dark:border-gray-700/50 p-6 text-center">
              <div className="relative inline-flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900 rounded-xl mb-4 mx-auto">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                <div className="absolute inset-0 bg-red-400 rounded-xl blur-sm opacity-30"></div>
              </div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Organization Not Found
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">{error}</p>
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
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
          <style>{`
            html, body, #__next {
              margin: 0;
              padding: 0;
              height: 100vh;
              height: 100dvh; /* Dynamic viewport height for mobile browsers */
            }
          `}</style>
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 py-4 px-4 relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-10 left-5 w-24 h-24 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute bottom-10 right-5 w-32 h-32 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full blur-2xl animate-pulse delay-1000"></div>
          </div>
          <div className="relative z-10 max-w-sm w-full mx-4">
            <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 rounded-2xl shadow-xl border border-white/30 dark:border-gray-700/50 p-6 text-center">
              <div className="relative inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl mb-4 mx-auto shadow-md">
                <CheckCircle2 className="w-6 h-6 text-white" />
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl blur-sm opacity-40"></div>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2">
                You're On Stage!
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                {formatGroupDisplayName(
                  groupMembers[0] || '',
                  groupMembers.length > 1 ? groupMembers.slice(1) : null,
                  groupMembers.filter(m => m.trim() !== '').length
                )}
              </p>
              <div className="bg-gradient-to-r from-slate-100/60 to-gray-100/60 dark:from-slate-800/60 dark:to-gray-800/60 rounded-lg p-4 mb-4 border border-slate-200/50 dark:border-slate-700/50">
                <p className="text-xs font-semibold text-gray-900 dark:text-white mb-1 uppercase tracking-wider">Your Song</p>
                <p className="text-base font-bold text-gray-900 dark:text-white">
                  🎵 "{songTitle}"
                </p>
                {songArtist && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">by {songArtist}</p>
                )}
              </div>
            {queuePosition && (
              <div className="bg-gradient-to-r from-blue-50/60 to-cyan-50/60 dark:from-blue-900/10 dark:to-cyan-900/10 rounded-lg p-4 mb-4 border border-blue-200/50 dark:border-blue-800/50">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1 uppercase tracking-wider">Queue Position</p>
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                  #{queuePosition}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  {queuePosition === 1 ? "🎤 You're next!" : `${queuePosition - 1} ahead`}
                </p>
              </div>
            )}

            {/* Status Check Link */}
            {signupId && (
              <div className="bg-gradient-to-r from-slate-100/60 to-gray-100/60 dark:from-slate-800/60 dark:to-gray-800/60 rounded-lg p-4 mb-4 border border-slate-200/50 dark:border-slate-700/50">
                <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                  Track Your Status
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Check your queue position anytime
                </p>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/status/karaoke/${signupId}`}
                    className="flex-1 h-8 px-2 bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded text-xs text-gray-900 dark:text-white"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        navigator.clipboard.writeText(`${window.location.origin}/karaoke/status/${signupId}`);
                      }
                    }}
                    className="h-8 px-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-xs rounded"
                  >
                    Copy
                  </Button>
                </div>
                  <Button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.open(`/status/karaoke/${signupId}`, '_blank');
                      }
                    }}
                  variant="outline"
                  className="w-full h-8 bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded text-xs"
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
                        window.location.href = `/status/karaoke/${signupId}`;
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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta property="og:title" content={`Join Karaoke with ${organization?.name || 'DJ'}`} />
        <meta property="og:description" content="Sign up for karaoke! Choose your song and join the queue. Get notified when it's your turn to sing!" />
        <meta property="og:image" content="https://tipjar.live/assets/tipjar-karaoke-signup-og.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Karaoke Sign-Up - Join the stage and sing your heart out!" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`Join Karaoke with ${organization?.name || 'DJ'}`} />
        <meta name="twitter:description" content="Sign up for karaoke! Choose your song and join the queue. Get notified when it's your turn!" />
        <meta name="twitter:image" content="https://tipjar.live/assets/tipjar-karaoke-signup-og.png" />
        <style>{`
          html, body, #__next {
            margin: 0;
            padding: 0;
            height: 100vh;
            height: 100dvh; /* Dynamic viewport height for mobile browsers */
            overflow-x: hidden;
          }

          /* Prevent zoom on input focus for iOS */
          input[type="text"],
          input[type="email"],
          input[type="tel"],
          input[type="search"],
          textarea,
          select {
            font-size: 16px !important; /* Prevents zoom on iOS */
          }

          /* Better touch targets */
          button, .cursor-pointer {
            min-height: 44px;
            min-width: 44px;
          }

          /* Smooth scrolling */
          html {
            scroll-behavior: smooth;
          }

          /* Hide scrollbar on mobile but keep functionality */
          ::-webkit-scrollbar {
            width: 0px;
            background: transparent;
          }
        `}</style>
      </Head>
      <div
        className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 py-2 px-3 relative overflow-hidden"
        style={{
          minHeight: viewportHeight,
          paddingBottom: isKeyboardVisible ? '20px' : '8px'
        }}
      >
        {/* Futuristic background elements - reduced for mobile */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-5 w-24 h-24 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-10 right-5 w-32 h-32 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full blur-2xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-r from-indigo-400 to-cyan-500 rounded-full blur-2xl opacity-15"></div>
        </div>

        <div className="max-w-2xl mx-auto relative z-10 h-screen flex flex-col">
          <div className="flex-1 backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 rounded-2xl shadow-2xl border border-white/30 dark:border-gray-700/50 overflow-hidden flex flex-col">
            {/* Compact header */}
            <div className="text-center py-4 px-6 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="relative inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl shadow-md">
                  <Mic className="w-5 h-5 text-white" />
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl blur-sm opacity-40"></div>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    Karaoke Sign-Up
                  </h1>
                  {organization && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {organization.name}
                    </p>
                  )}
                </div>
              </div>
              {eventQrCode && eventQrCode !== organization?.slug && (
                <p className="text-xs text-cyan-600 dark:text-cyan-400">
                  Event: {eventQrCode}
                </p>
              )}
            </div>

            {/* Status info - compact */}
            <div className="px-6 py-3 border-b border-gray-200/50 dark:border-gray-700/50">
              {currentSinger && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-300 uppercase tracking-wider">Now: {formatGroupDisplayName(currentSinger.singer_name, currentSinger.group_members, currentSinger.group_size)}</span>
                </div>
              )}
              {queueLength > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {queueLength} {queueLength === 1 ? 'person' : 'people'} ahead
                  </span>
                </div>
              )}
            </div>

            {/* Form content */}
            <div className={`flex-1 px-6 ${isKeyboardVisible ? 'py-2' : 'py-4'} overflow-y-auto`}>
              <form onSubmit={handleSubmit} className="space-y-4">
              {/* Dynamic Group Member Names */}
              <div>
                <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-2 uppercase tracking-wider">
                  Singer Names
                </label>
                <div className="space-y-2">
                  {groupMembers.map((member, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        type="text"
                        value={member}
                        onChange={(e) => handleMemberChange(index, e.target.value)}
                        placeholder={index === 0 ? 'Your name' : `Group member ${index + 1}`}
                        required
                        className="flex-1 min-h-[44px] h-11 text-base bg-white/70 dark:bg-gray-800/70 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                        autoComplete={index === 0 ? "name" : undefined}
                        autoCapitalize="words"
                        autoCorrect="off"
                      />
                      {index > 0 && (
                        <Button
                          type="button"
                          onClick={() => removeMember(index)}
                          variant="outline"
                          size="sm"
                          className="min-h-[44px] h-11 px-3 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 active:scale-95 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}

                  {/* Add member button */}
                  <Button
                    type="button"
                    onClick={addMember}
                    variant="outline"
                    className="w-full min-h-[44px] h-11 mt-2 border-cyan-200 text-cyan-600 hover:bg-cyan-50 dark:border-cyan-800 dark:text-cyan-400 dark:hover:bg-cyan-900/20 active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add another singer
                  </Button>
                </div>
              </div>


              {/* Song Selection - Compact */}
              <div>
                <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-2 uppercase tracking-wider">
                  Song <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
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
                    className="w-full min-h-[44px] h-11 text-base bg-white/70 dark:bg-gray-800/70 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  />
                  <Input
                    type="text"
                    value={songArtist}
                    onChange={(e) => setSongArtist(e.target.value)}
                    placeholder="Artist name"
                    required
                    className="w-full min-h-[44px] h-11 text-base bg-white/70 dark:bg-gray-800/70 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                </div>
              </div>

              {/* Contact Info - Compact */}
              <div>
                <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-2 uppercase tracking-wider">
                  Contact Info
                </label>
                <div className="space-y-2">
                  {(karaokeSettings?.phone_field_mode || 'required') !== 'hidden' && (
                    <>
                  <Input
                    type="tel"
                    value={singerPhone}
                    onChange={(e) => setSingerPhone(e.target.value)}
                    placeholder={`Phone number${(karaokeSettings?.phone_field_mode || 'required') === 'required' ? ' (required)' : ' (optional)'}`}
                    required={karaokeSettings?.phone_field_mode === 'required'}
                    className="w-full min-h-[44px] h-11 text-base bg-white/70 dark:bg-gray-800/70 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                  <p className="text-xs text-cyan-600 dark:text-cyan-400">
                    📱 {(karaokeSettings?.phone_field_mode || 'required') === 'required' ? "We'll text you when you're next up!" : "We'll text you updates if you provide your number"}
                  </p>
                    </>
                  )}
                  <Input
                    type="email"
                    value={singerEmail}
                    onChange={(e) => setSingerEmail(e.target.value)}
                    placeholder="Email (optional)"
                    className="w-full min-h-[44px] h-11 text-base bg-white/70 dark:bg-gray-800/70 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                </div>
              </div>

              {/* Priority Option - Compact */}
              <div className="bg-gradient-to-r from-yellow-50/60 to-amber-50/60 dark:from-yellow-900/10 dark:to-amber-900/10 border border-yellow-200/50 dark:border-yellow-800/50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        Skip queue - $10
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={isPriority}
                    onCheckedChange={setIsPriority}
                    className="data-[state=checked]:bg-yellow-500 scale-90"
                  />
                </div>
              </div>

              {/* Error Message - Compact */}
              {error && (
                <div className="bg-red-50/80 dark:bg-red-900/10 border border-red-200/50 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-xs font-medium text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              {/* Submit Button - Prominent and compact */}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full min-h-[48px] h-14 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base rounded-xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200"
              >
                <div className="flex items-center justify-center gap-2">
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing Up...</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      <span>Join the Stage</span>
                    </>
                  )}
                </div>
              </Button>
            </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
