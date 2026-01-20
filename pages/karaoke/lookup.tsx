'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Page for users to look up their queue status by name/phone
 * URL: /karaoke/lookup?event_code=xxx&organization_id=xxx
 */
export default function KaraokeLookupPage() {
  const router = useRouter();
  const { event_code, organization_id } = router.query;

  const [singerName, setSingerName] = useState('');
  const [singerPhone, setSingerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!singerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!event_code || !organization_id) {
      setError('Event information missing. Please use the signup page link.');
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams({
        event_code: event_code as string,
        organization_id: organization_id as string,
        singer_name: singerName.trim(),
        ...(singerPhone.trim() && { singer_phone: singerPhone.trim() })
      });

      const response = await fetch(`/api/karaoke/check-status?${params}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || data.error || 'Signup not found');
      }

      const data = await response.json();
      
      // Redirect to status page
      router.push(`/karaoke/status/${data.signup.id}`);
    } catch (err: any) {
      console.error('Lookup error:', err);
      setError(err.message || 'Could not find your signup. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Look Up Your Queue Status | Karaoke</title>
        <meta property="og:title" content="Find Your Karaoke Queue Position" />
        <meta property="og:description" content="Look up your position in the karaoke queue. Enter your name and phone number to find your signup status!" />
        <meta property="og:image" content="https://tipjar.live/assets/tipjar-karaoke-status-og.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Karaoke Queue Lookup - Find your position and status!" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Find Your Karaoke Queue Position" />
        <meta name="twitter:description" content="Look up your karaoke queue status and see when it's your turn to sing!" />
        <meta name="twitter:image" content="https://tipjar.live/assets/tipjar-karaoke-status-og.png" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full mb-4">
              <Search className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Look Up Your Status
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enter your information to check your queue position
            </p>
          </div>

          <form onSubmit={handleLookup} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Your Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={singerName}
                onChange={(e) => setSingerName(e.target.value)}
                placeholder="Enter the name you used to sign up"
                required
                className="w-full"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Phone Number (Optional)
              </label>
              <Input
                type="tel"
                value={singerPhone}
                onChange={(e) => setSingerPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Helps us find your signup if there are multiple people with the same name
              </p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !singerName.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Looking up...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Find My Status
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Don't have your status link? Enter your name above to find it.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
