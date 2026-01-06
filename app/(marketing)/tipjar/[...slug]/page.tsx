import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import TipJarHeader from '@/components/tipjar/Header';
import TipJarFooter from '@/components/tipjar/Footer';
import CustomCSS from '@/components/tipjar/CustomCSS';
import { Button } from '@/components/ui/button';
import {
  Music,
  Mail,
  Phone,
  ExternalLink,
  Calendar,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Link as LinkIcon,
  Play,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ArtistPageProps {
  params: {
    slug: string[];
  };
}

export async function generateMetadata({ params }: ArtistPageProps): Promise<Metadata> {
  const slugs = Array.isArray(params.slug) ? params.slug : [params.slug];
  
  // Handle nested route: [venue-slug]/[performer-slug]
  if (slugs.length === 2) {
    const [venueSlug, performerSlug] = slugs;
    
    // Get venue
    const { data: venueOrg } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('slug', venueSlug)
      .eq('organization_type', 'venue')
      .single();

    if (!venueOrg) {
      return {
        title: 'Performer Not Found | TipJar.Live',
      };
    }

    // Get performer
    const { data: performerOrg } = await supabase
      .from('organizations')
      .select('name, artist_page_headline, artist_page_bio, artist_page_profile_image_url')
      .eq('parent_organization_id', venueOrg.id)
      .eq('performer_slug', performerSlug)
      .eq('is_active', true)
      .single();

    if (!performerOrg) {
      return {
        title: 'Performer Not Found | TipJar.Live',
      };
    }

    const title = performerOrg.artist_page_headline || `${performerOrg.name} at ${venueOrg.name} | TipJar.Live`;
    const description = performerOrg.artist_page_bio?.substring(0, 160) || `Visit ${performerOrg.name} at ${venueOrg.name} on TipJar.Live`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: performerOrg.artist_page_profile_image_url ? [performerOrg.artist_page_profile_image_url] : [],
      },
    };
  }
  
  // Handle single slug route: [slug]
  const slug = slugs[0];
  const { data: org } = await supabase
    .from('organizations')
    .select('name, artist_page_headline, artist_page_bio, artist_page_profile_image_url')
    .eq('slug', slug)
    .eq('artist_page_enabled', true)
    .single();

  if (!org) {
    return {
      title: 'Artist Not Found | TipJar.Live',
    };
  }

  const title = org.artist_page_headline || `${org.name} | TipJar.Live`;
  const description = org.artist_page_bio?.substring(0, 160) || `Visit ${org.name} on TipJar.Live`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: org.artist_page_profile_image_url ? [org.artist_page_profile_image_url] : [],
    },
  };
}

function getIconForLink(icon: string) {
  const iconMap: Record<string, any> = {
    instagram: Instagram,
    facebook: Facebook,
    twitter: Twitter,
    youtube: Youtube,
    spotify: Music, // Use Music icon for Spotify since Spotify icon doesn't exist in lucide-react
    music: Music,
    link: LinkIcon,
  };
  return iconMap[icon?.toLowerCase()] || ExternalLink;
}

