import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import DJDashHeader from '@/components/djdash/Header';
import DJDashFooter from '@/components/djdash/Footer';
import CostCalculatorClient from './CostCalculatorClient';
import { getStaticCalculatorResult } from '@/utils/pricingCalculator';
import { generateAggregateOffer } from '@/utils/pricingAggregateOffer';

interface PageProps {
  params: {
    city: string;
  };
  searchParams: {
    event_type?: string;
    state?: string;
  };
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const cityName = params.city.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const state = searchParams.state?.toUpperCase();
  const eventType = searchParams.event_type || 'wedding';
  
  const title = `DJ Cost Calculator for ${cityName}${state ? `, ${state}` : ''} | DJ Dash`;
  const description = `Calculate DJ pricing for ${eventType} events in ${cityName}${state ? `, ${state}` : ''}. Get instant estimates based on real DJ Dash booking data.`;
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://www.djdash.net/cost/${params.city}`,
      siteName: 'DJ Dash',
    },
  };
}

export default async function CostCalculatorPage({ params, searchParams }: PageProps) {
  const cityName = params.city.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const state = searchParams.state;
  const eventType = searchParams.event_type || 'wedding';
  
  // Get static AI search text
  const aiSearchText = await getStaticCalculatorResult(cityName, eventType, state);
  
  // Generate AggregateOffer structured data
  const aggregateOffer = await generateAggregateOffer(cityName, eventType, state);
  
  return (
    <>
      {/* AggregateOffer Structured Data */}
      {aggregateOffer && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(aggregateOffer)
          }}
        />
      )}
      
      {/* AI Search Text (visible in DOM) */}
      {aiSearchText && (
        <div className="sr-only" aria-hidden="true">
          {aiSearchText}
        </div>
      )}
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <DJDashHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              DJ Cost Calculator
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Get an instant estimate for DJ services in {cityName}
              {state && `, ${state}`}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Based on real DJ Dash booking data
            </p>
          </div>
          
          <CostCalculatorClient
            city={cityName}
            state={state}
            eventType={eventType}
          />
          
          {/* Additional Info Section */}
          <div className="mt-12 max-w-3xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">How It Works</h2>
              <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-3">
                  <span className="font-semibold text-primary">1.</span>
                  <span>Our calculator uses real booking data from DJ Dash to provide accurate estimates.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-semibold text-primary">2.</span>
                  <span>We analyze pricing from recent inquiries and completed bookings in your area.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-semibold text-primary">3.</span>
                  <span>Estimates are adjusted for event duration, add-ons, and seasonal demand.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-semibold text-primary">4.</span>
                  <span>Results are estimates only — actual pricing varies by DJ and availability.</span>
                </li>
              </ul>
            </div>
          </div>
        </main>
        <DJDashFooter />
      </div>
    </>
  );
}

