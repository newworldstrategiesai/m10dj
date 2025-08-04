import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  CheckCircle, 
  AlertTriangle, 
  Star, 
  Music, 
  Mic2, 
  Volume2, 
  Users, 
  Calendar,
  Award,
  Heart,
  Phone
} from 'lucide-react';
import Header from '../../components/company/Header';
import Footer from '../../components/company/Footer';
import ContactForm from '../../components/company/ContactForm';
import SEO from '../../components/SEO';

export default function HowToChooseWeddingDJMemphis() {
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    // Add any tracking or analytics here
  }, []);

  const keywords = [
    "how to choose a wedding DJ Memphis",
    "choosing wedding DJ Memphis",
    "wedding DJ selection Memphis",
    "best wedding DJ Memphis",
    "professional wedding DJ Memphis",
    "Memphis wedding DJ tips",
    "wedding DJ checklist Memphis",
    "hiring wedding DJ Memphis",
    "wedding DJ questions Memphis",
    "Memphis wedding entertainment guide"
  ];

  const selectionCriteria = [
    {
      icon: Volume2,
      title: "Professional Equipment & Sound Quality",
      description: "A true professional DJ invests in high-quality sound equipment that can fill any venue without distortion.",
      details: [
        "Professional-grade speakers and amplifiers",
        "Wireless microphone systems for clear announcements",
        "Backup equipment for every critical component",
        "Sound level management for different venue sizes",
        "Clear, distortion-free audio at all volume levels"
      ],
      warning: "Many 'wannabe wedding DJs' lack the proper equipment for professional sound quality."
    },
    {
      icon: Mic2,
      title: "Polished MC Skills & Announcements",
      description: "Your DJ should be an experienced master of ceremonies who can guide your wedding smoothly.",
      details: [
        "Clear, professional speaking voice",
        "Experience with wedding timeline coordination",
        "Ability to make smooth transitions between events",
        "Comfortable speaking to crowds of all sizes",
        "Knowledge of proper wedding etiquette and traditions"
      ],
      warning: "Poor MC skills can make your wedding feel disjointed and unprofessional."
    },
    {
      icon: Users,
      title: "Crowd Reading & Music Selection",
      description: "The best DJs know how to read the room and adjust music to keep everyone dancing.",
      details: [
        "Ability to gauge crowd energy and respond accordingly",
        "Extensive music library across all genres and eras",
        "Experience mixing different musical tastes for all ages",
        "Skill in building energy throughout the night",
        "Knowledge of Memphis music culture and preferences"
      ],
      warning: "A DJ who can't read the crowd will leave your dance floor empty."
    },
    {
      icon: Calendar,
      title: "Experience & Professionalism",
      description: "Seasoned professionals have handled every wedding scenario and can adapt to any situation.",
      details: [
        "Years of experience with Memphis weddings",
        "Professional contracts and liability insurance",
        "Reliable communication throughout planning process",
        "Punctuality and professional appearance",
        "References from recent Memphis weddings"
      ],
      warning: "Inexperienced DJs may not be prepared for unexpected challenges."
    }
  ];

  const redFlags = [
    {
      icon: AlertTriangle,
      title: "No Professional Equipment",
      description: "Avoid DJs who use consumer-grade equipment or don't have backup systems."
    },
    {
      icon: AlertTriangle,
      title: "Poor Communication",
      description: "If they're hard to reach during planning, they may not be reliable on your wedding day."
    },
    {
      icon: AlertTriangle,
      title: "No References or Reviews",
      description: "Professional DJs should have plenty of recent Memphis wedding references."
    },
    {
      icon: AlertTriangle,
      title: "Unrealistic Pricing",
      description: "Extremely low prices often indicate inexperience or inadequate equipment."
    }
  ];

  const questionsToAsk = [
    "How many Memphis weddings have you performed in the last year?",
    "Can you provide references from recent Memphis weddings?",
    "What backup equipment do you bring to every event?",
    "How do you handle song requests from guests?",
    "What's your experience with my specific venue?",
    "How far in advance do we finalize the music timeline?",
    "Do you have liability insurance and professional contracts?",
    "What happens if you become ill on my wedding day?",
    "How do you coordinate with other vendors (photographers, planners)?",
    "Can you provide ceremony music and wireless microphones?"
  ];

  return (
    <>
      <SEO
        title="How to Choose the Right Wedding DJ in Memphis 2025 | Expert Guide | M10 DJ Company"
        description="Complete guide to choosing the perfect wedding DJ in Memphis. Learn what to look for, questions to ask, and red flags to avoid. Expert tips from Memphis wedding professionals with 15+ years experience."
        keywords={keywords}
        canonical="/blog/how-to-choose-wedding-dj-memphis-2025"
      />

      <Header />

      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-10 w-72 h-72 bg-brand-gold rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-gold rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
          </div>
          
          <div className="section-container relative z-10 text-center">
            <div className="max-w-4xl mx-auto">
              <h1 className="heading-1 mb-6">
                <span className="block text-white">How to Choose the Right</span>
                <span className="block text-brand-gold">Wedding DJ in Memphis</span>
              </h1>
              
              <p className="text-xl md:text-2xl mb-8 leading-relaxed text-white/90">
                Your complete guide to finding the perfect wedding DJ in Memphis. Learn what separates 
                true professionals from the rest, with expert insights from 15+ years of Memphis weddings.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Link 
                  href="/memphis-wedding-dj"
                  className="btn-primary bg-white text-brand hover:bg-gray-100 px-8 py-4"
                >
                  Explore Our Services
                </Link>
                <a href="tel:9014102020" className="btn-outline border-white text-white hover:bg-white hover:text-brand px-8 py-4">
                  Call (901) 410-2020
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Introduction */}
        <section className="py-16 bg-white">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-12">
                <div className="flex">
                  <AlertTriangle className="h-6 w-6 text-yellow-400 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">Why This Guide Matters</h3>
                    <p className="text-yellow-700">
                      Many couples discover too late that their "budget DJ" lacks professional equipment, 
                      experience, or skills. Don't let poor DJ selection ruin your special day. This guide 
                      helps you identify true professionals from inexperienced operators.
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center mb-12">
                <h2 className="heading-2 mb-6 text-gray-900">What Makes a Professional Wedding DJ?</h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  After performing at 500+ Memphis weddings, we've learned what separates exceptional DJs 
                  from the rest. Here are the four essential criteria every Memphis couple should evaluate.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Selection Criteria */}
        <section className="py-16 bg-gray-50">
          <div className="section-container">
            <div className="max-w-6xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-8">
                {selectionCriteria.map((criteria, index) => (
                  <div key={index} className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <criteria.icon className="h-8 w-8 text-brand" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">{criteria.title}</h3>
                        <p className="text-gray-600 mb-4">{criteria.description}</p>
                        
                        <ul className="space-y-2 mb-4">
                          {criteria.details.map((detail, idx) => (
                            <li key={idx} className="flex items-start space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                              <span className="text-sm text-gray-600">{detail}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="bg-red-50 border-l-4 border-red-400 p-3">
                          <p className="text-sm text-red-700">
                            <strong>Warning:</strong> {criteria.warning}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Red Flags Section */}
        <section className="py-16 bg-white">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="heading-2 mb-6 text-gray-900">Red Flags to Avoid</h2>
                <p className="text-lg text-gray-600">
                  Watch out for these warning signs when evaluating Memphis wedding DJs.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {redFlags.map((flag, index) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-start space-x-4">
                      <flag.icon className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="text-lg font-semibold text-red-900 mb-2">{flag.title}</h3>
                        <p className="text-red-700">{flag.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Questions to Ask */}
        <section className="py-16 bg-gray-50">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="heading-2 mb-6 text-gray-900">Essential Questions to Ask Every DJ</h2>
                <p className="text-lg text-gray-600">
                  Use this checklist when interviewing potential wedding DJs in Memphis.
                </p>
              </div>

              <div className="bg-white rounded-lg p-8 shadow-sm">
                <div className="grid md:grid-cols-2 gap-4">
                  {questionsToAsk.map((question, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-brand text-white rounded-full flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </div>
                      <p className="text-gray-700">{question}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Memphis-Specific Tips */}
        <section className="py-16 bg-white">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="heading-2 mb-6 text-gray-900">Memphis-Specific Considerations</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Venue Experience Matters</h3>
                    <p className="text-gray-600 mb-4">
                      Choose a DJ familiar with popular Memphis venues like The Peabody Hotel, 
                      Memphis Botanic Garden, or Dixon Gallery & Gardens. Venue experience means 
                      they understand acoustics, setup requirements, and logistics.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Local Music Culture</h3>
                    <p className="text-gray-600">
                      Memphis has a rich musical heritage. Your DJ should understand local preferences 
                      and be able to incorporate Memphis music traditions when appropriate, from blues 
                      and soul to modern Southern favorites.
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Seasonal Considerations</h3>
                    <p className="text-gray-600 mb-4">
                      Memphis weather can be unpredictable. Ensure your DJ has experience with 
                      outdoor events and backup plans for weather changes, especially for 
                      spring and fall weddings.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Vendor Network</h3>
                    <p className="text-gray-600">
                      Established Memphis DJs work regularly with local photographers, planners, 
                      and caterers. This network ensures smooth coordination and better overall 
                      wedding execution.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose M10 DJ */}
        <section className="py-16 bg-brand text-white">
          <div className="section-container">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="heading-2 mb-6">Why Memphis Couples Choose M10 DJ Company</h2>
              <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
                We meet every criterion in this guide and more. With 15+ years serving Memphis couples 
                and 500+ successful weddings, we're the trusted choice for discerning couples.
              </p>

              <div className="grid md:grid-cols-3 gap-8 mb-12">
                <div className="text-center">
                  <Award className="h-12 w-12 text-white mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">15+ Years Experience</h3>
                  <p className="text-white/80">Serving Memphis couples since 2009</p>
                </div>
                
                <div className="text-center">
                  <Star className="h-12 w-12 text-white mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">500+ Weddings</h3>
                  <p className="text-white/80">Proven track record of success</p>
                </div>
                
                <div className="text-center">
                  <Heart className="h-12 w-12 text-white mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">5-Star Service</h3>
                  <p className="text-white/80">Consistently rated by Memphis couples</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/memphis-wedding-dj"
                  className="bg-white text-brand hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
                >
                  Learn About Our Services
                </Link>
                <a 
                  href="tel:9014102020" 
                  className="border-2 border-white text-white hover:bg-white hover:text-brand px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
                >
                  Call (901) 410-2020
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Related Articles */}
        <section className="py-16 bg-gray-50">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              <h2 className="heading-2 text-center mb-12 text-gray-900">Related Wedding Planning Resources</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <Link 
                  href="/blog/memphis-dj-cost-pricing-guide-2025"
                  className="bg-white rounded-lg p-6 hover:shadow-md transition-shadow group"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-brand">
                    Memphis DJ Cost & Pricing Guide 2025
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Complete breakdown of wedding DJ costs in Memphis, including what affects pricing and how to budget.
                  </p>
                </Link>

                <Link 
                  href="/memphis-wedding-dj-prices-2025"
                  className="bg-white rounded-lg p-6 hover:shadow-md transition-shadow group"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-brand">
                    Memphis Wedding DJ Packages
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Explore our wedding DJ packages designed specifically for Memphis couples and venues.
                  </p>
                </Link>

                <Link 
                  href="/blog/memphis-wedding-songs-2025"
                  className="bg-white rounded-lg p-6 hover:shadow-md transition-shadow group"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-brand">
                    Best Memphis Wedding Songs 2025
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Popular wedding songs and Memphis favorites for your ceremony, reception, and special dances.
                  </p>
                </Link>

                <Link 
                  href="/best-wedding-dj-memphis"
                  className="bg-white rounded-lg p-6 hover:shadow-md transition-shadow group"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-brand">
                    Best Wedding DJ Memphis
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Why M10 DJ Company is consistently rated as Memphis's top choice for wedding entertainment.
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-white">
          <div className="section-container">
            <div className="text-center mb-12">
              <h2 className="heading-2 mb-6 text-gray-900">Ready to Find Your Perfect Memphis Wedding DJ?</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Don't leave your wedding entertainment to chance. Contact M10 DJ Company today 
                for a consultation with Memphis's most trusted wedding DJs.
              </p>
            </div>

            <ContactForm />
          </div>
        </section>
      </main>

      <Footer />
      
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "How to Choose the Right Wedding DJ in Memphis 2025",
            "description": "Complete guide to choosing the perfect wedding DJ in Memphis. Learn what to look for, questions to ask, and red flags to avoid.",
            "author": {
              "@type": "Organization",
              "name": "M10 DJ Company"
            },
            "publisher": {
              "@type": "Organization",
              "name": "M10 DJ Company",
              "logo": {
                "@type": "ImageObject",
                "url": "https://www.m10djcompany.com/logo-static.jpg"
              }
            },
            "datePublished": "2025-01-04",
            "dateModified": "2025-01-04",
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": "https://www.m10djcompany.com/blog/how-to-choose-wedding-dj-memphis-2025"
            }
          })
        }}
      />
    </>
  );
}