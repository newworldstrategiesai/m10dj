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
  Globe,
  Languages,
  Mic2,
  Volume2
} from 'lucide-react';
import Header from '../components/company/Header';
import Footer from '../components/company/Footer';
import ContactForm from '../components/company/ContactForm';
import SEO from '../components/SEO';
import KeywordSchema from '../components/KeywordSchema';
import { scrollToContact } from '../utils/scroll-helpers';

const culturalServices = [
  {
    icon: Globe,
    title: "Spanish DJ Memphis / DJ Latino",
    description: "Professional bilingual DJ services for Hispanic celebrations including weddings, quinceañeras, and fiestas with authentic Latin music.",
    keywords: ["Spanish DJ Memphis", "DJ latino Memphis", "DJ para boda Memphis", "DJ para quinceañera en Memphis", "DJ para fiesta Memphis"],
    musicTypes: ["Reggaeton", "Salsa", "Bachata", "Merengue", "Cumbia", "Pop Latino"],
    events: ["Bodas (Weddings)", "Quinceañeras", "Fiestas", "Bautizos", "Aniversarios"]
  },
  {
    icon: Languages,
    title: "Indian Wedding DJ / Bollywood DJ",
    description: "Specialized Indian wedding DJ services with deep knowledge of Bollywood, classical Indian music, and cultural wedding traditions.",
    keywords: ["Indian wedding DJ Memphis", "Bollywood DJ Memphis"],
    musicTypes: ["Bollywood", "Punjabi", "Classical Indian", "Bhangra", "Garba", "Regional Indian"],
    events: ["Indian Weddings", "Sangeet", "Mehndi", "Reception", "Cultural Festivals"]
  },
  {
    icon: Mic2,
    title: "Bilingual DJ Services",
    description: "Professional bilingual DJs who can seamlessly transition between languages and cultures for diverse Memphis celebrations.",
    keywords: ["Bilingual DJ Memphis"],
    musicTypes: ["Multi-cultural playlists", "English & Spanish", "International hits", "Cultural fusion"],
    events: ["Multicultural weddings", "Corporate events", "Community celebrations", "Cultural festivals"]
  },
  {
    icon: Users,
    title: "Female DJ Memphis",
    description: "Professional female DJ services bringing unique energy and perspective to Memphis events with personalized entertainment.",
    keywords: ["Female DJ Memphis"],
    musicTypes: ["All genres", "Female artist focus", "Empowering playlists", "Diverse music selection"],
    events: ["Women's events", "Bridal showers", "Corporate events", "Private parties"]
  }
];