export default async function ArtistPage({ params }: ArtistPageProps) {
  const slugs = Array.isArray(params.slug) ? params.slug : [params.slug];
  
  // Handle nested route: [venue-slug]/[performer-slug]
  if (slugs.length === 2) {
    const [venueSlug, performerSlug] = slugs;
    
    // Get venue organization
    const { data: venueOrg, error: venueError } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('slug', venueSlug)
      .eq('organization_type', 'venue')
      .single();

    if (venueError || !venueOrg) {
      notFound();
    }

    // Get performer organization
    const { data: performerOrg, error: performerError } = await supabase
      .from('organizations')
      .select('*')
      .eq('parent_organization_id', venueOrg.id)
      .eq('performer_slug', performerSlug)
      .eq('is_active', true)
      .single();

    if (performerError || !performerOrg) {
      notFound();
    }

    // Artist pages are not yet implemented - redirect all /tipjar/[venue]/[performer] to requests page
    // This ensures users always see the requests page instead of an error
    redirect(`/${venueSlug}/${performerSlug}/requests`);

    const links = (performerOrg.artist_page_links as any[]) || [];
    const galleryImages = performerOrg.artist_page_gallery_images || [];
    const videoUrls = performerOrg.artist_page_video_urls || [];

    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <TipJarHeader />
        
        {/* Venue Context Banner */}
        <div className="bg-purple-50 dark:bg-purple-900/20 border-b border-purple-200 dark:border-purple-800">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <Link 
                href={`/${venueSlug}`}
                className="flex items-center text-sm text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span>Back to {venueOrg.name}</span>
              </Link>
              <span className="text-xs text-purple-600 dark:text-purple-400">
                Performing at {venueOrg.name}
              </span>
            </div>
          </div>
        </div>
        
        {/* Hero Section */}
        <section className="relative pt-16 md:pt-24 pb-16 md:pb-24 overflow-hidden">
          {performerOrg.artist_page_cover_image_url ? (
            <div className="absolute inset-0">
              <Image
                src={performerOrg.artist_page_cover_image_url}
                alt={`${performerOrg.name} cover`}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600" />
          )}
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              {/* Profile Image */}
              {performerOrg.artist_page_profile_image_url && (
                <div className="mb-6 flex justify-center">
                  <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shadow-2xl">
                    <Image
                      src={performerOrg.artist_page_profile_image_url}
                      alt={performerOrg.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
              
              {/* Performer Name */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
                {performerOrg.name}
              </h1>
              
              {/* Headline */}
              {performerOrg.artist_page_headline && (
                <p className="text-xl md:text-2xl text-purple-100 mb-6">
                  {performerOrg.artist_page_headline}
                </p>
              )}
              
              {/* Bio */}
              {performerOrg.artist_page_bio && (
                <p className="text-lg text-white/90 max-w-2xl mx-auto mb-8 leading-relaxed">
                  {performerOrg.artist_page_bio}
                </p>
              )}
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 justify-center">
                {performerOrg.artist_page_booking_url && (
                  <Link href={performerOrg.artist_page_booking_url} target="_blank" rel="noopener noreferrer">
                    <Button className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-6 py-3">
                      <Calendar className="w-5 h-5 mr-2" />
                      Book Now
                    </Button>
                  </Link>
                )}
                <Link href={`/${venueSlug}/${performerSlug}/requests`}>
                  <Button className="bg-purple-600 text-white hover:bg-purple-700 font-semibold px-6 py-3">
                    <Music className="w-5 h-5 mr-2" />
                    Request a Song
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Links Section */}
        {links.length > 0 && (
          <section className="py-12 bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">
                  Connect & Listen
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {links.map((link: any, index: number) => {
                    const IconComponent = getIconForLink(link.icon);
                    return (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all hover:scale-105 border border-gray-200 dark:border-gray-700"
                      >
                        <IconComponent className="w-8 h-8 mb-2 text-purple-600 dark:text-purple-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white text-center">
                          {link.label}
                        </span>
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Gallery Section */}
        {galleryImages.length > 0 && (
          <section className="py-12 bg-white dark:bg-gray-950">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">
                  Gallery
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {galleryImages.map((imageUrl: string, index: number) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow group"
                    >
                      <Image
                        src={imageUrl}
                        alt={`${performerOrg.name} gallery ${index + 1}`}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Videos Section */}
        {videoUrls.length > 0 && (
          <section className="py-12 bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">
                  Videos
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {videoUrls.map((videoUrl: string, index: number) => {
                    const youtubeMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
                    const vimeoMatch = videoUrl.match(/vimeo\.com\/(\d+)/);
                    
                    if (youtubeMatch) {
                      const videoId = youtubeMatch[1];
                      return (
                        <div key={index} className="relative aspect-video rounded-lg overflow-hidden shadow-lg">
                          <iframe
                            src={`https://www.youtube.com/embed/${videoId}`}
                            title={`${performerOrg.name} video ${index + 1}`}
                            className="absolute inset-0 w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      );
                    } else if (vimeoMatch) {
                      const videoId = vimeoMatch[1];
                      return (
                        <div key={index} className="relative aspect-video rounded-lg overflow-hidden shadow-lg">
                          <iframe
                            src={`https://player.vimeo.com/video/${videoId}`}
                            title={`${performerOrg.name} video ${index + 1}`}
                            className="absolute inset-0 w-full h-full"
                            allow="autoplay; fullscreen; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      );
                    } else {
                      return (
                        <a
                          key={index}
                          href={videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative aspect-video rounded-lg overflow-hidden shadow-lg bg-gray-800 flex items-center justify-center group"
                        >
                          <Play className="w-16 h-16 text-white group-hover:scale-110 transition-transform" />
                        </a>
                      );
                    }
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Contact Section */}
        {(performerOrg.artist_page_contact_email || performerOrg.artist_page_contact_phone) && (
          <section className="py-12 bg-white dark:bg-gray-950">
            <div className="container mx-auto px-4">
              <div className="max-w-2xl mx-auto text-center">
                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                  Get In Touch
                </h2>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {performerOrg.artist_page_contact_email && (
                    <a
                      href={`mailto:${performerOrg.artist_page_contact_email}`}
                      className="flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      <Mail className="w-5 h-5 mr-2" />
                      {performerOrg.artist_page_contact_email}
                    </a>
                  )}
                  {performerOrg.artist_page_contact_phone && (
                    <a
                      href={`tel:${performerOrg.artist_page_contact_phone}`}
                      className="flex items-center justify-center px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
                    >
                      <Phone className="w-5 h-5 mr-2" />
                      {performerOrg.artist_page_contact_phone}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Custom CSS */}
        <CustomCSS css={performerOrg.artist_page_custom_css || ''} />

        <TipJarFooter />
      </div>
    );
  }

  // Handle single slug route: [slug]
  const slug = slugs[0];
  
  // First check if organization exists
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .single();

  // If organization doesn't exist, show 404
  if (orgError || !org) {
    console.error('Organization not found:', slug, orgError);
    notFound();
  }

  // Artist pages are not yet implemented - redirect all /tipjar/[slug] to requests page
  // This ensures users always see the requests page instead of an error
  redirect(`/${slug}/requests`);

  const links = (org.artist_page_links as any[]) || [];
  const galleryImages = org.artist_page_gallery_images || [];
  const videoUrls = org.artist_page_video_urls || [];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <TipJarHeader />
      
      {/* Hero Section with Cover Image */}
      <section className="relative pt-24 md:pt-32 pb-16 md:pb-24 overflow-hidden">
        {org.artist_page_cover_image_url ? (
          <div className="absolute inset-0">
            <Image
              src={org.artist_page_cover_image_url}
              alt={`${org.name} cover`}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600" />
        )}
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Profile Image */}
            {org.artist_page_profile_image_url && (
              <div className="mb-6 flex justify-center">
                <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shadow-2xl">
                  <Image
                    src={org.artist_page_profile_image_url}
                    alt={org.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}
            
            {/* Artist Name */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              {org.name}
            </h1>
            
            {/* Headline */}
            {org.artist_page_headline && (
              <p className="text-xl md:text-2xl text-purple-100 mb-6">
                {org.artist_page_headline}
              </p>
            )}
            
            {/* Bio */}
            {org.artist_page_bio && (
              <p className="text-lg text-white/90 max-w-2xl mx-auto mb-8 leading-relaxed">
                {org.artist_page_bio}
              </p>
            )}
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 justify-center">
              {org.artist_page_booking_url && (
                <Link href={org.artist_page_booking_url} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-6 py-3">
                    <Calendar className="w-5 h-5 mr-2" />
                    Book Now
                  </Button>
                </Link>
              )}
              <Link href={`/${slug}/requests`}>
                <Button className="bg-purple-600 text-white hover:bg-purple-700 font-semibold px-6 py-3">
                  <Music className="w-5 h-5 mr-2" />
                  Request a Song
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Links Section */}
      {links.length > 0 && (
        <section className="py-12 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">
                Connect & Listen
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {links.map((link: any, index: number) => {
                  const IconComponent = getIconForLink(link.icon);
                  return (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all hover:scale-105 border border-gray-200 dark:border-gray-700"
                    >
                      <IconComponent className="w-8 h-8 mb-2 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white text-center">
                        {link.label}
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Gallery Section */}
      {galleryImages.length > 0 && (
        <section className="py-12 bg-white dark:bg-gray-950">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">
                Gallery
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {galleryImages.map((imageUrl: string, index: number) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow group"
                  >
                    <Image
                      src={imageUrl}
                      alt={`${org.name} gallery ${index + 1}`}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Videos Section */}
      {videoUrls.length > 0 && (
        <section className="py-12 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">
                Videos
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {videoUrls.map((videoUrl: string, index: number) => {
                  // Extract video ID from YouTube/Vimeo URLs
                  const youtubeMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
                  const vimeoMatch = videoUrl.match(/vimeo\.com\/(\d+)/);
                  
                  if (youtubeMatch) {
                    const videoId = youtubeMatch[1];
                    return (
                      <div key={index} className="relative aspect-video rounded-lg overflow-hidden shadow-lg">
                        <iframe
                          src={`https://www.youtube.com/embed/${videoId}`}
                          title={`${org.name} video ${index + 1}`}
                          className="absolute inset-0 w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    );
                  } else if (vimeoMatch) {
                    const videoId = vimeoMatch[1];
                    return (
                      <div key={index} className="relative aspect-video rounded-lg overflow-hidden shadow-lg">
                        <iframe
                          src={`https://player.vimeo.com/video/${videoId}`}
                          title={`${org.name} video ${index + 1}`}
                          className="absolute inset-0 w-full h-full"
                          allow="autoplay; fullscreen; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    );
                  } else {
                    return (
                      <a
                        key={index}
                        href={videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative aspect-video rounded-lg overflow-hidden shadow-lg bg-gray-800 flex items-center justify-center group"
                      >
                        <Play className="w-16 h-16 text-white group-hover:scale-110 transition-transform" />
                      </a>
                    );
                  }
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      {(org.artist_page_contact_email || org.artist_page_contact_phone) && (
        <section className="py-12 bg-white dark:bg-gray-950">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                Get In Touch
              </h2>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {org.artist_page_contact_email && (
                  <a
                    href={`mailto:${org.artist_page_contact_email}`}
                    className="flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    <Mail className="w-5 h-5 mr-2" />
                    {org.artist_page_contact_email}
                  </a>
                )}
                {org.artist_page_contact_phone && (
                  <a
                    href={`tel:${org.artist_page_contact_phone}`}
                    className="flex items-center justify-center px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    {org.artist_page_contact_phone}
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Custom CSS */}
      <CustomCSS css={org.artist_page_custom_css || ''} />

      <TipJarFooter />
    </div>
  );
}

