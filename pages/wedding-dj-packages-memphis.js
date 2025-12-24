import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Heart, 
  Star, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle,
  ChevronRight,
  Clock,
  Music,
  Users,
  Award,
  Sparkles,
  Zap,
  DollarSign
} from 'lucide-react';
import Header from '../components/company/Header';
import Footer from '../components/company/Footer';
import ContactForm from '../components/company/ContactForm';
import SEO from '../components/SEO';
import { generateStructuredData } from '../utils/generateStructuredData';
import { weddingPackages, ceremonyAudioAddon, generateProductSchema } from '../utils/aiFriendlyPackages';
import { scrollToContact } from '../utils/scroll-helpers';

const packages = [
  {
    name: "Essential Wedding Package",
    price: "$799",
    duration: "6 hours",
    ideal: "Intimate weddings (50-100 guests)",
    popular: false,
    includes: [
      "Professional wedding DJ for 6 hours",
      "Ceremony sound system setup",
      "Reception DJ services",
      "Wireless microphones (2)",
      "Basic uplighting package (4-6 lights)",
      "Music consultation meeting",
      "Memphis venue coordination",
      "Professional setup & breakdown"
    ],
    addons: [
      "Additional hour: $150",
      "Enhanced uplighting: $200",
      "Ceremony audio only: $300"
    ]
  },
  {
    name: "Premium Wedding Package",
    price: "$1,299",
    duration: "8 hours",
    ideal: "Most Memphis weddings (100-200 guests)",
    popular: true,
    includes: [
      "Professional wedding DJ for 8 hours",
      "Ceremony & cocktail hour music",
      "Complete reception DJ services",
      "Wireless microphones (4)",
      "Premium uplighting design (8-12 lights)",
      "Dance floor lighting effects",
      "Detailed music consultation",
      "Professional MC services",
      "Memphis venue coordination",
      "Backup equipment included",
      "Online planning portal"
    ],
    addons: [
      "Additional hour: $150",
      "Photo booth rental: $500",
      "Cold spark machines: $500",
      "Monogram projection: $300"
    ]
  },
  {
    name: "Luxury Wedding Package",
    price: "$1,899",
    duration: "Up to 10 hours",
    ideal: "Premium weddings (150+ guests)",
    popular: false,
    includes: [
      "Premium wedding DJ up to 10 hours",
      "Ceremony, cocktail & reception coverage",
      "Professional sound system with backup",
      "Wireless microphones (6)",
      "Custom uplighting design (12-16 lights)",
      "Special effects lighting",
      "Complete music consultation",
      "Professional MC services",
      "Memphis venue coordination",
      "Backup DJ & equipment",
      "Custom monogram projection",
      "Online planning portal",
      "Post-event consultation"
    ],
    addons: [
      "Photo booth rental: $500",
      "Cold spark machines: $500",
      "Additional lighting effects: $200"
    ]
  }
];

const faqs = [
  {
    question: "What's included in wedding DJ packages in Memphis?",
    answer: "Our wedding DJ packages include professional DJ services, sound systems, wireless microphones, lighting packages, MC services, music consultation, venue coordination, and setup/breakdown. Premium packages add extended coverage, enhanced lighting, backup equipment, and additional features."
  },
  {
    question: "How much do wedding DJ packages cost in Memphis?",
    answer: "Wedding DJ packages in Memphis typically range from $799-$1,899 depending on package level, event duration, and included services. Most couples invest $1,299 for our Premium package which includes 8 hours of coverage, uplighting, and all essential services."
  },
  {
    question: "What's the difference between Essential and Premium wedding DJ packages?",
    answer: "Essential packages ($799) include 6 hours of coverage with basic services. Premium packages ($1,299) include 8 hours, enhanced lighting, more microphones, backup equipment, and professional MC services. Luxury packages ($1,899) add extended coverage, custom lighting design, and premium features."
  },
  {
    question: "Do wedding DJ packages include ceremony music?",
    answer: "Yes, all our wedding DJ packages include ceremony sound system setup. Premium and Luxury packages include complete ceremony music coordination, processional/recessional music, and cocktail hour entertainment."
  },
  {
    question: "Can I customize a wedding DJ package?",
    answer: "Absolutely! We work with couples to customize packages based on their specific needs, venue requirements, and budget. Add-ons like photo booths, cold spark machines, and additional lighting can be added to any package."
  }
];