export default function MulticulturalDJMemphis() {
  const [activeService, setActiveService] = useState(0);

  useEffect(() => {
    // Add any tracking or analytics here
  }, []);

  const keywords = [
    "Spanish DJ Memphis",
    "DJ latino Memphis", 
    "DJ para boda Memphis",
    "DJ para quinceañera en Memphis",
    "DJ para fiesta Memphis",
    "Hispanic DJ Memphis",
    "Indian wedding DJ Memphis",
    "Bollywood DJ Memphis",
    "Bilingual DJ Memphis",
    "Female DJ Memphis",
    "multicultural DJ Memphis",
    "diverse DJ services Memphis"
  ];

  return (
    <>
      <SEO
        title="Multicultural DJ Memphis | Spanish, Indian, Bilingual & Female DJs | M10 DJ Company"
        description="Professional multicultural DJ services in Memphis. Spanish DJ, Bollywood DJ, bilingual DJs, and female DJs for diverse celebrations. Authentic music for every culture. Call (901) 410-2020!"
        keywords={keywords}
        canonical="/multicultural-dj-memphis"
      />
      
      <KeywordSchema 
        keywords={keywords}
        pageType="Multicultural DJ"
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
                <span className="block">Multicultural DJ Services Memphis</span>
                <span className="block text-white/90">Spanish • Indian • Bilingual • Female DJs</span>
              </h1>
              
              <p className="text-xl md:text-2xl mb-8 leading-relaxed text-white/90">
                Memphis is a beautifully diverse city, and we're honored to serve communities celebrating their heritage. 
                Whether you're planning a quinceañera in Hickory Hill, an Indian wedding in Germantown, or a multicultural 
                celebration anywhere in the Memphis area, we bring authentic music, cultural respect, and professional service 
                to every event.
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

        {/* Cultural Services Grid */}
        <section className="py-20 bg-white">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 mb-6 text-gray-900">Our Multicultural DJ Services</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Memphis is a diverse city, and we celebrate that diversity with specialized DJ services 
                that honor different cultures, languages, and traditions.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 mb-16">
              {culturalServices.map((service, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-8 hover:shadow-lg transition-shadow">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <service.icon className="h-8 w-8 text-brand" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">{service.title}</h3>
                      <p className="text-gray-600 mb-4">{service.description}</p>
                      
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Music Styles:</h4>
                          <ul className="space-y-1">
                            {service.musicTypes.map((type, idx) => (
                              <li key={idx} className="text-sm text-gray-600 flex items-center">
                                <Music className="h-3 w-3 text-brand mr-2" />
                                {type}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Event Types:</h4>
                          <ul className="space-y-1">
                            {service.events.map((event, idx) => (
                              <li key={idx} className="text-sm text-gray-600 flex items-center">
                                <Calendar className="h-3 w-3 text-brand mr-2" />
                                {event}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        <strong>Search terms:</strong> {service.keywords.join(', ')}
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
              <h2 className="heading-2 mb-6 text-gray-900">Why Choose M10 DJ for Multicultural Events?</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                After 15+ years serving Memphis, we've learned that cultural celebrations aren't just about playing the right songs—they're 
                about understanding traditions, respecting customs, and creating an atmosphere where every guest feels included. 
                We take the time to learn about your specific cultural needs and work with you to ensure every detail is perfect.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <Globe className="h-12 w-12 text-brand mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Cultural Authenticity</h3>
                <p className="text-gray-600">Deep respect and understanding of cultural traditions, music, and celebration customs.</p>
              </div>
              
              <div className="text-center">
                <Languages className="h-12 w-12 text-brand mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Bilingual Services</h3>
                <p className="text-gray-600">Professional MC services in multiple languages to ensure all guests feel included.</p>
              </div>
              
              <div className="text-center">
                <Volume2 className="h-12 w-12 text-brand mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Authentic Music Libraries</h3>
                <p className="text-gray-600">Extensive collections of authentic music from various cultures and regions.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Memphis Multicultural Community Section */}
        <section className="py-20 bg-white">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              <h2 className="heading-2 text-center mb-12 text-gray-900">Serving Memphis's Diverse Communities</h2>
              
              <div className="prose prose-lg max-w-none text-gray-700 mb-8">
                <p className="text-lg leading-relaxed mb-6">
                  Memphis is home to vibrant Hispanic communities in neighborhoods like Berclair, Hickory Hill, and South Memphis, 
                  where quinceañeras and bodas (weddings) are celebrated with traditional Latin music. We've provided DJ services 
                  for celebrations at venues throughout the city, understanding the importance of playing the right songs at the 
                  right moments—from the hora loca to the last dance.
                </p>
                
                <p className="text-lg leading-relaxed mb-6">
                  The Memphis area also has a growing Indian community, with weddings and cultural celebrations that require 
                  deep knowledge of Bollywood music, traditional ceremony music, and the ability to blend classical Indian sounds 
                  with modern hits. Whether it's a Sangeet ceremony or the main reception, we work closely with families to ensure 
                  every cultural tradition is honored through music.
                </p>
                
                <p className="text-lg leading-relaxed">
                  As Memphis continues to grow more diverse, we're committed to serving all communities with respect, cultural 
                  sensitivity, and authentic music libraries. From bilingual MC services that make everyone feel included to 
                  extensive music collections spanning multiple cultures, we bring the same level of professionalism to every 
                  multicultural celebration.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mt-12">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Memphis Hispanic Community</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Quinceañeras at venues across Memphis and surrounding areas</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Bilingual wedding ceremonies and receptions</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Fiestas and community celebrations</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Authentic Latin music: Reggaeton, Salsa, Bachata, Merengue</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Memphis Indian Community</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Indian weddings with traditional ceremony music</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Sangeet and Mehndi celebrations</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Bollywood parties and cultural festivals</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                      <span>Extensive Bollywood, Bhangra, and regional Indian music</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-gray-50">
          <div className="section-container">
            <div className="max-w-3xl mx-auto">
              <h2 className="heading-2 text-center mb-12 text-gray-900">Multicultural DJ Services FAQ</h2>
              
              <div className="space-y-6">
                <div className="bg-white rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Do you provide Spanish DJ services in Memphis?</h3>
                  <p className="text-gray-600">¡Sí! We offer professional Spanish DJ services for bodas (weddings), quinceañeras, fiestas, and other Hispanic celebrations throughout Memphis and surrounding areas. Our DJs understand Latino culture and have extensive libraries of Reggaeton, Salsa, Bachata, Merengue, and other Latin music genres. We've worked with families in neighborhoods across Memphis, from Berclair to Hickory Hill, and understand the importance of playing the right songs at the right moments—especially during traditional dances like the hora loca.</p>
                </div>

                <div className="bg-white rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Can you DJ Indian weddings and Bollywood parties?</h3>
                  <p className="text-gray-600">Absolutely! We specialize in Indian wedding DJ services and Bollywood parties throughout the Memphis area. We have extensive knowledge of Indian music, from classical ragas to modern Bollywood hits, and understand the timing requirements for traditional ceremonies. Whether you need music for a Sangeet, Mehndi, or the main reception, we work closely with families to ensure every cultural tradition is honored. Our music library includes Bollywood classics, Punjabi hits, Bhangra, Garba, and regional Indian music.</p>
                </div>

                <div className="bg-white rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">What makes your bilingual DJ services special?</h3>
                  <p className="text-gray-600">Our bilingual DJ services go beyond just speaking two languages—we understand cultural nuances and know when to transition between languages during events. This ensures all guests, regardless of their primary language, feel included and engaged. We provide MC services in multiple languages and can coordinate announcements, introductions, and special moments in the language that makes your guests most comfortable. This is especially important for multicultural weddings where families may speak different languages.</p>
                </div>

                <div className="bg-white rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Do you offer female DJ services in Memphis?</h3>
                  <p className="text-gray-600">Yes! We have professional female DJs available for events where clients prefer female entertainment staff. This is especially popular for women's events, bridal showers, certain cultural celebrations, and corporate events. Our female DJs bring unique energy and perspective to every celebration while maintaining the same high level of professionalism and musical expertise.</p>
                </div>

                <div className="bg-white rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">How do you ensure cultural authenticity in your music selection?</h3>
                  <p className="text-gray-600">We start by having detailed conversations with you about your cultural traditions, must-play songs, and any songs to avoid. We maintain extensive music libraries for various cultures and continuously update them with new releases. For Indian weddings, we understand the significance of different ceremony phases and play appropriate music. For Hispanic celebrations, we know the difference between a bachata wedding and a reggaeton party. Most importantly, we're not afraid to ask questions and learn—we want to get it right for your family.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-20 bg-brand text-white">
          <div className="section-container">
            <div className="text-center mb-12">
              <h2 className="heading-2 mb-6">Ready to Celebrate Your Culture?</h2>
              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                Contact M10 DJ Company today to discuss your multicultural event needs. 
                We'll honor your heritage while creating an unforgettable celebration.
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