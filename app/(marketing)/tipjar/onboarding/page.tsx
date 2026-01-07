import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import TipJarHeader from '@/components/tipjar/Header';
import TipJarFooter from '@/components/tipjar/Footer';
import { getCurrentOrganization } from '@/utils/organization-context';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Getting Started | TipJar.Live',
  description: 'Complete your TipJar setup',
};

export default async function TipJarOnboardingPage() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/tipjar/signin');
  }

  // Verify user has TipJar product context
  const productContext = user.user_metadata?.product_context;
  if (productContext !== 'tipjar') {
    // User signed up through different product, redirect appropriately
    redirect('/signin');
  }

  // Check if organization exists
  const organization = await getCurrentOrganization(supabase);

  // If organization exists, redirect to crowd requests admin page
  if (organization) {
    redirect('/admin/crowd-requests');
  }

  // Organization is being created or missing
  // Show a loading/waiting state
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <TipJarHeader />
      
      <main className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Loader2 className="h-12 w-12 text-purple-600 dark:text-purple-400 animate-spin" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Setting Up Your Account
            </h1>
            
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              We're creating your TipJar account. This usually takes just a few seconds.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-center gap-3 text-gray-700 dark:text-gray-300">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Account created</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-gray-700 dark:text-gray-300">
                <Loader2 className="h-5 w-5 text-purple-600 animate-spin" />
                <span>Setting up your organization...</span>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>What's happening?</strong> We're automatically creating your organization and setting up your TipJar account. 
                    This page will automatically refresh when everything is ready.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                If this page doesn't refresh automatically, click the button below:
              </p>
              <form action="/admin/crowd-requests" method="get">
                <button
                  type="submit"
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Continue to Dashboard
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Auto-refresh script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Auto-refresh every 3 seconds to check if organization is ready
              let refreshCount = 0;
              const maxRefreshes = 20; // Stop after 1 minute
              
              const checkOrganization = setInterval(() => {
                refreshCount++;
                if (refreshCount >= maxRefreshes) {
                  clearInterval(checkOrganization);
                  return;
                }
                
                // Try to fetch admin page - if it works, org exists
                fetch('/admin/crowd-requests', { method: 'HEAD' })
                  .then(() => {
                    window.location.href = '/admin/crowd-requests';
                  })
                  .catch(() => {
                    // Still loading, continue waiting
                  });
              }, 3000);
            `,
          }}
        />
      </main>
      
      <TipJarFooter />
    </div>
  );
}

