'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Heart, DollarSign, Gift } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface TipJarInStreamProps {
  streamerUserId: string;
  streamerUsername: string;
  onTipSent?: (amount: number, name: string, message: string) => void;
}

// Default preset amounts (in dollars, will be converted to cents)
const DEFAULT_PRESET_AMOUNTS = [
  { label: '$5', value: 5 },
  { label: '$10', value: 10 },
  { label: '$25', value: 25 },
  { label: '$50', value: 50 },
];

export function TipJarInStream({ 
  streamerUserId, 
  streamerUsername,
  onTipSent 
}: TipJarInStreamProps) {
  const [open, setOpen] = useState(false);
  const [amountType, setAmountType] = useState<'preset' | 'custom'>('preset');
  const [presetAmount, setPresetAmount] = useState(5); // Default to $5
  const [customAmount, setCustomAmount] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const getAmount = () => {
    if (amountType === 'preset') {
      return presetAmount;
    }
    const custom = parseFloat(customAmount);
    return isNaN(custom) || custom <= 0 ? 0 : custom;
  };

  const currentAmount = getAmount();
  const minimumAmount = DEFAULT_PRESET_AMOUNTS[0].value;

  async function handleTip() {
    const amount = getAmount();
    
    if (!amount || amount < minimumAmount) {
      alert(`Minimum tip amount is $${minimumAmount.toFixed(2)}`);
      return;
    }

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
          amount: Math.round(amount * 100), // Convert to cents
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
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-purple-500" />
            Send a Tip
          </DialogTitle>
          <DialogDescription>
            Support {streamerUsername} with a tip!
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Amount Type Toggle */}
          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <button
              type="button"
              onClick={() => setAmountType('preset')}
              className={`flex-1 py-2 px-3 rounded-md border-2 transition-all font-semibold text-sm ${
                amountType === 'preset'
                  ? 'border-purple-500 bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'border-transparent bg-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Quick Amount
            </button>
            <button
              type="button"
              onClick={() => setAmountType('custom')}
              className={`flex-1 py-2 px-3 rounded-md border-2 transition-all font-semibold text-sm ${
                amountType === 'custom'
                  ? 'border-purple-500 bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'border-transparent bg-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Custom Amount
            </button>
          </div>

          {/* Preset Amount Buttons */}
          {amountType === 'preset' && (
            <div>
              <Label className="mb-2 block text-sm font-semibold">Select Amount</Label>
              <div className="grid grid-cols-2 gap-3">
                {DEFAULT_PRESET_AMOUNTS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setPresetAmount(preset.value)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      presetAmount === preset.value
                        ? 'border-purple-500 bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-xl scale-105'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-300 hover:scale-[1.02]'
                    }`}
                  >
                    <span className="text-lg font-bold">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Amount Input */}
          {amountType === 'custom' && (
            <div>
              <Label htmlFor="customAmount" className="mb-2 block text-sm font-semibold">
                Enter Amount (USD)
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="customAmount"
                  type="number"
                  step="0.01"
                  min={minimumAmount}
                  value={customAmount}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setCustomAmount('');
                      return;
                    }
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue) && numValue >= 0) {
                      setCustomAmount(value);
                    }
                  }}
                  placeholder={`${minimumAmount.toFixed(2)}`}
                  className={`pl-10 ${
                    customAmount && parseFloat(customAmount) > 0 && parseFloat(customAmount) < minimumAmount
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : ''
                  }`}
                />
              </div>
              {customAmount && parseFloat(customAmount) > 0 && parseFloat(customAmount) < minimumAmount ? (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  Minimum amount is ${minimumAmount.toFixed(2)}
                </p>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Minimum: ${minimumAmount.toFixed(2)}
                </p>
              )}
            </div>
          )}

          {/* Total Amount Display */}
          {currentAmount > 0 && (
            <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-purple-900/20 rounded-xl p-4 border-2 border-purple-200 dark:border-purple-700">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-gray-900 dark:text-white">
                  Total Amount:
                </span>
                <span className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 dark:from-purple-400 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                  ${currentAmount.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Name Input */}
          <div>
            <Label htmlFor="name" className="mb-2 block text-sm font-semibold">
              Your Name (optional)
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Anonymous"
              maxLength={50}
            />
          </div>

          {/* Message Input */}
          <div>
            <Label htmlFor="message" className="mb-2 block text-sm font-semibold">
              Message (optional)
            </Label>
            <Input
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Keep up the great work!"
              maxLength={200}
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleTip}
            disabled={loading || currentAmount < minimumAmount}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold"
            size="lg"
          >
            {loading ? (
              'Processing...'
            ) : (
              <>
                <Heart className="h-4 w-4 mr-2" />
                Tip ${currentAmount > 0 ? currentAmount.toFixed(2) : '0.00'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
