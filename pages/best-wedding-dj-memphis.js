import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Star, 
  Trophy, 
  Heart, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle,
  ChevronRight,
  Award,
  Users,
  Music,
  Calendar,
  Volume2,
  Sparkles,
  Shield,
  Clock,
  ThumbsUp
} from 'lucide-react';
import Header from '../components/company/Header';
import Footer from '../components/company/Footer';
import ContactForm from '../components/company/ContactForm';
import TestimonialSlider from '../components/company/TestimonialSlider';
import { scrollToContact } from '../utils/scroll-helpers';

const whyBestFeatures = [
  {
    icon: Star,
    title: "5-Star Rated Service",
    description: "Consistently rated 5 stars by Memphis couples with hundreds of positive reviews across Google, WeddingWire, and The Knot"
  },
  {
    icon: Trophy,
    title: "10+ Years Experience",
    description: "Over a decade serving Memphis weddings with 500+ successful celebrations and countless happy couples"
  },
  {
    icon: Award,
    title: "Professional Equipment",
    description: "Premium sound systems, wireless microphones, and LED uplighting included in every Memphis wedding package"
  },
  {
    icon: Users,
    title: "Master of Ceremonies",
    description: "Experienced MC services to guide your Memphis wedding timeline seamlessly from ceremony to reception"
  },
  {
    icon: Shield,
    title: "Fully Insured & Licensed",
    description: "Licensed and insured Memphis wedding DJ service with backup equipment and contingency plans"
  },
  {
    icon: Heart,
    title: "Personalized Approach",
    description: "Custom music curation and timeline planning tailored specifically to your Memphis wedding vision"
  }
];

const competitorComparison = [
  {
    feature: "Experience in Memphis",
    m10: "10+ years, 500+ weddings",
    others: "Varies, often newer"
  },
  {
    feature: "Equipment Quality",
    m10: "Premium sound & lighting",
    others: "Basic equipment"
  },
  {
    feature: "MC Services Included",
    m10: "Professional MC included",
    others: "Often extra charge"
  },
  {
    feature: "Backup Equipment",
    m10: "Full backup systems",
    others: "Limited or none"
  },
  {
    feature: "Venue Knowledge",
    m10: "Approved at all major venues",
    others: "Limited venue experience"
  },
  {
    feature: "Transparent Pricing",
    m10: "No hidden fees",
    others: "Often surprise charges"
  }
];

const awards = [
  {
    title: "5-Star Google Reviews",
    description: "Consistently rated 5 stars by Memphis couples",
    icon: Star
  },
  {
    title: "WeddingWire Recommended", 
    description: "Top-rated Memphis wedding DJ vendor",
    icon: Award
  },
  {
    title: "Venue Preferred Vendor",
    description: "Preferred by Memphis's premier wedding venues",
    icon: Trophy
  },
  {
    title: "Client Choice Awards",
    description: "Chosen by Memphis couples year after year",
    icon: Heart
  }
];

const testimonials = [
  {
    name: "Dan Roberts",
    venue: "The Columns",
    quote: "Outstanding service from start to finish! Ben handled our ceremony and reception beautifully. Great music selection, smooth transitions, and he really knows how to work a Memphis crowd. Highly recommend!",
    rating: 5,
    highlight: "Outstanding Memphis wedding DJ!"
  },
  {
    name: "Brad Eiseman",
    venue: "Memphis Botanic Garden",
    quote: "Ben made our outdoor Memphis wedding absolutely magical! Despite some weather concerns, he had everything under control. The music was perfect and our guests danced until the very end.",
    rating: 5,
    highlight: "Made our wedding magical!"
  },
  {
    name: "Steven Gordon",
    venue: "AutoZone Park", 
    quote: "M10 DJ Company was fantastic for our unique Memphis wedding venue! Ben's equipment handled the large space perfectly and he kept everyone entertained. Professional, reliable, and fun!",
    rating: 5,
    highlight: "Professional, reliable, and fun!"
  }
];

const bestPractices = [
  {
    title: "Music Consultation",
    description: "Detailed discussion about your music preferences, must-play songs, and do-not-play lists"
  },
  {
    title: "Timeline Coordination", 
    description: "Professional coordination with your venue and vendors to ensure perfect timing"
  },
  {
    title: "Sound Check",
    description: "Thorough sound testing before your ceremony and reception to ensure perfect audio"
  },
  {
    title: "Backup Plans",
    description: "Redundant equipment and backup systems to guarantee uninterrupted entertainment"
  },
  {
    title: "Professional Appearance",
    description: "Dressed appropriately for your wedding style with a professional, polished presence"
  },
  {
    title: "Crowd Reading",
    description: "Expert ability to read the room and adjust music to keep your dance floor packed"
  }
];

