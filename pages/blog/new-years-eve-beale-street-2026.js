import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import {
  Calendar,
  MapPin,
  Music,
  Quote,
  Sparkles,
  Users,
  ChevronRight,
  Shield,
} from 'lucide-react';
import Header from '../../components/company/Header';
import Footer from '../../components/company/Footer';
import { ArticleSchema, BreadcrumbListSchema } from '../../components/StandardSchema';
import ContactForm from '../../components/company/ContactForm';
import { scrollToContact } from '../../utils/scroll-helpers';

const OG_IMAGE_URL = 'https://m10djcompany.com/assets/nye-beale-street-2026-og.png';
const PHOTO_1 = '/assets/DJ-Ben-Murray-NYE-Beale-St-2026-1.jpg';
const PHOTO_2 = '/assets/DJ-Ben-Murray-NYE-Beale-St-2026-2.jpg';

const eventDetails = {
  name: "New Year's Eve on Beale Street",
  date: "December 31, 2025",
  location: "Beale Street, Memphis, TN",
  attendees: "8,000–10,000",
  age: "21+",
  organizer: "Downtown Memphis Commission & Beale Street merchants",
};

const attendeeQuotes = [
  {
    quote: "The music was bumping all night — everyone was on the dance floor until 2 AM!",
  },
  {
    quote: "Loved the energy from the DJs and bands — non-stop dance floor!",
  },
  {
    quote: "Great live music, everyone's vibing. I feel good.",
  },
  {
    quote: "Beale was packed but the music made it worth it — danced the whole time.",
  },
  {
    quote: "The DJ kept the party alive — epic vibes all around. Confetti everywhere at midnight with the perfect drop!",
  },
];

