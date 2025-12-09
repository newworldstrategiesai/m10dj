import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import DJDashHeader from '@/components/djdash/Header';
import DJDashFooter from '@/components/djdash/Footer';
import { 
  MapPin, 
  Star,
  CheckCircle,
  ArrowRight,
  Heart,
  Music,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Import city data
const cities: Record<string, { name: string; state: string; stateAbbr: string; djCount: string }> = {
  'memphis-tn': { name: 'Memphis', state: 'Tennessee', stateAbbr: 'TN', djCount: '80+' },
  'nashville-tn': { name: 'Nashville', state: 'Tennessee', stateAbbr: 'TN', djCount: '120+' },
  'atlanta-ga': { name: 'Atlanta', state: 'Georgia', stateAbbr: 'GA', djCount: '100+' },
  'los-angeles-ca': { name: 'Los Angeles', state: 'California', stateAbbr: 'CA', djCount: '300+' },
  'new-york-ny': { name: 'New York', state: 'New York', stateAbbr: 'NY', djCount: '350+' },
  'chicago-il': { name: 'Chicago', state: 'Illinois', stateAbbr: 'IL', djCount: '250+' },
  'houston-tx': { name: 'Houston', state: 'Texas', stateAbbr: 'TX', djCount: '200+' },
  'phoenix-az': { name: 'Phoenix', state: 'Arizona', stateAbbr: 'AZ', djCount: '150+' },
  'philadelphia-pa': { name: 'Philadelphia', state: 'Pennsylvania', stateAbbr: 'PA', djCount: '180+' },
  'san-antonio-tx': { name: 'San Antonio', state: 'Texas', stateAbbr: 'TX', djCount: '140+' },
  'san-diego-ca': { name: 'San Diego', state: 'California', stateAbbr: 'CA', djCount: '120+' },
  'dallas-tx': { name: 'Dallas', state: 'Texas', stateAbbr: 'TX', djCount: '200+' },
  'austin-tx': { name: 'Austin', state: 'Texas', stateAbbr: 'TX', djCount: '110+' },
  'jacksonville-fl': { name: 'Jacksonville', state: 'Florida', stateAbbr: 'FL', djCount: '90+' },
  'charlotte-nc': { name: 'Charlotte', state: 'North Carolina', stateAbbr: 'NC', djCount: '85+' },
  'san-francisco-ca': { name: 'San Francisco', state: 'California', stateAbbr: 'CA', djCount: '120+' },
  'seattle-wa': { name: 'Seattle', state: 'Washington', stateAbbr: 'WA', djCount: '110+' },
  'denver-co': { name: 'Denver', state: 'Colorado', stateAbbr: 'CO', djCount: '100+' },
  'washington-dc': { name: 'Washington', state: 'District of Columbia', stateAbbr: 'DC', djCount: '100+' },
  'boston-ma': { name: 'Boston', state: 'Massachusetts', stateAbbr: 'MA', djCount: '90+' },
  'detroit-mi': { name: 'Detroit', state: 'Michigan', stateAbbr: 'MI', djCount: '70+' },
  'portland-or': { name: 'Portland', state: 'Oregon', stateAbbr: 'OR', djCount: '85+' },
  'las-vegas-nv': { name: 'Las Vegas', state: 'Nevada', stateAbbr: 'NV', djCount: '150+' },
  'miami-fl': { name: 'Miami', state: 'Florida', stateAbbr: 'FL', djCount: '130+' },
  'minneapolis-mn': { name: 'Minneapolis', state: 'Minnesota', stateAbbr: 'MN', djCount: '80+' },
  'tucson-az': { name: 'Tucson', state: 'Arizona', stateAbbr: 'AZ', djCount: '60+' },
  'sacramento-ca': { name: 'Sacramento', state: 'California', stateAbbr: 'CA', djCount: '75+' },
  'kansas-city-mo': { name: 'Kansas City', state: 'Missouri', stateAbbr: 'MO', djCount: '70+' },
  'raleigh-nc': { name: 'Raleigh', state: 'North Carolina', stateAbbr: 'NC', djCount: '65+' },
  'virginia-beach-va': { name: 'Virginia Beach', state: 'Virginia', stateAbbr: 'VA', djCount: '55+' },
  'oakland-ca': { name: 'Oakland', state: 'California', stateAbbr: 'CA', djCount: '70+' },
  'tulsa-ok': { name: 'Tulsa', state: 'Oklahoma', stateAbbr: 'OK', djCount: '50+' },
  'cleveland-oh': { name: 'Cleveland', state: 'Ohio', stateAbbr: 'OH', djCount: '60+' },
  'wichita-ks': { name: 'Wichita', state: 'Kansas', stateAbbr: 'KS', djCount: '45+' },
  'arlington-tx': { name: 'Arlington', state: 'Texas', stateAbbr: 'TX', djCount: '55+' },
};

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
  const cityData = cities[params.city];
  
  if (!cityData) {
    return {
      title: 'Wedding DJs | DJ Dash',
    };
  }

  const { name, state, stateAbbr } = cityData;
  const title = `Wedding DJs in ${name} ${stateAbbr} | Find a Wedding DJ in ${name} | DJ Dash`;
  const description = `Find the best wedding DJs in ${name}, ${state}. Browse ${cityData.djCount} verified wedding DJs with reviews, portfolios, and pricing. Get free quotes for your ${name} wedding.`;

  return {
    title,
    description,
    keywords: [
      `wedding DJs ${name}`,
      `wedding DJs ${name} ${stateAbbr}`,
      `wedding DJ ${name}`,
      `find wedding DJ ${name}`,
      `best wedding DJs ${name}`,
      `${name} wedding DJ`,
      `wedding DJ near me ${name}`,
      `affordable wedding DJ ${name}`,
      `professional wedding DJ ${name}`,
    ],
    openGraph: {
      title: `Wedding DJs in ${name} ${stateAbbr} | Find a Wedding DJ | DJ Dash`,
      description: `Find the best wedding DJs in ${name}, ${state}. Browse ${cityData.djCount} verified wedding DJs with reviews and pricing.`,
      url: `https://www.djdash.net/find-dj/${params.city}/wedding-djs`,
      siteName: 'DJ Dash',
      images: [
        {
          url: '/assets/DJ-Dash-Logo-Black-1.PNG',
          width: 1200,
          height: 630,
          alt: `Wedding DJs in ${name} ${stateAbbr} - DJ Dash`,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Wedding DJs in ${name} ${stateAbbr} | Find a Wedding DJ | DJ Dash`,
      description: `Find the best wedding DJs in ${name}, ${state}. Browse ${cityData.djCount} verified wedding DJs.`,
      images: ['/assets/DJ-Dash-Logo-Black-1.PNG'],
    },
  };
}

export default function WeddingDJsCityPage({ params }: PageProps) {
  const cityData = cities[params.city];
  
  if (!cityData) {
    notFound();
  }

  const { name, state, stateAbbr, djCount } = cityData;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            serviceType: 'Wedding DJ Services',
            provider: {
              '@type': 'LocalBusiness',
              name: `Wedding DJ Directory - ${name}, ${state}`,
              address: {
                '@type': 'PostalAddress',
                addressLocality: name,
                addressRegion: stateAbbr,
                addressCountry: 'US',
              },
            },
            areaServed: {
              '@type': 'City',
              name: name,
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.9',
              ratingCount: djCount,
            },
          }),
        }}
      />
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <DJDashHeader />
        
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
          <div className="max-w-7xl mx-auto">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 text-sm font-medium">
                <Heart className="w-4 h-4" />
                <span>Wedding DJs in {name}, {state}</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="text-gray-900 dark:text-white">Find the Perfect</span>
                <br />
                <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                  Wedding DJ in {name}
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                Browse {djCount} verified wedding DJs in {name}, {state}. Read reviews, view portfolios, compare pricing, and get free quotes for your special day.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                <a 
                  href="#find-dj-form"
                  className="px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg font-semibold text-lg hover:from-pink-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Get Free Wedding DJ Quotes
                </a>
                <Link 
                  href={`/djdash/find-dj/${params.city}`}
                  className="px-8 py-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold text-lg hover:border-pink-500 dark:hover:border-pink-500 transition-all"
                >
                  View All {name} DJs
                </Link>
              </div>
              
              <div className="flex items-center justify-center gap-8 pt-8 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>{djCount} Wedding DJs</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>4.9★ Average Rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Free Quotes</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Wedding DJs from DJ Dash */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Why Choose a Wedding DJ from DJ Dash in {name}?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                We've helped thousands of couples find their perfect wedding DJ
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="p-6 rounded-xl bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 border border-pink-100 dark:border-gray-700">
                <Star className="w-12 h-12 text-pink-600 dark:text-pink-400 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Verified & Reviewed
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  All wedding DJs in {name} are verified professionals with real reviews from past couples.
                </p>
              </div>
              
              <div className="p-6 rounded-xl bg-gradient-to-br from-purple-50 to-cyan-50 dark:from-gray-800 dark:to-gray-800 border border-purple-100 dark:border-gray-700">
                <Music className="w-12 h-12 text-purple-600 dark:text-purple-400 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Wedding Specialists
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {name} wedding DJs specialize in ceremonies, receptions, and all wedding traditions.
                </p>
              </div>
              
              <div className="p-6 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 border border-cyan-100 dark:border-gray-700">
                <Calendar className="w-12 h-12 text-cyan-600 dark:text-cyan-400 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Available Dates
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  See which {name} wedding DJs are available for your wedding date instantly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Lead Capture Form */}
        <section id="find-dj-form" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Get Free Quotes from {name} Wedding DJs
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Tell us about your wedding and we'll connect you with the best wedding DJs in {name}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl">
              <form className="space-y-6" action="/api/djdash/lead-capture" method="POST">
                <input type="hidden" name="city" value={name} />
                <input type="hidden" name="state" value={stateAbbr} />
                <input type="hidden" name="eventType" value="Wedding" />
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="John & Jane Smith"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="couple@example.com"
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="(901) 555-1234"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="weddingDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Wedding Date *
                    </label>
                    <input
                      type="date"
                      id="weddingDate"
                      name="eventDate"
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="guests" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Number of Guests
                  </label>
                  <input
                    type="number"
                    id="guests"
                    name="guests"
                    min="1"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="150"
                  />
                </div>
                
                <div>
                  <label htmlFor="venue" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Wedding Venue (Optional)
                  </label>
                  <input
                    type="text"
                    id="venue"
                    name="venue"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Venue name"
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tell us about your wedding
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Music preferences, special songs, ceremony details, reception timeline..."
                  ></textarea>
                </div>
                
                <Button
                  type="submit"
                  className="w-full py-6 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg font-semibold text-lg hover:from-pink-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                >
                  Get Free Quotes from {djCount} {name} Wedding DJs
                  <ArrowRight className="ml-2 w-5 h-5 inline" />
                </Button>
                
                <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                  By submitting, you agree to receive quotes from verified wedding DJs in {name}. We'll never share your information.
                </p>
              </form>
            </div>
          </div>
        </section>

        <DJDashFooter />
      </div>
    </>
  );
}

