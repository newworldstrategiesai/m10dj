import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Music, 
  Heart, 
  Play, 
  Users, 
  Star, 
  Calendar,
  TrendingUp,
  Mic2,
  Volume2,
  Headphones,
  ChevronRight,
  Clock
} from 'lucide-react';
import Header from '../../components/company/Header';
import Footer from '../../components/company/Footer';
import ContactForm from '../../components/company/ContactForm';
import SEO from '../../components/SEO';

export default function MemphisWeddingMusicTopSongs2025() {
  const [activeCategory, setActiveCategory] = useState(0);
  const [playingSong, setPlayingSong] = useState(null);

  useEffect(() => {
    // Add any tracking or analytics here
  }, []);

  const keywords = [
    "Memphis wedding music 2025",
    "best wedding songs Memphis",
    "Memphis wedding DJ playlist",
    "popular wedding songs 2025",
    "Memphis wedding reception music",
    "first dance songs Memphis",
    "Memphis wedding song ideas",
    "wedding music trends Memphis",
    "Memphis DJ song recommendations",
    "wedding dance music Memphis"
  ];

  const songCategories = [
    {
      title: "First Dance Songs",
      icon: Heart,
      description: "Romantic songs perfect for your first dance as a married couple",
      trending: "Most Requested by Memphis Couples"
    },
    {
      title: "Father-Daughter Dance",
      icon: Users,
      description: "Heartfelt songs celebrating the father-daughter bond",
      trending: "Timeless Classics + Modern Favorites"
    },
    {
      title: "Mother-Son Dance", 
      icon: Music,
      description: "Special songs honoring the mother-son relationship",
      trending: "Emotional & Meaningful"
    },
    {
      title: "Dance Floor Anthems",
      icon: TrendingUp,
      description: "High-energy songs that pack the dance floor",
      trending: "Memphis Reception Favorites"
    },
    {
      title: "Ceremony Processional",
      icon: Star,
      description: "Beautiful music for walking down the aisle",
      trending: "Classical & Contemporary"
    },
    {
      title: "Memphis & Southern Favorites",
      icon: Volume2,
      description: "Local favorites and Southern classics",
      trending: "Hometown Hits"
    }
  ];

  const firstDanceSongs = [
    {
      title: "Perfect",
      artist: "Ed Sheeran",
      year: "2017",
      reason: "Sweet, simple lyrics about finding your perfect person",
      popularity: "Most Requested",
      memphisNote: "Consistently #1 choice for Memphis couples"
    },
    {
      title: "All of Me",
      artist: "John Legend", 
      year: "2013",
      reason: "Deeply personal and romantic with beautiful piano",
      popularity: "Classic Choice",
      memphisNote: "Memphis couples love the soulful melody"
    },
    {
      title: "Thinking Out Loud",
      artist: "Ed Sheeran",
      year: "2014", 
      reason: "Promises of lifelong love with acoustic guitar",
      popularity: "Timeless",
      memphisNote: "Perfect for garden wedding venues"
    },
    {
      title: "Make You Feel My Love",
      artist: "Adele",
      year: "2008",
      reason: "Powerful vocals on Bob Dylan's romantic classic",
      popularity: "Emotional",
      memphisNote: "Stunning choice for The Peabody Hotel weddings"
    },
    {
      title: "Better Days",
      artist: "OneRepublic",
      year: "2020",
      reason: "Hopeful message about facing the future together",
      popularity: "Trending Up",
      memphisNote: "Popular with younger Memphis couples"
    },
    {
      title: "Die From A Broken Heart",
      artist: "Maddie & Tae",
      year: "2019",
      reason: "Country-pop crossover about devoted love",
      popularity: "Country Favorite",
      memphisNote: "Great for outdoor Memphis venues"
    }
  ];

  const fatherDaughterSongs = [
    {
      title: "My Girl",
      artist: "The Temptations",
      year: "1964",
      reason: "Classic Motown celebrating your special girl",
      popularity: "Timeless Classic",
      memphisNote: "Perfect for Memphis's musical heritage"
    },
    {
      title: "I Loved Her First",
      artist: "Heartland",
      year: "2006",
      reason: "Country ballad from father's perspective",
      popularity: "Emotional Favorite",
      memphisNote: "Popular at Dixon Gallery weddings"
    },
    {
      title: "Butterfly Kisses",
      artist: "Bob Carlisle",
      year: "1997",
      reason: "Tender song about watching daughter grow up",
      popularity: "Traditional Choice",
      memphisNote: "Classic choice for all Memphis venues"
    },
    {
      title: "Isn't She Lovely",
      artist: "Stevie Wonder",
      year: "1976",
      reason: "Joyful celebration of a beloved daughter",
      popularity: "Upbeat Option",
      memphisNote: "Memphis couples love the Motown connection"
    },
    {
      title: "The Way You Look Tonight",
      artist: "Tony Bennett",
      year: "1964",
      reason: "Elegant jazz standard full of admiration",
      popularity: "Sophisticated",
      memphisNote: "Ideal for upscale Memphis venues"
    }
  ];

  const danceFloorAnthems = [
    {
      title: "Uptown Funk",
      artist: "Mark Ronson ft. Bruno Mars",
      year: "2014",
      reason: "Irresistible groove that gets everyone dancing",
      popularity: "Party Starter",
      memphisNote: "Always packs Memphis dance floors"
    },
    {
      title: "I Wanna Dance with Somebody",
      artist: "Whitney Houston", 
      year: "1987",
      reason: "Pure joy and celebration in song form",
      popularity: "Multi-Generational",
      memphisNote: "Memphis wedding essential"
    },
    {
      title: "Good as Hell",
      artist: "Lizzo",
      year: "2019",
      reason: "Empowering anthem with infectious energy",
      popularity: "Modern Hit",
      memphisNote: "Popular with Memphis millennial couples"
    },
    {
      title: "Mr. Brightside",
      artist: "The Killers",
      year: "2003",
      reason: "Rock anthem everyone knows the words to",
      popularity: "Singalong Hit",
      memphisNote: "Guaranteed crowd pleaser in Memphis"
    },
    {
      title: "September",
      artist: "Earth, Wind & Fire",
      year: "1978",
      reason: "Disco-funk perfection that transcends generations",
      popularity: "Universal Favorite",
      memphisNote: "Memphis reception staple"
    },
    {
      title: "Can't Stop the Feeling!",
      artist: "Justin Timberlake",
      year: "2016",
      reason: "Feel-good pop with infectious positivity",
      popularity: "Family Friendly",
      memphisNote: "Great for all-ages Memphis celebrations"
    }
  ];

  const memphisFavorites = [
    {
      title: "Sweet Home Alabama",
      artist: "Lynyrd Skynyrd",
      year: "1974",
      reason: "Southern rock anthem everyone loves",
      popularity: "Regional Classic",
      memphisNote: "Memphis wedding tradition"
    },
    {
      title: "Walking in Memphis",
      artist: "Marc Cohn",
      year: "1991",
      reason: "Celebrates the musical spirit of Memphis",
      popularity: "Hometown Pride",
      memphisNote: "Must-play at Memphis weddings"
    },
    {
      title: "Tennessee Whiskey",
      artist: "Chris Stapleton",
      year: "2015",
      reason: "Smooth country-soul about intoxicating love",
      popularity: "Southern Romance",
      memphisNote: "Perfect for Memphis's musical soul"
    },
    {
      title: "Burning Love",
      artist: "Elvis Presley",
      year: "1972",
      reason: "The King's energetic love song",
      popularity: "Memphis Legend",
      memphisNote: "Elvis connection makes it special"
    },
    {
      title: "(Sittin' On) The Dock of the Bay",
      artist: "Otis Redding",
      year: "1968",
      reason: "Soulful classic with Southern roots",
      popularity: "Soul Music",
      memphisNote: "Honors Memphis's musical heritage"
    }
  ];

  const trendingTips = [
    {
      icon: TrendingUp,
      title: "2025 Music Trends",
      tips: [
        "Couples creating custom playlists that tell their love story",
        "Mixing vintage soul with modern pop for multi-generational appeal",
        "Including songs from first dates and relationship milestones",
        "Silent disco options for outdoor venues with noise restrictions"
      ]
    },
    {
      icon: Heart,
      title: "Memphis Preferences",
      tips: [
        "Strong preference for songs with Memphis/Southern connections",
        "Mix of classic Motown with modern hits performs best",
        "Couples often request live Memphis artists for ceremony music",
        "Blues and soul influences in cocktail hour playlists"
      ]
    },
    {
      icon: Users,
      title: "Crowd Pleasing Strategy",
      tips: [
        "Include at least 3-4 songs from each decade (60s-2020s)",
        "Balance slow songs with dance floor anthems (70/30 split)",
        "Always include sing-along favorites for maximum engagement",
        "Save high-energy songs for peak dancing hours (9-11 PM)"
      ]
    }
  ];

  const playlistTips = [
    {
      phase: "Cocktail Hour",
      duration: "60-90 minutes",
      style: "Background ambiance",
      examples: ["Norah Jones", "John Mayer", "Alicia Keys", "Michael Bublé"],
      memphisTip: "Include Memphis artists like B.B. King and Al Green for local flavor"
    },
    {
      phase: "Dinner Service", 
      duration: "45-60 minutes",
      style: "Conversation-friendly",
      examples: ["Adele", "Sam Smith", "Ed Sheeran", "Billie Eilish"],
      memphisTip: "Keep volume low enough for table conversation"
    },
    {
      phase: "Special Dances",
      duration: "15-20 minutes",
      style: "Emotional moments",
      examples: ["First dance", "Parent dances", "Anniversary dance"],
      memphisTip: "Practice with your DJ to perfect timing and fade-outs"
    },
    {
      phase: "Party Time",
      duration: "2-3 hours",
      style: "High-energy dancing",
      examples: ["Top 40", "Classic rock", "Hip-hop", "Dance hits"],
      memphisTip: "Mix eras and genres to keep all ages on the dance floor"
    }
  ];

  return (
    <>
      <SEO
        title="Memphis Wedding Music & Top Songs 2025 | Best Wedding Playlist Ideas | M10 DJ Company"
        description="Discover the most popular wedding songs in Memphis for 2025! From first dance favorites to dance floor anthems, plus Memphis favorites and Southern classics. Expert playlist tips from Memphis wedding DJs."
        keywords={keywords}
        canonical="/blog/memphis-wedding-music-top-songs-2025"
      />

      <Header />

      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-10 w-72 h-72 bg-pink-500 rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-500 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
          </div>
          
          <div className="section-container relative z-10 text-center">
            <div className="max-w-4xl mx-auto">
              <h1 className="heading-1 mb-6">
                <span className="block text-white">Memphis Wedding Music &</span>
                <span className="block text-gradient">Top Songs for 2025</span>
              </h1>
              
              <p className="text-xl md:text-2xl mb-8 leading-relaxed text-white/90">
                Discover the most requested wedding songs by Memphis couples, from romantic first dances 
                to dance floor anthems that pack every Memphis venue.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Link 
                  href="/memphis-wedding-dj"
                  className="btn-primary bg-white text-purple-900 hover:bg-gray-100 px-8 py-4"
                >
                  Wedding DJ Services
                </Link>
                <a href="tel:9014102020" className="btn-outline border-white text-white hover:bg-white hover:text-purple-900 px-8 py-4">
                  Custom Playlist Consultation
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Music Categories */}
        <section className="py-16 bg-white">
          <div className="section-container">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="heading-2 mb-6 text-gray-900">Wedding Music Categories</h2>
                <p className="text-lg text-gray-600">
                  Explore the most popular song categories for Memphis weddings, curated from 500+ celebrations.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {songCategories.map((category, index) => (
                  <div 
                    key={index} 
                    className={`bg-white border-2 rounded-lg p-6 cursor-pointer transition-all hover:shadow-lg ${
                      activeCategory === index ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-200'
                    }`}
                    onClick={() => setActiveCategory(index)}
                  >
                    <div className="flex items-center mb-4">
                      <category.icon className="h-8 w-8 text-purple-600 mr-3" />
                      <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
                    </div>
                    <p className="text-gray-600 mb-3">{category.description}</p>
                    <div className="text-sm text-purple-600 font-medium">{category.trending}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* First Dance Songs */}
        <section className="py-16 bg-gray-50">
          <div className="section-container">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <Heart className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="heading-2 mb-6 text-gray-900">Most Requested First Dance Songs</h2>
                <p className="text-lg text-gray-600">
                  Based on 500+ Memphis weddings, these are the most popular first dance choices.
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {firstDanceSongs.map((song, index) => (
                  <div key={index} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">"{song.title}"</h3>
                        <p className="text-purple-600 font-medium mb-2">{song.artist} ({song.year})</p>
                        <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                          song.popularity === 'Most Requested' ? 'bg-red-100 text-red-800' :
                          song.popularity === 'Trending Up' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {song.popularity}
                        </span>
                      </div>
                      <button 
                        className="flex-shrink-0 w-10 h-10 bg-purple-100 hover:bg-purple-200 rounded-full flex items-center justify-center transition-colors"
                        onClick={() => setPlayingSong(playingSong === `${song.title}-${song.artist}` ? null : `${song.title}-${song.artist}`)}
                      >
                        <Play className="h-4 w-4 text-purple-600" />
                      </button>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{song.reason}</p>
                    
                    <div className="bg-purple-50 border-l-4 border-purple-400 p-3">
                      <p className="text-purple-800 text-sm">
                        <strong>Memphis Note:</strong> {song.memphisNote}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Father-Daughter Dance */}
        <section className="py-16 bg-white">
          <div className="section-container">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h2 className="heading-2 mb-6 text-gray-900">Father-Daughter Dance Favorites</h2>
                <p className="text-lg text-gray-600">
                  Heartfelt songs that celebrate the special father-daughter bond.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {fatherDaughterSongs.map((song, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">"{song.title}"</h3>
                    <p className="text-blue-600 font-medium mb-2">{song.artist}</p>
                    <p className="text-gray-600 text-sm mb-3">{song.reason}</p>
                    <div className="text-xs text-blue-800 bg-blue-100 px-2 py-1 rounded inline-block mb-2">
                      {song.popularity}
                    </div>
                    <div className="text-xs text-gray-700 border-t pt-2">
                      {song.memphisNote}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Dance Floor Anthems */}
        <section className="py-16 bg-gradient-to-r from-yellow-50 to-orange-50">
          <div className="section-container">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <TrendingUp className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                <h2 className="heading-2 mb-6 text-gray-900">Dance Floor Anthems</h2>
                <p className="text-lg text-gray-600">
                  High-energy songs guaranteed to pack the dance floor at Memphis weddings.
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {danceFloorAnthems.map((song, index) => (
                  <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">"{song.title}"</h3>
                        <p className="text-orange-600 font-medium">{song.artist} ({song.year})</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-orange-800 bg-orange-100 px-3 py-1 rounded-full">
                          {song.popularity}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{song.reason}</p>
                    
                    <div className="bg-orange-50 border-l-4 border-orange-400 p-3">
                      <p className="text-orange-800 text-sm">
                        <strong>Memphis Impact:</strong> {song.memphisNote}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Memphis & Southern Favorites */}
        <section className="py-16 bg-brand text-white">
          <div className="section-container">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <Volume2 className="h-12 w-12 text-white mx-auto mb-4" />
                <h2 className="heading-2 mb-6">Memphis & Southern Favorites</h2>
                <p className="text-lg text-white/90">
                  Songs that celebrate Memphis's rich musical heritage and Southern spirit.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {memphisFavorites.map((song, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-white mb-2">"{song.title}"</h3>
                    <p className="text-brand-light font-medium mb-3">{song.artist} ({song.year})</p>
                    <p className="text-white/80 text-sm mb-4">{song.reason}</p>
                    
                    <div className="bg-white/20 rounded p-3">
                      <div className="text-sm text-white font-medium mb-1">{song.popularity}</div>
                      <div className="text-xs text-white/90">{song.memphisNote}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center mt-12">
                <p className="text-lg text-white/90 mb-6">
                  Want to incorporate Memphis musical heritage into your wedding playlist?
                </p>
                <Link 
                  href="/memphis-wedding-dj"
                  className="bg-white text-brand hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
                >
                  Discuss Custom Memphis Playlist
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 2025 Music Trends */}
        <section className="py-16 bg-white">
          <div className="section-container">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="heading-2 mb-6 text-gray-900">2025 Wedding Music Trends</h2>
                <p className="text-lg text-gray-600">
                  What Memphis couples are requesting for their 2025 weddings.
                </p>
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                {trendingTips.map((tip, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <tip.icon className="h-8 w-8 text-purple-600 mr-3" />
                      <h3 className="text-xl font-semibold text-gray-900">{tip.title}</h3>
                    </div>
                    
                    <ul className="space-y-3">
                      {tip.tips.map((tipItem, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <ChevronRight className="h-4 w-4 text-purple-500 mt-1 flex-shrink-0" />
                          <span className="text-gray-600 text-sm">{tipItem}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Reception Timeline & Music */}
        <section className="py-16 bg-gray-50">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <Clock className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h2 className="heading-2 mb-6 text-gray-900">Reception Music Timeline</h2>
                <p className="text-lg text-gray-600">
                  How to structure your wedding music throughout the evening.
                </p>
              </div>

              <div className="space-y-8">
                {playlistTips.map((phase, index) => (
                  <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{phase.phase}</h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div><strong>Duration:</strong> {phase.duration}</div>
                          <div><strong>Style:</strong> {phase.style}</div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Example Artists:</h4>
                        <div className="flex flex-wrap gap-2">
                          {phase.examples.map((artist, idx) => (
                            <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                              {artist}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="bg-green-50 border-l-4 border-green-400 p-3">
                        <h4 className="font-semibold text-green-800 mb-1">Memphis Tip:</h4>
                        <p className="text-green-700 text-sm">{phase.memphisTip}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Expert DJ Advice */}
        <section className="py-16 bg-purple-900 text-white">
          <div className="section-container">
            <div className="max-w-4xl mx-auto text-center">
              <Headphones className="h-16 w-16 text-white mx-auto mb-6" />
              <h2 className="heading-2 mb-6">Expert Memphis DJ Music Advice</h2>
              <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
                With 15+ years entertaining Memphis couples, we know what works at every venue. 
                Let us create the perfect soundtrack for your special day.
              </p>

              <div className="grid md:grid-cols-2 gap-8 mb-12 text-left">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Do's for Wedding Music</h3>
                  <ul className="space-y-2 text-white/90">
                    <li className="flex items-start space-x-2">
                      <span className="text-green-400 font-bold">✓</span>
                      <span>Create a "do not play" list alongside your requests</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-green-400 font-bold">✓</span>
                      <span>Include songs from different decades for all ages</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-green-400 font-bold">✓</span>
                      <span>Trust your DJ to read the crowd and adjust</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-green-400 font-bold">✓</span>
                      <span>Test special dance songs beforehand</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Don'ts for Wedding Music</h3>
                  <ul className="space-y-2 text-white/90">
                    <li className="flex items-start space-x-2">
                      <span className="text-red-400 font-bold">✗</span>
                      <span>Over-plan every single song - leave room for spontaneity</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-red-400 font-bold">✗</span>
                      <span>Ignore venue noise restrictions</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-red-400 font-bold">✗</span>
                      <span>Forget to consider guest demographics</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-red-400 font-bold">✗</span>
                      <span>Choose first dance songs you've never danced to</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="tel:9014102020" 
                  className="bg-white text-purple-900 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
                >
                  Call (901) 410-2020
                </a>
                <Link 
                  href="/memphis-wedding-dj"
                  className="border-2 border-white text-white hover:bg-white hover:text-purple-900 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
                >
                  Wedding DJ Services
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Related Resources */}
        <section className="py-16 bg-gray-50">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              <h2 className="heading-2 text-center mb-12 text-gray-900">Related Wedding Music Resources</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <Link 
                  href="/blog/how-to-choose-wedding-dj-memphis-2025"
                  className="bg-white rounded-lg p-6 hover:shadow-md transition-shadow group"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-600">
                    How to Choose Your Wedding DJ
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Complete guide to selecting a Memphis wedding DJ who understands your music preferences.
                  </p>
                </Link>

                <Link 
                  href="/blog/top-memphis-wedding-venues-2025"
                  className="bg-white rounded-lg p-6 hover:shadow-md transition-shadow group"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-600">
                    Top Memphis Wedding Venues
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Discover Memphis's best wedding venues and their specific music requirements.
                  </p>
                </Link>

                <Link 
                  href="/memphis-wedding-dj-prices-2025"
                  className="bg-white rounded-lg p-6 hover:shadow-md transition-shadow group"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-600">
                    Memphis Wedding DJ Packages
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Explore our wedding packages including custom playlist consultation services.
                  </p>
                </Link>

                <Link 
                  href="/memphis-wedding-dj"
                  className="bg-white rounded-lg p-6 hover:shadow-md transition-shadow group"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-600">
                    Memphis Wedding DJ Services
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Professional wedding entertainment with extensive music libraries and Memphis expertise.
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-white">
          <div className="section-container">
            <div className="text-center mb-12">
              <h2 className="heading-2 mb-6 text-gray-900">Ready to Create Your Perfect Wedding Playlist?</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Let our experienced Memphis DJs help you craft the perfect soundtrack for your special day, 
                featuring your favorite songs and guaranteed crowd-pleasers.
              </p>
            </div>

            <ContactForm />
          </div>
        </section>
      </main>

      <Footer />
      
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "Memphis Wedding Music & Top Songs for 2025",
            "description": "Discover the most popular wedding songs in Memphis for 2025, from first dance favorites to dance floor anthems and Memphis favorites.",
            "author": {
              "@type": "Organization",
              "name": "M10 DJ Company"
            },
            "publisher": {
              "@type": "Organization",
              "name": "M10 DJ Company",
              "logo": {
                "@type": "ImageObject",
                "url": "https://www.m10djcompany.com/logo-static.jpg"
              }
            },
            "datePublished": "2025-01-04",
            "dateModified": "2025-01-04",
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": "https://www.m10djcompany.com/blog/memphis-wedding-music-top-songs-2025"
            },
            "about": [
              {
                "@type": "Thing",
                "name": "Wedding Music"
              },
              {
                "@type": "Thing", 
                "name": "Memphis Wedding Songs"
              },
              {
                "@type": "Thing",
                "name": "First Dance Songs"
              }
            ]
          })
        }}
      />
    </>
  );
}