export default function NewYearsEveBealeStreet2026() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <>
      <Head>
        <title>DJ Ben Murray at New Year&apos;s Eve on Beale Street 2026 | M10 DJ Company</title>
        <meta
          name="description"
          content="DJ Ben Murray and DJ Tree headlined the 2025–2026 New Year's Eve on Beale Street celebration in Memphis. Read about the tower stage, LED screens, and the soundtrack that kept 8,000+ attendees dancing until the confetti drop."
        />
        <meta
          name="keywords"
          content="DJ Ben Murray Beale Street, NYE Beale Street Memphis, New Year's Eve Memphis DJ, Beale Street 2026, Memphis NYE celebration, Downtown Memphis Commission"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://m10djcompany.com/blog/new-years-eve-beale-street-2026" />

        {/* Open Graph */}
        <meta property="og:title" content="DJ Ben Murray at New Year's Eve on Beale Street 2026" />
        <meta property="og:description" content="DJ Ben Murray and DJ Tree anchored the NYE on Beale Street celebration — high-energy sets from the tower stage for thousands in downtown Memphis." />
        <meta property="og:url" content="https://m10djcompany.com/blog/new-years-eve-beale-street-2026" />
        <meta property="og:type" content="article" />
        <meta property="og:image" content={OG_IMAGE_URL} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="DJ Ben Murray at New Year's Eve on Beale Street 2026 - M10 DJ Company Event Recap" />
        <meta property="og:image:type" content="image/png" />
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="DJ Ben Murray at New Year's Eve on Beale Street 2026" />
        <meta name="twitter:description" content="DJ Ben Murray and DJ Tree anchored the NYE on Beale Street celebration — high-energy sets from the tower stage for thousands in downtown Memphis." />
        <meta name="twitter:image" content={OG_IMAGE_URL} />
        <meta name="twitter:image:alt" content="DJ Ben Murray at New Year's Eve on Beale Street 2026 - M10 DJ Company Event Recap" />

        <ArticleSchema
          headline="DJ Ben Murray at New Year's Eve on Beale Street 2026"
          description="Recap of DJ Ben Murray and DJ Tree headlining the 2025–2026 New Year's Eve on Beale Street celebration in Memphis — tower stage, LED screens, and the soundtrack for 8,000+ attendees."
          datePublished="2026-01-15"
          dateModified="2026-01-15"
          url="https://m10djcompany.com/blog/new-years-eve-beale-street-2026"
          image={OG_IMAGE_URL}
          category="Events & Performances"
          author="M10 DJ Company"
        />

        <BreadcrumbListSchema
          breadcrumbs={[
            { name: 'Home', url: 'https://m10djcompany.com' },
            { name: 'Blog', url: 'https://m10djcompany.com/blog' },
            { name: "New Year's Eve on Beale Street 2026", url: 'https://m10djcompany.com/blog/new-years-eve-beale-street-2026' },
          ]}
        />

        {/* BlogPosting schema for Google Article/Blog rich results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BlogPosting',
              headline: "DJ Ben Murray at New Year's Eve on Beale Street 2026",
              description: "Recap of DJ Ben Murray and DJ Tree headlining the 2025–2026 New Year's Eve on Beale Street celebration in Memphis — tower stage, LED screens, and the soundtrack for 8,000+ attendees.",
              image: {
                '@type': 'ImageObject',
                url: OG_IMAGE_URL,
                width: 1200,
                height: 630,
              },
              url: 'https://m10djcompany.com/blog/new-years-eve-beale-street-2026',
              datePublished: '2026-01-15',
              dateModified: '2026-01-15',
              author: {
                '@type': 'Person',
                '@id': 'https://www.m10djcompany.com/about/ben-murray#person',
                name: 'Ben Murray',
                alternateName: 'DJ Ben Murray',
                jobTitle: 'Founder & Lead DJ',
                url: 'https://www.m10djcompany.com/about/ben-murray',
                sameAs: [
                  'https://www.instagram.com/djbenmurray/',
                  'https://soundcloud.com/thebenmurray',
                  'https://www.facebook.com/djbenmurray/',
                  'https://x.com/djbenmurray',
                ],
              },
              publisher: {
                '@type': 'Organization',
                name: 'M10 DJ Company',
                logo: {
                  '@type': 'ImageObject',
                  url: 'https://m10djcompany.com/logo-static.jpg',
                },
              },
              mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': 'https://m10djcompany.com/blog/new-years-eve-beale-street-2026',
              },
              articleSection: 'Events & Performances',
              wordCount: 720,
              keywords: 'DJ Ben Murray Beale Street, NYE Beale Street Memphis, New Year\'s Eve Memphis DJ, Beale Street 2026, Memphis NYE celebration',
            }),
          }}
        />

        {/* Event schema for Google Event rich results (all optionals included) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'MusicEvent',
              name: "New Year's Eve on Beale Street",
              description: "Free 21+ street party welcoming 2026 on historic Beale Street. DJ Ben Murray and DJ Tree headlined from the tower stage with LED screens, countdown, fireworks, and confetti. Organized by Downtown Memphis Commission and Beale Street merchants.",
              url: 'https://m10djcompany.com/blog/new-years-eve-beale-street-2026',
              startDate: '2025-12-31T18:00:00-06:00',
              endDate: '2026-01-01T02:00:00-06:00',
              doorTime: '2025-12-31T18:00:00-06:00',
              eventStatus: 'https://schema.org/EventScheduled',
              eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
              location: {
                '@type': 'Place',
                name: 'Beale Street',
                address: {
                  '@type': 'PostalAddress',
                  streetAddress: 'Beale Street',
                  addressLocality: 'Memphis',
                  addressRegion: 'TN',
                  postalCode: '38103',
                  addressCountry: 'US',
                },
                geo: {
                  '@type': 'GeoCoordinates',
                  latitude: 35.1382,
                  longitude: -90.0506,
                },
              },
              image: [
                OG_IMAGE_URL,
                'https://m10djcompany.com/assets/DJ-Ben-Murray-NYE-Beale-St-2026-1.jpg',
                'https://m10djcompany.com/assets/DJ-Ben-Murray-NYE-Beale-St-2026-2.jpg',
              ],
              organizer: [
                {
                  '@type': 'Organization',
                  name: 'Downtown Memphis Commission',
                  url: 'https://www.downtownmemphis.com',
                },
                {
                  '@type': 'Organization',
                  name: 'Beale Street Merchants',
                },
              ],
              performer: [
                {
                  '@type': 'Person',
                  '@id': 'https://www.m10djcompany.com/about/ben-murray#person',
                  name: 'Ben Murray',
                  alternateName: 'DJ Ben Murray',
                  url: 'https://www.m10djcompany.com/about/ben-murray',
                },
                {
                  '@type': 'Person',
                  name: 'DJ Tree',
                },
              ],
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
                availability: 'https://schema.org/InStock',
                validFrom: '2025-12-31',
                url: 'https://m10djcompany.com/blog/new-years-eve-beale-street-2026',
              },
              audience: {
                '@type': 'PeopleAudience',
                suggestedMinAge: 21,
              },
              isAccessibleForFree: true,
              maximumAttendeeCapacity: 10000,
              typicalAgeRange: '21-',
              subEvent: [
                {
                  '@type': 'Event',
                  name: 'Live DJ sets on tower stage',
                  startDate: '2025-12-31T18:00:00-06:00',
                  endDate: '2026-01-01T02:00:00-06:00',
                },
                {
                  '@type': 'Event',
                  name: 'Midnight countdown, fireworks & confetti',
                  startDate: '2026-01-01T00:00:00-06:00',
                },
              ],
            }),
          }}
        />
      </Head>

      <Header />

      <main>
        {/* Hero */}
        <section className="relative py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-10 w-72 h-72 bg-brand-gold rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-gold rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
          </div>

          <div className="section-container relative z-10 pt-16">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-brand-gold mr-3" />
                <span className="text-brand-gold font-semibold">Event Recap</span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold mb-8 leading-tight">
                <span className="block text-white">New Year&apos;s Eve on Beale Street</span>
                <span className="block text-gradient bg-gradient-to-r from-brand via-amber-400 to-brand bg-clip-text text-transparent">DJ Ben Murray Headlines 2026 Celebration</span>
              </h1>

              <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                The free, 21+ street party that welcomed 2026 drew an estimated 8,000–10,000 people to historic Beale Street — 
                with DJ Ben Murray and DJ Tree at the center of the soundtrack from the main tower stage.
              </p>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-2xl mx-auto">
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div>
                    <div className="text-2xl font-bold text-brand-gold">8K–10K</div>
                    <div className="text-sm text-gray-300">Attendees</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-brand-gold">Dec 31</div>
                    <div className="text-sm text-gray-300">2025 → 2026</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-brand-gold">Beale St</div>
                    <div className="text-sm text-gray-300">Memphis, TN</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-brand-gold">Free</div>
                    <div className="text-sm text-gray-300">21+ Event</div>
                  </div>
                </div>
              </div>

              {/* Hero photo from NYE on Beale */}
              <div className="mt-16 max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/10">
                <div className="relative aspect-[16/10] w-full">
                  <Image
                    src={PHOTO_1}
                    alt="DJ Ben Murray at New Year's Eve on Beale Street 2026 - tower stage and crowd"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 896px"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Event overview */}
        <section className="py-24 bg-white dark:bg-gray-900">
          <div className="section-container">
            <div className="max-w-3xl mx-auto">
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
                The New Year&apos;s Eve on Beale Street celebration on December 31, 2025, to welcome 2026 transformed the historic district 
                into one of Memphis&apos;s most electric annual gatherings. Organized by the Downtown Memphis Commission and Beale Street merchants, 
                the free, 21+ event drew an estimated 8,000 to 10,000 attendees — a packed crowd that filled the street from early evening through the early morning hours.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <div className="flex items-start">
                  <Calendar className="w-5 h-5 text-brand-gold mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-gray-900 dark:text-white">Date</strong>
                    <p className="text-gray-600 dark:text-gray-400">{eventDetails.date}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-brand-gold mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-gray-900 dark:text-white">Location</strong>
                    <p className="text-gray-600 dark:text-gray-400">{eventDetails.location}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Users className="w-5 h-5 text-brand-gold mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-gray-900 dark:text-white">Crowd</strong>
                    <p className="text-gray-600 dark:text-gray-400">{eventDetails.attendees} (21+)</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Music className="w-5 h-5 text-brand-gold mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-gray-900 dark:text-white">Organizers</strong>
                    <p className="text-gray-600 dark:text-gray-400">{eventDetails.organizer}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The stage & performance */}
        <section className="py-24 bg-gray-50 dark:bg-gray-800">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                The Tower Stage &amp; the Soundtrack
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                At the center of the festivities stood a prominent temporary tower structure erected directly in the cross-section between Silky&apos;s and Alfred&apos;s, 
                rising several stories high. This striking setup featured massive LED screens — one facing each direction of Beale Street — broadcasting visuals, 
                countdowns, and live feeds to the thousands below. From this elevated stage, <strong className="text-gray-900 dark:text-white">DJ Ben Murray</strong> and{' '}
                <strong className="text-gray-900 dark:text-white">DJ Tree</strong> delivered high-energy sets that anchored the night&apos;s soundtrack.
              </p>
              <div className="rounded-2xl overflow-hidden shadow-xl mb-8">
                <div className="relative aspect-[16/10] w-full">
                  <Image
                    src={PHOTO_2}
                    alt="NYE on Beale Street 2026 - tower stage, LED screens, and crowd on Beale Street"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1024px"
                  />
                </div>
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                Their performance kept the massive crowd in constant motion, blending crowd-pleasing anthems, modern hits, and soulful Memphis-inspired mixes. 
                The music flowed seamlessly across the district, complementing live acts inside venues like B.B. King&apos;s Blues Club, Rum Boogie Café, and Tin Roof 
                while driving the street-level energy toward the midnight disco ball raise, fireworks, and confetti cannons.
              </p>
            </div>
          </div>
        </section>

        {/* Attendee quotes */}
        <section className="py-24 bg-white dark:bg-gray-900">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                What Attendees Said
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Reactions from social media, local news comments, and forums in the days after the event.
              </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-8">
              {attendeeQuotes.map((item, index) => (
                <blockquote
                  key={index}
                  className="flex items-start gap-4 p-6 rounded-xl bg-gray-50 dark:bg-gray-800 border-l-4 border-brand-gold"
                >
                  <Quote className="w-8 h-8 text-brand-gold flex-shrink-0 mt-1" />
                  <p className="text-lg text-gray-700 dark:text-gray-200 italic">&ldquo;{item.quote}&rdquo;</p>
                </blockquote>
              ))}
            </div>

            <p className="max-w-3xl mx-auto mt-10 text-gray-600 dark:text-gray-400 text-center">
              These reactions underscore how the soundtrack fueled the celebration&apos;s success — and why live DJ performances 
              remain a defining part of Beale Street NYE.
            </p>
          </div>
        </section>

        {/* Safety & closing */}
        <section className="py-24 bg-gray-50 dark:bg-gray-800">
          <div className="section-container">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-10 h-10 text-brand-gold" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Safe &amp; Sound</h2>
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                No major incidents were reported. Memphis Police maintained a strong, visible presence with increased patrols, 
                weapon screenings, drones, mounted units, and the Downtown Command Center, ensuring a safe environment for the large gathering.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                The 2025–2026 edition reinforced Beale Street NYE as a beloved Memphis tradition: a free, high-energy street party where music 
                unites thousands in pure celebration. The overwhelming positive response to the night&apos;s beats highlights the power of live DJ 
                performances in creating unforgettable moments on one of the city&apos;s most iconic stages.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 bg-gray-900 dark:bg-black text-white">
          <div className="section-container">
            <div className="max-w-3xl mx-auto text-center">
              <Music className="w-16 h-16 text-brand-gold mx-auto mb-6" />
              <h2 className="text-4xl font-bold mb-6">Book Your Next Memphis Celebration</h2>
              <p className="text-xl mb-8 text-gray-300">
                From Beale Street to your wedding or corporate event — let M10 DJ Company bring the same energy and professionalism to your party.
              </p>
              <button
                onClick={scrollToContact}
                className="bg-brand-gold text-black hover:bg-amber-400 px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-flex items-center"
              >
                Get a Quote
                <ChevronRight className="ml-2 w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

        {/* Related */}
        <section className="py-24 bg-white dark:bg-gray-900">
          <div className="section-container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">More from the Blog</h2>
              <p className="text-gray-600 dark:text-gray-300">Wedding guides, success stories, and Memphis event tips.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Link
                href="/blog/memphis-wedding-success-story-sarah-michael"
                className="card text-center group hover:shadow-xl transition-all dark:bg-gray-800 dark:border-gray-700"
              >
                <Sparkles className="w-12 h-12 text-brand mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Memphis Wedding Success Story</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Real Peabody Memphis wedding with M10 DJ Company</p>
                <span className="text-brand font-semibold">Read Story →</span>
              </Link>

              <Link
                href="/blog/memphis-wedding-dj-cost-guide-2025"
                className="card text-center group hover:shadow-xl transition-all dark:bg-gray-800 dark:border-gray-700"
              >
                <Music className="w-12 h-12 text-brand mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Memphis Wedding DJ Cost Guide</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">2025 pricing and packages for Memphis weddings</p>
                <span className="text-brand font-semibold">Read Guide →</span>
              </Link>

              <Link
                href="/blog/memphis-wedding-songs-2025"
                className="card text-center group hover:shadow-xl transition-all dark:bg-gray-800 dark:border-gray-700"
              >
                <Music className="w-12 h-12 text-brand mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Memphis Wedding Songs 2025</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Top songs and playlist ideas for your big day</p>
                <span className="text-brand font-semibold">Get Playlist →</span>
              </Link>
            </div>
          </div>
        </section>

        <ContactForm />
      </main>

      <Footer />
    </>
  );
}
