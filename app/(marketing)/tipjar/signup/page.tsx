import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Sign Up | TipJar.Live - Start Collecting Tips & Song Requests',
  description: 'Start your free account. No credit card required. Get instant access to tip collection and song request features for your events.',
};

export default function SignupPage() {
  redirect('/tipjar/signup/phone');
}