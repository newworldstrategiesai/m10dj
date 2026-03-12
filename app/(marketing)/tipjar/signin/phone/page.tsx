import { Metadata } from 'next';
import Link from 'next/link';
import TipJarHeader from '@/components/tipjar/Header';
import TipJarFooter from '@/components/tipjar/Footer';
import PhoneSignupForm from '@/components/tipjar/PhoneSignupForm';

export const metadata: Metadata = {
  title: 'Sign In with Phone | TipJar.Live',
  description: 'Sign in to your TipJar account with your phone number.',
};

export default function TipJarPhoneSignInPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <TipJarHeader />
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-800 dark:bg-gray-900">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Sign in with your phone
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              We’ll send a one-time code to your number.
            </p>
            <div className="mt-6">
              <PhoneSignupForm mode="signin" />
            </div>
          </div>
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            <Link href="/tipjar/signin" className="font-medium text-primary underline-offset-4 hover:underline">
              ← Back to sign in
            </Link>
          </p>
        </div>
      </main>
      <TipJarFooter />
    </div>
  );
}
