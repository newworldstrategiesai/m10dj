import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { 
  Calendar,
  MapPin,
  Users,
  Music,
  ArrowLeft,
  Star,
  Clock,
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  Heart
} from 'lucide-react';
import Header from '../../components/company/Header';
import Footer from '../../components/company/Footer';
import AuthorByline from '../../components/AuthorByline';
import { db } from '../../utils/company_lib/supabase';
import { generateStructuredData } from '../../utils/generateStructuredData';

export default function CaseStudy({ caseStudy: initialCaseStudy, relatedCaseStudies: initialRelated }) {
  const router = useRouter();
  const { slug } = router.query;
  const [caseStudy, setCaseStudy] = useState(initialCaseStudy || null);
  const [relatedCaseStudies, setRelatedCaseStudies] = useState(initialRelated || []);
  const [loading, setLoading] = useState(!initialCaseStudy);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (slug && !initialCaseStudy) {
      loadCaseStudy();
    }
  }, [slug, initialCaseStudy]);

  const loadCaseStudy = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await db.getCaseStudyBySlug(slug);
      
      if (!data) {
        setError('Case study not found');
        return;
      }
      
      setCaseStudy(data);
      
      // Load related case studies from same venue or event type
      const related = await db.getRelatedCaseStudies(data.id, data.venue_name, data.event_type, 3);
      setRelatedCaseStudies(related.filter(c => c.id !== data.id).slice(0, 2));
      
    } catch (err) {
      console.error('Error loading case study:', err);
      setError('Failed to load case study');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center bg-black">
          <div className="text-center">
            <img
              src="/M10-Rotating-Logo.gif"
              alt="M10 DJ Company Loading"
              className="w-24 h-24 object-contain mx-auto mb-4"
            />
            <p className="text-white">Loading case study...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !caseStudy) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Case Study Not Found</h1>
            <Link href="/events" className="text-brand-gold hover:underline">
              View All Case Studies
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const shareUrl = `https://www.m10djcompany.com/events/${caseStudy.slug}`;
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Generate Article schema for case study
  const structuredData = generateStructuredData({
    pageType: 'blog',
    canonical: `/events/${caseStudy.slug}`,
    title: caseStudy.title,
    description: caseStudy.excerpt || caseStudy.title,
    blogProps: {
      headline: caseStudy.title,
      author: 'Ben Murray',
      datePublished: caseStudy.event_date || caseStudy.created_at,
      dateModified: caseStudy.updated_at || caseStudy.created_at,
      image: caseStudy.featured_image_url || '/logo-static.jpg',
      category: 'Case Study'
    }
  });

  return (
    <>
      <Head>
        <title>{caseStudy.title} | M10 DJ Company Case Study</title>
        <meta 
          name="description" 
          content={caseStudy.excerpt || `Real wedding DJ case study from ${caseStudy.venue_name || 'Memphis'}. See how M10 DJ Company created an unforgettable celebration.`} 
        />
        <meta name="keywords" content={`${caseStudy.venue_name} wedding DJ, Memphis wedding case study, ${caseStudy.event_type} DJ Memphis`} />
        <link rel="canonical" href={shareUrl} />
        
        {/* Open Graph */}
        <meta property="og:title" content={caseStudy.title} />
        <meta property="og:description" content={caseStudy.excerpt || caseStudy.title} />
        <meta property="og:url" content={shareUrl} />
        <meta property="og:type" content="article" />
        {caseStudy.featured_image_url && (
          <meta property="og:image" content={caseStudy.featured_image_url} />
        )}
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={caseStudy.title} />
        <meta name="twitter:description" content={caseStudy.excerpt || caseStudy.title} />
        
        {/* Article Schema */}
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
            <div className="max-w-4xl mx-auto">
              {/* Breadcrumb */}
              <nav className="flex items-center space-x-2 text-sm text-gray-400 mb-8">
                <Link href="/" className="hover:text-brand-gold transition-colors">Home</Link>
                <span>/</span>
                <Link href="/events" className="hover:text-brand-gold transition-colors">Case Studies</Link>
                <span>/</span>
                <span className="text-gray-300">{caseStudy.title}</span>
              </nav>

              {/* Event Meta */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                {caseStudy.venue_name && (
                  <div className="flex items-center text-gray-300 text-sm">
                    <MapPin className="w-4 h-4 mr-1" />
                    {caseStudy.venue_name}
                  </div>
                )}
                
                {caseStudy.event_date && (
                  <div className="flex items-center text-gray-300 text-sm">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(caseStudy.event_date)}
                  </div>
                )}
                
                {caseStudy.number_of_guests && (
                  <div className="flex items-center text-gray-300 text-sm">
                    <Users className="w-4 h-4 mr-1" />
                    {caseStudy.number_of_guests} guests
                  </div>
                )}
                
                {caseStudy.event_type && (
                  <div className="flex items-center text-gray-300 text-sm">
                    <Music className="w-4 h-4 mr-1" />
                    {caseStudy.event_type}
                  </div>
                )}
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                {caseStudy.title}
              </h1>

              {/* Excerpt */}
              {caseStudy.excerpt && (
                <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                  {caseStudy.excerpt}
                </p>
              )}

              {/* Author Byline */}
              <AuthorByline 
                lastUpdated={caseStudy.updated_at ? formatDate(caseStudy.updated_at) : undefined}
                showDate={!!caseStudy.updated_at}
                className="text-gray-400"
              />
            </div>
          </div>
        </section>

        {/* Featured Image */}
        {caseStudy.featured_image_url && (
          <section className="py-0">
            <div className="section-container">
              <div className="max-w-4xl mx-auto">
                <div className="relative w-full h-96 md:h-[500px] rounded-2xl overflow-hidden">
                  <Image
                    src={caseStudy.featured_image_url}
                    alt={caseStudy.title}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Content Section */}
        <section className="py-20 bg-white dark:bg-gray-900">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              <div className="prose prose-lg max-w-none dark:prose-invert">
                <div 
                  className="case-study-content"
                  dangerouslySetInnerHTML={{ __html: caseStudy.content }}
                />
              </div>

              {/* Key Highlights */}
              {caseStudy.highlights && caseStudy.highlights.length > 0 && (
                <div className="mt-12 bg-gray-50 dark:bg-gray-800 rounded-xl p-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    What Made This Event Special
                  </h3>
                  <ul className="space-y-3">
                    {caseStudy.highlights.map((highlight, index) => (
                      <li key={index} className="flex items-start">
                        <Star className="w-5 h-5 text-brand-gold mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 dark:text-gray-300">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Client Testimonial */}
              {caseStudy.testimonial && (
                <div className="mt-12 bg-brand text-white rounded-xl p-8">
                  <div className="flex items-center mb-4">
                    <Heart className="w-6 h-6 text-brand-gold mr-2" />
                    <h3 className="text-2xl font-bold">Client Testimonial</h3>
                  </div>
                  <blockquote className="text-lg italic mb-4">
                    "{caseStudy.testimonial.testimonial_text}"
                  </blockquote>
                  <div className="flex items-center">
                    <div className="flex items-center mr-4">
                      {Array.from({ length: caseStudy.testimonial.rating || 5 }).map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-brand-gold fill-current" />
                      ))}
                    </div>
                    <div>
                      <p className="font-semibold">{caseStudy.testimonial.client_name}</p>
                      {caseStudy.testimonial.event_date && (
                        <p className="text-sm text-gray-200">{formatDate(caseStudy.testimonial.event_date)}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Related Case Studies */}
        {relatedCaseStudies.length > 0 && (
          <section className="py-20 bg-gray-50 dark:bg-gray-800">
            <div className="section-container">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                  Related Case Studies
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {relatedCaseStudies.map((related) => (
                    <Link
                      key={related.id}
                      href={`/events/${related.slug}`}
                      className="bg-white dark:bg-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      {related.featured_image_url && (
                        <div className="relative w-full h-48">
                          <Image
                            src={related.featured_image_url}
                            alt={related.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          {related.title}
                        </h3>
                        {related.excerpt && (
                          <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                            {related.excerpt}
                          </p>
                        )}
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          {related.venue_name && (
                            <>
                              <MapPin className="w-4 h-4 mr-1" />
                              <span className="mr-4">{related.venue_name}</span>
                            </>
                          )}
                          {related.event_date && (
                            <>
                              <Calendar className="w-4 h-4 mr-1" />
                              <span>{formatDate(related.event_date)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

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
                  href="/events"
                  className="btn-outline text-lg"
                >
                  View More Case Studies
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

// Generate static paths for all case studies
export async function getStaticPaths() {
  try {
    const caseStudies = await db.getCaseStudies();
    const paths = caseStudies
      .filter(cs => cs.slug && cs.is_published)
      .map((cs) => ({
        params: { slug: cs.slug }
      }));

    return {
      paths,
      fallback: 'blocking'
    };
  } catch (error) {
    console.error('Error in getStaticPaths for case studies:', error);
    return {
      paths: [],
      fallback: 'blocking'
    };
  }
}

// Generate static props for each case study
export async function getStaticProps({ params }) {
  try {
    const caseStudy = await db.getCaseStudyBySlug(params.slug);
    
    if (!caseStudy) {
      return {
        notFound: true
      };
    }

    // Get related case studies
    const relatedCaseStudies = await db.getRelatedCaseStudies(
      caseStudy.id,
      caseStudy.venue_name,
      caseStudy.event_type,
      3
    );

    return {
      props: {
        caseStudy,
        relatedCaseStudies: relatedCaseStudies || []
      },
      revalidate: 3600 // Revalidate every hour
    };
  } catch (error) {
    console.error('Error in getStaticProps for case study:', error);
    return {
      notFound: true
    };
  }
}

