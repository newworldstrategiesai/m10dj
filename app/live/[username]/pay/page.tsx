'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Loader2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

export default function PPVPaymentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const username = (params?.username as string) || '';
  const priceCents = parseInt(searchParams?.get('price') || '0');
  const [loading, setLoading] = useState(false);
  const [stream, setStream] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadStream() {
      const { data: streamData } = await supabase
        .from('live_streams')
        .select('*')
        .eq('username', username.replace('@', ''))
        .single();

      if (streamData) {
        setStream(streamData);
      }
    }

    if (username) {
      loadStream();
    }
  }, [username, supabase]);

  async function handlePurchase() {
    if (!stream || priceCents <= 0) return;

    setLoading(true);
    try {
      // Create PPV payment session
      const response = await fetch('/api/livekit/ppv-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stream_id: stream.id,
          room_name: stream.room_name,
          amount_cents: priceCents,
          return_url: `${window.location.origin}/live/@${username}`,
        }),
      });

      const data = await response.json();

      if (data.sessionId) {
        // Redirect to Stripe Checkout
        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
        if (stripe) {
          await (stripe as any).redirectToCheckout({ sessionId: data.sessionId });
        }
      } else {
        alert('Failed to create payment session');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Failed to process payment');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-gray-900 border-gray-800">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Lock className="h-6 w-6 text-purple-400" />
            <CardTitle className="text-white">Unlock Live Stream</CardTitle>
          </div>
          <CardDescription className="text-gray-400">
            This is a paid stream. Purchase access to watch live.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400">Stream:</span>
              <span className="text-white font-semibold">@{username}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Price:</span>
              <span className="text-2xl font-bold text-purple-400">
                ${(priceCents / 100).toFixed(2)}
              </span>
            </div>
          </div>

          <Button
            onClick={handlePurchase}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Purchase Access
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            One-time payment. Access valid for this stream only.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

