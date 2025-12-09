import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import DJDashHeader from '@/components/djdash/Header';
import DJDashFooter from '@/components/djdash/Footer';
import { 
  MapPin, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Users,
  Clock,
  BarChart3
} from 'lucide-react';

// Major US cities for DJ gigs
const cities = {
  'nashville-tn': { name: 'Nashville', state: 'Tennessee', stateAbbr: 'TN', population: '700K+' },
  'atlanta-ga': { name: 'Atlanta', state: 'Georgia', stateAbbr: 'GA', population: '500K+' },
  'los-angeles-ca': { name: 'Los Angeles', state: 'California', stateAbbr: 'CA', population: '4M+' },
  'new-york-ny': { name: 'New York', state: 'New York', stateAbbr: 'NY', population: '8M+' },
  'chicago-il': { name: 'Chicago', state: 'Illinois', stateAbbr: 'IL', population: '2.7M+' },
  'houston-tx': { name: 'Houston', state: 'Texas', stateAbbr: 'TX', population: '2.3M+' },
  'phoenix-az': { name: 'Phoenix', state: 'Arizona', stateAbbr: 'AZ', population: '1.6M+' },
  'philadelphia-pa': { name: 'Philadelphia', state: 'Pennsylvania', stateAbbr: 'PA', population: '1.6M+' },
  'san-antonio-tx': { name: 'San Antonio', state: 'Texas', stateAbbr: 'TX', population: '1.5M+' },
  'san-diego-ca': { name: 'San Diego', state: 'California', stateAbbr: 'CA', population: '1.4M+' },
  'dallas-tx': { name: 'Dallas', state: 'Texas', stateAbbr: 'TX', population: '1.3M+' },
  'san-jose-ca': { name: 'San Jose', state: 'California', stateAbbr: 'CA', population: '1M+' },
  'austin-tx': { name: 'Austin', state: 'Texas', stateAbbr: 'TX', population: '950K+' },
  'jacksonville-fl': { name: 'Jacksonville', state: 'Florida', stateAbbr: 'FL', population: '950K+' },
  'fort-worth-tx': { name: 'Fort Worth', state: 'Texas', stateAbbr: 'TX', population: '920K+' },
  'columbus-oh': { name: 'Columbus', state: 'Ohio', stateAbbr: 'OH', population: '900K+' },
  'charlotte-nc': { name: 'Charlotte', state: 'North Carolina', stateAbbr: 'NC', population: '880K+' },
  'san-francisco-ca': { name: 'San Francisco', state: 'California', stateAbbr: 'CA', population: '870K+' },
  'indianapolis-in': { name: 'Indianapolis', state: 'Indiana', stateAbbr: 'IN', population: '880K+' },
  'seattle-wa': { name: 'Seattle', state: 'Washington', stateAbbr: 'WA', population: '750K+' },
  'denver-co': { name: 'Denver', state: 'Colorado', stateAbbr: 'CO', population: '720K+' },
  'washington-dc': { name: 'Washington', state: 'District of Columbia', stateAbbr: 'DC', population: '700K+' },
  'boston-ma': { name: 'Boston', state: 'Massachusetts', stateAbbr: 'MA', population: '690K+' },
  'el-paso-tx': { name: 'El Paso', state: 'Texas', stateAbbr: 'TX', population: '680K+' },
  'detroit-mi': { name: 'Detroit', state: 'Michigan', stateAbbr: 'MI', population: '630K+' },
  'portland-or': { name: 'Portland', state: 'Oregon', stateAbbr: 'OR', population: '650K+' },
  'oklahoma-city-ok': { name: 'Oklahoma City', state: 'Oklahoma', stateAbbr: 'OK', population: '640K+' },
  'las-vegas-nv': { name: 'Las Vegas', state: 'Nevada', stateAbbr: 'NV', population: '640K+' },
  'memphis-tn': { name: 'Memphis', state: 'Tennessee', stateAbbr: 'TN', population: '630K+' },
  'louisville-ky': { name: 'Louisville', state: 'Kentucky', stateAbbr: 'KY', population: '620K+' },
  'baltimore-md': { name: 'Baltimore', state: 'Maryland', stateAbbr: 'MD', population: '580K+' },
  'milwaukee-wi': { name: 'Milwaukee', state: 'Wisconsin', stateAbbr: 'WI', population: '570K+' },
  'albuquerque-nm': { name: 'Albuquerque', state: 'New Mexico', stateAbbr: 'NM', population: '560K+' },
  'tucson-az': { name: 'Tucson', state: 'Arizona', stateAbbr: 'AZ', population: '540K+' },
  'fresno-ca': { name: 'Fresno', state: 'California', stateAbbr: 'CA', population: '540K+' },
  'sacramento-ca': { name: 'Sacramento', state: 'California', stateAbbr: 'CA', population: '520K+' },
  'kansas-city-mo': { name: 'Kansas City', state: 'Missouri', stateAbbr: 'MO', population: '510K+' },
  'mesa-az': { name: 'Mesa', state: 'Arizona', stateAbbr: 'AZ', population: '510K+' },
  'omaha-ne': { name: 'Omaha', state: 'Nebraska', stateAbbr: 'NE', population: '490K+' },
  'colorado-springs-co': { name: 'Colorado Springs', state: 'Colorado', stateAbbr: 'CO', population: '480K+' },
  'raleigh-nc': { name: 'Raleigh', state: 'North Carolina', stateAbbr: 'NC', population: '470K+' },
  'virginia-beach-va': { name: 'Virginia Beach', state: 'Virginia', stateAbbr: 'VA', population: '460K+' },
  'miami-fl': { name: 'Miami', state: 'Florida', stateAbbr: 'FL', population: '440K+' },
  'oakland-ca': { name: 'Oakland', state: 'California', stateAbbr: 'CA', population: '430K+' },
  'minneapolis-mn': { name: 'Minneapolis', state: 'Minnesota', stateAbbr: 'MN', population: '430K+' },
  'tulsa-ok': { name: 'Tulsa', state: 'Oklahoma', stateAbbr: 'OK', population: '410K+' },
  'cleveland-oh': { name: 'Cleveland', state: 'Ohio', stateAbbr: 'OH', population: '390K+' },
  'wichita-ks': { name: 'Wichita', state: 'Kansas', stateAbbr: 'KS', population: '400K+' },
  'arlington-tx': { name: 'Arlington', state: 'Texas', stateAbbr: 'TX', population: '400K+' },
};

