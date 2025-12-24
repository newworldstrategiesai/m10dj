import Head from 'next/head';
import Link from 'next/link';
import { 
  Music, 
  Calendar,
  MapPin,
  Users,
  Award,
  Star,
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
  ArrowLeft,
  Heart
} from 'lucide-react';
import Header from '../../components/company/Header';
import Footer from '../../components/company/Footer';
import { PersonSchema, BreadcrumbListSchema } from '../../components/StandardSchema';

export default function BenMurrayAuthor() {
  const stats = [
    { icon: Clock, value: '15+', label: 'Years Experience' },
    { icon: Calendar, value: '500+', label: 'Events Performed' },
    { icon: Users, value: '15K+', label: 'Social Following' },
    { icon: Trophy, value: '#1', label: 'Memphis DJ' }
  ];

  const expertise = [
    {
      title: 'Wedding Entertainment',
      description: '500+ successful weddings at Memphis\'s premier venues including The Peabody, Memphis Botanic Garden, and Graceland',
      icon: Heart
    },
    {
      title: 'Festival & Club DJ',
      description: 'Featured performer at Mempho Music Festival, Beale Street Music Festival VIP Afterparty, and Beale Street resident DJ',
      icon: Music
    },
    {
      title: 'Music Production',
      description: 'Official remixes for major artists including Ava Max and Shaboozey, featured in The Hype Magazine',
      icon: Headphones
    },
    {
      title: 'Corporate Events',
      description: 'Professional entertainment for Memphis businesses, holiday parties, and corporate celebrations',
      icon: Award
    }
  ];

  const notableAchievements = [
    {
      year: '2022-Present',
      title: 'Beale Street Resident DJ',
      description: 'Weekend residency at Jerry Lee Lewis\' Cafe & Honky Tonk on Memphis\'s iconic Beale Street'
    },
    {
      year: '2021-2022',
      title: 'Mempho Music Festival Featured DJ',
      description: 'Performed alongside national acts, bringing high-energy dance sets to festival crowds'
    },
    {
      year: '2022',
      title: 'Beale Street Music Festival VIP Afterparty',
      description: 'Official VIP after-party DJ for Memphis\'s largest music festival'
    },
    {
      year: '2014',
      title: 'Founded M10 DJ Company',
      description: 'Started Memphis\'s premier DJ company, now serving 500+ events with 5-star ratings'
    }
  ];

  return (
    <>
      <Head>
        <title>Ben Murray - Author & Founder | M10 DJ Company</title>
        <meta 
          name="description" 
          content="Ben Murray is the founder of M10 DJ Company and Memphis's premier DJ with 15+ years of experience. Learn about his expertise in wedding entertainment, festival performances, and music production." 
        />
        <meta name="keywords" content="Ben Murray, DJ Ben Murray, M10 DJ Company founder, Memphis DJ author, wedding DJ expert, Beale Street DJ" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://www.m10djcompany.com/about/ben-murray" />
        
        {/* Open Graph tags */}
        <meta property="og:title" content="Ben Murray - Author & Founder | M10 DJ Company" />
        <meta property="og:description" content="Ben Murray is the founder of M10 DJ Company and Memphis's premier DJ with 15+ years of experience." />
        <meta property="og:url" content="https://www.m10djcompany.com/about/ben-murray" />
        <meta property="og:type" content="profile" />
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Ben Murray - Author & Founder" />
        <meta name="twitter:description" content="Memphis's premier DJ with 15+ years of experience. Founder of M10 DJ Company." />

        {/* Person Schema */}
        <PersonSchema 
          name="Ben Murray"
          jobTitle="Founder & Lead DJ"
          description="Professional DJ and music producer, founder of M10 DJ Company with 15+ years of experience in Memphis"
          url="https://www.m10djcompany.com/about/ben-murray"
          image="https://www.m10djcompany.com/dj-ben-murray.jpg"
          sameAs={[
            "https://www.instagram.com/djbenmurray/",
            "https://soundcloud.com/thebenmurray",
            "https://www.facebook.com/djbenmurray/",
            "https://x.com/djbenmurray"
          ]}
        />

        {/* Breadcrumb Schema */}
        <BreadcrumbListSchema 
          breadcrumbs={[
            { name: "Home", url: "https://www.m10djcompany.com" },
            { name: "About", url: "https://www.m10djcompany.com/about" },
            { name: "Ben Murray", url: "https://www.m10djcompany.com/about/ben-murray" }
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
            <div className="max-w-4xl mx-auto">
              {/* Back Link */}
              <Link 
                href="/about" 
                className="inline-flex items-center text-brand-gold hover:text-white mb-8 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to About
              </Link>

              <div className="text-center mb-12">
                <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                  <span className="block text-white">Ben Murray</span>
                  <span className="block text-brand-gold">Founder & Lead DJ</span>
                </h1>
                
                <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                  Professional DJ and music producer with 15+ years of experience creating unforgettable celebrations in Memphis. 
                  Founder of M10 DJ Company, Beale Street resident DJ, and featured performer at major festivals.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="w-16 h-16 bg-brand-gold rounded-lg flex items-center justify-center mx-auto mb-3">
                        <stat.icon className="w-8 h-8 text-black" />
                      </div>
                      <div className="text-3xl font-bold text-brand-gold mb-1">{stat.value}</div>
                      <div className="text-sm text-gray-300">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="py-20 bg-white dark:bg-gray-900">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="heading-2 text-gray-900 dark:text-white mb-6">
                  About Ben Murray
                </h2>
                <div className="w-24 h-1 bg-brand-gold mx-auto"></div>
              </div>

              <div className="prose prose-lg max-w-none text-gray-600 dark:text-gray-300 mb-12">
                <p className="text-xl leading-relaxed mb-8">
                  Ben Murray is the founder and lead DJ of M10 DJ Company, Memphis's premier event entertainment service. 
                  With over 15 years of professional DJ experience, Ben has performed at 500+ events including weddings, 
                  corporate celebrations, festivals, and club nights throughout the Mid-South.
                </p>

                <p className="leading-relaxed mb-8">
                  Ben's expertise spans multiple areas of entertainment. As a wedding DJ, he's created unforgettable 
                  celebrations at Memphis's most prestigious venues including The Peabody Hotel, Memphis Botanic Garden, 
                  and Graceland. His deep understanding of music curation, crowd reading, and seamless event coordination 
                  has earned him a 5-star average rating and recognition as Memphis's #1 DJ.
                </p>

                <p className="leading-relaxed mb-8">
                  Beyond private events, Ben maintains a weekend residency at Jerry Lee Lewis' Cafe & Honky Tonk on 
                  Beale Street, Memphis's historic entertainment district. He's also been featured as a performer at 
                  major festivals including Mempho Music Festival and the Beale Street Music Festival VIP Afterparty.
                </p>

                <p className="leading-relaxed">
                  As a music producer, Ben has created official remixes for major artists including Ava Max and Shaboozey, 
                  and his work has been featured in The Hype Magazine. He also hosts a weekly mix show on WYXR 91.7 FM 
                  (Revival Radio), showcasing his diverse musical knowledge and passion for discovery.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Expertise Areas */}
        <section className="py-20 bg-gray-50 dark:bg-gray-800">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 text-gray-900 dark:text-white mb-6">
                Areas of Expertise
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Ben's experience spans multiple areas of professional entertainment and music production.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {expertise.map((item, index) => (
                <div key={index} className="bg-white dark:bg-gray-700 rounded-xl p-8 hover:shadow-lg transition-shadow">
                  <div className="w-16 h-16 bg-brand-gold rounded-lg flex items-center justify-center mb-6">
                    <item.icon className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Notable Achievements */}
        <section className="py-20 bg-white dark:bg-gray-900">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 text-gray-900 dark:text-white mb-6">
                Notable Achievements
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Key milestones in Ben's career as a professional DJ and music producer.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="space-y-8">
                {notableAchievements.map((achievement, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0 w-20 text-center">
                      <div className="text-2xl font-bold text-brand-gold mb-2">{achievement.year}</div>
                    </div>
                    <div className="flex-1 ml-8 pb-8 border-b border-gray-200 dark:border-gray-700 last:border-0">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {achievement.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Contact & Social */}
        <section className="py-20 bg-gray-50 dark:bg-gray-800">
          <div className="section-container">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="heading-2 text-gray-900 dark:text-white mb-6">
                Connect with Ben
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Follow Ben's work and connect on social media, or reach out directly for event bookings.
              </p>

              <div className="flex flex-wrap justify-center gap-6 mb-12">
                <a 
                  href="https://www.instagram.com/djbenmurray/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-shadow"
                >
                  <Instagram className="w-5 h-5 mr-2" />
                  Instagram (@djbenmurray)
                </a>
                <a 
                  href="https://soundcloud.com/thebenmurray" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center px-6 py-3 bg-orange-500 text-white rounded-lg hover:shadow-lg transition-shadow"
                >
                  <Headphones className="w-5 h-5 mr-2" />
                  SoundCloud
                </a>
                <a 
                  href="https://www.facebook.com/djbenmurray/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:shadow-lg transition-shadow"
                >
                  <Facebook className="w-5 h-5 mr-2" />
                  Facebook
                </a>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="tel:(901)410-2020" 
                  className="btn-primary text-lg"
                >
                  <Phone className="mr-2 w-5 h-5" />
                  Call (901) 410-2020
                </a>
                <Link 
                  href="/contact"
                  className="btn-outline text-lg"
                >
                  <Mail className="mr-2 w-5 h-5" />
                  Send Message
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Author Content Note */}
        <section className="py-12 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                  About This Author
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Ben Murray is the founder and lead DJ of M10 DJ Company. All content on this website related to 
                  DJ services, wedding entertainment, and event planning is written or reviewed by Ben based on his 
                  15+ years of professional experience in Memphis. Content is regularly updated to reflect current 
                  industry practices, venue partnerships, and service offerings.
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-4">
                  <strong>Last Updated:</strong> December 2025
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

