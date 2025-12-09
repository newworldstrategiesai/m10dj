import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up - TipJar.Live',
  description: 'Create your TipJar account in 60 seconds. No credit card required. Start collecting tips and song requests tonight.',
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

