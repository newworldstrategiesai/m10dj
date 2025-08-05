import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Heart, 
  Star, 
  MapPin, 
  Calendar, 
  Users, 
  Music, 
  Award, 
  ChevronRight, 
  CheckCircle,
  Quote,
  Camera,
  Clock
} from 'lucide-react';
import Header from '../../components/company/Header';
import Footer from '../../components/company/Footer';
import { ArticleSchema, BreadcrumbListSchema } from '../../components/StandardSchema';
import ContactForm from '../../components/company/ContactForm';
import { scrollToContact } from '../../utils/scroll-helpers';

const timelineEvents = [
  {
    time: "4:00 PM",
    event: "Setup & Sound Check",
    description: "M10 DJ Company arrived early at The Peabody Memphis to set up ceremony and reception equipment"
  },
  {
    time: "5:30 PM",
    event: "Ceremony Music",
    description: "Perfect processional with 'A Thousand Years' and recessional with 'Marry Me' by Train"
  },
  {
    time: "6:00 PM",
    event: "Cocktail Hour",
    description: "Jazz standards and Memphis soul classics created elegant atmosphere for guest mingling"
  },
  {
    time: "7:30 PM", 
    event: "Grand Entrance",
    description: "Professional MC introduction and seamless transition to first dance"
  },
  {
    time: "8:00 PM",
    event: "First Dance",
    description: "'Thinking Out Loud' by Ed Sheeran with perfect lighting and crystal-clear sound"
  },
  {
    time: "8:30 PM",
    event: "Dinner Service",
    description: "Background music coordination with catering staff for smooth service"
  },
  {
    time: "9:30 PM",
    event: "Dance Floor Opening",
    description: "High-energy music mix that packed the dance floor from the first song"
  },
  {
    time: "11:30 PM",
    event: "Last Dance",
    description: "Perfect ending with 'All of Me' as guests formed a circle around the couple"
  }
];

const weddingDetails = {
  couple: "Quade Nowlin",
  date: "July 20, 2024",
  venue: "The Peabody Memphis",
  location: "Downtown Memphis, TN",
  guestCount: 150,
  style: "Elegant Classic",
  budget: "$1,299 (Premium Package)",
  rating: 5
};

const servicesProvided = [
  "Professional Memphis wedding DJ",
  "Master of ceremonies services",
  "Ceremony sound system",
  "Cocktail hour background music", 
  "Reception dance music",
  "Premium uplighting design",
  "Wireless microphones (4)",
  "Timeline coordination",
  "Music consultation",
  "Backup equipment"
];

const challenges = [
  {
    challenge: "Outdoor ceremony backup plan",
    solution: "Weather contingency with indoor ceremony setup at The Peabody ready in 30 minutes"
  },
  {
    challenge: "Multi-generational music preferences",
    solution: "Custom playlist balancing modern hits, classic soul, and family-friendly favorites"
  },
  {
    challenge: "Tight venue timeline",
    solution: "Precise coordination with venue staff and other vendors for seamless transitions"
  }
];

