import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Music, 
  Heart, 
  Star, 
  Play, 
  ChevronRight, 
  CheckCircle,
  Users,
  Calendar,
  Volume2,
  Sparkles,
  Award,
  Download,
  Clock
} from 'lucide-react';
import Header from '../../components/company/Header';
import Footer from '../../components/company/Footer';
import ContactForm from '../../components/company/ContactForm';
import { scrollToContact } from '../../utils/scroll-helpers';

const songCategories = [
  {
    title: "Processional Songs",
    description: "Beautiful songs for walking down the aisle",
    icon: Heart,
    songs: [
      { title: "A Thousand Years", artist: "Christina Perri", popularity: "High" },
      { title: "All of Me", artist: "John Legend", popularity: "High" },
      { title: "Perfect", artist: "Ed Sheeran", popularity: "High" },
      { title: "Marry Me", artist: "Train", popularity: "Medium" },
      { title: "Canon in D", artist: "Pachelbel", popularity: "Medium" },
      { title: "Here Comes the Sun", artist: "The Beatles", popularity: "Medium" }
    ]
  },
  {
    title: "First Dance Songs",
    description: "Romantic choices for your first dance as married couple",
    icon: Users,
    songs: [
      { title: "Thinking Out Loud", artist: "Ed Sheeran", popularity: "High" },
      { title: "All of Me", artist: "John Legend", popularity: "High" },
      { title: "Perfect", artist: "Ed Sheeran", popularity: "High" },
      { title: "At Last", artist: "Etta James", popularity: "Medium" },
      { title: "The Way You Look Tonight", artist: "Frank Sinatra", popularity: "Medium" },
      { title: "Make You Feel My Love", artist: "Adele", popularity: "Medium" }
    ]
  },
  {
    title: "Memphis Local Favorites",
    description: "Songs with Memphis connections that always get the crowd moving",
    icon: Star,
    songs: [
      { title: "Sweet Caroline", artist: "Neil Diamond", popularity: "High" },
      { title: "Walking in Memphis", artist: "Marc Cohn", popularity: "High" },
      { title: "Love Me Tender", artist: "Elvis Presley", popularity: "High" },
      { title: "Can't Help Myself", artist: "The Four Tops", popularity: "Medium" },
      { title: "Mustang Sally", artist: "Wilson Pickett", popularity: "Medium" },
      { title: "Green Onions", artist: "Booker T. & the M.G.'s", popularity: "High" }
    ]
  },
  {
    title: "Reception Dance Hits",
    description: "Guaranteed crowd-pleasers for Memphis wedding receptions",
    icon: Music,
    songs: [
      { title: "Uptown Funk", artist: "Bruno Mars", popularity: "High" },
      { title: "Can't Stop the Feeling", artist: "Justin Timberlake", popularity: "High" },
      { title: "September", artist: "Earth, Wind & Fire", popularity: "High" },
      { title: "I Wanna Dance with Somebody", artist: "Whitney Houston", popularity: "High" },
      { title: "Mr. Brightside", artist: "The Killers", popularity: "Medium" },
      { title: "Don't Stop Me Now", artist: "Queen", popularity: "High" }
    ]
  },
  {
    title: "Father-Daughter Dance",
    description: "Meaningful songs for the father-daughter dance",
    icon: Heart,
    songs: [
      { title: "My Girl", artist: "The Temptations", popularity: "High" },
      { title: "Isn't She Lovely", artist: "Stevie Wonder", popularity: "High" },
      { title: "Butterfly Kisses", artist: "Bob Carlisle", popularity: "Medium" },
      { title: "I Hope You Dance", artist: "Lee Ann Womack", popularity: "Medium" },
      { title: "The Way You Look Tonight", artist: "Tony Bennett", popularity: "Medium" },
      { title: "Daddy's Little Girl", artist: "The Mills Brothers", popularity: "Low" }
    ]
  },
  {
    title: "Mother-Son Dance",
    description: "Special songs for the mother-son dance moment",
    icon: Heart,
    songs: [
      { title: "A Song for Mama", artist: "Boyz II Men", popularity: "High" },
      { title: "You'll Be in My Heart", artist: "Phil Collins", popularity: "High" },
      { title: "I Hope You Dance", artist: "Lee Ann Womack", popularity: "Medium" },
      { title: "The Mother", artist: "Brandi Carlile", popularity: "Medium" },
      { title: "You Raise Me Up", artist: "Josh Groban", popularity: "Medium" },
      { title: "Mama", artist: "Spice Girls", popularity: "Low" }
    ]
  }
];

