import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Music, 
  Calendar,
  MapPin,
  Users,
  Award,
  Play,
  Radio,
  Star,
  ExternalLink,
  Mic,
  Volume2,
  Heart,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Headphones,
  Zap,
  Trophy,
  Clock,
  Phone,
  Mail
} from 'lucide-react';
import Header from '../components/company/Header';
import Footer from '../components/company/Footer';
import ContactForm from '../components/company/ContactForm';
import { scrollToContact } from '../utils/scroll-helpers';

const achievements = [
  {
    year: "15+",
    title: "Years Experience",
    description: "Professional DJ since late 2000s",
    icon: Clock
  },
  {
    year: "500+",
    title: "Events Performed",
    description: "Weddings, festivals, and club nights",
    icon: Calendar
  },
  {
    year: "15K+",
    title: "Social Following",
    description: "Engaged fans across platforms",
    icon: Users
  },
  {
    year: "#1",
    title: "Memphis DJ",
    description: "Recognized as the best in the city",
    icon: Trophy
  }
];

const notablePerformances = [
  {
    year: "2022-Present",
    event: "Jerry Lee Lewis' Cafe & Honky Tonk",
    role: "Resident DJ",
    description: "Weekend residency on Memphis's iconic Beale Street, entertaining diverse tourist crowds",
    venue: "Beale Street, Memphis"
  },
  {
    year: "2021-2022",
    event: "Mempho Music Festival",
    role: "Featured DJ",
    description: "Performed alongside national acts, bringing high-energy dance sets to festival crowds",
    venue: "Memphis, TN"
  },
  {
    year: "2022",
    event: "Beale Street Music Festival VIP Afterparty",
    role: "Headlining DJ",
    description: "Official VIP after-party DJ for Memphis's largest music festival",
    venue: "310 Beale Street"
  },
  {
    year: "2013",
    event: "Waka Flocka Flame Concert",
    role: "Opening DJ",
    description: "Opened for major hip-hop artist at sold-out show",
    venue: "Minglewood Hall"
  },
  {
    year: "2013",
    event: "Hot Chelle Rae / 3OH!3 Concert",
    role: "Featured DJ",
    description: "Multi-artist pop/EDM lineup performance",
    venue: "New Daisy Theatre"
  },
  {
    year: "2011",
    event: "Minerva Music Fest",
    role: "Featured Act",
    description: "DJ act in diverse lineup of rock, metal, and indie bands",
    venue: "Memphis, TN"
  }
];

const discography = [
  {
    title: "Million Dollar Baby (Ben Spins Remix)",
    artist: "Ava Max",
    year: "2024",
    type: "Official Remix",
    description: "Uptempo dance remix featuring club-ready drops"
  },
  {
    title: "A Bar Song (Ben Spins Remix)", 
    artist: "Shaboozey",
    year: "2024",
    type: "Hip-Hop Remix",
    description: "Creative remix blending rap vocals with EDM elements"
  },
  {
    title: "Fancy x This Love Mashup",
    artist: "Iggy Azalea × Maroon 5", 
    year: "2014",
    type: "Bootleg Mashup",
    description: "Popular cross-genre mashup showcasing mixing skills"
  },
  {
    title: "NuWave Mixtape",
    artist: "Daw$on (Hosted by DJ Ben Murray)",
    year: "2016", 
    type: "Mixtape Host",
    description: "Featured in The Hype Magazine, hip-hop collaboration"
  }
];

const mediaProfiles = [
  {
    platform: "Instagram",
    handle: "@djbenmurray", 
    followers: "15K+",
    description: "Event clips, behind-the-scenes content, and DJ humor",
    icon: Instagram,
    primary: true
  },
  {
    platform: "SoundCloud",
    handle: "djbenmurray",
    followers: "280+",
    description: "Remixes, mashups, and DJ mixes dating back to 2012",
    icon: Headphones
  },
  {
    platform: "Facebook", 
    handle: "DJ Ben Murray",
    followers: "500+",
    description: "Event announcements and client testimonials",
    icon: Facebook
  },
  {
    platform: "YouTube",
    handle: "djbenmurray",
    description: "Live performance videos and Pioneer DJ features",
    icon: Youtube
  }
];

