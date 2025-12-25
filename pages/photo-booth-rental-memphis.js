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
    description: "Photo booths solve a problem you might not realize you have: keeping guests entertained during lulls in the event. While the DJ is playing dinner music or during cocktail hour, guests head to the photo booth. It's especially popular with kids and teenagers, but we see all ages using it. At corporate events, it breaks the ice and gets people interacting. At weddings, it creates those fun, candid moments that end up being some of the best photos from the night."
  },
  {
    icon: Gift,
    title: "Instant Keepsakes",
    description: "Every photo booth session creates instant prints—usually two copies so guests can keep one and leave one in a guest book or for the couple. But we also provide a digital gallery with all photos, so guests can download and share on social media. This means your event gets organic social media coverage throughout the night, and you get a collection of fun, candid photos that are often more entertaining than the formal photographer's shots."
  },
  {
    icon: Sparkles,
    title: "Custom Branding",
    description: "We can add your wedding monogram, company logo, or custom graphics to every photo. This is especially popular for corporate events where companies want their logo on every photo for brand visibility, and for weddings where couples want their names or wedding date on each print. It's a small detail that makes the photos feel more personalized and professional."
  },
  {
    icon: Award,
    title: "Professional Setup",
    description: "We provide a full-service photo booth experience—we bring the equipment, set it up, provide an on-site attendant to help guests and keep things running smoothly, and handle all breakdown. The attendant is key because they help guests use the booth, manage props, troubleshoot any issues, and ensure the equipment stays working throughout your event. You don't have to worry about anything—we handle it all."
  }
];

const faqs = [
  {
    question: "How much does photo booth rental cost in Memphis?",
    answer: "Photo booth rental in Memphis typically costs $500-$1,000 depending on package level and duration. Most couples invest $750 for our Premium package with 4 hours of coverage, custom branding, and unlimited prints. The Classic package ($500) works well for shorter events or smaller celebrations, while the Deluxe package ($1,000) adds green screen options and video capabilities for premium events. The 4-hour Premium package usually covers most of the reception, which is when photo booths get the most use. We've set up photo booths at venues throughout Memphis, from The Peabody to backyard celebrations, and the pricing is consistent regardless of venue."
  },
  {
    question: "What's included in photo booth rental?",
    answer: "Photo booth rental includes professional setup (we arrive early to set everything up before guests arrive), instant photo prints (usually 2 copies per session), props and accessories (we bring a collection of fun props that guests love), on-site attendant (someone to help guests, manage props, and keep everything running smoothly), digital gallery access (all photos available for download after the event), and setup/breakdown (we handle everything). Premium packages add custom branding (your logo or monogram on every photo), social media sharing capabilities (guests can share directly to social media), and extended coverage (longer rental periods). The on-site attendant is crucial—they ensure the booth stays working, help guests who aren't familiar with photo booths, and keep the props organized."
  },
  {
    question: "Can photo booth be added to a DJ package?",
    answer: "Yes! Photo booth rental can be added to any DJ package or rented separately. Many couples combine photo booth with DJ services for complete event entertainment. When you book both together, we can coordinate timing—maybe the photo booth is especially active during dinner when the DJ is playing background music, or we can announce photo booth availability during certain songs. We've also had couples rent photo booths for events where they're handling music themselves, or for corporate events where they just want the photo booth. It's completely flexible."
  },
  {
    question: "Do you provide props and backdrops?",
    answer: "Yes, all photo booth packages include props, accessories, and backdrop options. We bring a collection of fun props—silly hats, glasses, signs, boas, and other accessories that guests love using. Premium packages include more extensive prop collections and custom backdrop options. Some couples provide their own props that match their theme (like cowboy hats for a western theme, or specific signs they've made), and we're happy to incorporate those. The backdrop options range from simple, elegant backdrops to custom-designed ones that match your wedding colors or theme."
  },
  {
    question: "How many photos can guests take?",
    answer: "Classic packages include standard photo sessions (guests can take photos throughout the rental period, but there might be limits on how many sessions per hour). Premium and Deluxe packages offer unlimited photos during the rental period—guests can use it as much as they want. All packages include instant prints (usually 2 copies per session) and digital gallery access (all photos available for download after the event). The unlimited option is popular because it means guests don't have to worry about 'using up' the photo booth—they can go back multiple times throughout the night. We've seen guests at weddings use the photo booth 3-4 times throughout the evening as the party energy changes."
  },
  {
    question: "Where should the photo booth be placed at my venue?",
    answer: "Photo booth placement depends on your venue layout, but we generally recommend placing it in a visible but not intrusive location. Near the dance floor works well because guests can see it and are reminded to use it. In a separate area like a cocktail space or near the bar also works—it gives guests something to do during cocktail hour or dinner. We need access to power and enough space for the booth, props table, and a small line of guests. We'll discuss placement during planning and can visit your venue if needed to determine the best spot. We've set up photo booths at Memphis venues ranging from The Peabody's ballroom to backyard celebrations, and we know how to work with different space constraints."
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
                Photo booths are one of those additions that seem optional until you see how much guests love them. We've set up photo 
                booths at weddings across Memphis—from elegant Peabody celebrations to backyard parties in Germantown. Guests line up 
                for them, they create instant party favors, and they generate social media content throughout your event. Plus, you get 
                a digital gallery of all the fun, candid moments. Packages from $500.
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
                Photo booths have become a standard at Memphis weddings and events, and for good reason. They're one of the few 
                additions that guests actively seek out and use throughout the night. Unlike some entertainment options that guests 
                might ignore, photo booths create a line—and that's a good thing. It means people are engaged, having fun, and 
                creating memories.
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

