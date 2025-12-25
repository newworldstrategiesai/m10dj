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
    description: "We've DJ'd proms and homecoming dances at Memphis-area high schools for years. We know how to keep students dancing with clean, current music while respecting school policies and creating an atmosphere that makes these milestone events memorable.",
    keywords: ["school dance DJ Memphis", "prom DJ Memphis", "homecoming DJ Memphis"],
    features: ["Age-appropriate playlists", "Professional lighting", "MC services", "Interactive games"]
  },
  {
    icon: Sparkles,
    title: "Bar & Bat Mitzvah DJ",
    description: "Bar and bat mitzvahs are significant religious and cultural milestones. We work closely with families to understand the ceremony requirements, traditional music needs, and celebration preferences. We've provided DJ services for mitzvahs at synagogues throughout Memphis and understand the balance between honoring tradition and creating a fun celebration.",
    keywords: ["bar mitzvah DJ Memphis", "bat mitzvah DJ Memphis"],
    features: ["Cultural music knowledge", "Traditional ceremonies", "Family-friendly entertainment", "Custom playlists"]
  },
  {
    icon: Cake,
    title: "Sweet 16 Party DJ",
    description: "Sweet 16 parties are all about the birthday teen. We work directly with them (and their parents) to create playlists that reflect their current music taste, incorporate social media trends, and create Instagram-worthy moments. These parties often have a different energy than adult celebrations, and we know how to match that energy perfectly.",
    keywords: ["Sweet 16 DJ Memphis"],
    features: ["Trending music", "Social media integration", "Interactive entertainment", "Personalized experience"]
  },
  {
    icon: PartyPopper,
    title: "Club & Nightlife DJ",
    description: "Sometimes you want that club energy at a private event. Whether it's an adult birthday party, a private venue celebration, or a corporate event that needs high-energy entertainment, we bring professional club-style DJ services with seamless mixing, current hits, and the kind of energy that keeps people on the dance floor all night.",
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
                Not every celebration fits the standard wedding or corporate event mold. Over the years, we've DJ'd proms at 
                Memphis high schools, Sweet 16 parties in Germantown, bar mitzvahs at synagogues across the city, and club-style 
                events at private venues. Each specialty event has its own unique energy, and we know how to match it.
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
                We've provided DJ services for proms at White Station High School, homecoming dances at Houston High, 
                Sweet 16 parties in Collierville, and bar mitzvahs throughout the Memphis Jewish community. Each event 
                type requires different music, different energy, and different expertise—and that's exactly what we bring.
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
                <p className="text-gray-600">There's a huge difference between a prom playlist and a Sweet 16 playlist, even though both are for teenagers. We understand the nuances—what's appropriate for a school dance versus a private party, what current music trends matter to each age group, and how to keep everyone engaged without crossing any lines.</p>
              </div>
              
              <div className="text-center">
                <Award className="h-12 w-12 text-brand mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Cultural Sensitivity</h3>
                <p className="text-gray-600">Bar and bat mitzvahs have specific traditions and requirements. We take the time to understand what music is appropriate for different parts of the ceremony and celebration. We're not just playing songs—we're honoring a significant religious and cultural milestone, and we treat it with the respect it deserves.</p>
              </div>
              
              <div className="text-center">
                <Music className="h-12 w-12 text-brand mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Memphis Experience</h3>
                <p className="text-gray-600">We've been doing specialty events in Memphis for over 15 years. We know the venues, we know the schools, we know the communities. This isn't our first prom, Sweet 16, or bar mitzvah—and that experience shows in how smoothly everything runs and how well we understand what each event type needs.</p>
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
                  <p className="text-gray-600">Yes! We've provided DJ services for proms, homecoming dances, and other school events at high schools throughout the Memphis area, including White Station, Houston, Collierville, and Germantown. School dances require a specific approach—we need to keep the energy high while respecting school policies about music content, volume levels, and appropriate behavior. We work closely with school administrators and student councils to ensure everything runs smoothly and everyone has a great time.</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Can you DJ bar mitzvah and bat mitzvah celebrations?</h3>
                  <p className="text-gray-600">Absolutely! We have experience with bar mitzvah and bat mitzvah celebrations throughout the Memphis Jewish community. These events often have multiple phases—the religious ceremony, the reception, and sometimes separate teen and adult celebrations. We understand the significance of these milestones and work with families to ensure the music honors both the religious traditions and the celebratory aspects. We've provided DJ services for mitzvahs at various synagogues and venues across Memphis and understand the balance between tradition and celebration.</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">What makes your Sweet 16 DJ services special?</h3>
                  <p className="text-gray-600">Sweet 16 parties are unique because they're often the first "grown-up" party a teen has, but they're still very much a teen celebration. We work directly with the birthday teen to understand their music taste (which is usually very current and trend-focused), while also working with parents to ensure everything stays appropriate. We know how to create Instagram-worthy moments, incorporate TikTok trends, and keep the energy high. These parties often have a different vibe than adult celebrations—more energy, more current music, more interactive elements—and we know exactly how to match that energy.</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Do you provide club-style DJ services for private events?</h3>
                  <p className="text-gray-600">Yes! Sometimes you want that high-energy club vibe at a private event—whether it's an adult birthday party, a private venue celebration, or even a corporate event that needs that kind of energy. We bring professional club-style DJ services with seamless mixing, current hits, extended dance mixes, and the kind of energy that keeps people on the dance floor all night. This is different from our standard event DJ services—it's more mixing-focused, more energy-driven, and designed for crowds that want to dance continuously.</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">How do you ensure music is age-appropriate for school events?</h3>
                  <p className="text-gray-600">We maintain clean versions of all current hits specifically for school events. We also work closely with school administrators to understand their specific policies—some schools are stricter than others about certain words or themes. We're experienced at reading a crowd of teenagers and knowing what will get them dancing while staying within school guidelines. The key is having current music that students love, but in versions that meet school standards. We've never had a school complain about inappropriate content, and we've kept plenty of dance floors packed.</p>
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