/**
 * Stripe Connect Requirements Utilities
 * 
 * Functions to check if an organization needs Stripe Connect setup.
 * Platform owners (M10 DJ Company) bypass all requirements.
 */

import { Organization } from '@/utils/organization-context';

/**
 * Check if organization has Stripe Connect fully set up
 */
export function hasStripeConnectSetup(org: Organization | null): boolean {
  if (!org) return false;
  
  return !!(
    org.stripe_connect_account_id &&
    org.stripe_connect_charges_enabled &&
    org.stripe_connect_payouts_enabled
  );
}

/**
 * Check if organization requires Stripe Connect setup
 * Platform owners (M10 DJ Company) never require it
 */
export function requiresStripeConnect(org: Organization | null): boolean {
  if (!org) return true; // No org = needs setup
  
  // Platform owners bypass requirement
  if (org.is_platform_owner) {
    return false;
  }
  
  // Check if fully set up
  return !hasStripeConnectSetup(org);
}

/**
 * Get Stripe Connect setup status for an organization
 */
export function getStripeConnectStatus(org: Organization | null): {
  requiresSetup: boolean;
  hasAccount: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  isComplete: boolean;
  isPlatformOwner: boolean;
} {
  if (!org) {
    return {
      requiresSetup: true,
      hasAccount: false,
      chargesEnabled: false,
      payoutsEnabled: false,
      isComplete: false,
      isPlatformOwner: false,
    };
  }
  
  const isPlatformOwner = org.is_platform_owner || false;
  const hasAccount = !!org.stripe_connect_account_id;
  const chargesEnabled = org.stripe_connect_charges_enabled || false;
  const payoutsEnabled = org.stripe_connect_payouts_enabled || false;
  const isComplete = hasAccount && chargesEnabled && payoutsEnabled;
  
  return {
    requiresSetup: isPlatformOwner ? false : !isComplete,
    hasAccount,
    chargesEnabled,
    payoutsEnabled,
    isComplete,
    isPlatformOwner,
  };
}

/**
 * Get user-friendly message about Stripe Connect requirement
 */
export function getStripeConnectMessage(org: Organization | null): {
  message: string;
  action: string;
  severity: 'info' | 'warning' | 'error';
} {
  const status = getStripeConnectStatus(org);
  
  if (status.isPlatformOwner) {
    return {
      message: 'Platform owner - no Stripe Connect required',
      action: '',
      severity: 'info',
    };
  }
  
  if (status.isComplete) {
    return {
      message: 'Stripe Connect is set up and ready',
      action: '',
      severity: 'info',
    };
  }
  
  if (!status.hasAccount) {
    return {
      message: 'Stripe Connect account not created. You need to set up Stripe Connect to receive payments.',
      action: 'Set up Stripe Connect',
      severity: 'error',
    };
  }
  
  if (!status.chargesEnabled || !status.payoutsEnabled) {
    return {
      message: 'Stripe Connect onboarding incomplete. Please complete the setup process to receive payments.',
      action: 'Complete Setup',
      severity: 'warning',
    };
  }
  
  return {
    message: 'Stripe Connect setup required',
    action: 'Set up Stripe Connect',
    severity: 'error',
  };
}

