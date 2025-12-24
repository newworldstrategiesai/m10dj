import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Camera, 
  Star, 
  Phone, 
  Mail, 
  CheckCircle,
  ChevronRight,
  Users,
  Image,
  Sparkles,
  Award,
  Gift
} from 'lucide-react';
import Header from '../components/company/Header';
import Footer from '../components/company/Footer';
import ContactForm from '../components/company/ContactForm';
import SEO from '../components/SEO';
import { generateStructuredData } from '../utils/generateStructuredData';
import { scrollToContact } from '../utils/scroll-helpers';

const photoBoothPackages = [
  {
    name: "Classic Photo Booth",
    price: "$500",
    duration: "3 hours",
    ideal: "Small to medium events",
    includes: [
      "Professional photo booth setup",
      "Instant photo prints (2 copies)",
      "Custom backdrop options",
      "Props and accessories",
      "On-site attendant",
      "Digital gallery access",
      "Setup & breakdown"
    ]
  },
  {
    name: "Premium Photo Booth",
    price: "$750",
    duration: "4 hours",
    ideal: "Most weddings and events",
    popular: true,
    includes: [
      "Professional photo booth setup",
      "Instant photo prints (2 copies)",
      "Custom backdrop options",
      "Premium props collection",
      "On-site attendant",
      "Digital gallery access",
      "Custom branding options",
      "Social media sharing",
      "Setup & breakdown"
    ]
  },
  {
    name: "Deluxe Photo Booth",
    price: "$1,000",
    duration: "5 hours",
    ideal: "Large weddings, premium events",
    includes: [
      "Professional photo booth setup",
      "Instant photo prints (unlimited)",
      "Custom backdrop options",
      "Premium props collection",
      "On-site attendant",
      "Digital gallery access",
      "Custom branding options",
      "Social media sharing",
      "Green screen option",
      "Video booth capabilities",
      "Setup & breakdown"
    ]
  }
];

const benefits = [
  {
    icon: Users,
    title: "Guest Entertainment",
    description: "Photo booths keep guests entertained and create lasting memories. Perfect for weddings, corporate events, and parties."
  },
  {
    icon: Gift,
    title: "Instant Keepsakes",
    description: "Guests take home instant photo prints and access digital galleries. Great party favors and social media content."
  },
  {
    icon: Sparkles,
    title: "Custom Branding",
    description: "Add your wedding monogram, company logo, or custom graphics to every photo. Make it uniquely yours."
  },
  {
    icon: Award,
    title: "Professional Setup",
    description: "Full-service photo booth rental with on-site attendant, professional equipment, and seamless integration with your event."
  }
];

const faqs = [
  {
    question: "How much does photo booth rental cost in Memphis?",
    answer: "Photo booth rental in Memphis typically costs $500-$1,000 depending on package level and duration. Most couples invest $750 for our Premium package with 4 hours of coverage, custom branding, and unlimited prints."
  },
  {
    question: "What's included in photo booth rental?",
    answer: "Photo booth rental includes professional setup, instant photo prints, props and accessories, on-site attendant, digital gallery access, and setup/breakdown. Premium packages add custom branding, social media sharing, and extended coverage."
  },
  {
    question: "Can photo booth be added to a DJ package?",
    answer: "Yes! Photo booth rental can be added to any DJ package or rented separately. Many couples combine photo booth with DJ services for complete event entertainment."
  },
  {
    question: "Do you provide props and backdrops?",
    answer: "Yes, all photo booth packages include props, accessories, and backdrop options. Premium packages include custom backdrop options and extensive prop collections."
  },
  {
    question: "How many photos can guests take?",
    answer: "Classic packages include standard photo sessions. Premium and Deluxe packages offer unlimited photos during the rental period. All packages include instant prints and digital gallery access."
  }
];

export default function PhotoBoothRentalMemphis() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const structuredData = generateStructuredData({
    pageType: 'service',
    serviceKey: 'wedding',
    locationKey: 'memphis',
    canonical: '/photo-booth-rental-memphis',
    title: 'Photo Booth Rental Memphis | Wedding & Event Photo Booths | M10 DJ Company',
    description: 'Professional photo booth rental in Memphis. Instant prints, props, custom branding. Wedding photo booth packages from $500. Same-day quotes! Call (901) 410-2020!'
  });

  return (
    <>
      <SEO
        title="Photo Booth Rental Memphis | Wedding & Event Photo Booths | M10 DJ Company"
        description="Professional photo booth rental in Memphis. Instant prints, props, custom branding. Wedding photo booth packages from $500. Same-day quotes! Call (901) 410-2020!"
        keywords={[
          'photo booth rental memphis',
          'wedding photo booth memphis',
          'party photo booth memphis',
          'memphis photo booth rental',
          'event photo booth memphis',
          'photo booth memphis tn'
        ]}
        canonical="/photo-booth-rental-memphis"
        jsonLd={structuredData}
      />

      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-10 w-72 h-72 bg-pink-500 rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
          </div>
          
          <div className="section-container relative z-10 pt-16">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex items-center justify-center mb-6">
                <Camera className="w-12 h-12 text-brand-gold mr-3" />
                <span className="text-brand-gold font-semibold text-lg">Professional Photo Booth Rental</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                <span className="block text-white">Photo Booth Rental Memphis</span>
                <span className="block text-gradient">Instant Memories for Your Event</span>
              </h1>
              
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Professional photo booth rental with instant prints, props, and custom branding. Perfect for weddings, corporate events, and parties. Packages from $500.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <button 
                  onClick={scrollToContact}
                  className="btn-primary text-lg px-8 py-4"
                >
                  Get Photo Booth Quote
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
                Why Add a Photo Booth to Your Event?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Photo booths are one of the most popular event additions, keeping guests entertained and creating lasting memories.
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
                Photo Booth Rental Packages
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Choose the photo booth package that fits your event needs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {photoBoothPackages.map((pkg, index) => (
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
                Photo Booth Rental FAQ
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
                Ready to Add a Photo Booth to Your Event?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Get a quote for photo booth rental at your Memphis event. Same-day quotes available!
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

