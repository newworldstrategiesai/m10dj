import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Sparkles, 
  Star, 
  Phone, 
  Mail, 
  CheckCircle,
  ChevronRight,
  Zap,
  Shield,
  Award,
  Flame
} from 'lucide-react';
import Header from '../components/company/Header';
import Footer from '../components/company/Footer';
import ContactForm from '../components/company/ContactForm';
import SEO from '../components/SEO';
import { generateStructuredData } from '../utils/generateStructuredData';
import { scrollToContact } from '../utils/scroll-helpers';

const coldSparkPackages = [
  {
    name: "Single Machine",
    price: "$500",
    duration: "Up to 3 activations",
    ideal: "Grand entrances, first dance",
    includes: [
      "1 cold spark machine",
      "Professional setup & operation",
      "Indoor-safe spark effects",
      "Remote control operation",
      "Setup & breakdown"
    ]
  },
  {
    name: "Dual Machine Package",
    price: "$750",
    duration: "Up to 5 activations",
    ideal: "Most weddings and events",
    popular: true,
    includes: [
      "2 cold spark machines",
      "Professional setup & operation",
      "Enhanced spark effects",
      "Remote control operation",
      "Synchronized activation",
      "Setup & breakdown"
    ]
  },
  {
    name: "Premium Spark Package",
    price: "$1,000",
    duration: "Unlimited activations",
    ideal: "Premium events, multiple moments",
    includes: [
      "3-4 cold spark machines",
      "Professional setup & operation",
      "Maximum spark effects",
      "Remote control operation",
      "Synchronized activation",
      "Multiple activation points",
      "Setup & breakdown"
    ]
  }
];

const benefits = [
  {
    icon: Sparkles,
    title: "Indoor-Safe Special Effects",
    description: "Cold spark machines create dramatic spark effects that are completely safe for indoor use. No heat, no fire risk, just stunning visual impact."
  },
  {
    icon: Zap,
    title: "Grand Entrance Moments",
    description: "Perfect for grand entrances, first dances, cake cutting, and other special moments. Creates unforgettable photo and video opportunities."
  },
  {
    icon: Shield,
    title: "Venue-Approved",
    description: "Cold spark machines are approved for use at most Memphis venues including The Peabody, Graceland, and premier event spaces."
  },
  {
    icon: Award,
    title: "Professional Operation",
    description: "Our team handles all setup, operation, and breakdown. Remote control activation ensures perfect timing for your special moments."
  }
];

const faqs = [
  {
    question: "What are cold spark machines?",
    answer: "Cold spark machines create dramatic spark effects using titanium particles that produce bright, safe sparks without heat or fire risk. They're perfect for indoor events and create stunning visual effects for grand entrances, first dances, and special moments."
  },
  {
    question: "How much do cold spark machines cost in Memphis?",
    answer: "Cold spark machine rental in Memphis typically costs $500-$1,000 depending on the number of machines and activations. Most couples invest $750 for our Dual Machine package with 2 machines and up to 5 activations."
  },
  {
    question: "Are cold spark machines safe for indoor use?",
    answer: "Yes! Cold spark machines are completely safe for indoor use. They produce sparks without heat, making them safe for venues, guests, and decorations. They're approved for use at most Memphis event venues."
  },
  {
    question: "When are cold spark machines typically used?",
    answer: "Cold spark machines are perfect for grand entrances, first dances, cake cutting, bouquet toss, and other special moments. They create dramatic photo and video opportunities that make your event unforgettable."
  },
  {
    question: "Can cold spark machines be added to a DJ package?",
    answer: "Yes! Cold spark machines can be added to any DJ package or rented separately. Many couples combine cold spark effects with DJ services and uplighting for a complete premium entertainment experience."
  }
];