export default function WeddingDJPackagesMemphis() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Generate Service schema for the page
  const serviceStructuredData = generateStructuredData({
    pageType: 'service',
    serviceKey: 'wedding',
    locationKey: 'memphis',
    canonical: '/wedding-dj-packages-memphis',
    title: 'Wedding DJ Packages in Memphis | Transparent Pricing | M10 DJ Company',
    description: 'Wedding DJ packages in Memphis with transparent pricing. Essential ($799), Premium ($1,299), and Luxury ($1,899) packages. All-inclusive pricing for Memphis weddings. Call (901) 410-2020!'
  });

  // Generate Product schema for each package and addon
  const allPackages = [...weddingPackages, ceremonyAudioAddon];
  const productSchemas = allPackages.map(pkg => generateProductSchema(pkg));
  
  // Combine Service schema with Product schemas
  // Service schema is already an array, so we add Product schemas to it
  const structuredData = Array.isArray(serviceStructuredData) 
    ? [...serviceStructuredData, ...productSchemas]
    : [serviceStructuredData, ...productSchemas];

  return (
    <>
      <SEO
        title="Wedding DJ Packages in Memphis | Transparent Pricing | M10 DJ Company"
        description="Wedding DJ packages in Memphis with transparent pricing. Essential ($799), Premium ($1,299), and Luxury ($1,899) packages. All-inclusive pricing for Memphis weddings. Same-day quotes! Call (901) 410-2020!"
        keywords={[
          'wedding dj packages memphis',
          'wedding dj pricing memphis',
          'memphis wedding dj packages',
          'wedding dj cost memphis',
          'memphis wedding dj prices',
          'wedding entertainment packages memphis',
          'wedding dj package prices memphis'
        ]}
        canonical="/wedding-dj-packages-memphis"
        jsonLd={structuredData}
      />

      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-10 w-72 h-72 bg-brand-gold rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-gold rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
          </div>
          
          <div className="section-container relative z-10 pt-16">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                <span className="block text-white">Wedding DJ Packages</span>
                <span className="block text-gradient">Transparent Pricing in Memphis, TN</span>
              </h1>
              
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                All-inclusive wedding DJ packages with transparent pricing. No hidden fees. Choose the package that fits your Memphis wedding perfectly.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <button 
                  onClick={scrollToContact}
                  className="btn-primary text-lg px-8 py-4"
                >
                  Get Your Free Quote
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

        {/* Packages Section */}
        <section className="py-16 bg-white dark:bg-black">
          <div className="section-container">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
                Choose Your Wedding DJ Package
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Transparent pricing with no hidden fees. All packages include professional DJ services, equipment, and setup.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {packages.map((pkg, index) => (
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
                      <div className="text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2">
                        <Clock className="w-4 h-4" />
                        {pkg.duration}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        {pkg.ideal}
                      </p>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {pkg.includes.map((item, i) => (
                        <li key={i} className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-brand mr-3 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 dark:text-gray-300">{item}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Popular Add-Ons:</p>
                      <ul className="space-y-1">
                        {pkg.addons.map((addon, i) => (
                          <li key={i} className="text-sm text-gray-600 dark:text-gray-400">
                            • {addon}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button 
                      onClick={scrollToContact}
                      className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                        pkg.popular 
                          ? 'bg-brand text-white hover:bg-amber-600' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      Get Quote for {pkg.name}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Our Packages */}
        <section className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-gray-900 dark:text-white">
                Why Choose M10 DJ Company Packages?
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-black rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <DollarSign className="w-8 h-8 text-brand mr-3" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Transparent Pricing</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    No hidden fees or surprise charges. What you see is what you pay. All packages include setup, breakdown, and basic coordination.
                  </p>
                </div>

                <div className="bg-white dark:bg-black rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Award className="w-8 h-8 text-brand mr-3" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">15+ Years Experience</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    We've DJed 500+ Memphis weddings and know what works at local venues. Our experience ensures your wedding runs smoothly.
                  </p>
                </div>

                <div className="bg-white dark:bg-black rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Zap className="w-8 h-8 text-brand mr-3" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Backup Equipment</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    All packages include backup equipment. We never leave you without music, even if something goes wrong.
                  </p>
                </div>

                <div className="bg-white dark:bg-black rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <MapPin className="w-8 h-8 text-brand mr-3" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Memphis Venue Expertise</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    We know The Peabody, Graceland, Memphis Botanic Garden, and 27+ premier venues. We understand their acoustics and requirements.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-white dark:bg-black">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-gray-900 dark:text-white">
                Wedding DJ Packages FAQ
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
                Ready to Choose Your Wedding DJ Package?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Get a personalized quote for your Memphis wedding. Same-day quotes available!
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
                    <div className="flex items-center mb-4">
                      <Mail className="w-6 h-6 text-brand mr-3" />
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Email Us</h3>
                    </div>
                    <a href="mailto:info@m10djcompany.com" className="text-lg text-brand hover:text-amber-600 transition-colors break-all">
                      info@m10djcompany.com
                    </a>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                    <Link href="/memphis-wedding-dj" className="text-brand hover:text-amber-600 font-semibold inline-flex items-center">
                      View Full Wedding DJ Services <ChevronRight className="ml-2 w-5 h-5" />
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

