import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

/**
 * Root-level features page
 * Redirects to the correct product page based on domain
 */
export default async function FeaturesPage() {
  const headersList = headers();
  const hostname = headersList.get('host') || '';
  const hostnameLower = hostname.toLowerCase();
  
  // Check which domain we're on and redirect accordingly
  if (hostnameLower.includes('tipjar.live')) {
    redirect('/tipjar/features');
  } else if (hostnameLower.includes('djdash.net')) {
    redirect('/djdash/features');
  } else {
    // For main platform (m10djcompany.com), redirect to main site
    // Main platform uses Pages Router, so this shouldn't normally be hit
    redirect('/');
  }
}