export default function ColdSparksMemphis() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const structuredData = generateStructuredData({
    pageType: 'service',
    serviceKey: 'wedding',
    locationKey: 'memphis',
    canonical: '/cold-sparks-memphis',
    title: 'Cold Spark Machines Memphis | Wedding Special Effects | M10 DJ Company',
    description: 'Professional cold spark machine rental in Memphis. Indoor-safe spark effects for grand entrances and special moments. Packages from $500. Same-day quotes! Call (901) 410-2020!'
  });

  return (
    <>
      <SEO
        title="Cold Spark Machines Memphis | Wedding Special Effects | M10 DJ Company"
        description="Professional cold spark machine rental in Memphis. Indoor-safe spark effects for grand entrances and special moments. Packages from $500. Same-day quotes! Call (901) 410-2020!"
        keywords={[
          'cold spark machines memphis',
          'wedding spark machines memphis',
          'cold sparks memphis',
          'memphis wedding special effects',
          'indoor spark effects memphis',
          'grand entrance effects memphis'
        ]}
        canonical="/cold-sparks-memphis"
        jsonLd={structuredData}
      />

      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500 rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-500 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
          </div>
          
          <div className="section-container relative z-10 pt-16">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex items-center justify-center mb-6">
                <Sparkles className="w-12 h-12 text-brand-gold mr-3" />
                <span className="text-brand-gold font-semibold text-lg">Professional Special Effects</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                <span className="block text-white">Cold Spark Machines Memphis</span>
                <span className="block text-gradient">Dramatic Indoor-Safe Spark Effects</span>
              </h1>
              
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Professional cold spark machine rental for grand entrances and special moments. Indoor-safe, venue-approved, and completely stunning. Packages from $500.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <button 
                  onClick={scrollToContact}
                  className="btn-primary text-lg px-8 py-4"
                >
                  Get Cold Spark Quote
                  <ChevronRight className="ml-2 w-5 h-5" />
                </button>
                <a href="tel:+19014102020" className="btn-outline text-lg px-8 py-4">
                  <Phone className="mr-2 w-5 h-5" />
                  Call (901) 410-2020
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 bg-white dark:bg-black">
          <div className="section-container">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
                Why Choose Cold Spark Machines?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Create unforgettable moments with indoor-safe spark effects that add drama and excitement to your event.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {benefits.map((benefit, index) => (
                <div key={index} className="modern-card">
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-gradient-to-br from-brand to-amber-500 text-white rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                      <benefit.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {benefit.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Packages Section */}
        <section className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="section-container">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
                Cold Spark Machine Packages
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Choose the cold spark package that fits your event needs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {coldSparkPackages.map((pkg, index) => (
                <div 
                  key={index}
                  className={`modern-card relative overflow-hidden ${pkg.popular ? 'ring-2 ring-brand ring-offset-4' : ''}`}
                >
                  {pkg.popular && (
                    <div className="absolute top-0 right-0 bg-brand text-white px-4 py-2 rounded-bl-lg font-semibold text-sm">
                      Most Popular
                    </div>
                  )}
                  
                  <div className="p-8">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {pkg.name}
                      </h3>
                      <div className="text-4xl font-bold text-brand mb-2">
                        {pkg.price}
                      </div>
                      <div className="text-gray-600 dark:text-gray-300 mb-2">
                        {pkg.duration}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {pkg.ideal}
                      </p>
                    </div>

                    <ul className="space-y-3">
                      {pkg.includes.map((item, i) => (
                        <li key={i} className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-brand mr-3 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 dark:text-gray-300">{item}</span>
                        </li>
                      ))}
                    </ul>

                    <button 
                      onClick={scrollToContact}
                      className={`w-full mt-6 py-3 px-6 rounded-lg font-semibold transition-colors ${
                        pkg.popular 
                          ? 'bg-brand text-white hover:bg-amber-600' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      Get Quote
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-white dark:bg-black">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-gray-900 dark:text-white">
                Cold Spark Machines FAQ
              </h2>
              
              <div className="space-y-6">
                {faqs.map((faq, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                      {faq.question}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="contact" className="py-16 bg-gradient-to-br from-brand/10 to-amber-50/30 dark:from-black dark:to-black">
          <div className="section-container">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-white">
                Ready to Add Cold Spark Effects?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Get a quote for cold spark machines at your Memphis event. Same-day quotes available!
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
                  <ContactForm />
                </div>
                
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <Phone className="w-6 h-6 text-brand mr-3" />
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Call Us</h3>
                    </div>
                    <a href="tel:+19014102020" className="text-2xl font-bold text-brand hover:text-amber-600 transition-colors">
                      (901) 410-2020
                    </a>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                    <Link href="/memphis-wedding-dj" className="text-brand hover:text-amber-600 font-semibold inline-flex items-center">
                      View Wedding DJ Services <ChevronRight className="ml-2 w-5 h-5" />
                    </Link>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                    <Link href="/wedding-dj-packages-memphis" className="text-brand hover:text-amber-600 font-semibold inline-flex items-center">
                      View Wedding Packages <ChevronRight className="ml-2 w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

