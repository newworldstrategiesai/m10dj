import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

/**
 * Root-level use-cases page
 * Redirects to the correct product page based on domain
 */
export default async function UseCasesPage() {
  const headersList = headers();
  const hostname = headersList.get('host') || '';
  const hostnameLower = hostname.toLowerCase();
  
  // Check which domain we're on and redirect accordingly
  if (hostnameLower.includes('tipjar.live')) {
    // TipJar doesn't have a use-cases page, redirect to features
    redirect('/tipjar/features');
  } else if (hostnameLower.includes('djdash.net')) {
    redirect('/djdash/use-cases');
  } else {
    // For main platform (m10djcompany.com), redirect to main site
    // Main platform uses Pages Router, so this shouldn't normally be hit
    redirect('/');
  }
}

