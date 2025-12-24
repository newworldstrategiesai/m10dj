import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Calendar,
  MapPin,
  Clock,
  Music,
  Share2,
  ExternalLink,
  Phone,
  Mail,
  ChevronRight,
  Star,
  Users
} from 'lucide-react';
import Header from '../../../components/company/Header';
import Footer from '../../../components/company/Footer';

// Cover photo for the event - update this path to your Silky O'Sullivan's image
const COVER_PHOTO = '/assets/silky-osullivans-beale-street.jpg'; // Update this path
const DEFAULT_COVER_PHOTO = '/assets/DJ-Ben-Murray-Dodge-Poster.png'; // Fallback

export default function DJBenMurraySilkyOSullivansEvent() {
  const [songRequestSubmitted, setSongRequestSubmitted] = useState(false);
  const [songRequest, setSongRequest] = useState({ name: '', email: '', song: '', artist: '' });

  // Event details
  const eventDate = new Date('2026-12-27T22:00:00'); // 10pm CST
  const eventName = "DJ Ben Murray Live at Silky O'Sullivan's";
  const venueName = "Silky O'Sullivan's";
  const venueAddress = "183 Beale St, Memphis, TN 38103";
  const venueUrl = "https://www.silkyosullivans.com";
  const eventUrl = "https://www.m10djcompany.com/events/live/dj-ben-murray-silky-osullivans-2026-12-27";
  
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const formattedTime = eventDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  // Set up cover photo URL for use in structured data and meta tags
  const baseUrl = "https://www.m10djcompany.com";
  const coverPhotoUrl = COVER_PHOTO.startsWith('http') ? COVER_PHOTO : `${baseUrl}${COVER_PHOTO}`;

  // Event Schema structured data
  const eventStructuredData = {
    "@context": "https://schema.org",
    "@type": "Event",
    "@id": `${eventUrl}#event`,
    "name": eventName,
    "description": "Join DJ Ben Murray for a live performance at Silky O'Sullivan's on Beale Street! Open to the public. Request your favorite songs and enjoy an unforgettable night of music in the heart of Memphis.",
    "startDate": "2026-12-27T22:00:00-06:00",
    "endDate": "2026-12-28T02:00:00-06:00",
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "location": {
      "@type": "Place",
      "name": venueName,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "183 Beale St",
        "addressLocality": "Memphis",
        "addressRegion": "TN",
        "postalCode": "38103",
        "addressCountry": "US"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 35.1389,
        "longitude": -90.0503
      },
      "url": venueUrl
    },
    "organizer": {
      "@type": "Organization",
      "name": "M10 DJ Company",
      "url": "https://www.m10djcompany.com",
      "telephone": "+19014102020"
    },
    "performer": {
      "@type": "Person",
      "@id": "https://www.m10djcompany.com/dj-ben-murray#person",
      "name": "Ben Murray",
      "alternateName": "DJ Ben Murray",
      "jobTitle": "Professional DJ",
      "url": "https://www.m10djcompany.com/dj-ben-murray"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "url": eventUrl,
      "validFrom": "2024-01-01T00:00:00-06:00"
    },
    "image": coverPhotoUrl,
    "url": eventUrl
  };

  const handleSongRequest = async (e) => {
    e.preventDefault();
    
    // Simple form submission - you can enhance this to use your API
    try {
      // Here you would typically send to your API endpoint
      // For now, we'll just show success message
      setSongRequestSubmitted(true);
      
      // Optional: Send to your API
      // await fetch('/api/song-request', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ ...songRequest, eventDate: '2026-12-27' })
      // });
    } catch (error) {
      console.error('Error submitting song request:', error);
    }
  };

  const shareUrl = eventUrl;
  const shareText = `Join DJ Ben Murray at Silky O'Sullivan's on Beale Street, December 27, 2026 at 10pm! Request your favorite songs!`;
  
  // Meta tags for social sharing
  const pageTitle = `${eventName} | December 27, 2026 | Beale Street Memphis`;
  const pageDescription = `Join DJ Ben Murray for a live performance at Silky O'Sullivan's on Beale Street, December 27, 2026 at 10pm. Open to the public. Request your favorite songs and enjoy an unforgettable night of music in the heart of Memphis!`;
  const canonicalUrl = `${baseUrl}/events/live/dj-ben-murray-silky-osullivans-2026-12-27`;
  const ogImage = coverPhotoUrl; // Use Silky O'Sullivan's photo for social sharing

  return (
    <>
      <Head>
        {/* Primary Meta Tags */}
        <title>{pageTitle}</title>
        <meta name="title" content={pageTitle} />
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content="DJ Ben Murray, Silky O Sullivan Beale Street, Memphis DJ live performance, Beale Street DJ, Memphis nightlife, DJ event Memphis, live music Beale Street, Memphis entertainment" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="event" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={`${eventName} - December 27, 2026 at Silky O'Sullivan's on Beale Street`} />
        <meta property="og:site_name" content="M10 DJ Company" />
        <meta property="og:locale" content="en_US" />
        
        {/* Event-specific Open Graph tags */}
        <meta property="event:start_time" content="2026-12-27T22:00:00-06:00" />
        <meta property="event:end_time" content="2026-12-28T02:00:00-06:00" />
        <meta property="event:location" content={`${venueName}, ${venueAddress}`} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={canonicalUrl} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={ogImage} />
        <meta name="twitter:image:alt" content={`${eventName} - December 27, 2026 at Silky O'Sullivan's on Beale Street`} />
        <meta name="twitter:creator" content="@m10djcompany" />
        <meta name="twitter:site" content="@m10djcompany" />
        
        {/* Additional SEO Tags */}
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="author" content="M10 DJ Company" />
        <meta name="language" content="en-US" />
        
        {/* Local SEO Tags */}
        <meta name="geo.region" content="US-TN" />
        <meta name="geo.placename" content="Memphis" />
        <meta name="ICBM" content="35.1389, -90.0503" />
        
        {/* Event-specific meta tags */}
        <meta name="event:start_date" content="2026-12-27" />
        <meta name="event:start_time" content="22:00" />
        <meta name="event:location" content={venueName} />
        <meta name="event:venue" content={venueName} />
        <meta name="event:venue:address" content={venueAddress} />
        
        {/* Apple iOS Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="DJ Ben Murray Live" />
        
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(eventStructuredData)
          }}
        />
      </Head>

      <Header />

      <main>
        {/* Hero Section with Cover Photo */}
        <section 
          className="relative w-full overflow-hidden bg-gradient-to-b from-gray-900 via-black to-black text-white"
          style={{
            height: '50vh',
            minHeight: '400px',
            maxHeight: '600px',
            backgroundImage: `url(${COVER_PHOTO})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/80 z-10"></div>
          
          {/* Animated background elements (subtle) */}
          <div className="absolute inset-0 opacity-20 z-0">
            <div className="absolute top-20 left-10 w-72 h-72 bg-brand-gold rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
          </div>
          
          <div className="section-container relative z-20 h-full flex flex-col justify-center pt-16">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex items-center justify-center mb-6">
                <Music className="w-12 h-12 text-brand-gold mr-3 drop-shadow-lg" />
                <span className="text-brand-gold font-semibold text-lg drop-shadow-lg">Live Performance</span>
              </div>
              
              <h1 
                className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight drop-shadow-2xl"
                style={{
                  textShadow: '3px 3px 6px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.5)'
                }}
              >
                <span className="block text-white">DJ Ben Murray</span>
                <span className="block text-gradient bg-gradient-to-r from-brand-gold via-amber-400 to-brand-gold bg-clip-text text-transparent">
                  Live at Silky O'Sullivan's
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed drop-shadow-lg">
                Join us for an unforgettable night of music on Beale Street! Open to the public.
              </p>

              {/* Event Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-3xl mx-auto">
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 shadow-xl">
                  <Calendar className="w-8 h-8 text-brand-gold mx-auto mb-3 drop-shadow-lg" />
                  <div className="text-sm text-white/80 mb-1">Date</div>
                  <div className="text-lg font-bold text-white drop-shadow-lg">{formattedDate}</div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 shadow-xl">
                  <Clock className="w-8 h-8 text-brand-gold mx-auto mb-3 drop-shadow-lg" />
                  <div className="text-sm text-white/80 mb-1">Time</div>
                  <div className="text-lg font-bold text-white drop-shadow-lg">{formattedTime}</div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 shadow-xl">
                  <MapPin className="w-8 h-8 text-brand-gold mx-auto mb-3 drop-shadow-lg" />
                  <div className="text-sm text-white/80 mb-1">Location</div>
                  <div className="text-lg font-bold text-white drop-shadow-lg">Beale Street</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="#song-request"
                  className="btn-primary text-lg px-8 py-4"
                >
                  Request a Song
                  <Music className="ml-2 w-5 h-5" />
                </a>
                <a 
                  href={venueUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline text-lg px-8 py-4"
                >
                  Visit Venue Website
                  <ExternalLink className="ml-2 w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Event Details Section */}
        <section className="py-16 bg-white dark:bg-black">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Venue Info */}
                <div className="modern-card">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    <MapPin className="w-6 h-6 inline mr-2 text-brand-gold" />
                    Venue Information
                  </h2>
                  <div className="space-y-3">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">Silky O'Sullivan's</div>
                      <div className="text-gray-600 dark:text-gray-300">183 Beale St, Memphis, TN 38103</div>
                    </div>
                    <div>
                      <a 
                        href={venueUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand hover:text-amber-600 inline-flex items-center"
                      >
                        Visit Venue Website <ExternalLink className="ml-2 w-4 h-4" />
                      </a>
                    </div>
                    <div>
                      <a 
                        href="https://www.google.com/maps/search/?api=1&query=Silky+O'Sullivan's+Beale+Street+Memphis"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand hover:text-amber-600 inline-flex items-center"
                      >
                        Get Directions <ExternalLink className="ml-2 w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Event Info */}
                <div className="modern-card">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    <Calendar className="w-6 h-6 inline mr-2 text-brand-gold" />
                    Event Details
                  </h2>
                  <div className="space-y-3">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">Date & Time</div>
                      <div className="text-gray-600 dark:text-gray-300">
                        {formattedDate} at {formattedTime}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">Admission</div>
                      <div className="text-gray-600 dark:text-gray-300">Open to the public - No cover charge</div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">Age Requirement</div>
                      <div className="text-gray-600 dark:text-gray-300">21+ (Bar venue)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Song Request Section */}
        <section id="song-request" className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="section-container">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <Music className="w-12 h-12 text-brand-gold mx-auto mb-4" />
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  Request Your Favorite Songs
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300">
                  Want to hear a specific song? Request it here and we'll do our best to play it!
                </p>
              </div>

              {songRequestSubmitted ? (
                <div className="modern-card bg-green-50 dark:bg-green-900/20 border-2 border-green-500">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Music className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Song Request Received!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Thanks for your request! We'll do our best to play "{songRequest.song}" by {songRequest.artist} during the show.
                    </p>
                    <button
                      onClick={() => {
                        setSongRequestSubmitted(false);
                        setSongRequest({ name: '', email: '', song: '', artist: '' });
                      }}
                      className="btn-secondary"
                    >
                      Request Another Song
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSongRequest} className="modern-card">
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Your Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={songRequest.name}
                        onChange={(e) => setSongRequest({ ...songRequest, name: e.target.value })}
                        required
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Your Email (optional)
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={songRequest.email}
                        onChange={(e) => setSongRequest({ ...songRequest, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="john@example.com"
                      />
                    </div>

                    <div>
                      <label htmlFor="song" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Song Title *
                      </label>
                      <input
                        type="text"
                        id="song"
                        name="song"
                        value={songRequest.song}
                        onChange={(e) => setSongRequest({ ...songRequest, song: e.target.value })}
                        required
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="Sweet Caroline"
                      />
                    </div>

                    <div>
                      <label htmlFor="artist" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Artist *
                      </label>
                      <input
                        type="text"
                        id="artist"
                        name="artist"
                        value={songRequest.artist}
                        onChange={(e) => setSongRequest({ ...songRequest, artist: e.target.value })}
                        required
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="Neil Diamond"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full btn-primary text-lg py-4"
                    >
                      Submit Song Request
                      <Music className="ml-2 w-5 h-5" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* About DJ Ben Murray */}
        <section className="py-16 bg-white dark:bg-black">
          <div className="section-container">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  About DJ Ben Murray
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
                    Ben Murray is the founder and lead DJ of M10 DJ Company, with over 15 years of experience 
                    creating unforgettable celebrations throughout Memphis and the Mid-South.
                  </p>
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
                    With 500+ successful events under his belt, Ben brings professional expertise, an extensive 
                    music library, and a passion for making every event special.
                  </p>
                  <Link 
                    href="/dj-ben-murray"
                    className="btn-secondary inline-flex items-center"
                  >
                    Learn More About Ben
                    <ChevronRight className="ml-2 w-5 h-5" />
                  </Link>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Event Highlights</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <Star className="w-5 h-5 text-brand-gold mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600 dark:text-gray-300">Open to the public - No cover charge</span>
                    </li>
                    <li className="flex items-start">
                      <Star className="w-5 h-5 text-brand-gold mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600 dark:text-gray-300">Request your favorite songs</span>
                    </li>
                    <li className="flex items-start">
                      <Star className="w-5 h-5 text-brand-gold mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600 dark:text-gray-300">Professional sound system</span>
                    </li>
                    <li className="flex items-start">
                      <Star className="w-5 h-5 text-brand-gold mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600 dark:text-gray-300">Historic Beale Street location</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Share Section */}
        <section className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="section-container">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Share This Event
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Let your friends know about the show!
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline inline-flex items-center"
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Share on Facebook
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline inline-flex items-center"
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Share on Twitter
                </a>
                <a
                  href={`mailto:?subject=${encodeURIComponent(eventName)}&body=${encodeURIComponent(shareText + ' ' + shareUrl)}`}
                  className="btn-outline inline-flex items-center"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Email Friends
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-br from-brand/10 to-amber-50/30 dark:from-black dark:to-black">
          <div className="section-container">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-white">
                Need a DJ for Your Event?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                M10 DJ Company provides professional DJ services for weddings, corporate events, and private parties throughout Memphis.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact" className="btn-primary text-lg px-8 py-4">
                  Get Your Free Quote
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Link>
                <a href="tel:+19014102020" className="btn-outline text-lg px-8 py-4">
                  <Phone className="mr-2 w-5 h-5" />
                  Call (901) 410-2020
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

