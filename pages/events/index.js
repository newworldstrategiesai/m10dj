import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Calendar,
  MapPin,
  Users,
  Music,
  ArrowRight,
  Search,
  Filter,
  Star,
  Heart
} from 'lucide-react';
import Header from '../../components/company/Header';
import Footer from '../../components/company/Footer';
import { db } from '../../utils/company_lib/supabase';
import { generateStructuredData } from '../../utils/generateStructuredData';

export default function CaseStudiesIndex({ initialCaseStudies, initialFeatured }) {
  const [caseStudies, setCaseStudies] = useState(initialCaseStudies || []);
  const [featuredCaseStudies, setFeaturedCaseStudies] = useState(initialFeatured || []);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('all');
  const [selectedEventType, setSelectedEventType] = useState('all');

  useEffect(() => {
    if (!initialCaseStudies || !initialFeatured) {
      loadCaseStudies();
    }
  }, [initialCaseStudies, initialFeatured]);

  const loadCaseStudies = async () => {
    setLoading(true);
    try {
      const [all, featured] = await Promise.all([
        db.getCaseStudies(),
        db.getFeaturedCaseStudies(3)
      ]);
      
      setCaseStudies(all);
      setFeaturedCaseStudies(featured);
    } catch (error) {
      console.error('Error loading case studies:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCaseStudies = caseStudies.filter(cs => {
    const matchesSearch = cs.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cs.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cs.venue_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVenue = selectedVenue === 'all' || cs.venue_name === selectedVenue;
    const matchesEventType = selectedEventType === 'all' || cs.event_type === selectedEventType;
    return matchesSearch && matchesVenue && matchesEventType;
  });

  const venues = [...new Set(caseStudies.map(cs => cs.venue_name).filter(Boolean))];
  const eventTypes = [...new Set(caseStudies.map(cs => cs.event_type).filter(Boolean))];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const structuredData = generateStructuredData({
    pageType: 'homepage',
    canonical: '/events',
    title: 'Memphis Wedding & Event DJ Case Studies | M10 DJ Company',
    description: 'Real case studies from 500+ successful Memphis weddings and events. See how M10 DJ Company creates unforgettable celebrations at The Peabody, Graceland, Memphis Botanic Garden, and more.'
  });

  return (
    <>
      <Head>
        <title>Memphis Wedding & Event DJ Case Studies | M10 DJ Company</title>
        <meta 
          name="description" 
          content="Real case studies from 500+ successful Memphis weddings and events. See how M10 DJ Company creates unforgettable celebrations at premier Memphis venues." 
        />
        <meta name="keywords" content="Memphis wedding DJ case studies, wedding DJ reviews Memphis, event DJ success stories, Memphis venue DJ experience" />
        <link rel="canonical" href="https://www.m10djcompany.com/events" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData)
          }}
        />
      </Head>

      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-10 w-72 h-72 bg-brand-gold rounded-full blur-3xl animate-pulse-slow"></div>
          </div>
          
          <div className="section-container relative z-10 pt-16">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                <span className="block text-white">Real Event Case Studies</span>
                <span className="block text-brand-gold">From 500+ Memphis Celebrations</span>
              </h1>
              
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                See how we've created unforgettable celebrations at Memphis's premier venues. 
                Real stories from real couples and event organizers.
              </p>

              <div className="grid grid-cols-3 gap-8 mb-8">
                <div>
                  <div className="text-3xl font-bold text-brand-gold">500+</div>
                  <div className="text-sm text-gray-300">Events Completed</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-brand-gold">27+</div>
                  <div className="text-sm text-gray-300">Memphis Venues</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-brand-gold">5★</div>
                  <div className="text-sm text-gray-300">Average Rating</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Case Studies */}
        {featuredCaseStudies.length > 0 && (
          <section className="py-20 bg-white dark:bg-gray-900">
            <div className="section-container">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Featured Case Studies
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300">
                  Some of our most memorable celebrations
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {featuredCaseStudies.map((caseStudy) => (
                  <Link
                    key={caseStudy.id}
                    href={`/events/${caseStudy.slug}`}
                    className="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    {caseStudy.featured_image_url && (
                      <div className="relative w-full h-64">
                        <Image
                          src={caseStudy.featured_image_url}
                          alt={caseStudy.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-brand-gold transition-colors">
                        {caseStudy.title}
                      </h3>
                      {caseStudy.excerpt && (
                        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                          {caseStudy.excerpt}
                        </p>
                      )}
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                        {caseStudy.venue_name && (
                          <>
                            <MapPin className="w-4 h-4 mr-1" />
                            <span className="mr-4">{caseStudy.venue_name}</span>
                          </>
                        )}
                        {caseStudy.event_date && (
                          <>
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>{formatDate(caseStudy.event_date)}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center text-brand-gold font-semibold">
                        <span>Read Case Study</span>
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* All Case Studies */}
        <section className="py-20 bg-gray-50 dark:bg-gray-800">
          <div className="section-container">
            <div className="max-w-6xl mx-auto">
              {/* Filters */}
              <div className="mb-12">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search case studies..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <select
                      value={selectedVenue}
                      onChange={(e) => setSelectedVenue(e.target.value)}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-transparent"
                    >
                      <option value="all">All Venues</option>
                      {venues.map(venue => (
                        <option key={venue} value={venue}>{venue}</option>
                      ))}
                    </select>
                    <select
                      value={selectedEventType}
                      onChange={(e) => setSelectedEventType(e.target.value)}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-transparent"
                    >
                      <option value="all">All Event Types</option>
                      {eventTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Showing {filteredCaseStudies.length} case {filteredCaseStudies.length === 1 ? 'study' : 'studies'}
                </p>
              </div>

              {/* Case Studies Grid */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="flex items-center justify-center mb-4">
                    <img
                      src="/M10-Rotating-Logo.gif"
                      alt="M10 DJ Company Loading"
                      className="w-20 h-20 object-contain"
                    />
                  </div>
                  <p className="text-gray-600">Loading case studies...</p>
                </div>
              ) : filteredCaseStudies.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    No case studies found. Check back soon!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredCaseStudies.map((caseStudy) => (
                    <Link
                      key={caseStudy.id}
                      href={`/events/${caseStudy.slug}`}
                      className="group bg-white dark:bg-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      {caseStudy.featured_image_url && (
                        <div className="relative w-full h-48">
                          <Image
                            src={caseStudy.featured_image_url}
                            alt={caseStudy.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-brand-gold transition-colors">
                          {caseStudy.title}
                        </h3>
                        {caseStudy.excerpt && (
                          <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                            {caseStudy.excerpt}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                          {caseStudy.venue_name && (
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              <span>{caseStudy.venue_name}</span>
                            </div>
                          )}
                          {caseStudy.event_date && (
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              <span>{formatDate(caseStudy.event_date)}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center text-brand-gold font-semibold">
                          <span>Read More</span>
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-white dark:bg-gray-900">
          <div className="section-container">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Ready to Create Your Own Success Story?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Let's discuss your upcoming event and how we can help make it unforgettable.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/contact"
                  className="btn-primary text-lg"
                >
                  Get Your Free Quote
                </Link>
                <Link 
                  href="/memphis-wedding-dj"
                  className="btn-outline text-lg"
                >
                  View Wedding DJ Services
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

// Generate static props
export async function getStaticProps() {
  try {
    const [allCaseStudies, featured] = await Promise.all([
      db.getCaseStudies(),
      db.getFeaturedCaseStudies(3)
    ]);

    return {
      props: {
        initialCaseStudies: allCaseStudies || [],
        initialFeatured: featured || []
      },
      revalidate: 3600 // Revalidate every hour
    };
  } catch (error) {
    console.error('Error fetching case studies for SSG:', error);
    return {
      props: {
        initialCaseStudies: [],
        initialFeatured: []
      },
      revalidate: 3600
    };
  }
}

