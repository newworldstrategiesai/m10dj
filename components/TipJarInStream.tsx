'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Heart } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface TipJarInStreamProps {
  streamerUserId: string;
  streamerUsername: string;
  onTipSent?: (amount: number, name: string, message: string) => void;
}

export function TipJarInStream({ 
  streamerUserId, 
  streamerUsername,
  onTipSent 
}: TipJarInStreamProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleTip() {
    if (!amount || parseFloat(amount) <= 0) return;

    setLoading(true);
    try {
      // Create Stripe Checkout session
      const response = await fetch('/api/tipjar/create-tip-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          streamer_user_id: streamerUserId,
          amount: parseFloat(amount) * 100, // Convert to cents
          name: name || 'Anonymous',
          message: message || '',
          return_url: window.location.href,
        }),
      });

      const data = await response.json();

      if (data.sessionId) {
        // Redirect to Stripe Checkout
        const stripe = await import('@stripe/stripe-js').then((m) => m.loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!));
        if (stripe) {
          await (stripe as any).redirectToCheckout({ sessionId: data.sessionId });
        }
      } else {
        alert('Failed to create tip session');
      }
    } catch (error) {
      console.error('Error creating tip:', error);
      alert('Failed to process tip');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all"
        >
          <Heart className="h-5 w-5 mr-2" />
          Tip {streamerUsername}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send a Tip</DialogTitle>
          <DialogDescription>
            Support {streamerUsername} with a tip!
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="10.00"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="name">Your Name (optional)</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Anonymous"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="message">Message (optional)</Label>
            <Input
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Keep up the great work!"
              className="mt-1"
            />
          </div>
          <Button
            onClick={handleTip}
            disabled={loading || !amount || parseFloat(amount) <= 0}
            className="w-full"
            size="lg"
          >
            {loading ? 'Processing...' : `Tip $${amount || '0.00'}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

