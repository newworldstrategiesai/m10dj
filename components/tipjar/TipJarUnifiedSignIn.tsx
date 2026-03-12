'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithPassword } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { createClient } from '@/utils/supabase/client';
import Button from '@/components/ui/Button/Button';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

function isEmail(value: string): boolean {
  const v = value.trim();
  return v.length > 0 && (v.includes('@') || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
}

function isPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 10 || (value.trim().startsWith('+') && digits.length >= 10);
}

function phoneToE164(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (value.trim().startsWith('+')) return `+${digits}`;
  return value.trim();
}

interface TipJarUnifiedSignInProps {
  redirectTo?: string;
  initialEmail?: string;
  message?: string;
  allowEmail?: boolean;
  redirectMethod?: string;
}

export default function TipJarUnifiedSignIn({
  redirectTo,
  initialEmail,
  message,
  allowEmail = true,
  redirectMethod = 'client',
}: TipJarUnifiedSignInProps) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState(initialEmail || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const useEmail = isEmail(identifier);
  const usePhone = !useEmail && isPhone(identifier);
  const canSubmitEmail = useEmail && password.length > 0;
  const canSendCode = usePhone && identifier.trim().length >= 10;
  const canVerifyOtp = otpStep && code.length === 6;

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!useEmail || !password) return;
    setError(null);
    setLoading(true);
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    formData.set('email', identifier.trim());
    formData.set('password', password);
    if (redirectTo) formData.set('redirect', redirectTo);
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>;
    Object.defineProperty(fakeEvent, 'currentTarget', { value: form, writable: false });
    try {
      await handleRequest(
        fakeEvent as React.FormEvent<HTMLFormElement>,
        signInWithPassword,
        redirectMethod === 'client' ? router : null
      );
    } catch (err) {
      setError('Sign in failed. Check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usePhone) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: identifier.trim(), productContext: 'tipjar' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Failed to send code. Try again.');
        return;
      }
      setOtpStep(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canVerifyOtp) return;
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const phoneE164 = phoneToE164(identifier);
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
        const url = redirectTo && redirectTo.startsWith('/') ? redirectTo : '/admin/crowd-requests';
        router.push(url);
        return;
      }
      setError('Verification succeeded but no session. Please try again.');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {message && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-600 dark:text-blue-400">{message}</p>
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Email + password flow */}
      {useEmail && !otpStep && (
        <form onSubmit={handleEmailSignIn} className="mb-6">
          <div className="space-y-5">
            <div className="space-y-4">
              <div>
                <label htmlFor="identifier" className="block text-sm font-semibold text-white mb-2">
                  Email or phone number
                </label>
                <input
                  id="identifier"
                  type="text"
                  inputMode="email"
                  placeholder="you@example.com or (555) 123-4567"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setError(null);
                  }}
                  autoComplete="username email"
                  className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-white mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    name="password"
                    className="w-full px-4 py-3 pr-12 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand p-1.5"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <input type="hidden" name="email" value={identifier.trim()} />
              {redirectTo && <input type="hidden" name="redirect" value={redirectTo} />}
              <input type="hidden" name="productContext" value="tipjar" />
            </div>
            <Button
              variant="slim"
              type="submit"
              className="w-full font-bold py-3 rounded-lg bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-500 hover:from-emerald-500 hover:via-green-500 to-emerald-600 text-white disabled:opacity-50"
              loading={loading}
              disabled={!canSubmitEmail}
            >
              Sign in
            </Button>
          </div>
        </form>
      )}

      {/* Phone OTP flow: request code */}
      {usePhone && !otpStep && (
        <form onSubmit={handleSendOtp} className="mb-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="identifier-phone" className="block text-sm font-semibold text-white mb-2">
                Email or phone number
              </label>
              <input
                id="identifier-phone"
                type="tel"
                placeholder="you@example.com or (555) 123-4567"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setError(null);
                }}
                autoComplete="tel"
                className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <Button
              variant="slim"
              type="submit"
              className="w-full font-bold py-3 rounded-lg bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-500 hover:from-emerald-500 to-emerald-600 text-white disabled:opacity-50"
              loading={loading}
              disabled={!canSendCode}
            >
              Send code
            </Button>
          </div>
        </form>
      )}

      {/* Phone OTP flow: enter code */}
      {usePhone && otpStep && (
        <form onSubmit={handleVerifyOtp} className="mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            We sent a 6-digit code to {identifier}. Enter it below.
          </p>
          <div className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-semibold text-white mb-2">
                Verification code
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-center text-lg tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <Button
              variant="slim"
              type="submit"
              className="w-full font-bold py-3 rounded-lg bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-500 hover:from-emerald-500 to-emerald-600 text-white disabled:opacity-50"
              loading={loading}
              disabled={!canVerifyOtp}
            >
              Verify & sign in
            </Button>
            <button
              type="button"
              onClick={() => {
                setOtpStep(false);
                setCode('');
                setError(null);
              }}
              className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-brand py-2"
            >
              Use a different number
            </button>
          </div>
        </form>
      )}

      {/* Neither email nor phone yet: show single field and hint */}
      {!useEmail && !usePhone && identifier.trim() === '' && (
        <form className="mb-6" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label htmlFor="identifier-initial" className="block text-sm font-semibold text-white mb-2">
              Email or phone number
            </label>
            <input
              id="identifier-initial"
              type="text"
              placeholder="you@example.com or (555) 123-4567"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username email tel"
              className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Enter your email for password sign-in, or your phone number to receive a one-time code.
            </p>
          </div>
        </form>
      )}

      {/* Invalid / ambiguous: show same field and hint */}
      {!useEmail && !usePhone && identifier.trim() !== '' && (
        <div className="mb-6">
          <div>
            <label htmlFor="identifier-ambiguous" className="block text-sm font-semibold text-white mb-2">
              Email or phone number
            </label>
            <input
              id="identifier-ambiguous"
              type="text"
              placeholder="you@example.com or (555) 123-4567"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                setError(null);
              }}
              className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              Enter a valid email address or a 10-digit phone number.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        {useEmail && (
          <>
            <div>
              <Link
                href={`/tipjar/signin/forgot_password${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-brand"
              >
                Forgot your password?
              </Link>
            </div>
            {allowEmail && (
              <div>
                <Link href="/tipjar/signin/email_signin" className="text-sm text-gray-600 dark:text-gray-400 hover:text-brand">
                  Sign in via magic link
                </Link>
              </div>
            )}
          </>
        )}
        <div>
          <Link href="/tipjar/signup" className="text-sm text-gray-600 dark:text-gray-400 hover:text-brand">
            Don&apos;t have an account? Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
