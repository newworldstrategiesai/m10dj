import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Lightbulb, 
  Star, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle,
  ChevronRight,
  Sparkles,
  Palette,
  Home,
  Heart,
  Award
} from 'lucide-react';
import Header from '../components/company/Header';
import Footer from '../components/company/Footer';
import ContactForm from '../components/company/ContactForm';
import SEO from '../components/SEO';
import { generateStructuredData } from '../utils/generateStructuredData';
import { scrollToContact } from '../utils/scroll-helpers';

const uplightingPackages = [
  {
    name: "Basic Uplighting",
    price: "$200",
    lights: "4-6 lights",
    ideal: "Small venues, intimate events",
    includes: [
      "4-6 LED uplighting fixtures",
      "Color matching to your theme",
      "Professional setup & breakdown",
      "Remote control operation",
      "Basic color options"
    ]
  },
  {
    name: "Standard Uplighting",
    price: "$350",
    lights: "8-12 lights",
    ideal: "Most weddings and events",
    popular: true,
    includes: [
      "8-12 LED uplighting fixtures",
      "Color matching to your theme",
      "Professional setup & breakdown",
      "Remote control operation",
      "Full color spectrum",
      "Dance floor accent lighting"
    ]
  },
  {
    name: "Premium Uplighting",
    price: "$500",
    lights: "12-16 lights",
    ideal: "Large venues, premium events",
    includes: [
      "12-16 LED uplighting fixtures",
      "Custom color matching",
      "Professional setup & breakdown",
      "Remote control operation",
      "Full color spectrum + effects",
      "Dance floor & wall lighting",
      "Color-changing effects",
      "Music-sync capabilities"
    ]
  }
];

const benefits = [
  {
    icon: Palette,
    title: "Transform Your Venue",
    description: "We've seen it hundreds of times—a venue that looks fine, then uplighting gets added and suddenly it's transformed. The walls glow with your wedding colors, the dance floor has that perfect ambiance, and every photo looks more professional. It's one of the most cost-effective ways to elevate your event's atmosphere."
  },
  {
    icon: Sparkles,
    title: "Professional Quality",
    description: "We use professional-grade LED fixtures that can match any color you can imagine. Whether you want elegant gold uplighting at The Peabody, vibrant purple at a modern venue, or soft white for a classic look, our equipment handles it. Remote control means we can adjust colors throughout the night if needed, and professional installation ensures everything looks perfect."
  },
  {
    icon: Home,
    title: "Memphis Venue Expertise",
    description: "After lighting hundreds of Memphis events, we know the quirks of different venues. The Peabody's ballroom needs different placement than Graceland's chapel. Memphis Botanic Garden's outdoor spaces require weather-resistant equipment. Dixon Gallery has specific power requirements. We've worked at all of them and know how to make each venue look its absolute best."
  },
  {
    icon: Award,
    title: "Easy Add-On",
    description: "Uplighting can be added to any DJ package or rented separately. Perfect for enhancing your existing entertainment."
  }
];

