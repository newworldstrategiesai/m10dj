import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function LeadsIndexPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard since this is where leads are managed
    router.push('/admin/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#fcba00] mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}