export default function MemphisWeddingSuccessStory() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <>
      <Head>
        <title>Memphis Wedding Success Story: Quade Nowlin at The Peabody | M10 DJ Company</title>
        <meta 
          name="description" 
          content="Real Memphis wedding success story featuring Quade Nowlin's elegant Peabody Memphis celebration. See how M10 DJ Company created the perfect Memphis wedding experience with professional DJ and MC services." 
        />
        <meta name="keywords" content="Memphis wedding DJ review, Peabody Memphis wedding DJ, Memphis wedding success story, professional wedding DJ Memphis, Memphis wedding testimonial, The Peabody wedding entertainment" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://m10djcompany.com/blog/memphis-wedding-success-story-sarah-michael" />
        
        {/* Open Graph tags */}
        <meta property="og:title" content="Memphis Wedding Success Story: Sarah & Michael at The Peabody" />
        <meta property="og:description" content="Real Memphis wedding success story showcasing professional DJ services at The Peabody Memphis." />
        <meta property="og:url" content="https://m10djcompany.com/blog/memphis-wedding-success-story-sarah-michael" />
        <meta property="og:type" content="article" />
        <meta property="og:image" content="https://m10djcompany.com/logo-static.jpg" />
        
        {/* Article Schema */}
        <ArticleSchema 
          headline="Memphis Wedding Success Story: Sarah & Michael at The Peabody"
          description="Real Memphis wedding success story featuring professional DJ services at The Peabody Hotel Memphis. Learn how M10 DJ Company created the perfect wedding celebration."
          datePublished="2024-12-01"
          dateModified="2024-12-01"
          url="https://m10djcompany.com/blog/memphis-wedding-success-story-sarah-michael"
          image="https://m10djcompany.com/logo-static.jpg"
          category="Wedding Success Stories"
        />

        {/* Breadcrumb Schema */}
        <BreadcrumbListSchema 
          breadcrumbs={[
            { name: "Home", url: "https://m10djcompany.com" },
            { name: "Blog", url: "https://m10djcompany.com/blog" },
            { name: "Memphis Wedding Success Story", url: "https://m10djcompany.com/blog/memphis-wedding-success-story-sarah-michael" }
          ]}
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
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex items-center justify-center mb-6">
                <Heart className="w-8 h-8 text-brand-gold mr-3" />
                <span className="text-brand-gold font-semibold">Real Memphis Wedding</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-8 leading-tight">
                <span className="block text-white">Quade Nowlin's</span>
                <span className="block text-gradient">Perfect Memphis Wedding</span>
              </h1>
              
              <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                Discover how M10 DJ Company created an unforgettable Memphis wedding celebration at The Peabody Memphis. 
                From ceremony to last dance, see why Quade calls us the best wedding DJ in Memphis.
              </p>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-2xl mx-auto">
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div>
                    <div className="text-2xl font-bold text-brand-gold">150</div>
                    <div className="text-sm text-gray-300">Happy Guests</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-brand-gold">5★</div>
                    <div className="text-sm text-gray-300">Perfect Rating</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-brand-gold">8hrs</div>
                    <div className="text-sm text-gray-300">Non-stop Fun</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-brand-gold">100%</div>
                    <div className="text-sm text-gray-300">Dance Floor Packed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Wedding Details */}
        <section className="py-24 bg-white">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 mb-4">Wedding Details</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Sarah & Michael chose M10 DJ Company for their elegant Memphis wedding at one of the city's most prestigious venues.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gray-50 rounded-2xl p-8">
                  <h3 className="text-2xl font-bold mb-6">Event Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Heart className="w-5 h-5 text-brand mr-3" />
                      <span><strong>Couple:</strong> {weddingDetails.couple}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-brand mr-3" />
                      <span><strong>Date:</strong> {weddingDetails.date}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 text-brand mr-3" />
                      <span><strong>Venue:</strong> {weddingDetails.venue}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="w-5 h-5 text-brand mr-3" />
                      <span><strong>Guest Count:</strong> {weddingDetails.guestCount}</span>
                    </div>
                    <div className="flex items-center">
                      <Award className="w-5 h-5 text-brand mr-3" />
                      <span><strong>Style:</strong> {weddingDetails.style}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-brand text-white rounded-2xl p-8">
                  <h3 className="text-2xl font-bold mb-6">Services Provided</h3>
                  <div className="space-y-3">
                    {servicesProvided.map((service, index) => (
                      <div key={index} className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-white mr-3" />
                        <span className="text-sm">{service}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 p-4 bg-white/10 rounded-lg">
                    <div className="text-sm opacity-90">Investment:</div>
                    <div className="text-2xl font-bold">{weddingDetails.budget}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-24 bg-gray-50">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 mb-4">Wedding Day Timeline</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                See how M10 DJ Company orchestrated Sarah & Michael's perfect Memphis wedding day from setup to last dance.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              {timelineEvents.map((event, index) => (
                <div key={index} className="flex items-start mb-8 last:mb-0">
                  <div className="bg-brand text-white rounded-full w-16 h-16 flex items-center justify-center font-bold text-sm mr-6 flex-shrink-0">
                    {event.time}
                  </div>
                  <div className="bg-white rounded-lg p-6 shadow-lg flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{event.event}</h3>
                    <p className="text-gray-600">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Challenges & Solutions */}
        <section className="py-24 bg-white">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 mb-4">Professional Problem Solving</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Every Memphis wedding has unique challenges. Here's how M10 DJ Company's experience 
                ensured Sarah & Michael's celebration went perfectly.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              {challenges.map((item, index) => (
                <div key={index} className="bg-gray-50 rounded-2xl p-8 mb-8 last:mb-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-xl font-bold text-red-600 mb-3">Challenge</h3>
                      <p className="text-gray-700">{item.challenge}</p>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-green-600 mb-3">M10's Solution</h3>
                      <p className="text-gray-700">{item.solution}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonial */}
        <section className="py-24 bg-brand text-white">
          <div className="section-container">
            <div className="max-w-4xl mx-auto text-center">
              <Quote className="w-16 h-16 text-white mx-auto mb-8" />
              
              <blockquote className="text-2xl md:text-3xl font-bold mb-8 leading-relaxed">
                "Ben was absolutely amazing for our Memphis wedding! From the ceremony to the reception, 
                everything was flawless. The music selection kept everyone on the dance floor, and his MC 
                skills were professional and engaging. Worth every penny!"
              </blockquote>
              
              <div className="flex items-center justify-center mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                ))}
              </div>
              
              <div className="text-xl">
                <div className="font-bold">{weddingDetails.couple}</div>
                <div className="opacity-90">{weddingDetails.venue}, Memphis, TN</div>
                <div className="opacity-75 text-sm mt-2">{weddingDetails.date}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="py-24 bg-gray-50">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 mb-4">Wedding Success Metrics</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Sarah & Michael's Memphis wedding was a complete success by every measure that matters.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">100%</h3>
                <p className="text-gray-600">Dance Floor Participation</p>
              </div>

              <div className="text-center">
                <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">On Time</h3>
                <p className="text-gray-600">Every Timeline Event</p>
              </div>

              <div className="text-center">
                <div className="bg-yellow-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-10 h-10 text-yellow-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">5 Stars</h3>
                <p className="text-gray-600">Customer Rating</p>
              </div>

              <div className="text-center">
                <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Perfect</h3>
                <p className="text-gray-600">Couple Satisfaction</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gray-900 text-white">
          <div className="section-container">
            <div className="max-w-4xl mx-auto text-center">
              <Award className="w-16 h-16 text-brand-gold mx-auto mb-6" />
              <h2 className="text-4xl font-bold mb-6">Create Your Own Memphis Wedding Success Story</h2>
              <p className="text-xl mb-8 opacity-90">
                Ready to experience the same level of professionalism and perfection as Sarah & Michael? 
                Let M10 DJ Company make your Memphis wedding unforgettable.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="text-center">
                  <Music className="w-12 h-12 text-brand-gold mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Professional Experience</h3>
                  <p className="opacity-90">10+ years of Memphis wedding expertise</p>
                </div>
                <div className="text-center">
                  <Users className="w-12 h-12 text-brand-gold mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Personal Service</h3>
                  <p className="opacity-90">Customized planning for your unique vision</p>
                </div>
                <div className="text-center">
                  <CheckCircle className="w-12 h-12 text-brand-gold mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Guaranteed Success</h3>
                  <p className="opacity-90">Backup plans and professional execution</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <button 
                  onClick={scrollToContact}
                  className="bg-brand-gold text-black hover:bg-yellow-400 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
                >
                  Start Planning Your Memphis Wedding
                  <ChevronRight className="ml-2 w-5 h-5 inline" />
                </button>
                <Link 
                  href="/best-wedding-dj-memphis" 
                  className="border-2 border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg transition-colors text-center"
                >
                  See Why We're Memphis's Best
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Related Content */}
        <section className="py-24 bg-white">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 mb-4">More Memphis Wedding Resources</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Continue exploring our Memphis wedding guides and success stories.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Link href="/blog/memphis-wedding-dj-cost-guide-2025" className="card text-center group hover:shadow-xl transition-all">
                <Calendar className="w-12 h-12 text-brand mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold mb-3">Memphis Wedding DJ Costs</h3>
                <p className="text-gray-600 mb-4">Complete 2025 pricing guide for Memphis weddings</p>
                <span className="text-brand font-semibold">Read Guide →</span>
              </Link>

              <Link href="/blog/memphis-wedding-songs-2025" className="card text-center group hover:shadow-xl transition-all">
                <Music className="w-12 h-12 text-brand mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold mb-3">Memphis Wedding Songs</h3>
                <p className="text-gray-600 mb-4">Best Memphis wedding playlist ideas for 2025</p>
                <span className="text-brand font-semibold">Get Playlist →</span>
              </Link>

              <Link href="/memphis-wedding-dj" className="card text-center group hover:shadow-xl transition-all">
                <Heart className="w-12 h-12 text-brand mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold mb-3">Memphis Wedding DJ Services</h3>
                <p className="text-gray-600 mb-4">Professional wedding entertainment packages</p>
                <span className="text-brand font-semibold">Explore Services →</span>
              </Link>
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