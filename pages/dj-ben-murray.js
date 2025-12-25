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
  Mail,
  Quote,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import Header from '../components/company/Header';
import Footer from '../components/company/Footer';
import ContactForm from '../components/company/ContactForm';
import { scrollToContact } from '../utils/scroll-helpers';

// Real testimonials from verified clients
const testimonials = [
  {
    client_name: "Quade Nowlin",
    event_type: "Wedding Reception",
    location: "Memphis, TN",
    rating: 5,
    testimonial_text: "Ben was an excellent choice for my wedding. He played everything we asked and built a playlist based on those preferences. He had a better price than everyone else we contacted, and he was more responsive than anyone else we reached out to. He had a professional demeanor the entire time while also being able to have fun. Highly recommended, 10/10",
    event_date: "2024"
  },
  {
    client_name: "Alexis Cameron",
    event_type: "Wedding Reception",
    location: "Memphis, TN",
    rating: 5,
    testimonial_text: "Ben DJ'd our wedding last weekend and I couldn't be more thankful. He was communicative, paid great attention to detail, and ensured everything went smoothly. He had a lapel mic for my officiant and some speeches that made it all seamless and convenient. We had younger kids, grandparents and all the others in between- the music was appropriate and also right up our alley.",
    event_date: "2024"
  },
  {
    client_name: "Dan Roberts",
    event_type: "Wedding Reception",
    location: "Memphis, TN",
    rating: 5,
    testimonial_text: "Ben worked as the DJ at my fairly large (200-250 people) wedding. He was extremely professional with his communication and knew the right questions to ask us about specific music for planned dances and also about what kind of music we thought our attendees would like. I've never been to a wedding where the DJ mixes his own tracks throughout the open dance time, but Ben made that work extremely well!",
    event_date: "2021"
  },
  {
    client_name: "Steven Gordon",
    event_type: "Wedding Reception",
    location: "Memphis, TN",
    rating: 5,
    testimonial_text: "Ben is the best DJ in Memphis. We had him DJ our wedding, very easy to work with and the reception music, lighting, etc was perfect…made sure everybody was enjoying the vibe and accommodated requests. From prior experience, he's also a great party/club DJ.",
    event_date: "2021"
  },
  {
    client_name: "Mary Nguyen",
    event_type: "Wedding Reception",
    location: "Memphis, TN",
    rating: 5,
    testimonial_text: "Ben is AMAZING! He's professional and knows what he's doing. He got us to put together our playlist and combined it with his and made the night magical! I don't know if he's ever done a Vietnamese wedding before, but he rocked it for my brother's.",
    event_date: "2021"
  },
  {
    client_name: "Brad & Sarah Eiseman",
    event_type: "Wedding Reception",
    location: "Memphis, TN",
    rating: 5,
    testimonial_text: "This company is professional, courteous, and kind! Easily one of the best DJs we could have chosen for our wedding which was obviously one of the most important moments in our lives! DJ Ben Murray is a great person and a great DJ and we were lucky to have him.",
    event_date: "2021"
  }
];