const genreBreakdown = [
  { genre: "Pop/Contemporary", percentage: 40, description: "Modern hits that appeal to all ages" },
  { genre: "Classic Soul/R&B", percentage: 25, description: "Memphis musical heritage with Motown classics" },
  { genre: "Rock Classics", percentage: 20, description: "Timeless rock songs that get everyone moving" },
  { genre: "Country", percentage: 10, description: "Tennessee favorites and modern country hits" },
  { genre: "Jazz/Standards", percentage: 5, description: "Elegant choices for cocktail hour and dinner" }
];

const playlistTips = [
  {
    icon: Users,
    title: "Know Your Audience",
    description: "Memphis weddings often span multiple generations. Include something for grandparents, parents, and young guests."
  },
  {
    icon: Clock,
    title: "Consider the Timeline",
    description: "Slow songs for dinner, high-energy hits for dancing, and meaningful ballads for special moments."
  },
  {
    icon: Star,
    title: "Add Personal Touches",
    description: "Include songs that tell your love story or represent shared memories and experiences."
  },
  {
    icon: Volume2,
    title: "Trust Your Memphis DJ",
    description: "Professional DJs know how to read the room and adjust the music to keep your dance floor packed."
  }
];

const doNotPlayList = [
  "Songs with explicit lyrics",
  "Breakup songs or sad ballads during dancing",
  "Very niche music only you enjoy",
  "Songs that might offend older family members",
  "Overly long instrumental solos",
  "Music with negative associations"
];

