import { useState, useEffect, useRef } from 'react';
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
  Users,
  Loader2,
  AlertCircle,
  X,
  CheckCircle,
  Link2,
  Ticket
} from 'lucide-react';
import Header from '../../../components/company/Header';
import Footer from '../../../components/company/Footer';
import { useSongExtraction } from '../../../hooks/useSongExtraction';
import { useSongSearch } from '../../../hooks/useSongSearch';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import TicketPurchaseForm from '../../../components/events/TicketPurchaseForm';

// Cover photo for the event - update this path to your Silky O'Sullivan's image
const COVER_PHOTO = '/assets/silky-osullivans-beale-street.jpg'; // Update this path
const DEFAULT_COVER_PHOTO = '/assets/DJ-Ben-Murray-Dodge-Poster.png'; // Fallback

export default function DJBenMurraySilkyOSullivansEvent() {
  const supabase = createClientComponentClient();
  const [songRequestSubmitted, setSongRequestSubmitted] = useState(false);
  const [songRequest, setSongRequest] = useState({ name: '', email: '', song: '', artist: '' });
  
  // Song extraction and search state
  const [isExtractedFromLink, setIsExtractedFromLink] = useState(false);
  const [albumArtUrl, setAlbumArtUrl] = useState(null);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [songUrl, setSongUrl] = useState('');
  const [extractedSongUrl, setExtractedSongUrl] = useState('');
  const songTitleInputRef = useRef(null);
  
  // Get organization ID for song search (default to m10dj)
  const [organizationId, setOrganizationId] = useState(null);
  
  useEffect(() => {
    async function loadOrganization() {
      const { data } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', 'm10djcompany')
        .single();
      if (data) setOrganizationId(data.id);
    }
    loadOrganization();
  }, [supabase]);
  
  // Use song extraction hook
  const { extractingSong, extractionError, extractSongInfo: extractSongInfoHook } = useSongExtraction();
  
  // Helper function to detect if input is a URL
  const detectUrl = (value) => {
    if (!value || typeof value !== 'string') return false;
    const trimmed = value.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const urlPattern = /^(https?:\/\/)?([\w-]+\.)?(youtube\.com|youtu\.be|spotify\.com|soundcloud\.com|tidal\.com|music\.apple\.com|itunes\.apple\.com)/i;
      return urlPattern.test(trimmed);
    }
    const urlPattern = /^(https?:\/\/)?([\w-]+\.)?(youtube\.com|youtu\.be|spotify\.com|soundcloud\.com|tidal\.com|music\.apple\.com|itunes\.apple\.com)/i;
    return urlPattern.test(trimmed);
  };
  
  // Use song search hook for autocomplete
  const shouldSearch = songRequest.song && 
                       !detectUrl(songRequest.song) && 
                       !isExtractedFromLink && 
                       songRequest.song.trim().length >= 2;
  const { suggestions, loading: searchingSongs } = useSongSearch(
    shouldSearch ? songRequest.song : '', 
    organizationId
  );
  
  // Reset selected suggestion index when suggestions change
  useEffect(() => {
    setSelectedSuggestionIndex(-1);
  }, [suggestions]);
  
  // Extract song info from URL
  const extractSongInfo = async (url) => {
    const extractedData = await extractSongInfoHook(url, (updater) => {
      if (typeof updater === 'function') {
        setSongRequest(prev => {
          const updated = updater(prev);
          return {
            ...prev,
            song: updated?.song || prev.song,
            artist: updated?.artist || prev.artist
          };
        });
      } else {
        setSongRequest(prev => ({
          ...prev,
          song: updater.song || prev.song,
          artist: updater.artist || prev.artist
        }));
      }
    });
    
    if (extractedData) {
      setExtractedSongUrl(url);
      setIsExtractedFromLink(true);
      setSongUrl(url);
      if (extractedData.albumArt) {
        setAlbumArtUrl(extractedData.albumArt);
      }
    }
    
    return extractedData;
  };
  
  // Clear extraction state
  const handleClearExtraction = () => {
    setSongRequest(prev => ({ ...prev, song: '', artist: '' }));
    setSongUrl('');
    setExtractedSongUrl('');
    setIsExtractedFromLink(false);
    setAlbumArtUrl(null);
  };
  
  // Handle input change with URL detection
  const handleSongInputChange = async (e) => {
    const value = e.target.value;
    const isUrl = detectUrl(value);
    
    if (isUrl) {
      const url = value.trim();
      setSongUrl(url);
      setExtractedSongUrl(url);
      setSongRequest(prev => ({ ...prev, song: '' }));
      await extractSongInfo(url);
      return;
    }
    
    setSongRequest(prev => ({ ...prev, song: value }));
    
    if (!isUrl && !isExtractedFromLink && value.trim().length >= 2) {
      setShowAutocomplete(true);
    } else {
      setShowAutocomplete(false);
    }
    
    if (albumArtUrl) {
      setAlbumArtUrl(null);
      setIsExtractedFromLink(false);
      setExtractedSongUrl('');
    }
  };
  
  // Handle blur event for URL detection
  const handleSongTitleBlur = async (e) => {
    const value = e.target.value;
    if (!value || extractingSong) return;
    
    const isUrl = detectUrl(value);
    if (isUrl && !isExtractedFromLink) {
      const url = value.trim();
      setSongUrl(url);
      setExtractedSongUrl(url);
      setSongRequest(prev => ({ ...prev, song: '' }));
      await extractSongInfo(url);
    }
  };
  
  // Handle autocomplete suggestion selection
  const handleSuggestionSelect = (suggestion) => {
    setSongRequest(prev => ({
      ...prev,
      song: suggestion.title,
      artist: suggestion.artist
    }));
    if (suggestion.albumArt) {
      setAlbumArtUrl(suggestion.albumArt);
    }
    setShowAutocomplete(false);
    setSelectedSuggestionIndex(-1);
    setIsExtractedFromLink(false);
  };
  
  // Handle keyboard navigation in autocomplete
  const handleSongTitleKeyDown = (e) => {
    if (!showAutocomplete || suggestions.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      handleSuggestionSelect(suggestions[selectedSuggestionIndex]);
    } else if (e.key === 'Escape') {
      setShowAutocomplete(false);
      setSelectedSuggestionIndex(-1);
    }
  };

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
      "price": "5",
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
      // Build request data including URL if extracted from link
      const requestData = {
        ...songRequest,
        eventDate: '2026-12-27',
        eventName: eventName,
        ...(songUrl && { songUrl: songUrl })
      };
      
      // Here you would typically send to your API endpoint
      // For now, we'll just show success message
      setSongRequestSubmitted(true);
      
      // Optional: Send to your API
      // await fetch('/api/song-request', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(requestData)
      // });
    } catch (error) {
      console.error('Error submitting song request:', error);
    }
  };

  const shareUrl = eventUrl;
  const shareText = `Join DJ Ben Murray at Silky O'Sullivan's on Beale Street, December 27, 2026 at 10pm!`;
  
  // Check if Web Share API is available (mobile devices)
  const canUseNativeShare = typeof window !== 'undefined' && navigator.share;
  
  // Native share handler for mobile devices
  const handleNativeShare = async () => {
    if (canUseNativeShare) {
      try {
        await navigator.share({
          title: eventName,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled or error occurred - fail silently
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    }
  };
  
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

      <main className="bg-black relative overflow-hidden">
        {/* Animated background elements - Yellow glow like requests page */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div 
            className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl animate-pulse" 
            style={{ 
              animationDelay: '1s',
              backgroundColor: 'rgba(252, 186, 0, 0.2)'
            }}
          ></div>
        </div>
        
        {/* Hero Section - Solid Color Header */}
        <section className="relative w-full overflow-hidden bg-black text-white">
          {/* Solid color background - no gradient */}
          <div className="absolute inset-0 bg-black z-0"></div>
          
          {/* Subtle grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03] z-0" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}></div>
          
          {/* Minimal animated accent line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-gold/50 to-transparent z-10"></div>
          
          <div className="section-container relative z-20 py-12 md:py-16">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column - Hero Content */}
                <div className="lg:col-span-7">
                  {/* Minimal badge */}
                  <div className="flex items-center mb-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 border border-brand-gold/30 rounded-full bg-brand-gold/5">
                      <div className="w-2 h-2 rounded-full bg-brand-gold animate-pulse"></div>
                      <span className="text-xs font-medium tracking-wider text-brand-gold uppercase">Live Performance</span>
                    </div>
                  </div>
                  
                  {/* Main headline - more compact */}
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-light mb-4 leading-tight tracking-tight">
                    <span className="block text-white font-extralight">DJ Ben Murray</span>
                    <span className="block text-brand-gold font-light mt-1">Live at Silky O'Sullivan's</span>
                  </h1>
                  
                  {/* Subtitle - compact */}
                  <p className="text-base md:text-lg text-gray-400 mb-6 font-light">
                    December 27, 2026 • 10:00 PM • Beale Street, Memphis
                  </p>

                  {/* Event Details - Compact inline */}
                  <div className="flex flex-wrap gap-4 mb-6 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar className="w-4 h-4 text-brand-gold" />
                      <span>{formattedDate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="w-4 h-4 text-brand-gold" />
                      <span>{formattedTime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <MapPin className="w-4 h-4 text-brand-gold" />
                      <span>Beale Street</span>
                    </div>
                  </div>

                  {/* CTA Buttons - Compact */}
                  <div className="flex flex-wrap gap-2">
                    <a 
                      href="#tickets"
                      className="inline-flex items-center justify-center px-6 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-semibold text-sm uppercase tracking-wider transition-all"
                    >
                      Buy Tickets
                      <Ticket className="w-4 h-4 ml-2" />
                    </a>
                    <a 
                      href="#song-request"
                      className="inline-flex items-center justify-center px-6 py-2.5 border border-gray-700 text-white font-medium text-sm uppercase tracking-wider hover:border-brand-gold hover:text-brand-gold transition-all"
                    >
                      Request Song
                      <Music className="ml-2 w-4 h-4" />
                    </a>
                    <a 
                      href={venueUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-6 py-2.5 border border-gray-700 text-white font-medium text-sm uppercase tracking-wider hover:border-brand-gold hover:text-brand-gold transition-all"
                    >
                      Venue Info
                      <ExternalLink className="ml-2 w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Right Column - Quick Info Card */}
                <div className="lg:col-span-5">
                  <div className="border border-gray-800 bg-gray-950/50 p-6 space-y-4">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Event Info</h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <div className="text-xs text-gray-500 uppercase mb-1">Admission</div>
                        <div className="text-white font-light">Open to the public • $5 cover</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase mb-1">Age Requirement</div>
                        <div className="text-white font-light">21+ (Bar venue)</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase mb-1">Venue</div>
                        <div className="text-white font-light mb-2">Silky O'Sullivan's</div>
                        <div className="text-gray-400 text-xs font-light">183 Beale St, Memphis, TN</div>
                      </div>
                      <div className="pt-3 border-t border-gray-800">
                        <a 
                          href="https://www.google.com/maps/search/?api=1&query=Silky+O'Sullivan's+Beale+Street+Memphis"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-brand-gold transition-colors"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          Get Directions
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* Tickets & Song Request - Side by Side */}
        <section className="py-12 bg-black border-t border-gray-900">
          <div className="section-container">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Ticket Purchase - Left */}
                <div id="tickets">
                  <div className="mb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 border border-brand-gold/30 rounded-full bg-brand-gold/5 mb-4">
                      <Ticket className="w-4 h-4 text-brand-gold" />
                      <span className="text-xs font-medium tracking-wider text-brand-gold uppercase">Get Your Tickets</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-light mb-2 text-white">
                      Buy Tickets
                    </h2>
                    <p className="text-sm text-gray-400 font-light">
                      Secure your spot. Tickets are limited!
                    </p>
                  </div>

                  <div className="bg-black/50 backdrop-blur-xl rounded-xl border border-gray-800 p-6">
                    <TicketPurchaseForm 
                      eventId="dj-ben-murray-silky-osullivans-2026-12-27"
                      onSuccess={(data) => {
                        console.log('Ticket purchase initiated:', data);
                      }}
                    />
                  </div>
                </div>

                {/* Song Request - Right */}
                <div id="song-request">
                  <div className="mb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 border border-purple-500/30 rounded-full bg-purple-500/5 mb-4">
                      <Music className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-medium tracking-wider text-purple-400 uppercase">Request Songs</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-light mb-2 text-white">
                      Request Your Favorite Songs
                    </h2>
                    <p className="text-sm text-gray-400 font-light">
                      Submit your song request and we'll do our best to play it during the show.
                    </p>
                  </div>

              {songRequestSubmitted ? (
                <div className="bg-white/70 dark:bg-black/70 backdrop-blur-xl rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl border-2 border-gray-200/50 dark:border-gray-800/50 p-6 sm:p-8 text-center">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Music className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    Request Received!
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                    Thanks! We'll do our best to play "{songRequest.song}" by {songRequest.artist} during the show.
                  </p>
                  <button
                    onClick={() => {
                      setSongRequestSubmitted(false);
                      setSongRequest({ name: '', email: '', song: '', artist: '' });
                      handleClearExtraction();
                    }}
                    className="inline-flex items-center justify-center px-6 py-3 rounded-lg sm:rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-sm text-gray-900 dark:text-white font-semibold text-sm hover:border-purple-500 hover:ring-2 hover:ring-purple-500 hover:ring-opacity-20 transition-all duration-200"
                  >
                    Request Another Song
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSongRequest} className="bg-white/70 dark:bg-black/70 backdrop-blur-xl rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl border-2 border-gray-200/50 dark:border-gray-800/50 p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={songRequest.name}
                      onChange={(e) => setSongRequest({ ...songRequest, name: e.target.value })}
                      required
                      className="w-full px-3 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-4 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/20 transition-all duration-200"
                      placeholder="Enter your name"
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
                      Your Email <span className="text-gray-500 text-xs">(optional)</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={songRequest.email}
                      onChange={(e) => setSongRequest({ ...songRequest, email: e.target.value })}
                      className="w-full px-3 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-4 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/20 transition-all duration-200"
                      placeholder="Enter your email"
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <label htmlFor="song" className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
                      <Music className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                      Song Name or Link <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        ref={songTitleInputRef}
                        type="text"
                        id="song"
                        name="song"
                        value={songRequest.song}
                        onChange={handleSongInputChange}
                        onFocus={() => {
                          if (songRequest.song && !detectUrl(songRequest.song) && !isExtractedFromLink && songRequest.song.trim().length >= 2) {
                            setShowAutocomplete(true);
                          }
                        }}
                        onKeyDown={handleSongTitleKeyDown}
                        onBlur={(e) => {
                          setTimeout(() => {
                            setShowAutocomplete(false);
                            setSelectedSuggestionIndex(-1);
                          }, 200);
                          handleSongTitleBlur(e);
                        }}
                        required
                        className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-4 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/20 transition-all duration-200 touch-manipulation ${
                          extractingSong ? 'pr-20 sm:pr-24 md:pr-28' : isExtractedFromLink ? 'pr-20 sm:pr-24' : 'pr-3 sm:pr-4'
                        }`}
                        placeholder="Type song name or paste a link"
                        autoComplete="off"
                      />
                      {extractingSong && (
                        <div className="absolute right-2 sm:right-3 md:right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 sm:gap-2 pointer-events-none">
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-purple-500 flex-shrink-0" />
                          <span className="text-xs text-purple-600 dark:text-purple-400 hidden sm:inline whitespace-nowrap">Extracting...</span>
                        </div>
                      )}
                      {isExtractedFromLink && !extractingSong && (
                        <button
                          type="button"
                          onClick={handleClearExtraction}
                          className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          title="Clear and start over"
                        >
                          <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
                        </button>
                      )}
                    </div>
                    {extractionError && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        {extractionError}
                      </p>
                    )}
                    {isExtractedFromLink && !extractionError && (
                      <p className="mt-1 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        Song info extracted successfully
                      </p>
                    )}
                    {!songRequest.song && !isExtractedFromLink && !extractingSong && (
                      <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <Link2 className="w-3 h-3 flex-shrink-0" />
                        <span>Type a song name or paste a music link</span>
                      </p>
                    )}
                    {/* Autocomplete suggestions */}
                    {showAutocomplete && suggestions.length > 0 && (
                      <div className="mt-2 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto z-50">
                        {suggestions.map((suggestion, index) => (
                          <button
                            key={suggestion.id}
                            type="button"
                            onClick={() => handleSuggestionSelect(suggestion)}
                            className={`w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-3 ${
                              index === selectedSuggestionIndex ? 'bg-gray-100 dark:bg-gray-800' : ''
                            }`}
                          >
                            {suggestion.albumArt && (
                              <img
                                src={suggestion.albumArt}
                                alt=""
                                className="w-10 h-10 rounded flex-shrink-0 object-cover"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {suggestion.title}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {suggestion.artist}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {showAutocomplete && searchingSongs && suggestions.length === 0 && (
                      <div className="mt-2 p-3 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-lg flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Searching...</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="artist" className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
                      Artist Name
                      {!isExtractedFromLink && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      id="artist"
                      name="artist"
                      value={songRequest.artist}
                      onChange={(e) => setSongRequest({ ...songRequest, artist: e.target.value })}
                      required={!isExtractedFromLink}
                      className="w-full px-3 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-4 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/20 transition-all duration-200"
                      placeholder="Enter artist name"
                      autoComplete="off"
                    />
                  </div>
                  
                  {/* Album Art Display */}
                  {albumArtUrl && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800">
                      <img
                        src={albumArtUrl}
                        alt="Album art"
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover flex-shrink-0"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Album Art</p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                          {songRequest.song && songRequest.artist 
                            ? `${songRequest.song} by ${songRequest.artist}`
                            : 'Song information'}
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full mt-4 px-6 py-3.5 sm:py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-sm sm:text-base rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Music className="w-4 h-4 sm:w-5 sm:h-5" />
                    Submit Song Request
                  </button>
                </form>
              )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer Content - Combined Sections */}
        <section className="py-12 bg-black border-t border-gray-900">
          <div className="section-container">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* About DJ Ben Murray - Compact */}
                <div className="md:col-span-2">
                  <h3 className="text-xl font-light text-white mb-3 tracking-tight">
                    About DJ Ben Murray
                  </h3>
                  <p className="text-sm text-gray-400 mb-4 font-light leading-relaxed">
                    Founder and lead DJ of M10 DJ Company, with over 15 years of experience creating unforgettable celebrations throughout Memphis and the Mid-South. 500+ successful events.
                  </p>
                  <Link 
                    href="/dj-ben-murray"
                    className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-brand-gold uppercase tracking-wider transition-colors group"
                  >
                    Learn More
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
                
                {/* Share & Contact - Compact */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Share Event</h3>
                    <div className="flex flex-wrap gap-2">
                      {canUseNativeShare ? (
                        <button
                          onClick={handleNativeShare}
                          className="inline-flex items-center justify-center px-4 py-2 border border-gray-700 text-white text-xs uppercase tracking-wider hover:border-brand-gold hover:text-brand-gold transition-all"
                        >
                          <Share2 className="w-3 h-3 mr-1.5" />
                          Share
                        </button>
                      ) : (
                        <>
                          <a
                            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center px-4 py-2 border border-gray-700 text-white text-xs uppercase tracking-wider hover:border-brand-gold hover:text-brand-gold transition-all"
                          >
                            <Share2 className="w-3 h-3 mr-1.5" />
                            FB
                          </a>
                          <a
                            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center px-4 py-2 border border-gray-700 text-white text-xs uppercase tracking-wider hover:border-brand-gold hover:text-brand-gold transition-all"
                          >
                            <Share2 className="w-3 h-3 mr-1.5" />
                            X
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Need a DJ?</h3>
                    <div className="space-y-2">
                      <Link 
                        href="/contact" 
                        className="block text-xs text-gray-400 hover:text-brand-gold transition-colors"
                      >
                        Get Free Quote →
                      </Link>
                      <a 
                        href="tel:+19014102020" 
                        className="block text-xs text-gray-400 hover:text-brand-gold transition-colors"
                      >
                        (901) 410-2020
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