const faqs = [
  {
    question: "How do I know if Ben is available for my event date?",
    answer: "Contact us at (901) 410-2020 or use the contact form below. We typically respond within 24 hours with availability. For weddings, we recommend booking 6-12 months in advance, especially for popular dates like Saturday evenings in peak season (May-October)."
  },
  {
    question: "What's included when I book Ben for my wedding?",
    answer: "Ben provides professional DJ services, premium sound system, wireless microphones for ceremonies and speeches, MC services, basic uplighting, and an online planning portal to coordinate your music preferences. He'll handle both ceremony and reception music, and works directly with you to create the perfect playlist."
  },
  {
    question: "Can Ben handle multicultural weddings?",
    answer: "Absolutely. Ben has successfully DJ'd weddings for diverse cultures including Vietnamese weddings, and he's skilled at blending different musical traditions. He'll work with you to understand your cultural music preferences and seamlessly integrate them into your celebration."
  },
  {
    question: "How does Ben work with client music preferences?",
    answer: "Ben builds playlists based on your preferences and combines them with his professional expertise. He uses an online planning portal where you can share must-play songs, do-not-play lists, and general music style preferences. During the event, he reads the room and adjusts the energy level accordingly."
  },
  {
    question: "Does Ben provide equipment for outdoor ceremonies?",
    answer: "Yes. Ben brings all necessary equipment including sound systems suitable for outdoor ceremonies, wireless microphones for officiants, and backup systems. He's experienced with venues throughout Memphis including outdoor spaces at venues like Memphis Botanic Garden and Dixon Gallery & Gardens."
  },
  {
    question: "What makes Ben different from other Memphis DJs?",
    answer: "Ben combines 15+ years of experience with active performance skills from his Beale Street residency and festival appearances. This means he brings both the professionalism needed for weddings and the energy/technical skills from regular live performances. Clients consistently praise his responsiveness, attention to detail, and ability to mix live tracks during events."
  }
];

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
    year: "5★",
    title: "Average Rating",
    description: "Consistently perfect client reviews",
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
          content="DJ Ben Murray - Memphis wedding DJ and founder of M10 DJ Company. 15+ years experience, Beale Street resident DJ, 500+ successful events. Read reviews, view pricing, and book for your Memphis wedding or event." 
        />
        <meta name="keywords" content="DJ Ben Murray, Memphis DJ, best DJ Memphis, M10 DJ Company founder, Beale Street DJ, Memphis wedding DJ, professional DJ Memphis, electronic music Memphis, festival DJ" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://m10djcompany.com/dj-ben-murray" />
        
        {/* Open Graph tags */}
        <meta property="og:title" content="DJ Ben Murray | Memphis's Premier DJ & M10 DJ Company Founder" />
        <meta property="og:description" content="DJ Ben Murray - Memphis wedding DJ with 15+ years experience. Founder of M10 DJ Company, Beale Street resident DJ. 500+ successful events. Read client reviews and book your event." />
        <meta property="og:url" content="https://m10djcompany.com/dj-ben-murray" />
        <meta property="og:type" content="profile" />
        <meta property="og:image" content="https://m10djcompany.com/dj-ben-murray-og.jpg" />
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="DJ Ben Murray | Memphis's Premier DJ" />
        <meta name="twitter:description" content="Memphis wedding DJ with 15+ years experience. Founder of M10 DJ Company, Beale Street resident DJ. 500+ successful events." />
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
        <section className="relative min-h-screen flex items-center bg-gradient-to-br from-gray-900 via-brand-dark to-gray-900 text-white overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-gold/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-gold/3 rounded-full blur-3xl"></div>
          </div>

          <div className="section-container relative z-10 py-32">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                
                {/* Content */}
                <div className={`space-y-8 transform transition-all duration-700 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                  <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10">
                    <div className="w-2 h-2 bg-brand-gold rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-300">Founder • Wedding DJ • Beale Street Resident</span>
                  </div>
                  
                  <div className="space-y-4">
                    <h1 className="text-6xl md:text-8xl font-bold leading-[1.1] tracking-tight">
                      <span className="block bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">DJ Ben</span>
                      <span className="block bg-gradient-to-r from-brand-gold to-yellow-400 bg-clip-text text-transparent">Murray</span>
                    </h1>
                  </div>

                  <p className="text-xl text-gray-300 leading-relaxed max-w-xl">
                    Memphis-born DJ and founder of M10 DJ Company. Combines 15+ years of experience with active performance skills from Beale Street residencies and festival appearances.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button 
                      onClick={scrollToContact}
                      className="group relative px-8 py-4 bg-brand-gold text-black font-semibold rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-brand-gold/50"
                    >
                      <span className="relative z-10 flex items-center justify-center">
                        <Calendar className="w-5 h-5 mr-2" />
                        Book DJ Ben Murray
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-brand-gold opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                    <a 
                      href="#performances" 
                      className="group px-8 py-4 border-2 border-white/20 backdrop-blur-sm bg-white/5 rounded-xl font-semibold text-center transition-all duration-300 hover:border-white/40 hover:bg-white/10"
                    >
                      <span className="flex items-center justify-center">
                        <Play className="w-5 h-5 mr-2" />
                        View Performances
                      </span>
                    </a>
                  </div>
                </div>

                {/* Profile Image Area */}
                <div className={`transform transition-all duration-700 delay-200 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                  <div className="relative">
                    {/* Glass morphism card */}
                    <div className="aspect-square relative rounded-3xl overflow-hidden backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 shadow-2xl">
                      {/* Animated gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-gold/20 via-transparent to-brand/20 animate-pulse"></div>
                      
                      {/* Content */}
                      <div className="relative h-full flex flex-col items-center justify-center text-center p-8">
                        <div className="mb-6">
                          <Music className="w-32 h-32 text-brand-gold/80 mx-auto animate-pulse" style={{ animationDuration: '2s' }} />
                        </div>
                        <p className="text-brand-gold font-semibold text-xl mb-2">Professional Photo</p>
                        <p className="text-gray-400 text-sm">Coming Soon</p>
                      </div>
                    </div>
                    
                    {/* Floating stats - Glass morphism */}
                    <div className="absolute -bottom-4 -left-4 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 shadow-xl hover:scale-105 transition-transform duration-300">
                      <div className="flex items-center gap-2 text-brand-gold">
                        <Star className="w-5 h-5 fill-current" />
                        <span className="font-bold text-sm">15K+ Followers</span>
                      </div>
                    </div>
                    
                    <div className="absolute -top-4 -right-4 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 shadow-xl hover:scale-105 transition-transform duration-300">
                      <div className="flex items-center gap-2 text-brand-gold">
                        <Award className="w-5 h-5 fill-current" />
                        <span className="font-bold text-sm">5★ Rated</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* Achievement Stats */}
        <section className="relative py-20 bg-gradient-to-b from-gray-900 to-black text-white overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(252,186,0,0.05),transparent_50%)]"></div>
          <div className="section-container relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {achievements.map((achievement, index) => (
                <div 
                  key={index} 
                  className="group relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 transition-all duration-500 hover:bg-white/10 hover:border-brand-gold/30 hover:scale-105 hover:shadow-2xl hover:shadow-brand-gold/10"
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-gold/0 to-brand/0 group-hover:from-brand-gold/5 group-hover:to-brand/5 rounded-2xl transition-all duration-500"></div>
                  <div className="relative text-center">
                    <div className="inline-flex p-3 rounded-xl bg-brand-gold/10 mb-4 group-hover:bg-brand-gold/20 transition-colors duration-300">
                      <achievement.icon className="w-8 h-8 text-brand-gold" />
                    </div>
                    <div className="text-5xl font-bold text-brand-gold mb-2 tracking-tight">{achievement.year}</div>
                    <div className="text-lg font-semibold mb-2 text-gray-200">{achievement.title}</div>
                    <div className="text-gray-400 text-sm">{achievement.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Navigation Tabs */}
        <section className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-800/50">
          <div className="section-container">
            <div className="flex flex-wrap justify-center gap-2 py-4">
              {[
                { id: 'bio', label: 'About', icon: Users },
                { id: 'testimonials', label: 'Reviews', icon: Star },
                { id: 'performances', label: 'Performances', icon: Music },
                { id: 'music', label: 'Music', icon: Headphones },
                { id: 'faq', label: 'FAQ', icon: HelpCircle },
                { id: 'current', label: 'Schedule', icon: Calendar }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'text-brand-gold bg-brand-gold/10'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {activeTab === tab.id && (
                    <span className="absolute inset-0 rounded-xl bg-brand-gold/5 border border-brand-gold/20"></span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Biography Section */}
        {activeTab === 'bio' && (
          <section className="py-24 bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-900/50">
            <div className="section-container">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-20">
                  <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    About DJ Ben Murray
                  </h2>
                  <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    Memphis-born DJ, music producer, and founder of M10 DJ Company
                  </p>
                </div>

                <div className="space-y-8">
                  <div className="backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 rounded-3xl p-10 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
                    <h3 className="text-2xl font-bold mb-4 text-brand">The Memphis Connection</h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                      Born and raised in Memphis, Ben Murray started DJing in the late 2000s and quickly established himself in the city's nightlife scene. 
                      His approach to mixing caught attention early—a local radio profile described him as having "fearlessness, mixing and mashing up sounds that don't readily go hand-in-hand."
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      This genre-blending style wasn't just a gimmick; it became his signature. Ben became known for seamlessly transitioning between 
                      hip-hop, soft rock, country, and electronic music in ways that kept dance floors packed and audiences engaged.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    <div className="backdrop-blur-sm bg-gradient-to-br from-brand/5 to-brand/10 dark:from-brand/10 dark:to-brand/20 border-l-4 border-brand p-6 rounded-2xl hover:shadow-lg transition-all duration-300">
                      <h4 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">Nightlife & Festival Experience</h4>
                      <p className="text-gray-700 dark:text-gray-300 mb-3">
                        Ben's regular performances at Beale Street venues and appearances at festivals like Mempho Music Festival and Beale Street Music Festival 
                        keep his live mixing skills sharp. This translates directly to wedding and event work—he's comfortable mixing tracks live, reading crowds, 
                        and adapting energy levels in real-time.
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 text-sm">
                        <strong>Current Residency:</strong> Jerry Lee Lewis' Cafe & Honky Tonk on Beale Street (Friday & Saturday nights)
                      </p>
                    </div>
                    
                    <div className="backdrop-blur-sm bg-gradient-to-br from-brand-gold/5 to-brand-gold/10 dark:from-brand-gold/10 dark:to-brand-gold/20 border-l-4 border-brand-gold p-6 rounded-2xl hover:shadow-lg transition-all duration-300">
                      <h4 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">M10 DJ Company</h4>
                      <p className="text-gray-700 dark:text-gray-300 mb-3">
                        In 2014, Ben founded M10 DJ Company to provide professional DJ services for weddings and private events throughout Memphis. 
                        The company has since served 500+ events, working at premier venues including The Peabody, Memphis Botanic Garden, Dixon Gallery & Gardens, 
                        and many others across the metro area.
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 text-sm">
                        <strong>Focus:</strong> Professional event entertainment with the energy and technical skills from active performance work
                      </p>
                    </div>
                  </div>

                  <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-black text-white rounded-3xl p-10 mb-12 border border-gray-800 shadow-2xl">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(252,186,0,0.1),transparent_50%)]"></div>
                    <div className="relative">
                      <h3 className="text-2xl font-bold mb-6 text-brand-gold">What Clients Say</h3>
                      <blockquote className="text-xl italic border-l-4 border-brand-gold pl-6 mb-6 text-gray-200">
                        "Ben is the best DJ in Memphis. We had him DJ our wedding, very easy to work with and the reception music, lighting, etc was perfect…made sure everybody was enjoying the vibe and accommodated requests."
                      </blockquote>
                      <p className="text-gray-400 text-sm mb-6">— Steven Gordon, Wedding Client</p>
                      <p className="text-gray-300 leading-relaxed">
                        Clients consistently praise Ben's responsiveness, professionalism, and ability to handle events from intimate gatherings to large weddings with 200+ guests. 
                        He's known for asking the right questions during planning, providing detailed communication, and delivering seamless execution on event day.
                      </p>
                    </div>
                  </div>

                  <div className="backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 rounded-3xl p-10 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                    <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Memphis Venue Experience</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                      Ben has performed at and understands the technical requirements of Memphis's most popular wedding venues, including:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                        <CheckCircle className="w-5 h-5 text-brand-gold flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">The Peabody Hotel</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                        <CheckCircle className="w-5 h-5 text-brand-gold flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">Memphis Botanic Garden</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                        <CheckCircle className="w-5 h-5 text-brand-gold flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">Dixon Gallery & Gardens</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                        <CheckCircle className="w-5 h-5 text-brand-gold flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">The Columns</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                        <CheckCircle className="w-5 h-5 text-brand-gold flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">Annesdale Mansion</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                        <CheckCircle className="w-5 h-5 text-brand-gold flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">Graceland venues</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                        <CheckCircle className="w-5 h-5 text-brand-gold flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">And 20+ more venues</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center pt-8">
                    <h3 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Ready to Work Together?</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-8 max-w-2xl mx-auto">
                      Ben balances his active performance schedule with wedding and event bookings throughout the year. 
                      Whether you're planning a 50-person intimate wedding or a 250-person celebration, he brings the same 
                      attention to detail and energy that has made him a trusted choice for Memphis couples and event planners.
                    </p>
                    <Link 
                      href="/pricing"
                      className="inline-flex items-center gap-2 px-8 py-4 bg-brand-gold text-black hover:bg-yellow-400 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-brand-gold/50"
                    >
                      View Pricing & Packages
                      <ExternalLink className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Testimonials Section */}
        {activeTab === 'testimonials' && (
          <section className="py-24 bg-gray-50 dark:bg-gray-800">
            <div className="section-container">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                  <h2 className="heading-2 mb-6">What Clients Say About Ben</h2>
                  <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                    Real reviews from Memphis couples and event planners who have worked with DJ Ben Murray
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                  {testimonials.map((testimonial, index) => (
                    <div 
                      key={index} 
                      className="group relative backdrop-blur-sm bg-white/60 dark:bg-gray-900/60 rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="absolute top-4 right-4">
                        <Quote className="w-12 h-12 text-brand-gold/10 group-hover:text-brand-gold/20 transition-colors duration-300" />
                      </div>
                      
                      <div className="relative">
                        <div className="flex items-center gap-1 mb-4">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="w-5 h-5 text-brand-gold fill-current" />
                          ))}
                        </div>
                        
                        <blockquote className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed text-lg relative z-10">
                          "{testimonial.testimonial_text}"
                        </blockquote>
                        
                        <div className="border-t border-gray-200/50 dark:border-gray-700/50 pt-4">
                          <div className="font-bold text-gray-900 dark:text-white text-lg">{testimonial.client_name}</div>
                          <div className="text-brand text-sm font-semibold">{testimonial.event_type}</div>
                          <div className="text-gray-600 dark:text-gray-400 text-sm">{testimonial.location} • {testimonial.event_date}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="relative overflow-hidden bg-gradient-to-br from-brand to-brand-dark text-white rounded-3xl p-10 text-center border border-brand-gold/20 shadow-2xl">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(252,186,0,0.15),transparent_70%)]"></div>
                  <div className="relative">
                    <h3 className="text-3xl font-bold mb-4">Ready to Join These Happy Clients?</h3>
                    <p className="text-lg mb-8 max-w-2xl mx-auto text-gray-200">
                      Contact Ben today to discuss your event and see why Memphis couples consistently choose him for their most important celebrations.
                    </p>
                    <button 
                      onClick={scrollToContact}
                      className="px-8 py-4 bg-brand-gold text-black hover:bg-yellow-400 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-brand-gold/50"
                    >
                      Get Your Free Quote
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Notable Performances Section */}
        {activeTab === 'performances' && (
          <section id="performances" className="py-24 bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-900/50">
            <div className="section-container">
              <div className="text-center mb-20">
                <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Notable Performances & Residencies
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                  From opening for major artists to headlining festivals, Ben Murray's career spans the full spectrum of professional DJ work
                </p>
              </div>

              <div className="max-w-4xl mx-auto">
                <div className="space-y-6">
                  {notablePerformances.map((performance, index) => (
                    <div 
                      key={index} 
                      className="group backdrop-blur-sm bg-white/60 dark:bg-gray-900/60 rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-2xl hover:scale-[1.01] transition-all duration-300"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="md:w-1/4">
                          <div className="inline-block bg-gradient-to-br from-brand to-brand-dark text-white rounded-xl px-5 py-3 text-center font-bold shadow-lg">
                            {performance.year}
                          </div>
                        </div>
                        
                        <div className="md:w-3/4 space-y-3">
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {performance.event}
                          </h3>
                          
                          <div className="flex items-center gap-2 text-brand-gold font-semibold">
                            <Award className="w-5 h-5" />
                            <span>{performance.role}</span>
                          </div>
                          
                          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            {performance.description}
                          </p>
                          
                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-500">
                            <MapPin className="w-4 h-4" />
                            <span>{performance.venue}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center mt-16">
                  <div className="relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-brand-gold/10 to-brand/10 border border-brand-gold/20 rounded-3xl p-10 shadow-xl">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(252,186,0,0.1),transparent_70%)]"></div>
                    <div className="relative">
                      <h3 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Performance Experience</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        <div className="space-y-2">
                          <div className="text-3xl font-bold text-brand-gold">Memphis Venues</div>
                          <div className="text-gray-600 dark:text-gray-400 text-sm">Minglewood Hall, New Daisy Theatre, Beale Street clubs</div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-3xl font-bold text-brand-gold">Festival Acts</div>
                          <div className="text-gray-600 dark:text-gray-400 text-sm">Mempho Music Festival, Beale Street Music Festival, Minerva Music Fest</div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-3xl font-bold text-brand-gold">Beale Street</div>
                          <div className="text-gray-600 dark:text-gray-400 text-sm">Active Resident DJ at Jerry Lee Lewis' Cafe & Honky Tonk</div>
                        </div>
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
          <section className="py-24 bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-900/50">
            <div className="section-container">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-20">
                  <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    Music Style & Discography
                  </h2>
                  <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                    An "emotional rollercoaster through a kaleidoscope of sounds" – from heart-pounding bass drops to soaring synths
                  </p>
                </div>

                {/* Music Style */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">
                  <div className="backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-gray-900 dark:text-white">
                      <div className="p-2 bg-brand/10 rounded-xl">
                        <Volume2 className="w-6 h-6 text-brand" />
                      </div>
                      Musical Style
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="border-l-4 border-brand pl-4 py-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-r-xl transition-colors duration-200">
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-1">Open Format DJ</h4>
                        <p className="text-gray-600 dark:text-gray-400">
                          Effortlessly combines "styles as disparate as hip-hop, soft rock and country" into high-energy sets
                        </p>
                      </div>
                      
                      <div className="border-l-4 border-brand-gold pl-4 py-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-r-xl transition-colors duration-200">
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-1">Genre Blending Master</h4>
                        <p className="text-gray-600 dark:text-gray-400">
                          Creates unpredictable party atmospheres by mixing classic hits with current bangers
                        </p>
                      </div>
                      
                      <div className="border-l-4 border-brand pl-4 py-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-r-xl transition-colors duration-200">
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-1">Electronic Foundation</h4>
                        <p className="text-gray-600 dark:text-gray-400">
                          Strong roots in EDM with intense drops and rhythms, incorporating pop and hip-hop grooves
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="relative overflow-hidden bg-gradient-to-br from-brand to-brand-dark text-white rounded-3xl p-8 border border-brand-gold/20 shadow-xl">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(252,186,0,0.15),transparent_50%)]"></div>
                    <div className="relative">
                      <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <div className="p-2 bg-brand-gold/20 rounded-xl">
                          <Mic className="w-6 h-6 text-brand-gold" />
                        </div>
                        Signature Approach
                      </h3>
                      
                      <blockquote className="text-xl italic mb-6 border-l-4 border-brand-gold pl-6 text-gray-100">
                        "Club DJ Ben Murray's calling card is his fearlessness, mixing and mashing up sounds that don't readily go hand-in-hand"
                      </blockquote>
                      
                      <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                          <Zap className="w-5 h-5 text-brand-gold mt-1 flex-shrink-0" />
                          <span className="text-gray-200">Fearless mashup creation and bootleg remixes</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <Zap className="w-5 h-5 text-brand-gold mt-1 flex-shrink-0" />
                          <span className="text-gray-200">Seamless genre transitions that surprise audiences</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <Zap className="w-5 h-5 text-brand-gold mt-1 flex-shrink-0" />
                          <span className="text-gray-200">Memphis rap integration with pop sing-alongs</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Discography */}
                <div>
                  <h3 className="text-3xl font-bold text-center mb-12">Notable Releases</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {discography.map((track, index) => (
                      <div 
                        key={index} 
                        className="group backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:border-brand-gold/30 hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{track.title}</h4>
                            <p className="text-brand font-semibold">{track.artist}</p>
                          </div>
                          <div className="ml-4">
                            <div className="bg-brand-gold text-black px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">
                              {track.year}
                            </div>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <span className="inline-block bg-brand/10 text-brand px-3 py-1 rounded-full text-sm font-semibold">
                            {track.type}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
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

        {/* FAQ Section */}
        {activeTab === 'faq' && (
          <section className="py-24 bg-white dark:bg-gray-900">
            <div className="section-container">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                  <h2 className="heading-2 mb-6">Frequently Asked Questions</h2>
                  <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                    Common questions about booking DJ Ben Murray for your Memphis event
                  </p>
                </div>

                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <div 
                      key={index} 
                      className="group backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:border-brand-gold/30 hover:shadow-lg transition-all duration-300 cursor-pointer"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-start gap-3">
                        <HelpCircle className="w-5 h-5 text-brand-gold mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
                        <span className="flex-1">{faq.question}</span>
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed pl-8">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-12 relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-brand-gold/10 to-brand/10 border border-brand-gold/20 rounded-3xl p-10 text-center shadow-xl">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(252,186,0,0.1),transparent_70%)]"></div>
                  <div className="relative">
                    <h3 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Still Have Questions?</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                      Ben is happy to discuss your event details and answer any questions you have about his services, 
                      availability, or how he can make your celebration unforgettable.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <button 
                        onClick={scrollToContact}
                        className="group px-8 py-4 bg-brand-gold text-black hover:bg-yellow-400 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-brand-gold/50"
                      >
                        Contact Ben
                      </button>
                      <a 
                        href="tel:(901) 410-2020"
                        className="px-8 py-4 border-2 border-brand text-brand hover:bg-brand hover:text-white rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105"
                      >
                        Call (901) 410-2020
                      </a>
                    </div>
                  </div>
                </div>

                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300">
                    <h4 className="font-bold text-xl mb-4 text-gray-900 dark:text-white">Helpful Resources</h4>
                    <ul className="space-y-3">
                      <li>
                        <Link href="/pricing" className="group flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all duration-200">
                          <ExternalLink className="w-4 h-4 text-brand-gold group-hover:scale-110 transition-transform duration-200" />
                          <span className="text-gray-700 dark:text-gray-300 group-hover:text-brand-gold transition-colors duration-200">Wedding DJ Pricing Guide</span>
                        </Link>
                      </li>
                      <li>
                        <Link href="/blog/memphis-wedding-dj-cost-guide-2025" className="group flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all duration-200">
                          <ExternalLink className="w-4 h-4 text-brand-gold group-hover:scale-110 transition-transform duration-200" />
                          <span className="text-gray-700 dark:text-gray-300 group-hover:text-brand-gold transition-colors duration-200">Memphis Wedding DJ Cost Guide</span>
                        </Link>
                      </li>
                      <li>
                        <Link href="/blog/top-memphis-wedding-venues-2025" className="group flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all duration-200">
                          <ExternalLink className="w-4 h-4 text-brand-gold group-hover:scale-110 transition-transform duration-200" />
                          <span className="text-gray-700 dark:text-gray-300 group-hover:text-brand-gold transition-colors duration-200">Top Memphis Wedding Venues</span>
                        </Link>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300">
                    <h4 className="font-bold text-xl mb-4 text-gray-900 dark:text-white">Booking Process</h4>
                    <ol className="space-y-3">
                      {[
                        "Contact us with your event date and details",
                        "We'll check availability and send a custom quote",
                        "Schedule a consultation to discuss your music preferences",
                        "Sign contract and secure your date with a deposit",
                        "Use our online portal to plan your music in detail"
                      ].map((step, index) => (
                        <li key={index} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all duration-200">
                          <span className="flex-shrink-0 w-6 h-6 bg-brand-gold/10 text-brand-gold rounded-full flex items-center justify-center text-sm font-bold">{index + 1}</span>
                          <span className="text-gray-700 dark:text-gray-300 pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Current Activities Section */}
        {activeTab === 'current' && (
          <section className="py-24 bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-900/50">
            <div className="section-container">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-20">
                  <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    Current Activities
                  </h2>
                  <p className="text-xl text-gray-600 dark:text-gray-400">
                    Stay updated with DJ Ben Murray's ongoing performances, radio shows, and booking availability
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                  {currentActivities.map((activity, index) => (
                    <div 
                      key={index} 
                      className="group backdrop-blur-sm bg-white/60 dark:bg-gray-900/60 rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-2xl hover:scale-[1.02] hover:border-brand-gold/30 transition-all duration-300"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                        {activity.title}
                      </h3>
                      
                      <div className="flex items-center gap-2 text-brand-gold font-semibold mb-3">
                        <Clock className="w-5 h-5" />
                        <span>{activity.schedule}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-brand mb-4">
                        <MapPin className="w-5 h-5" />
                        <span>{activity.venue}</span>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        {activity.description}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Booking Information */}
                <div className="relative overflow-hidden bg-gradient-to-br from-brand to-brand-dark text-white rounded-3xl p-10 text-center border border-brand-gold/20 shadow-2xl">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(252,186,0,0.15),transparent_70%)]"></div>
                  <div className="relative">
                    <h3 className="text-4xl font-bold mb-6">Ready to Book DJ Ben Murray?</h3>
                    
                    <p className="text-xl mb-10 max-w-2xl mx-auto text-gray-200">
                      Available for weddings, corporate events, festivals, and club appearances. 
                      Book months in advance due to high demand.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <button 
                        onClick={scrollToContact}
                        className="group px-8 py-4 bg-brand-gold text-black hover:bg-yellow-400 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-brand-gold/50 flex items-center justify-center gap-2"
                      >
                        <Mail className="w-5 h-5" />
                        Get Quote
                      </button>
                      <a 
                        href="tel:(901) 410-2020"
                        className="px-8 py-4 border-2 border-white/30 backdrop-blur-sm bg-white/5 hover:bg-white/10 hover:border-white/50 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                      >
                        <Phone className="w-5 h-5" />
                        Call (901) 410-2020
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Social Media & Contact */}
        <section className="relative py-24 bg-gradient-to-b from-gray-900 to-black text-white overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(252,186,0,0.05),transparent_50%)]"></div>
          <div className="section-container relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Connect with DJ Ben Murray</h2>
              <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
                Follow along for behind-the-scenes content, new music releases, and upcoming show announcements
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                {mediaProfiles.map((profile, index) => (
                  <div 
                    key={index} 
                    className={`group backdrop-blur-xl bg-white/5 rounded-2xl p-6 border transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                      profile.primary 
                        ? 'border-brand-gold/30 hover:border-brand-gold/50 hover:bg-white/10' 
                        : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center mb-4">
                      <div className={`p-3 rounded-xl ${profile.primary ? 'bg-brand-gold/10' : 'bg-white/5'} group-hover:scale-110 transition-transform duration-300`}>
                        <profile.icon className={`w-6 h-6 ${profile.primary ? 'text-brand-gold' : 'text-gray-400'}`} />
                      </div>
                      <div className="text-left ml-4 flex-1">
                        <h3 className="font-bold text-lg">{profile.platform}</h3>
                        <p className="text-gray-400 text-sm">{profile.handle}</p>
                      </div>
                      {profile.followers && (
                        <div className="text-right">
                          <div className="text-brand-gold font-bold">{profile.followers}</div>
                          <div className="text-xs text-gray-500">Followers</div>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm text-left">{profile.description}</p>
                  </div>
                ))}
              </div>

              <div className="relative overflow-hidden backdrop-blur-xl bg-white/5 border border-brand-gold/20 rounded-3xl p-10 shadow-xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(252,186,0,0.1),transparent_70%)]"></div>
                <div className="relative">
                  <h3 className="text-3xl font-bold mb-4">Professional Bookings</h3>
                  <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                    For event bookings, corporate entertainment, and wedding DJ services, contact M10 DJ Company
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a 
                      href="mailto:booking@m10djcompany.com"
                      className="group px-8 py-4 bg-brand-gold text-black hover:bg-yellow-400 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-brand-gold/50 flex items-center justify-center gap-2"
                    >
                      <Mail className="w-5 h-5" />
                      booking@m10djcompany.com
                    </a>
                    <Link 
                      href="/pricing"
                      className="px-8 py-4 border-2 border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-black rounded-xl font-semibold transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-5 h-5" />
                      View Pricing & Packages
                    </Link>
                  </div>
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