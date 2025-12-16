'use client';

import Button from '@/components/ui/Button/Button';
import Link from 'next/link';
import { signInWithPassword } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// Define prop type with allowEmail boolean
interface PasswordSignInProps {
  allowEmail: boolean;
  redirectMethod: string;
  redirectTo?: string;
  initialEmail?: string;
  message?: string;
}

export default function PasswordSignIn({
  allowEmail,
  redirectMethod,
  redirectTo,
  initialEmail,
  message
}: PasswordSignInProps) {
  const router = redirectMethod === 'client' ? useRouter() : null;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true); // Disable the button while the request is being handled
    await handleRequest(e, signInWithPassword, router);
    setIsSubmitting(false);
  };

  return (
    <div>
      {message && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-600 dark:text-blue-400">{message}</p>
        </div>
      )}
      <form
        noValidate={true}
        className="mb-6"
        onSubmit={(e) => handleSubmit(e)}
      >
        <div className="space-y-5">
          <div className="space-y-4">
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                placeholder="your.email@example.com"
                type="email"
                name="email"
                defaultValue={initialEmail || ''}
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
              />
            </div>
            
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  placeholder="Enter your password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-12 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand dark:text-gray-500 dark:hover:text-brand transition-colors focus:outline-none focus:ring-2 focus:ring-brand rounded p-1.5"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            
            {redirectTo && (
              <input
                type="hidden"
                name="redirect"
                value={encodeURIComponent(redirectTo)}
              />
            )}
          </div>
          
          <Button
            variant="slim"
            type="submit"
            className="w-full bg-gradient-to-r from-brand to-amber-500 hover:from-amber-500 hover:to-brand text-black font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            loading={isSubmitting}
          >
            Sign in
          </Button>
        </div>
      </form>
      
      <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div>
          <Link 
            href="/signin/forgot_password" 
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-brand dark:hover:text-brand transition-colors"
          >
            Forgot your password?
          </Link>
        </div>
        {allowEmail && (
          <div>
            <Link 
              href="/signin/email_signin" 
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-brand dark:hover:text-brand transition-colors"
            >
              Sign in via magic link
            </Link>
          </div>
        )}
        <div>
          <Link 
            href="/signin/signup" 
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-brand dark:hover:text-brand transition-colors"
          >
            Don&apos;t have an account? Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