const currentActivities = [
  {
    title: "Beale Street Residency",
    schedule: "Friday & Saturday Nights",
    venue: "Jerry Lee Lewis' Cafe & Honky Tonk",
    description: "Regular weekend performances on Memphis's historic entertainment district"
  },
  {
    title: "Revival Radio",
    schedule: "Weekly Show",
    venue: "WYXR 91.7 FM",
    description: "Hosting adventurous mix show featuring diverse musical selections"
  },
  {
    title: "Private Events & Weddings",
    schedule: "Year-Round",
    venue: "M10 DJ Company",
    description: "Premium entertainment for weddings, corporate events, and celebrations"
  },
  {
    title: "Club Appearances",
    schedule: "Regular Bookings",
    venue: "Blind Bear, Hu Hotel Rooftop, Young Avenue Deli",
    description: "Guest DJ sets at Memphis's premier nightlife venues"
  }
];

export default function DJBenMurray() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('bio');

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <>
      <Head>
        <title>DJ Ben Murray | Memphis's Premier DJ & M10 DJ Company Founder</title>
        <meta 
          name="description" 
          content="Meet DJ Ben Murray, Memphis's #1 DJ with 15+ years experience. Founder of M10 DJ Company, Beale Street resident DJ, and featured performer at major festivals. Book Memphis's best DJ for your event." 
        />
        <meta name="keywords" content="DJ Ben Murray, Memphis DJ, best DJ Memphis, M10 DJ Company founder, Beale Street DJ, Memphis wedding DJ, professional DJ Memphis, electronic music Memphis, festival DJ" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://m10djcompany.com/dj-ben-murray" />
        
        {/* Open Graph tags */}
        <meta property="og:title" content="DJ Ben Murray | Memphis's Premier DJ & M10 DJ Company Founder" />
        <meta property="og:description" content="Meet DJ Ben Murray, Memphis's #1 DJ with 15+ years experience. Founder of M10 DJ Company, Beale Street resident DJ, and featured performer at major festivals." />
        <meta property="og:url" content="https://m10djcompany.com/dj-ben-murray" />
        <meta property="og:type" content="profile" />
        <meta property="og:image" content="https://m10djcompany.com/dj-ben-murray-og.jpg" />
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="DJ Ben Murray | Memphis's Premier DJ" />
        <meta name="twitter:description" content="Memphis's #1 DJ with 15+ years experience. Founder of M10 DJ Company and Beale Street resident DJ." />
        <meta name="twitter:image" content="https://m10djcompany.com/dj-ben-murray-twitter.jpg" />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person", 
              "name": "Ben Murray",
              "alternateName": "DJ Ben Murray",
              "description": "Professional DJ and music producer, founder of M10 DJ Company",
              "birthPlace": "Memphis, TN",
              "knowsAbout": ["DJing", "Music Production", "Event Entertainment", "Electronic Dance Music", "Wedding Entertainment"],
              "memberOf": {
                "@type": "Organization",
                "name": "M10 DJ Company"
              },
              "founder": {
                "@type": "Organization", 
                "name": "M10 DJ Company",
                "url": "https://m10djcompany.com"
              },
              "performerIn": [
                {
                  "@type": "Event",
                  "name": "Mempho Music Festival",
                  "location": "Memphis, TN"
                },
                {
                  "@type": "Event", 
                  "name": "Beale Street Music Festival VIP Afterparty",
                  "location": "Memphis, TN"
                }
              ],
              "sameAs": [
                "https://www.instagram.com/djbenmurray/",
                "https://soundcloud.com/thebenmurray",
                "https://www.facebook.com/djbenmurray/",
                "https://x.com/djbenmurray"
              ],
              "url": "https://m10djcompany.com/dj-ben-murray"
            }),
          }}
        />
      </Head>

      <Header />

      <main className="min-h-screen">
        
        {/* Hero Section */}
        <section className="relative py-32 bg-gradient-to-br from-brand via-brand-dark to-gray-900 text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-gold/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>

          <div className="section-container relative z-10">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                
                {/* Content */}
                <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'}`}>
                  <div className="flex items-center mb-6">
                    <Zap className="w-8 h-8 text-brand-gold mr-3" />
                    <span className="text-brand-gold font-semibold text-lg">Memphis's Premier DJ</span>
                  </div>
                  
                  <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
                    <span className="block">DJ Ben</span>
                    <span className="block text-brand-gold">Murray</span>
                  </h1>
                  
                  <p className="text-xl md:text-2xl text-gray-200 mb-8 leading-relaxed">
                    Founder of M10 DJ Company • 15+ Years Experience • Beale Street Resident DJ
                  </p>

                  <p className="text-lg text-gray-300 mb-12 leading-relaxed max-w-2xl">
                    Memphis-born DJ and music producer known for high-energy performances and fearless genre-blending. 
                    From Beale Street residencies to major festival stages, Ben Murray delivers unforgettable musical experiences.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-6">
                    <button 
                      onClick={scrollToContact}
                      className="btn-primary bg-brand-gold text-black hover:bg-yellow-400 px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105"
                    >
                      <Calendar className="w-5 h-5 mr-2" />
                      Book DJ Ben Murray
                    </button>
                    <a 
                      href="#performances" 
                      className="btn-secondary border-2 border-white text-white hover:bg-white hover:text-brand px-8 py-4 rounded-lg font-bold text-lg transition-all text-center"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      View Performances
                    </a>
                  </div>
                </div>

                {/* Profile Image Area */}
                <div className={`transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'}`}>
                  <div className="relative">
                    {/* Placeholder for professional photo */}
                    <div className="aspect-square bg-gradient-to-br from-brand-gold/20 to-brand/20 rounded-2xl border-4 border-brand-gold/30 flex items-center justify-center backdrop-blur-sm">
                      <div className="text-center">
                        <Music className="w-24 h-24 text-brand-gold mx-auto mb-4" />
                        <p className="text-brand-gold font-semibold text-lg">Professional Photo</p>
                        <p className="text-gray-300 text-sm">Coming Soon</p>
                      </div>
                    </div>
                    
                    {/* Floating stats */}
                    <div className="absolute -bottom-6 -left-6 bg-black/80 backdrop-blur-sm rounded-xl p-4">
                      <div className="flex items-center text-brand-gold">
                        <Star className="w-5 h-5 mr-2" />
                        <span className="font-bold">15K+ Followers</span>
                      </div>
                    </div>
                    
                    <div className="absolute -top-6 -right-6 bg-black/80 backdrop-blur-sm rounded-xl p-4">
                      <div className="flex items-center text-brand-gold">
                        <Award className="w-5 h-5 mr-2" />
                        <span className="font-bold">#1 Memphis DJ</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* Achievement Stats */}
        <section className="py-16 bg-gray-900 text-white">
          <div className="section-container">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {achievements.map((achievement, index) => (
                <div key={index} className="text-center group">
                  <div className="bg-brand/10 border border-brand/30 rounded-2xl p-8 transition-all group-hover:bg-brand/20 group-hover:border-brand-gold/50">
                    <achievement.icon className="w-12 h-12 text-brand-gold mx-auto mb-4" />
                    <div className="text-4xl font-bold text-brand-gold mb-2">{achievement.year}</div>
                    <div className="text-xl font-semibold mb-2">{achievement.title}</div>
                    <div className="text-gray-400 text-sm">{achievement.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Navigation Tabs */}
        <section className="bg-white dark:bg-gray-900 border-b">
          <div className="section-container">
            <div className="flex flex-wrap justify-center gap-4 py-6">
              {[
                { id: 'bio', label: 'Biography', icon: Users },
                { id: 'performances', label: 'Performances', icon: Music },
                { id: 'music', label: 'Music & Style', icon: Headphones },
                { id: 'current', label: 'Current Activities', icon: Calendar }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center ${
                    activeTab === tab.id
                      ? 'bg-brand text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <tab.icon className="w-5 h-5 mr-2" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Biography Section */}
        {activeTab === 'bio' && (
          <section className="py-24 bg-white dark:bg-gray-900">
            <div className="section-container">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                  <h2 className="heading-2 mb-6">The DJ Ben Murray Story</h2>
                  <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                    From Memphis nightlife pioneer to festival headliner and successful entrepreneur
                  </p>
                </div>

                <div className="prose prose-lg mx-auto dark:prose-invert">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 mb-12">
                    <h3 className="text-2xl font-bold mb-4 text-brand">Early Career & Breakthrough</h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      DJ Ben Murray began his journey in the late 2000s, quickly making a name for himself with his fearless approach to mixing genres. 
                      A local radio profile noted that "Club DJ Ben Murray's calling card is his fearlessness, mixing and mashing up sounds that don't readily go hand-in-hand." 
                      This innovative style set him apart in Memphis's competitive nightlife scene.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <div className="bg-brand/5 dark:bg-brand/10 border-l-4 border-brand p-6 rounded-lg">
                      <h4 className="font-bold text-lg mb-3">Musical Innovation</h4>
                      <p className="text-gray-700 dark:text-gray-300">
                        Known for creating crowd-pleasing mashups and seamlessly blending hip-hop, soft rock, and country into high-energy sets. 
                        His genre-bending approach creates unpredictable party atmospheres that keep dance floors packed.
                      </p>
                    </div>
                    
                    <div className="bg-brand-gold/5 border-l-4 border-brand-gold p-6 rounded-lg">
                      <h4 className="font-bold text-lg mb-3">Business Leadership</h4>
                      <p className="text-gray-700 dark:text-gray-300">
                        Founded M10 DJ Company, mentoring a team of DJs and delivering hundreds of successful events. 
                        Built a reputation for professionalism and versatility that extends far beyond Memphis.
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-900 text-white rounded-2xl p-8 mb-12">
                    <h3 className="text-2xl font-bold mb-4 text-brand-gold">Industry Recognition</h3>
                    <blockquote className="text-xl italic border-l-4 border-brand-gold pl-6 mb-4">
                      "Ben is the best DJ in Memphis. We had him DJ our wedding...he's also a great party/club DJ."
                    </blockquote>
                    <p className="text-gray-300">
                      Consistently praised by clients and peers, Ben Murray has earned recognition as one of Memphis's top DJs. 
                      His ability to "flawlessly blend several genres and create an energetic atmosphere" has made him a sought-after artist 
                      in both the electronic music field and private event entertainment.
                    </p>
                  </div>

                  <div className="text-center">
                    <h3 className="text-2xl font-bold mb-4">Today</h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      Ben Murray continues to balance his nightlife performances with running M10 DJ Company, 
                      pushing creative boundaries while offering polished entertainment services. His residency on Beale Street 
                      and regular festival appearances cement his status as a fixture in Memphis's music community.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Notable Performances Section */}
        {activeTab === 'performances' && (
          <section id="performances" className="py-24 bg-gray-50 dark:bg-gray-800">
            <div className="section-container">
              <div className="text-center mb-16">
                <h2 className="heading-2 mb-6">Notable Performances & Residencies</h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                  From opening for major artists to headlining festivals, Ben Murray's career spans the full spectrum of professional DJ work
                </p>
              </div>

              <div className="max-w-4xl mx-auto">
                <div className="space-y-8">
                  {notablePerformances.map((performance, index) => (
                    <div key={index} className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="md:w-1/4">
                          <div className="bg-brand text-white rounded-lg px-4 py-2 text-center font-bold">
                            {performance.year}
                          </div>
                        </div>
                        
                        <div className="md:w-3/4">
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            {performance.event}
                          </h3>
                          
                          <div className="flex items-center text-brand-gold font-semibold mb-3">
                            <Award className="w-5 h-5 mr-2" />
                            {performance.role}
                          </div>
                          
                          <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                            {performance.description}
                          </p>
                          
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <MapPin className="w-4 h-4 mr-2" />
                            {performance.venue}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center mt-16">
                  <div className="bg-brand-gold/10 border border-brand-gold/30 rounded-2xl p-8">
                    <h3 className="text-2xl font-bold mb-4">Performance Highlights</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                      <div>
                        <div className="text-3xl font-bold text-brand-gold">Major Venues</div>
                        <div className="text-gray-600 dark:text-gray-400">The Fillmore SF, Output NYC</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-brand-gold">Festival Acts</div>
                        <div className="text-gray-600 dark:text-gray-400">Mempho, Minerva Music Fest</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-brand-gold">Beale Street</div>
                        <div className="text-gray-600 dark:text-gray-400">Resident DJ & Tourist Favorite</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Music & Style Section */}
        {activeTab === 'music' && (
          <section className="py-24 bg-white dark:bg-gray-900">
            <div className="section-container">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                  <h2 className="heading-2 mb-6">Music Style & Discography</h2>
                  <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                    An "emotional rollercoaster through a kaleidoscope of sounds" – from heart-pounding bass drops to soaring synths
                  </p>
                </div>

                {/* Music Style */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8">
                    <h3 className="text-2xl font-bold mb-6 flex items-center">
                      <Volume2 className="w-8 h-8 text-brand mr-3" />
                      Musical Style
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="border-l-4 border-brand pl-4">
                        <h4 className="font-bold text-lg">Open Format DJ</h4>
                        <p className="text-gray-700 dark:text-gray-300">
                          Effortlessly combines "styles as disparate as hip-hop, soft rock and country" into high-energy sets
                        </p>
                      </div>
                      
                      <div className="border-l-4 border-brand-gold pl-4">
                        <h4 className="font-bold text-lg">Genre Blending Master</h4>
                        <p className="text-gray-700 dark:text-gray-300">
                          Creates unpredictable party atmospheres by mixing classic hits with current bangers
                        </p>
                      </div>
                      
                      <div className="border-l-4 border-green-500 pl-4">
                        <h4 className="font-bold text-lg">Electronic Foundation</h4>
                        <p className="text-gray-700 dark:text-gray-300">
                          Strong roots in EDM with intense drops and rhythms, incorporating pop and hip-hop grooves
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-brand text-white rounded-2xl p-8">
                    <h3 className="text-2xl font-bold mb-6 flex items-center">
                      <Mic className="w-8 h-8 text-brand-gold mr-3" />
                      Signature Approach
                    </h3>
                    
                    <blockquote className="text-xl italic mb-6 border-l-4 border-brand-gold pl-6">
                      "Club DJ Ben Murray's calling card is his fearlessness, mixing and mashing up sounds that don't readily go hand-in-hand"
                    </blockquote>
                    
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <Zap className="w-5 h-5 text-brand-gold mr-3 mt-1 flex-shrink-0" />
                        Fearless mashup creation and bootleg remixes
                      </li>
                      <li className="flex items-start">
                        <Zap className="w-5 h-5 text-brand-gold mr-3 mt-1 flex-shrink-0" />
                        Seamless genre transitions that surprise audiences
                      </li>
                      <li className="flex items-start">
                        <Zap className="w-5 h-5 text-brand-gold mr-3 mt-1 flex-shrink-0" />
                        Memphis rap integration with pop sing-alongs
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Discography */}
                <div>
                  <h3 className="text-3xl font-bold text-center mb-12">Notable Releases</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {discography.map((track, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="font-bold text-lg text-gray-900 dark:text-white">{track.title}</h4>
                            <p className="text-brand font-semibold">{track.artist}</p>
                          </div>
                          <div className="text-right">
                            <div className="bg-brand-gold text-black px-3 py-1 rounded-full text-sm font-bold">
                              {track.year}
                            </div>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <span className="bg-brand/10 text-brand px-3 py-1 rounded-full text-sm font-semibold">
                            {track.type}
                          </span>
                        </div>
                        
                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                          {track.description}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="text-center mt-12">
                    <p className="text-gray-600 dark:text-gray-400 italic">
                      Many tracks available on SoundCloud, with the "Ben Spins Remix" series showcasing his latest production work
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Current Activities Section */}
        {activeTab === 'current' && (
          <section className="py-24 bg-gray-50 dark:bg-gray-800">
            <div className="section-container">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                  <h2 className="heading-2 mb-6">Current Activities</h2>
                  <p className="text-xl text-gray-600 dark:text-gray-300">
                    Stay updated with DJ Ben Murray's ongoing performances, radio shows, and booking availability
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                  {currentActivities.map((activity, index) => (
                    <div key={index} className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-lg">
                      <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                        {activity.title}
                      </h3>
                      
                      <div className="flex items-center text-brand-gold font-semibold mb-3">
                        <Clock className="w-5 h-5 mr-2" />
                        {activity.schedule}
                      </div>
                      
                      <div className="flex items-center text-brand mb-4">
                        <MapPin className="w-5 h-5 mr-2" />
                        {activity.venue}
                      </div>
                      
                      <p className="text-gray-700 dark:text-gray-300">
                        {activity.description}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Booking Information */}
                <div className="bg-brand text-white rounded-2xl p-8 text-center">
                  <h3 className="text-3xl font-bold mb-6">Ready to Book DJ Ben Murray?</h3>
                  
                  <p className="text-xl mb-8 max-w-2xl mx-auto">
                    Available for weddings, corporate events, festivals, and club appearances. 
                    Book months in advance due to high demand.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button 
                      onClick={scrollToContact}
                      className="bg-brand-gold text-black hover:bg-yellow-400 px-8 py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center"
                    >
                      <Mail className="w-5 h-5 mr-2" />
                      Get Quote
                    </button>
                    <a 
                      href="tel:(901) 410-2020"
                      className="border-2 border-white text-white hover:bg-white hover:text-brand px-8 py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center"
                    >
                      <Phone className="w-5 h-5 mr-2" />
                      Call (901) 410-2020
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Social Media & Contact */}
        <section className="py-24 bg-gray-900 text-white">
          <div className="section-container">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-6">Connect with DJ Ben Murray</h2>
              <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
                Follow along for behind-the-scenes content, new music releases, and upcoming show announcements
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                {mediaProfiles.map((profile, index) => (
                  <div key={index} className={`bg-gray-800 rounded-xl p-6 border ${profile.primary ? 'border-brand-gold' : 'border-gray-700'}`}>
                    <div className="flex items-center mb-4">
                      <profile.icon className={`w-8 h-8 mr-3 ${profile.primary ? 'text-brand-gold' : 'text-gray-400'}`} />
                      <div className="text-left">
                        <h3 className="font-bold text-lg">{profile.platform}</h3>
                        <p className="text-gray-400">{profile.handle}</p>
                      </div>
                      {profile.followers && (
                        <div className="ml-auto text-right">
                          <div className="text-brand-gold font-bold">{profile.followers}</div>
                          <div className="text-xs text-gray-400">Followers</div>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-300 text-sm">{profile.description}</p>
                  </div>
                ))}
              </div>

              <div className="bg-brand/10 border border-brand/30 rounded-2xl p-8">
                <h3 className="text-2xl font-bold mb-4">Professional Bookings</h3>
                <p className="text-gray-300 mb-6">
                  For event bookings, corporate entertainment, and wedding DJ services, contact M10 DJ Company
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a 
                    href="mailto:booking@m10djcompany.com"
                    className="bg-brand-gold text-black hover:bg-yellow-400 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center"
                  >
                    <Mail className="w-5 h-5 mr-2" />
                    booking@m10djcompany.com
                  </a>
                  <Link 
                    href="/pricing"
                    className="border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-black px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center"
                  >
                    <ExternalLink className="w-5 h-5 mr-2" />
                    View Pricing & Packages
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section id="contact" className="py-24 bg-white dark:bg-gray-900">
          <ContactForm />
        </section>

      </main>

      <Footer />
    </>
  );
}