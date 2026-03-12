import { Metadata } from 'next';
import Link from 'next/link';
import TipJarHeader from '@/components/tipjar/Header';
import PhoneSignupForm from '@/components/tipjar/PhoneSignupForm';

export const metadata: Metadata = {
  title: 'Sign Up with Phone | TipJar.Live',
  description: 'Create your TipJar account with just your phone number. No password required.',
};

export default function TipJarPhoneSignupPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <style
        // Ensure input text is always visible (no white-on-white), including autofill, in light and dark mode
        dangerouslySetInnerHTML={{
          __html: `
        input#phone,
        input#organizationName,
        input#code {
          color: #111827 !important;
          background-color: #f9fafb !important;
          -webkit-text-fill-color: #111827 !important;
        }
        input#phone::placeholder,
        input#organizationName::placeholder,
        input#code::placeholder {
          color: #6b7280 !important;
        }
        .dark input#phone,
        .dark input#organizationName,
        .dark input#code,
        html.dark input#phone,
        html.dark input#organizationName,
        html.dark input#code {
          color: #f3f4f6 !important;
          background-color: #374151 !important;
          -webkit-text-fill-color: #f3f4f6 !important;
        }
        .dark input#phone::placeholder,
        .dark input#organizationName::placeholder,
        .dark input#code::placeholder,
        html.dark input#phone::placeholder,
        html.dark input#organizationName::placeholder,
        html.dark input#code::placeholder {
          color: #9ca3af !important;
        }
        /* Prevent browser autofill from making text invisible (white on white) */
        input#phone:-webkit-autofill,
        input#organizationName:-webkit-autofill,
        input#code:-webkit-autofill {
          -webkit-text-fill-color: #111827 !important;
          -webkit-box-shadow: 0 0 0 1000px #f9fafb inset !important;
          box-shadow: 0 0 0 1000px #f9fafb inset !important;
        }
        .dark input#phone:-webkit-autofill,
        .dark input#organizationName:-webkit-autofill,
        .dark input#code:-webkit-autofill,
        html.dark input#phone:-webkit-autofill,
        html.dark input#organizationName:-webkit-autofill,
        html.dark input#code:-webkit-autofill {
          -webkit-text-fill-color: #f3f4f6 !important;
          -webkit-box-shadow: 0 0 0 1000px #374151 inset !important;
          box-shadow: 0 0 0 1000px #374151 inset !important;
        }
      `,
        }}
      />
      <TipJarHeader />
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-800 dark:bg-gray-900">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Sign up with your phone
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              We’ll send a one-time code. No password needed.
            </p>
            <div className="mt-6">
              <PhoneSignupForm mode="signup" />
            </div>
          </div>
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link href="/tipjar/signin" className="font-medium text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
