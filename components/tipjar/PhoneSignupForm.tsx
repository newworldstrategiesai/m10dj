'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';

type Step = 'phone' | 'code';

export default function PhoneSignupForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedPhoneForVerify = phone.replace(/\D/g, '');
  const phoneE164 = normalizedPhoneForVerify.length === 10
    ? `+1${normalizedPhoneForVerify}`
    : phone.trim().startsWith('+')
      ? `+${normalizedPhoneForVerify}`
      : phone;

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          productContext: 'tipjar',
          organizationName: organizationName.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Failed to send code. Try again.');
        return;
      }
      setStep('code');
      setError(null);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      setError('Enter the 6-digit code from your phone.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        phone: phoneE164,
        token: code.trim(),
        type: 'sms',
      });
      if (verifyError) {
        setError(verifyError.message || 'Invalid or expired code. Request a new one.');
        return;
      }
      if (verifyData?.session) {
        router.push('/tipjar/dashboard');
        return;
      }
      setError('Verification succeeded but no session. Please try again.');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'code') {
    return (
      <form onSubmit={handleVerify} className="space-y-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          We sent a 6-digit code to {phone}. Enter it below.
        </p>
        <div>
          <Label htmlFor="code">Verification code</Label>
          <Input
            id="code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="mt-2 text-center text-lg tracking-[0.5em]"
            autoFocus
            disabled={loading}
          />
        </div>
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive dark:bg-destructive/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Verifying…' : 'Verify & continue'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          disabled={loading}
          onClick={() => {
            setStep('phone');
            setCode('');
            setError(null);
          }}
        >
          Use a different number
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleRequestCode} className="space-y-6">
      <div>
        <Label htmlFor="phone">Phone number</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="(555) 123-4567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-2"
          disabled={loading}
          autoComplete="tel"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          US number (10 digits) or E.164. We’ll send a one-time code.
        </p>
      </div>
      <div>
        <Label htmlFor="organizationName">Business name <span className="text-gray-400">(optional)</span></Label>
        <Input
          id="organizationName"
          type="text"
          placeholder="Your DJ or performer name"
          value={organizationName}
          onChange={(e) => setOrganizationName(e.target.value)}
          className="mt-2"
          disabled={loading}
        />
      </div>
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive dark:bg-destructive/20">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Sending code…' : 'Send code'}
      </Button>
      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <Link href="/tipjar/signin" className="font-medium text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