const faqs = [
  {
    question: "What is DJ uplighting in Memphis?",
    answer: "DJ uplighting uses LED light fixtures placed around the perimeter of your venue—typically along walls, columns, or architectural features—to create ambient lighting that matches your color scheme. Instead of harsh overhead lighting or dim, unflattering light, uplighting creates a warm, elegant glow that transforms the entire atmosphere. We've used it at Memphis venues ranging from The Peabody's formal ballrooms to outdoor celebrations at Memphis Botanic Garden, and it works beautifully in both settings. The lights are subtle enough that guests don't notice them directly, but the effect on the overall atmosphere is dramatic."
  },
  {
    question: "How much does wedding uplighting cost in Memphis?",
    answer: "Wedding uplighting in Memphis typically costs $200-$500 depending on the number of lights and package level. Most couples invest $350 for our Standard package with 8-12 lights, which covers most Memphis wedding venues like The Peabody, Graceland, Memphis Botanic Garden, and country clubs. Smaller, more intimate venues might only need 4-6 lights ($200), while large ballrooms or outdoor spaces might need 12-16 lights ($500). We assess each venue during planning to determine the optimal number of fixtures needed for maximum impact."
  },
  {
    question: "Do I need uplighting if I already have a DJ?",
    answer: "Uplighting is an optional enhancement, but it's one of the most impactful add-ons we offer. You don't need it—your event will still be great without it. But once you see the difference it makes in photos and overall atmosphere, most couples wish they'd added it. It's especially valuable at venues with plain walls or less-than-ideal lighting. Many couples add it to their DJ package because it's relatively affordable ($200-$500) compared to the visual impact it creates. We've had couples tell us it was the best $350 they spent on their wedding."
  },
  {
    question: "Can uplighting match my wedding colors?",
    answer: "Yes! Our LED uplighting fixtures offer full color spectrum capabilities—we can match virtually any color you can imagine. We've matched everything from elegant gold and white at formal Peabody weddings to vibrant purple and teal at modern celebrations. Some couples even change colors throughout the night—maybe gold during dinner, then switching to their wedding colors for dancing. We can also create color-changing effects that slowly transition between colors. The key is bringing color swatches or photos of your wedding colors so we can program the exact shade you want."
  },
  {
    question: "Which Memphis venues work best with uplighting?",
    answer: "Uplighting works beautifully at most Memphis venues, but each venue has its own considerations. The Peabody's Grand Ballroom has columns and architectural features that create perfect uplighting opportunities. Graceland's chapel has specific power requirements we know how to work with. Memphis Botanic Garden's outdoor spaces need weather-resistant equipment. Dixon Gallery & Gardens has historic spaces where we need to be careful with placement. Country clubs throughout Germantown and Collierville often have neutral-colored walls that uplighting transforms. We've worked at all of these venues and many more, so we know the specific requirements and best placement strategies for each one. During planning, we'll discuss your venue's layout and determine the optimal number of fixtures and placement."
  },
  {
    question: "When should I decide if I want uplighting?",
    answer: "You can add uplighting at any point, but we recommend deciding during initial planning so we can factor it into your venue assessment and ensure we have the right equipment available. That said, we've added uplighting to events just a few weeks before the date—it's flexible. The main consideration is your venue's power availability and layout, which we'll assess during planning. If you're on the fence, we can show you examples from similar venues to help you decide. Many couples start without it, see examples, and then add it because the visual impact is so significant."
  }
];

export default function DJUplightingMemphis() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const structuredData = generateStructuredData({
    pageType: 'service',
    serviceKey: 'wedding',
    locationKey: 'memphis',
    canonical: '/dj-uplighting-memphis',
    title: 'DJ Uplighting Memphis | Wedding & Event Lighting | M10 DJ Company',
    description: 'Professional DJ uplighting services in Memphis. Transform your venue with elegant LED uplighting. Wedding uplighting packages from $200. Color matching available. Call (901) 410-2020!'
  });

  return (
    <>
      <SEO
        title="DJ Uplighting Memphis | Wedding & Event Lighting | M10 DJ Company"
        description="Professional DJ uplighting services in Memphis. Transform your venue with elegant LED uplighting. Wedding uplighting packages from $200. Color matching available. Same-day quotes! Call (901) 410-2020!"
        keywords={[
          'dj uplighting memphis',
          'wedding uplighting memphis',
          'event uplighting memphis',
          'memphis wedding lighting',
          'uplighting rental memphis',
          'led uplighting memphis',
          'venue lighting memphis'
        ]}
        canonical="/dj-uplighting-memphis"
        jsonLd={structuredData}
      />

      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
          </div>
          
          <div className="section-container relative z-10 pt-16">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex items-center justify-center mb-6">
                <Lightbulb className="w-12 h-12 text-brand-gold mr-3" />
                <span className="text-brand-gold font-semibold text-lg">Professional Uplighting Services</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                <span className="block text-white">DJ Uplighting Memphis</span>
                <span className="block text-gradient">Transform Your Venue with Elegant Lighting</span>
              </h1>
              
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                We've lit up Memphis venues from The Peabody's Grand Ballroom to intimate celebrations at Dixon Gallery & Gardens. 
                Uplighting is one of those details that doesn't seem essential until you see it—then you can't imagine your event without it. 
                It transforms spaces, matches your colors perfectly, and creates that professional, polished look that makes photos pop. 
                Packages from $200.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <button 
                  onClick={scrollToContact}
                  className="btn-primary text-lg px-8 py-4"
                >
                  Get Uplighting Quote
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
                Why Choose Professional Uplighting?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Uplighting is one of those details that separates a good event from a great one. It's not flashy or obvious—guests 
                don't walk in and say 'wow, look at that uplighting.' But they do notice how beautiful the venue looks, how professional 
                everything feels, and how great the photos turn out. That's the power of good uplighting.
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
                Uplighting Packages
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Choose the uplighting package that fits your venue size and event needs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {uplightingPackages.map((pkg, index) => (
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
                        {pkg.lights}
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
                Uplighting FAQ
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
                Ready to Transform Your Venue?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Get a quote for professional uplighting at your Memphis event. Same-day quotes available!
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

