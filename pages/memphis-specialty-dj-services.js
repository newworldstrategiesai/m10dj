import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Music, 
  Heart, 
  Star, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Users,
  Award,
  CheckCircle,
  GraduationCap,
  Cake,
  PartyPopper,
  Sparkles
} from 'lucide-react';
import Header from '../components/company/Header';
import Footer from '../components/company/Footer';
import ContactForm from '../components/company/ContactForm';
import SEO from '../components/SEO';
import KeywordSchema from '../components/KeywordSchema';
import { scrollToContact } from '../utils/scroll-helpers';

const specialtyServices = [
  {
    icon: GraduationCap,
    title: "School Dance DJ Memphis",
    description: "Professional DJ services for proms, homecoming, and school dances with age-appropriate music and engaging entertainment.",
    keywords: ["school dance DJ Memphis", "prom DJ Memphis", "homecoming DJ Memphis"],
    features: ["Age-appropriate playlists", "Professional lighting", "MC services", "Interactive games"]
  },
  {
    icon: Sparkles,
    title: "Bar & Bat Mitzvah DJ",
    description: "Celebrate this special milestone with culturally-aware entertainment that honors tradition while creating unforgettable memories.",
    keywords: ["bar mitzvah DJ Memphis", "bat mitzvah DJ Memphis"],
    features: ["Cultural music knowledge", "Traditional ceremonies", "Family-friendly entertainment", "Custom playlists"]
  },
  {
    icon: Cake,
    title: "Sweet 16 Party DJ",
    description: "Make their 16th birthday unforgettable with trendy music, interactive entertainment, and personalized celebration services.",
    keywords: ["Sweet 16 DJ Memphis"],
    features: ["Trending music", "Social media integration", "Interactive entertainment", "Personalized experience"]
  },
  {
    icon: PartyPopper,
    title: "Club & Nightlife DJ",
    description: "High-energy club DJ services for nightlife venues, adult parties, and upscale entertainment events.",
    keywords: ["club DJ Memphis"],
    features: ["Club-style mixing", "High-energy entertainment", "Professional sound systems", "Lighting effects"]
  }
];

export default function MemphisSpecialtyDJServices() {
  const [activeService, setActiveService] = useState(0);

  useEffect(() => {
    // Add any tracking or analytics here
  }, []);

  const keywords = [
    "school dance DJ Memphis",
    "prom DJ Memphis", 
    "homecoming DJ Memphis",
    "bar mitzvah DJ Memphis",
    "bat mitzvah DJ Memphis",
    "Sweet 16 DJ Memphis",
    "club DJ Memphis",
    "specialty DJ Memphis",
    "Memphis specialty events",
    "professional DJ Memphis"
  ];

  return (
    <>
      <SEO
        title="Memphis Specialty DJ Services | School Dances, Bar Mitzvahs, Sweet 16 | M10 DJ Company"
        description="Professional specialty DJ services in Memphis for school dances, proms, bar mitzvahs, Sweet 16 parties, and club events. Expert entertainment for every special occasion. Call (901) 410-2020!"
        keywords={keywords}
        canonical="/memphis-specialty-dj-services"
      />
      
      <KeywordSchema 
        keywords={keywords}
        pageType="Specialty DJ"
        serviceArea="Memphis, Tennessee"
      />

      <Header />

      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-brand to-brand-dark py-20 overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-brand/90 to-brand-dark/90"></div>
          
          <div className="section-container relative z-10 text-center text-white">
            <div className="max-w-4xl mx-auto">
              <h1 className="heading-1 mb-6">
                <span className="block">Memphis Specialty DJ Services</span>
                <span className="block text-white/90">School Dances • Bar Mitzvahs • Sweet 16 • Club Events</span>
              </h1>
              
              <p className="text-xl md:text-2xl mb-8 leading-relaxed text-white/90">
                Professional specialty DJ services for unique celebrations throughout Memphis. From school dances and proms to 
                bar mitzvahs and Sweet 16 parties, we create unforgettable experiences tailored to each special occasion.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <button 
                  onClick={() => scrollToContact()}
                  className="btn-primary bg-white text-brand hover:bg-gray-100 px-8 py-4"
                >
                  Get Free Quote
                </button>
                <a href="tel:9014102020" className="btn-outline border-white text-white hover:bg-white hover:text-brand px-8 py-4">
                  Call (901) 410-2020
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Specialty Services Grid */}
        <section className="py-20 bg-white">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 mb-6 text-gray-900">Our Specialty DJ Services</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Every special occasion deserves expert entertainment. Our specialty DJ services are customized 
                for unique celebrations throughout Memphis and surrounding areas.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-16">
              {specialtyServices.map((service, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-8 hover:shadow-lg transition-shadow">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <service.icon className="h-8 w-8 text-brand" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">{service.title}</h3>
                      <p className="text-gray-600 mb-4">{service.description}</p>
                      
                      <div className="space-y-2 mb-4">
                        {service.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-brand" />
                            <span className="text-sm text-gray-600">{feature}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        <strong>Keywords:</strong> {service.keywords.join(', ')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-20 bg-gray-50">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 mb-6 text-gray-900">Why Choose M10 DJ for Specialty Events?</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <Users className="h-12 w-12 text-brand mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Age-Appropriate Entertainment</h3>
                <p className="text-gray-600">We understand different age groups and create perfect playlists for every specialty event.</p>
              </div>
              
              <div className="text-center">
                <Award className="h-12 w-12 text-brand mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Cultural Sensitivity</h3>
                <p className="text-gray-600">Respectful and knowledgeable approach to cultural and religious celebrations.</p>
              </div>
              
              <div className="text-center">
                <Music className="h-12 w-12 text-brand mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Custom Entertainment</h3>
                <p className="text-gray-600">Tailored music and entertainment specifically designed for your unique celebration.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-white">
          <div className="section-container">
            <div className="max-w-3xl mx-auto">
              <h2 className="heading-2 text-center mb-12 text-gray-900">Specialty DJ Services FAQ</h2>
              
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Do you provide school dance DJ services in Memphis?</h3>
                  <p className="text-gray-600">Yes! We specialize in school dance DJ services throughout Memphis including proms, homecoming dances, and other school events. Our music is age-appropriate and our entertainment is engaging for students.</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Can you DJ bar mitzvah and bat mitzvah celebrations?</h3>
                  <p className="text-gray-600">Absolutely! We have experience with bar mitzvah and bat mitzvah celebrations in Memphis, understanding the cultural significance and providing appropriate music for both traditional and modern elements of the celebration.</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">What makes your Sweet 16 DJ services special?</h3>
                  <p className="text-gray-600">Our Sweet 16 DJ services focus on current trends, social media integration, and creating Instagram-worthy moments. We work with the birthday teen to create their perfect playlist and entertainment experience.</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Do you provide club-style DJ services for private events?</h3>
                  <p className="text-gray-600">Yes! Our club DJ services bring high-energy nightlife entertainment to private venues throughout Memphis. Perfect for adult parties, corporate events, and upscale celebrations.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-20 bg-brand text-white">
          <div className="section-container">
            <div className="text-center mb-12">
              <h2 className="heading-2 mb-6">Ready to Book Your Specialty Event?</h2>
              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                Contact M10 DJ Company today to discuss your specialty event needs. 
                We'll create the perfect entertainment experience for your celebration.
              </p>
            </div>

            <ContactForm />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}