type CityKey = keyof typeof cities;

interface PageProps {
  params: {
    city: string;
  };
}

export async function generateStaticParams() {
  return Object.keys(cities).map((city) => ({
    city,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const cityData = cities[params.city as CityKey];
  
  if (!cityData) {
    return {
      title: 'DJ Gigs | DJ Dash',
    };
  }

  const { name, state, stateAbbr } = cityData;
  const title = `DJ Gigs ${name} ${stateAbbr} | Find & Manage DJ Gigs in ${name} | DJ Dash`;
  const description = `Find and manage DJ gigs in ${name}, ${state} with DJ Dash. The #1 DJ booking software for ${name} DJs. Track gigs, manage clients, automate invoicing, and grow your DJ business. Start free today.`;

  return {
    title,
    description,
    keywords: [
      `DJ gigs ${name} ${stateAbbr}`,
      `DJ gigs ${name}`,
      `${name} DJ gigs`,
      `find DJ gigs ${name}`,
      `DJ booking software ${name}`,
      `DJ management software ${name}`,
      `${name} DJ jobs`,
      `DJ work ${name}`,
      `DJ events ${name}`,
      `${name} DJ opportunities`,
      `DJ gigs ${state}`,
    ],
    openGraph: {
      title: `DJ Gigs ${name} ${stateAbbr} | Find & Manage DJ Gigs | DJ Dash`,
      description: `Find and manage DJ gigs in ${name}, ${state} with DJ Dash. The #1 DJ booking software for ${name} DJs.`,
      url: `https://www.djdash.net/dj-gigs/${params.city}`,
      siteName: 'DJ Dash',
      images: [
        {
          url: '/assets/DJ-Dash-Logo-Black-1.PNG',
          width: 1200,
          height: 630,
          alt: `DJ Gigs ${name} ${stateAbbr} - DJ Dash`,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `DJ Gigs ${name} ${stateAbbr} | Find & Manage DJ Gigs | DJ Dash`,
      description: `Find and manage DJ gigs in ${name}, ${state} with DJ Dash. The #1 DJ booking software for ${name} DJs.`,
      images: ['/assets/DJ-Dash-Logo-Black-1.PNG'],
    },
  };
}

export default function DJGigsCityPage({ params }: PageProps) {
  const cityData = cities[params.city as CityKey];
  
  if (!cityData) {
    notFound();
  }

  const { name, state, stateAbbr, population } = cityData;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: `DJ Dash - DJ Gigs Management ${name}`,
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.9',
              ratingCount: '1200',
            },
            areaServed: {
              '@type': 'City',
              name: name,
              containedIn: {
                '@type': 'State',
                name: state,
              },
            },
          }),
        }}
      />
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <DJDashHeader />
        
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
          <div className="max-w-7xl mx-auto">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium">
                <MapPin className="w-4 h-4" />
                <span>{name}, {state}</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="text-gray-900 dark:text-white">Find & Manage</span>
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600 bg-clip-text text-transparent">
                  DJ Gigs in {name}
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                The #1 DJ booking software for {name} DJs. Track gigs, manage clients, automate invoicing, and grow your DJ business—all in one platform.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                <Link 
                  href="/djdash/signup"
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Start Free Trial
                </Link>
                <Link 
                  href="/djdash/pricing"
                  className="px-8 py-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold text-lg hover:border-blue-500 dark:hover:border-blue-500 transition-all"
                >
                  View Pricing
                </Link>
              </div>
              
              <div className="flex items-center justify-center gap-8 pt-8 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>1,200+ {name} DJs</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose DJ Dash */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Why {name} DJs Choose DJ Dash
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Built specifically for DJs managing gigs in {name} and across {state}
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-800 border border-blue-100 dark:border-gray-700">
                <Calendar className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Track All Your Gigs
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Never miss a {name} gig. Calendar view, automated reminders, and gig tracking for weddings, corporate events, and parties.
                </p>
              </div>
              
              <div className="p-6 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800 border border-purple-100 dark:border-gray-700">
                <DollarSign className="w-12 h-12 text-purple-600 dark:text-purple-400 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Get Paid Faster
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Automated invoicing, payment tracking, and contract management. Get paid for your {name} DJ gigs on time, every time.
                </p>
              </div>
              
              <div className="p-6 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 border border-cyan-100 dark:border-gray-700">
                <TrendingUp className="w-12 h-12 text-cyan-600 dark:text-cyan-400 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Grow Your Business
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Analytics and insights to help you book more {name} gigs. See which event types are most profitable and optimize your pricing.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                {name} DJs Are Growing Their Business
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">1,200+</div>
                <div className="text-xl text-gray-600 dark:text-gray-400">{name} DJs Using DJ Dash</div>
              </div>
              
              <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <div className="text-5xl font-bold text-purple-600 dark:text-purple-400 mb-2">50K+</div>
                <div className="text-xl text-gray-600 dark:text-gray-400">Gigs Managed Monthly</div>
              </div>
              
              <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <div className="text-5xl font-bold text-cyan-600 dark:text-cyan-400 mb-2">$2M+</div>
                <div className="text-xl text-gray-600 dark:text-gray-400">Revenue Tracked</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Manage Your {name} DJ Gigs Better?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join 1,200+ {name} DJs who are growing their business with DJ Dash
            </p>
            <Link 
              href="/djdash/signup"
              className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
            >
              Start Your Free Trial
              <ArrowRight className="inline-block ml-2 w-5 h-5" />
            </Link>
          </div>
        </section>

        <DJDashFooter />
      </div>
    </>
  );
}

