import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

/**
 * Root-level how-it-works page
 * Redirects to the correct product page based on domain
 */
export default async function HowItWorksPage() {
  const headersList = headers();
  const hostname = headersList.get('host') || '';
  const hostnameLower = hostname.toLowerCase();
  
  // Check which domain we're on and redirect accordingly
  if (hostnameLower.includes('tipjar.live')) {
    redirect('/tipjar/how-it-works');
  } else if (hostnameLower.includes('djdash.net')) {
    redirect('/djdash/how-it-works');
  } else {
    // For main platform (m10djcompany.com), redirect to main site
    // Main platform uses Pages Router, so this shouldn't normally be hit
    // But if it is, redirect to a relevant page
    redirect('/');
  }
}