export default function MemphisWeddingSongs2025() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <>
      <Head>
        <title>Best Memphis Wedding Songs 2025 | Memphis Wedding DJ Playlist Ideas</title>
        <meta 
          name="description" 
          content="Complete guide to Memphis wedding songs for 2025! Top processional, first dance, and reception hits. Local Memphis favorites plus modern classics. Get your perfect wedding playlist!" 
        />
        <meta name="keywords" content="Memphis wedding songs, Memphis wedding playlist, best wedding songs Memphis, wedding music Memphis, Memphis wedding DJ songs, Tennessee wedding music, processional songs Memphis" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://m10djcompany.com/blog/memphis-wedding-songs-2025" />
        
        {/* Open Graph tags */}
        <meta property="og:title" content="Best Memphis Wedding Songs 2025 | Memphis Wedding DJ Playlist Ideas" />
        <meta property="og:description" content="Complete guide to Memphis wedding songs with local favorites and modern classics for your perfect Tennessee wedding playlist." />
        <meta property="og:url" content="https://m10djcompany.com/blog/memphis-wedding-songs-2025" />
        <meta property="og:type" content="article" />
        <meta property="og:image" content="https://m10djcompany.com/logo-static.jpg" />
        
        {/* Article Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              "headline": "Best Memphis Wedding Songs 2025",
              "description": "Complete guide to Memphis wedding songs and playlist ideas for Tennessee couples",
              "author": {
                "@type": "Organization",
                "name": "M10 DJ Company"
              },
              "publisher": {
                "@type": "Organization", 
                "name": "M10 DJ Company",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://m10djcompany.com/logo-static.jpg"
                }
              },
              "datePublished": "2024-12-01",
              "dateModified": "2024-12-01"
            })
          }}
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
                <Music className="w-8 h-8 text-brand-gold mr-3" />
                <span className="text-brand-gold font-semibold">2025 Wedding Music Guide</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-8 leading-tight">
                <span className="block text-white">Best Memphis</span>
                <span className="block text-gradient">Wedding Songs 2025</span>
              </h1>
              
              <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                The ultimate guide to Memphis wedding music! Discover the perfect songs for your Tennessee wedding, 
                from processional classics to reception hits, including local Memphis favorites that always pack the dance floor.
              </p>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold mb-4">What's Inside</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-brand-gold mr-3" />
                    <span>150+ song recommendations</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-brand-gold mr-3" />
                    <span>Memphis local favorites</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-brand-gold mr-3" />
                    <span>Genre breakdowns</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-brand-gold mr-3" />
                    <span>Professional DJ tips</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Song Categories Section */}
        <section className="py-24 bg-white">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 mb-4">Memphis Wedding Song Categories</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Browse our expertly curated categories of Memphis wedding songs, from ceremony music to reception hits. 
                Each category includes popularity ratings based on Memphis wedding receptions.
              </p>
            </div>

            <div className="mb-8">
              <div className="flex flex-wrap justify-center gap-4">
                {songCategories.map((category, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveCategory(index)}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                      activeCategory === index
                        ? 'bg-brand text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-w-5xl mx-auto">
              <div className="bg-gray-50 rounded-2xl p-8">
                <div className="flex items-center mb-6">
                  {(() => {
                    const IconComponent = songCategories[activeCategory].icon;
                    return <IconComponent className="w-8 h-8 text-brand mr-4" />;
                  })()}
                  <div>
                    <h3 className="text-2xl font-bold">{songCategories[activeCategory].title}</h3>
                    <p className="text-gray-600">{songCategories[activeCategory].description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {songCategories[activeCategory].songs.map((song, songIndex) => (
                    <div key={songIndex} className="bg-white rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">{song.title}</div>
                        <div className="text-gray-600">{song.artist}</div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        song.popularity === 'High' ? 'bg-green-100 text-green-800' :
                        song.popularity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {song.popularity}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Genre Breakdown */}
        <section className="py-24 bg-gray-50">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 mb-4">Memphis Wedding Music by Genre</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Understanding the perfect genre mix for Memphis weddings helps create a playlist that keeps 
                every generation of your family and friends on the dance floor.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              {genreBreakdown.map((genre, index) => (
                <div key={index} className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-bold">{genre.genre}</h3>
                      <p className="text-gray-600">{genre.description}</p>
                    </div>
                    <div className="text-2xl font-bold text-brand">{genre.percentage}%</div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-brand h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${genre.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <p className="text-gray-600 mb-6">
                Want help creating the perfect Memphis wedding playlist? Our professional DJs have 10+ years of experience reading Memphis crowds.
              </p>
              <button onClick={scrollToContact} className="btn-primary">
                Get Professional Playlist Help
                <Music className="ml-2 w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

        {/* Memphis Local Favorites */}
        <section className="py-24 bg-brand text-white">
          <div className="section-container">
            <div className="max-w-4xl mx-auto text-center">
              <Star className="w-16 h-16 text-white mx-auto mb-6" />
              <h2 className="text-4xl font-bold mb-6">Memphis Musical Heritage</h2>
              <p className="text-xl mb-12 opacity-90 max-w-3xl mx-auto">
                Memphis is the birthplace of rock 'n' roll and home to legendary labels like Stax and Sun Records. 
                Incorporating Memphis musical heritage into your wedding playlist creates a unique Tennessee celebration.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                  <h3 className="text-2xl font-bold mb-4">Elvis & Sun Records Era</h3>
                  <ul className="space-y-2">
                    <li>• "Love Me Tender" - Elvis Presley</li>
                    <li>• "Great Balls of Fire" - Jerry Lee Lewis</li>
                    <li>• "Blue Moon of Kentucky" - Bill Monroe</li>
                    <li>• "I Walk the Line" - Johnny Cash</li>
                  </ul>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                  <h3 className="text-2xl font-bold mb-4">Stax Records Soul</h3>
                  <ul className="space-y-2">
                    <li>• "Green Onions" - Booker T. & the M.G.'s</li>
                    <li>• "Soul Man" - Sam & Dave</li>
                    <li>• "Hold On, I'm Comin'" - Sam & Dave</li>
                    <li>• "Try a Little Tenderness" - Otis Redding</li>
                  </ul>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                  <h3 className="text-2xl font-bold mb-4">Modern Memphis Artists</h3>
                  <ul className="space-y-2">
                    <li>• "Can't Stop the Feeling" - Justin Timberlake</li>
                    <li>• "Better Days" - OneRepublic</li>
                    <li>• "Walking in Memphis" - Marc Cohn</li>
                    <li>• Local Memphis bands on request</li>
                  </ul>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                  <h3 className="text-2xl font-bold mb-4">Memphis Wedding Traditions</h3>
                  <ul className="space-y-2">
                    <li>• Playing "Sweet Caroline" for group singing</li>
                    <li>• "Walking in Memphis" for out-of-town guests</li>
                    <li>• Soul music during dinner</li>
                    <li>• Rock classics for dancing</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Playlist Tips */}
        <section className="py-24 bg-white">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 mb-4">Professional Memphis Wedding DJ Tips</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                With 10+ years of Memphis wedding experience, here are our professional tips for creating 
                the perfect wedding playlist that keeps your Tennessee celebration unforgettable.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {playlistTips.map((tip, index) => (
                <div key={index} className="card">
                  <tip.icon className="w-12 h-12 text-brand mb-4" />
                  <h3 className="text-xl font-bold mb-3">{tip.title}</h3>
                  <p className="text-gray-600">{tip.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Do Not Play List */}
        <section className="py-24 bg-gray-50">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="heading-2 mb-4">Memphis Wedding "Do Not Play" Guidelines</h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Just as important as what to play is what to avoid. Here are professional guidelines 
                  for songs to skip at Memphis weddings to keep the celebration positive and inclusive.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold mb-6 text-center">Songs to Avoid</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {doNotPlayList.map((item, index) => (
                    <div key={index} className="flex items-center p-4 bg-red-50 rounded-lg">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-4 flex-shrink-0"></div>
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 p-6 bg-blue-50 rounded-lg">
                  <h4 className="font-bold text-blue-900 mb-2">Professional Tip:</h4>
                  <p className="text-blue-800">
                    Your Memphis wedding DJ should always have backup songs ready and be able to read the room. 
                    If a song isn't working, a professional DJ will smoothly transition to something that gets people dancing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gray-900 text-white">
          <div className="section-container">
            <div className="max-w-4xl mx-auto text-center">
              <Award className="w-16 h-16 text-brand-gold mx-auto mb-6" />
              <h2 className="text-4xl font-bold mb-6">Let Memphis's Best Wedding DJ Create Your Perfect Playlist</h2>
              <p className="text-xl mb-8 opacity-90">
                Don't stress about creating the perfect Memphis wedding playlist alone. Our professional DJs have 
                curated thousands of successful wedding playlists and know exactly what works at Tennessee celebrations.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="text-center">
                  <Music className="w-12 h-12 text-brand-gold mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Custom Playlists</h3>
                  <p className="opacity-90">Personalized music selection based on your preferences and guest demographics</p>
                </div>
                <div className="text-center">
                  <Users className="w-12 h-12 text-brand-gold mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Crowd Reading</h3>
                  <p className="opacity-90">Professional ability to adjust music in real-time to keep your dance floor packed</p>
                </div>
                <div className="text-center">
                  <Star className="w-12 h-12 text-brand-gold mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Memphis Expertise</h3>
                  <p className="opacity-90">Local knowledge of what works at Memphis venues and with Tennessee audiences</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <button 
                  onClick={scrollToContact}
                  className="bg-brand-gold text-black hover:bg-yellow-400 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
                >
                  Get Your Custom Memphis Wedding Playlist
                  <ChevronRight className="ml-2 w-5 h-5 inline" />
                </button>
                <Link 
                  href="/memphis-wedding-dj-prices-2025" 
                  className="border-2 border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg transition-colors text-center"
                >
                  View Memphis Wedding DJ Packages
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Related Articles */}
        <section className="py-24 bg-gray-50">
          <div className="section-container">
            <div className="text-center mb-16">
              <h2 className="heading-2 mb-4">More Memphis Wedding Planning Resources</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Continue planning your perfect Memphis wedding with our comprehensive guides and professional advice.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Link href="/blog/memphis-wedding-dj-cost-guide-2025" className="card text-center group hover:shadow-xl transition-all">
                <Volume2 className="w-12 h-12 text-brand mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold mb-3">Memphis Wedding DJ Costs</h3>
                <p className="text-gray-600 mb-4">Complete pricing guide for Memphis wedding DJ services</p>
                <span className="text-brand font-semibold">Read Guide →</span>
              </Link>

              <Link href="/memphis-wedding-dj" className="card text-center group hover:shadow-xl transition-all">
                <Heart className="w-12 h-12 text-brand mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold mb-3">Memphis Wedding DJ Services</h3>
                <p className="text-gray-600 mb-4">Professional wedding entertainment packages</p>
                <span className="text-brand font-semibold">Learn More →</span>
              </Link>

              <Link href="/best-wedding-dj-memphis" className="card text-center group hover:shadow-xl transition-all">
                <Award className="w-12 h-12 text-brand mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold mb-3">Best Memphis Wedding DJ</h3>
                <p className="text-gray-600 mb-4">Why M10 is Memphis's top-rated wedding DJ choice</p>
                <span className="text-brand font-semibold">Discover Why →</span>
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