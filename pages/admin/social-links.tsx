import { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * Redirect old social-links page to new unified requests-page
 */
export default function SocialLinksRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/requests-page?tab=social');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-400">Redirecting...</p>
      </div>
    </div>
  );
}
