'use client';

import Button from '@/components/ui/Button/Button';
import Link from 'next/link';
import { requestPasswordUpdate } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Define prop type with allowEmail boolean
interface ForgotPasswordProps {
  allowEmail: boolean;
  redirectMethod: string;
  disableButton?: boolean;
  productContext?: string; // Add product context prop
}

export default function ForgotPassword({
  allowEmail,
  redirectMethod,
  disableButton,
  productContext
}: ForgotPasswordProps) {
  // Always call hooks unconditionally (Rules of Hooks)
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true); // Disable the button while the request is being handled
    // Only use router if redirectMethod is 'client', otherwise pass null
    await handleRequest(e, requestPasswordUpdate, redirectMethod === 'client' ? router : null);
    setIsSubmitting(false);
  };

  return (
    <div className="my-8">
      <form
        noValidate={true}
        className="mb-4"
        onSubmit={(e) => handleSubmit(e)}
      >
        <div className="grid gap-2">
          {/* Hidden field to pass product context */}
          {productContext && (
            <input type="hidden" name="productContext" value={productContext} />
          )}
          <div className="grid gap-1">
            <label htmlFor="email" className="block text-sm font-semibold text-white mb-2">Email</label>
            <input
              id="email"
              placeholder="name@example.com"
              type="email"
              name="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              className="w-full p-3 rounded-md bg-zinc-800 text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            />
          </div>
          <Button
            variant="slim"
            type="submit"
            className="mt-1"
            loading={isSubmitting}
            disabled={disableButton}
          >
            Send Email
          </Button>
        </div>
      </form>
      <p>
        <Link href="/signin/password_signin" className="font-light text-sm text-gray-400 hover:text-brand transition-colors">
          Sign in with email and password
        </Link>
      </p>
      {allowEmail && (
        <p>
          <Link href="/signin/email_signin" className="font-light text-sm text-gray-400 hover:text-brand transition-colors">
            Sign in via magic link
          </Link>
        </p>
      )}
      <p>
        <Link href="/signin/signup" className="font-light text-sm text-gray-400 hover:text-brand transition-colors">
          Don't have an account? Sign up
        </Link>
      </p>
    </div>
  );
}
