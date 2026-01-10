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

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

// Create Supabase client function to avoid module-level initialization issues
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables are not configured');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

interface ArtistPageProps {
  params: {
    slug: string[];
  };
}

export async function generateMetadata({ params }: ArtistPageProps): Promise<Metadata> {
  const slugs = Array.isArray(params.slug) ? params.slug : [params.slug];
  
  // Reserved paths that should not be handled by catch-all route
  const reservedPaths = [
    'claim',
    'signin',
    'signup',
    'dashboard',
    'onboarding',
    'pricing',
    'features',
    'how-it-works',
    'embed',
    'alerts',
    'admin',
    'api',
    'auth',
    'batch-create',
    'batch-dashboard',
    'privacy-policy',
    'terms-of-service',
    'recordings',
    'venue',
    'accept-invite'
  ];

  // Check if first slug is a reserved path
  const firstSlug = slugs[0];
  if (firstSlug && reservedPaths.includes(firstSlug.toLowerCase())) {
    return {
      title: 'Page Not Found | TipJar.Live',
    };
  }
  
  // Handle nested route: [venue-slug]/[performer-slug]
  if (slugs.length === 2) {
    const [venueSlug, performerSlug] = slugs;
    
    // Check if any slug is reserved
    if (reservedPaths.includes(venueSlug.toLowerCase()) || 
        reservedPaths.includes(performerSlug.toLowerCase())) {
      return {
        title: 'Page Not Found | TipJar.Live',
      };
    }
    
    // Get venue
    const supabase = getSupabaseClient();
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
  
  // Early return for reserved paths
  if (!slug || reservedPaths.includes(slug.toLowerCase())) {
    return {
      title: 'Page Not Found | TipJar.Live',
    };
  }
  
  const supabase = getSupabaseClient();
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
  
  // Reserved paths that should not be handled by catch-all route
  // These should be handled by their specific route files
  const reservedPaths = [
    'claim',
    'signin',
    'signup',
    'dashboard',
    'onboarding',
    'pricing',
    'features',
    'how-it-works',
    'embed',
    'alerts',
    'admin',
    'api',
    'auth',
    'batch-create',
    'batch-dashboard',
    'privacy-policy',
    'terms-of-service',
    'recordings',
    'venue',
    'accept-invite'
  ];

  // Check if first slug is a reserved path
  const firstSlug = slugs[0];
  if (firstSlug && reservedPaths.includes(firstSlug.toLowerCase())) {
    notFound();
  }
  
  // Handle nested route: [venue-slug]/[performer-slug]
  if (slugs.length === 2) {
    const [venueSlug, performerSlug] = slugs;
    
    // Check if any slug is reserved
    if (reservedPaths.includes(venueSlug.toLowerCase()) || 
        reservedPaths.includes(performerSlug.toLowerCase())) {
      notFound();
    }
    
    // Get venue organization
    const supabase = getSupabaseClient();
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
  }

  // Handle single slug route: [slug]
  const slug = slugs[0];
  
  // Early return for reserved paths (double-check)
  if (!slug || reservedPaths.includes(slug.toLowerCase())) {
    notFound();
  }
  
  // First check if organization exists
  const supabase = getSupabaseClient();
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
}

