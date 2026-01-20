'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Mic, Users, Loader2, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { getGroupLabel, formatGroupDisplayName } from '@/types/karaoke';
import SongAutocomplete from '@/components/karaoke/SongAutocomplete';

export default function KaraokeSignupPage() {
  const router = useRouter();
  const { code } = router.query;


  const [groupSize, setGroupSize] = useState(1);
  const [groupMembers, setGroupMembers] = useState<string[]>(['']);
  const [singerName, setSingerName] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [singerEmail, setSingerEmail] = useState('');
  const [singerPhone, setSingerPhone] = useState('');
  const [isPriority, setIsPriority] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [signupId, setSignupId] = useState<string | null>(null);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [currentSinger, setCurrentSinger] = useState<any>(null);
  const [queueLength, setQueueLength] = useState(0);

  // Update group members array when group size changes
  useEffect(() => {
    if (groupSize > 1) {
      const newMembers = Array(groupSize).fill('').map((_, i) => groupMembers[i] || '');
      setGroupMembers(newMembers);
      // Set primary singer name from first member if not set
      if (!singerName && newMembers[0]) {
        setSingerName(newMembers[0]);
      }
    } else {
      setGroupMembers(['']);
      // For solo, use singerName as the only member
      if (singerName) {
        setGroupMembers([singerName]);
      }
    }
  }, [groupSize]);

  // Fetch organization and queue info
  useEffect(() => {
    if (code) {
      fetchEventInfo(code as string);
      fetchQueue(code as string);
    }
  }, [code]);

  const fetchEventInfo = async (eventCode: string) => {
    try {
      const response = await fetch(`/api/crowd-request/event-info?code=${eventCode}`);
      if (response.ok) {
        const data = await response.json();
        setOrganizationId(data.organization_id);
      }
    } catch (err) {
      console.error('Error fetching event info:', err);
    }
  };

  const fetchQueue = async (eventCode: string) => {
    if (!organizationId) return;
    
    try {
      const response = await fetch(`/api/karaoke/queue?event_code=${eventCode}&organization_id=${organizationId}`);
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
    setError('');
  };

  const handleMemberChange = (index: number, value: string) => {
    const newMembers = [...groupMembers];
    newMembers[index] = value;
    setGroupMembers(newMembers);
    
    // Update primary singer name from first member
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

    if (!organizationId) {
      setError('Event not found. Please check your QR code.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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
          event_qr_code: code,
          organization_id: organizationId,
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
            organization_id: organizationId,
          }),
        });

        const checkoutData = await checkoutResponse.json();
        if (checkoutData.checkout_url) {
          window.location.href = checkoutData.checkout_url;
          return;
        }
      }

      // Refresh queue
      if (code) {
        fetchQueue(code as string);
      }
    } catch (err: any) {
      console.error('Error submitting signup:', err);
      setError(err.message || 'Failed to sign up. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success && signupId) {
    return (
      <>
        <Head>
          <title>Signed Up! | Karaoke</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              You're Signed Up!
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {formatGroupDisplayName(singerName, groupSize > 1 ? groupMembers : null, groupSize)}
            </p>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Song</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                "{songTitle}"
              </p>
              {songArtist && (
                <p className="text-sm text-gray-500 dark:text-gray-400">by {songArtist}</p>
              )}
            </div>
            {queuePosition && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Your Position</p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                  #{queuePosition}
                </p>
                <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                  {queuePosition === 1 ? "You're next!" : `${queuePosition - 1} ahead of you`}
                </p>
              </div>
            )}

            {/* Status Check Link */}
            {signupId && (
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 mb-6 border border-purple-200 dark:border-purple-800">
                <p className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2">
                  Check Your Status Anytime
                </p>
                <p className="text-xs text-purple-700 dark:text-purple-300 mb-3">
                  Bookmark this page to check your queue position:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/karaoke/status/${signupId}`}
                    className="flex-1 px-3 py-2 text-xs bg-white dark:bg-gray-700 border border-purple-200 dark:border-purple-700 rounded text-gray-900 dark:text-white"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        navigator.clipboard.writeText(`${window.location.origin}/karaoke/status/${signupId}`);
                      }
                    }}
                    className="bg-purple-600 hover:bg-purple-700"
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
                  className="w-full mt-3 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300"
                >
                  Open Status Page
                </Button>
              </div>
            )}

            <div className="flex gap-3">
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
                className="flex-1"
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
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  View Status
                </Button>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Karaoke Sign-Up | {code}</title>
        <meta property="og:title" content={`Join Karaoke Event: ${code}`} />
        <meta property="og:description" content="Sign up for karaoke! Choose your song, join the queue, and get notified when it's your turn to perform!" />
        <meta property="og:image" content="https://tipjar.live/assets/tipjar-karaoke-signup-og.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Karaoke Sign-Up - Join the karaoke queue and sing your favorite song!" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`Join Karaoke Event: ${code}`} />
        <meta name="twitter:description" content="Sign up for karaoke! Choose your song and join the queue!" />
        <meta name="twitter:image" content="https://tipjar.live/assets/tipjar-karaoke-signup-og.png" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full mb-4">
                <Mic className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Karaoke Sign-Up
              </h1>
              {code && (
                <p className="text-gray-600 dark:text-gray-400">
                  Event: {code}
                </p>
              )}
            </div>

            {/* Current Singer Info */}
            {currentSinger && (
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 mb-6 border border-purple-200 dark:border-purple-800">
                <p className="text-sm text-purple-600 dark:text-purple-400 mb-1">Now Singing</p>
                <p className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                  {formatGroupDisplayName(
                    currentSinger.singer_name,
                    currentSinger.group_members,
                    currentSinger.group_size
                  )}
                </p>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  "{currentSinger.song_title}"
                  {currentSinger.song_artist && ` by ${currentSinger.song_artist}`}
                </p>
              </div>
            )}

            {/* Queue Length */}
            {queueLength > 0 && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {queueLength} {queueLength === 1 ? 'person' : 'people'} in queue
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Group Size Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Group Size
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handleGroupSizeChange(size)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        groupSize === size
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-400'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <Users className={`w-6 h-6 mx-auto mb-2 ${
                        groupSize === size
                          ? 'text-purple-600 dark:text-purple-400'
                          : 'text-gray-400 dark:text-gray-500'
                      }`} />
                      <p className={`text-sm font-medium ${
                        groupSize === size
                          ? 'text-purple-700 dark:text-purple-300'
                          : 'text-gray-600 dark:text-gray-400'
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
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  {groupSize === 1 ? 'Your Name' : 'Group Member Names'}
                </label>
                <div className="space-y-3">
                  {groupMembers.map((member, index) => (
                    <Input
                      key={index}
                      type="text"
                      value={member}
                      onChange={(e) => handleMemberChange(index, e.target.value)}
                      placeholder={groupSize === 1 ? 'Enter your name' : `Member ${index + 1} name`}
                      required
                      className="w-full"
                    />
                  ))}
                </div>
              </div>

              {/* Song Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Song Title <span className="text-red-500">*</span>
                </label>
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
                  organizationId={organizationId}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Artist (Optional)
                </label>
                <Input
                  type="text"
                  value={songArtist}
                  onChange={(e) => setSongArtist(e.target.value)}
                  placeholder="Enter artist name"
                  className="w-full"
                />
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Email (Optional)
                  </label>
                  <Input
                    type="email"
                    value={singerEmail}
                    onChange={(e) => setSingerEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="tel"
                    value={singerPhone}
                    onChange={(e) => setSingerPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    required
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    We'll text you when you're next up! 📱
                  </p>
                </div>
              </div>

              {/* Priority Option */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        Skip the Line
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Pay $10 to move to the front of the queue
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={isPriority}
                    onCheckedChange={setIsPriority}
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                size="lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing Up...
                  </>
                ) : (
                  'Join Queue'
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
