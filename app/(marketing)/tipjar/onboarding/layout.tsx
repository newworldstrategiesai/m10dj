import { PropsWithChildren } from 'react';

/**
 * Layout for onboarding wizard - ensures no navigation or header appears
 * This creates a focused, full-screen onboarding experience
 */
export default function OnboardingLayout({ children }: PropsWithChildren) {
  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {children}
    </div>
  );
}

