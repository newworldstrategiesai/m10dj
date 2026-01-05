'use client';

import Button from '@/components/ui/Button/Button';
import React from 'react';
import Link from 'next/link';
import { signUp } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Define prop type with allowEmail boolean
interface SignUpProps {
  allowEmail: boolean;
  redirectMethod: string;
}

export default function SignUp({ allowEmail, redirectMethod }: SignUpProps) {
  const router = redirectMethod === 'client' ? useRouter() : null;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true); // Disable the button while the request is being handled
    await handleRequest(e, signUp, router);
    setIsSubmitting(false);
  };

  return (
    <div className="my-8">
      {/* Value Proposition */}
      <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          🎵 Start Your Free 14-Day Trial
        </h3>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <li>✓ Accept song requests at your events</li>
          <li>✓ Generate QR codes for easy sharing</li>
          <li>✓ Process payments securely</li>
          <li>✓ No credit card required</li>
        </ul>
      </div>

      <form
        noValidate={true}
        className="mb-4"
        onSubmit={(e) => handleSubmit(e)}
      >
        <div className="grid gap-2">
          <div className="grid gap-1">
            <label htmlFor="businessName" className="text-sm font-medium text-white">
              DJ Business Name <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <input
              id="businessName"
              placeholder="e.g., DJ John's Events"
              type="text"
              name="businessName"
              autoComplete="organization"
              className="w-full p-3 rounded-md bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-colors"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              We&apos;ll use your email if you don&apos;t provide a name
            </p>
            <label htmlFor="email" className="text-sm font-medium text-white mt-2">
              Email
            </label>
            <input
              id="email"
              placeholder="name@example.com"
              type="email"
              name="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              className="w-full p-3 rounded-md bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-colors"
            />
            <label htmlFor="password" className="text-sm font-medium text-white">
              Password
            </label>
            <input
              id="password"
              placeholder="Password"
              type="password"
              name="password"
              autoComplete="current-password"
              className="w-full p-3 rounded-md bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-colors"
            />
          </div>
          <Button
            variant="slim"
            type="submit"
            className="mt-1"
            loading={isSubmitting}
          >
            Sign up
          </Button>
        </div>
      </form>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
        Already have an account?
      </p>
      <p className="text-sm">
        <Link 
          href="/signin/password_signin" 
          className="font-light text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
        >
          Sign in with email and password
        </Link>
      </p>
      {allowEmail && (
        <p className="text-sm">
          <Link 
            href="/signin/email_signin" 
            className="font-light text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
          >
            Sign in via magic link
          </Link>
        </p>
      )}
    </div>
  );
}
