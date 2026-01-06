/**
 * Custom Slug Route for TipJar.live
 * 
 * Allows users to access their requests page via: tipjar.live/[slug]
 * Example: tipjar.live/memphismillennial
 * 
 * This redirects to /organizations/[slug]/requests for proper handling
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function CustomSlugPage() {
  const router = useRouter();
  const { slug } = router.query;

  useEffect(() => {
    if (slug) {
      // Redirect to the organization requests page
      router.replace(`/organizations/${slug}/requests`);
    }
  }, [slug, router]);

  return (
    <>
      <Head>
        <title>Loading...</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    </>
  );
}