export default function BestWeddingDJMemphis() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <>
      <Head>
        <title>Best Wedding DJ Memphis | 500+ 5-Star Reviews</title>
        <meta 
          name="description" 
          content="Best wedding DJ Memphis with 500+ 5-star reviews. Top-rated Memphis wedding DJs for your special day. See why couples choose us. Call (901) 410-2020!" 
        />
        <meta name="keywords" content="best wedding DJ Memphis, top wedding DJ Memphis, best Memphis wedding DJ, top Memphis wedding DJ, Memphis wedding DJ reviews, wedding DJ reviews Memphis, Memphis DJ testimonials, wedding DJ ratings Memphis" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://m10djcompany.com/best-wedding-dj-memphis" />
        
        {/* Open Graph tags */}
        <meta property="og:title" content="Memphis Wedding DJ Reviews | 500+ 5-Star Weddings | M10 DJ Company" />
        <meta property="og:description" content="See what makes M10 Memphis's most trusted wedding DJ. Read real reviews, see photos & videos from 500+ successful weddings, and discover why couples choose us." />
        <meta property="og:url" content="https://m10djcompany.com/best-wedding-dj-memphis" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://m10djcompany.com/logo-static.jpg" />
        
        {/* Local SEO tags */}
        <meta name="geo.region" content="US-TN" />
        <meta name="geo.placename" content="Memphis" />
        <meta name="ICBM" content="35.1495, -90.0490" />

        {/* Schema Markup */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": "M10 DJ Company",
              "description": "Memphis's best wedding DJ service with 5-star reviews and 500+ successful weddings",
              "url": "https://m10djcompany.com/best-wedding-dj-memphis",
              "telephone": "+19014102020",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "65 Stewart Rd",
                "addressLocality": "Eads",
                "addressRegion": "TN",
                "postalCode": "38028",
                "addressCountry": "US"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 35.1495,
                "longitude": -90.0490
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "5",
                "reviewCount": "150",
                "bestRating": "5",
                "worstRating": "5"
              },
              "awardName": ["5-Star Google Reviews", "WeddingWire Recommended", "Client Choice Awards"],
              "serviceType": "Wedding DJ Services",
              "priceRange": "$799-$1899"
            })
          }}
        />
      </Head>

      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-10 w-72 h-72 bg-brand-gold rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-gold rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
          </div>
          
          <div className="section-container relative z-10 pt-16">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="flex items-center mb-6">
                    <Trophy className="w-8 h-8 text-brand-gold mr-3" />
                    <span className="text-brand-gold font-semibold">Memphis's #1 Choice</span>
                  </div>
                  
                  <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                    <span className="block text-white">Best Wedding DJ</span>
                    <span className="block text-gradient">in Memphis</span>
                  </h1>
                  
                  <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                    Discover why Memphis couples choose M10 DJ Company as their wedding DJ. With 500+ successful 
                    weddings, 5-star reviews, and unmatched professionalism, we're Memphis's most trusted choice.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <Link
                      href="/memphis-wedding-dj"
                      className="btn-primary text-lg px-8 py-4 flex items-center"
                    >
                      View Wedding DJ Services
                      <ChevronRight className="ml-2 w-5 h-5" />
                    </Link>
                    <a href="tel:(901)410-2020" className="btn-outline text-lg px-8 py-4">
                      <Phone className="mr-2 w-5 h-5" />
                      Call (901) 410-2020
                    </a>
                    <p className="mt-4 text-sm text-gray-300 col-span-2">
                      Looking for our complete wedding DJ services? Visit our <Link href="/memphis-wedding-dj" className="text-brand-gold hover:underline">Memphis Wedding DJ</Link> page.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="text-3xl font-bold text-brand-gold">500+</div>
                      <div className="text-sm text-gray-300">Memphis Weddings</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-brand-gold">5★</div>
                      <div className="text-sm text-gray-300">Average Rating</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-brand-gold">10+</div>
                      <div className="text-sm text-gray-300">Years Experience</div>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                    <h3 className="text-2xl font-bold mb-6">What Makes Us the Best?</h3>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <Star className="w-5 h-5 text-brand-gold mr-3" />
                        <span>5-star rated by 150+ Memphis couples</span>
                      </div>
                      <div className="flex items-center">
                        <Trophy className="w-5 h-5 text-brand-gold mr-3" />
                        <span>Memphis's most experienced wedding DJ</span>
                      </div>
                      <div className="flex items-center">
                        <Award className="w-5 h-5 text-brand-gold mr-3" />
                        <span>Premium equipment & professional MC</span>
                      </div>
                      <div className="flex items-center">
                        <Shield className="w-5 h-5 text-brand-gold mr-3" />
                        <span>Fully licensed, insured & backed up</span>
                      </div>
                      <div className="flex items-center">
                        <Heart className="w-5 h-5 text-brand-gold mr-3" />
                        <span>Personalized service for every couple</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why We're the Best Section */}
        <section className="py-24 bg-white">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 mb-4">Why M10 is Memphis's Best Wedding DJ</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                When Memphis couples search for the best wedding DJ, they consistently choose M10. 
                Here's what sets us apart from other Memphis wedding entertainment options.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {whyBestFeatures.map((feature, index) => (
                <div key={index} className="text-center group">
                  <div className="bg-gray-50 rounded-2xl p-8 h-full hover:shadow-xl transition-all duration-300">
                    <feature.icon className="w-16 h-16 text-brand mx-auto mb-6 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Awards & Recognition Section */}
        <section className="py-24 bg-gray-50">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 mb-4">Awards & Recognition</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Our commitment to excellence has earned recognition from Memphis couples, 
                wedding venues, and industry platforms.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {awards.map((award, index) => (
                <div key={index} className="text-center">
                  <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                    <award.icon className="w-12 h-12 text-brand-gold mx-auto mb-4" />
                    <h3 className="text-lg font-bold mb-2">{award.title}</h3>
                    <p className="text-gray-600 text-sm">{award.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="py-24 bg-white">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 mb-4">M10 vs. Other Memphis Wedding DJs</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                See how M10 DJ Company compares to other Memphis wedding DJ options. 
                We believe in transparency so you can make the best choice for your special day.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-brand text-white p-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="font-semibold">Feature</div>
                    <div className="font-semibold">M10 DJ Company</div>
                    <div className="font-semibold">Other Memphis DJs</div>
                  </div>
                </div>
                
                {competitorComparison.map((item, index) => (
                  <div key={index} className={`grid grid-cols-3 gap-4 p-6 text-center ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                    <div className="font-semibold text-gray-900">{item.feature}</div>
                    <div className="text-green-600 font-semibold">{item.m10}</div>
                    <div className="text-gray-500">{item.others}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center mt-12">
              <button onClick={scrollToContact} className="btn-primary text-lg px-8 py-4">
                Choose Memphis's Best Wedding DJ
                <ChevronRight className="ml-2 w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

        {/* Best Practices Section */}
        <section className="py-24 bg-gray-50">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 mb-4">Our Best-in-Class Process</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                What makes a wedding DJ the "best"? It's our proven process that ensures 
                every Memphis wedding is executed flawlessly from start to finish.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {bestPractices.map((practice, index) => (
                <div key={index} className="bg-white rounded-2xl p-8 shadow-lg">
                  <div className="flex items-center mb-4">
                    <div className="bg-brand text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">
                      {index + 1}
                    </div>
                    <h3 className="text-xl font-bold">{practice.title}</h3>
                  </div>
                  <p className="text-gray-600">{practice.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 bg-gray-900 text-white">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Memphis Couples Agree: We're the Best</h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Don't just take our word for it. See what Memphis brides and grooms say about 
                their experience with the best wedding DJ in Memphis.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  
                  <div className="bg-brand-gold text-black px-4 py-2 rounded-full text-sm font-bold mb-4 inline-block">
                    {testimonial.highlight}
                  </div>
                  
                  <p className="text-gray-300 mb-6 italic">"{testimonial.quote}"</p>
                  
                  <div>
                    <div className="font-bold">{testimonial.name}</div>
                    <div className="text-sm text-brand-gold">{testimonial.venue}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <p className="text-gray-300 mb-6">
                Ready to see why we're consistently rated the best wedding DJ in Memphis?
              </p>
              <Link href="/memphis-wedding-dj-prices-2025" className="btn-outline">
                View Our Memphis Wedding Packages
                <ChevronRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-24 bg-brand text-white">
          <div className="section-container">
            <div className="max-w-4xl mx-auto text-center">
              <Trophy className="w-16 h-16 text-white mx-auto mb-6" />
              <h2 className="text-4xl font-bold mb-6">Book Memphis's Best Wedding DJ Today</h2>
              <p className="text-xl mb-8 opacity-90">
                Join the 500+ Memphis couples who chose the best wedding DJ for their special day. 
                Contact us now for your free consultation and see why we're Memphis's top choice.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <button 
                  onClick={scrollToContact}
                  className="bg-white text-brand hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
                >
                  Get Free Wedding Quote
                  <ChevronRight className="ml-2 w-5 h-5 inline" />
                </button>
                <a href="tel:(901)410-2020" className="border-2 border-white text-white hover:bg-white hover:text-brand px-8 py-4 rounded-lg font-semibold text-lg transition-colors">
                  <Phone className="mr-2 w-5 h-5 inline" />
                  Call Memphis's Best: (901) 410-2020
                </a>
              </div>

              <div className="mt-12 text-center">
                <p className="text-sm opacity-75">
                  Serving Memphis, Germantown, Collierville, Bartlett, and all of Tennessee
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <ContactForm />
      </main>

      <Footer />
    </>
  );
}