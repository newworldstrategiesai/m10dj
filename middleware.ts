import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client for organization lookups
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Helper function to get organization by slug with normalized matching
 * Supports flexible matching: "ben-spins" and "benspins" will match the same organization
 */
async function getOrganizationBySlugNormalized(slug: string, filters?: {
  organization_type?: string;
  parent_organization_id?: string;
  performer_slug?: string;
  is_active?: boolean;
}) {
  try {
    // First try exact match (for performance)
    let query = supabase
      .from('organizations')
      .select('*')
      .eq('slug', slug);
    
    if (filters?.organization_type) {
      query = query.eq('organization_type', filters.organization_type);
    }
    if (filters?.parent_organization_id) {
      query = query.eq('parent_organization_id', filters.parent_organization_id);
    }
    if (filters?.performer_slug) {
      query = query.eq('performer_slug', filters.performer_slug);
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }
    
    const { data: exactOrg, error: exactError } = await query.maybeSingle();
    
    if (!exactError && exactOrg) {
      return exactOrg;
    }
    
    // If exact match fails, try normalized match using RPC function
    const { data: normalizedOrgs, error: rpcError } = await supabase
      .rpc('get_organization_by_normalized_slug', { input_slug: slug });
    
    if (rpcError || !normalizedOrgs || normalizedOrgs.length === 0) {
      return null;
    }
    
    // Apply filters to normalized results if provided
    let result = normalizedOrgs[0];
    if (filters) {
      if (filters.organization_type && result.organization_type !== filters.organization_type) {
        return null;
      }
      if (filters.parent_organization_id && result.parent_organization_id !== filters.parent_organization_id) {
        return null;
      }
      if (filters.performer_slug && result.performer_slug !== filters.performer_slug) {
        return null;
      }
      if (filters.is_active !== undefined && result.is_active !== filters.is_active) {
        return null;
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error getting organization by normalized slug:', error);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';
  const hostnameLower = hostname.toLowerCase();
  
  // Handle /tipjar/admin/* paths - rewrite to /admin/* (admin routes are in pages router)
  if (url.pathname.startsWith('/tipjar/admin/')) {
    url.pathname = url.pathname.replace('/tipjar/admin', '/admin');
    const response = await updateSession(request);
    const rewriteResponse = NextResponse.rewrite(url);
    rewriteResponse.headers.set('x-pathname', request.nextUrl.pathname);
    response.headers.forEach((value, key) => {
      if (key.startsWith('x-') || key === 'set-cookie') {
        rewriteResponse.headers.set(key, value);
      }
    });
    return rewriteResponse;
  }
  
  // Handle domain-based routing for marketing sites
  const isApiRoute = url.pathname.startsWith('/api');
  const isStaticFile = url.pathname.startsWith('/_next') || 
                       url.pathname.startsWith('/favicon') ||
                       url.pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/);
  
  // Skip routing for API routes and static files
  if (isApiRoute || isStaticFile) {
    const response = await updateSession(request);
    response.headers.set('x-pathname', request.nextUrl.pathname);
    return response;
  }
  
  // Check which domain we're on
  // Route groups (marketing) don't appear in URLs, so we rewrite to the actual route structure
  const isTipJarDomain = hostnameLower === 'tipjar.live' || 
                         hostnameLower === 'www.tipjar.live' ||
                         hostnameLower.endsWith('.tipjar.live');
  
  const isDJDashDomain = hostnameLower === 'djdash.net' || 
                         hostnameLower === 'www.djdash.net' ||
                         hostnameLower.endsWith('.djdash.net');
  
  // Route tipjar.live to marketing pages
  if (isTipJarDomain) {
    const path = url.pathname;
    let rewritePath = '';
    
    // Route sitemap and robots to domain-specific versions
    if (path === '/sitemap.xml' || path === '/sitemap') {
      url.pathname = '/sitemap-tipjar.xml';
      return NextResponse.rewrite(url);
    } else if (path === '/robots.txt' || path === '/robots') {
      url.pathname = '/robots-tipjar.txt';
      return NextResponse.rewrite(url);
    }
    
    // If path already starts with /tipjar/, let it pass through without rewriting
    if (path.startsWith('/tipjar/')) {
      const response = await updateSession(request);
      response.headers.set('x-pathname', request.nextUrl.pathname);
      response.headers.set('x-product', 'tipjar');
      return response;
    }
    
    // Rewrite paths to tipjar marketing routes
    if (path === '/' || path === '') {
      rewritePath = '/tipjar';
    } else if (path === '/pricing' || path.startsWith('/pricing/')) {
      rewritePath = '/tipjar/pricing';
    } else if (path === '/features' || path.startsWith('/features/')) {
      rewritePath = '/tipjar/features';
    } else if (path === '/how-it-works' || path.startsWith('/how-it-works/')) {
      rewritePath = '/tipjar/how-it-works';
    } else if (path === '/signup' || path.startsWith('/signup/')) {
      rewritePath = '/tipjar/signup';
    } else if (path === '/signin') {
      rewritePath = '/tipjar/signin';
    } else if (path.startsWith('/signin/')) {
      // Preserve the sub-path (e.g., /signin/password_signin -> /tipjar/signin/password_signin)
      rewritePath = path.replace('/signin', '/tipjar/signin');
    } else if (path === '/embed' || path.startsWith('/embed/')) {
      rewritePath = '/tipjar/embed';
    } else if (path === '/alerts' || path.startsWith('/alerts/')) {
      rewritePath = path.replace('/alerts', '/tipjar/alerts');
    } else if (path.startsWith('/live/')) {
      // Keep live stream paths as-is (handled by app router)
      // Don't rewrite, let it fall through
    } else if (path.startsWith('/dashboard/go-live')) {
      rewritePath = '/tipjar/dashboard/go-live';
    } else if (path.startsWith('/dashboard/')) {
      rewritePath = path.replace('/dashboard', '/tipjar/dashboard');
    } else if (path.startsWith('/auth/')) {
      // Auth routes (confirm, callback, reset_password) are in app router
      // Keep as-is, don't rewrite - these should work directly at /auth/*
      rewritePath = '';
    } else if (path.startsWith('/admin/')) {
      // Admin routes are in pages router, keep as-is
      // Don't rewrite, let it fall through to pages router
      rewritePath = '';
    } else if (path.startsWith('/requests')) {
      // Keep requests path as-is (handled by pages router)
      // Don't rewrite, let it fall through
    } else if (path.startsWith('/organizations/')) {
      // Keep /organizations/[slug]/requests paths as-is (handled by pages router)
      // Don't rewrite, let it fall through to pages router
      rewritePath = '';
    } else if (path === '/bid' || path.startsWith('/bid/')) {
      // Keep /bid path as-is (dedicated bidding page)
      // Don't rewrite, let it fall through to pages router
    } else if (path.startsWith('/crowd-request/')) {
      // Keep /crowd-request/* paths as-is (handled by pages router)
      // Don't rewrite, let it fall through to pages router
      rewritePath = '';
    } else if (path === '/privacy-policy' || path.startsWith('/privacy-policy/')) {
      rewritePath = '/tipjar/privacy-policy';
    } else if (path === '/terms-of-service' || path.startsWith('/terms-of-service/')) {
      rewritePath = '/tipjar/terms-of-service';
    } else {
      // Extract path parts for routing
      const pathParts = path.replace(/^\//, '').split('/').filter(Boolean);
      
      // Check for nested venue/performer paths: /[venue-slug]/[performer-slug]
      if (pathParts.length >= 2) {
        const [venueSlug, performerSlug, ...rest] = pathParts;
        
        // Lookup venue organization (with normalized slug matching)
        try {
          const venueOrg = await getOrganizationBySlugNormalized(venueSlug, {
            organization_type: 'venue'
          });
          
          if (venueOrg) {
            // Lookup performer organization (with normalized slug matching)
            const performerOrg = await getOrganizationBySlugNormalized(performerSlug, {
              parent_organization_id: venueOrg.id,
              performer_slug: performerSlug,
              is_active: true
            });
            
            if (performerOrg) {
              // Route to performer page
              if (rest.length === 0 || (rest.length === 1 && rest[0] === '')) {
                // Performer landing page: /[venue-slug]/[performer-slug]
                rewritePath = `/tipjar/${venueSlug}/${performerSlug}`;
              } else if (rest[0] === 'requests') {
                // Performer requests page: /[venue-slug]/[performer-slug]/requests
                rewritePath = `/organizations/${performerOrg.slug}/requests`;
              } else if (rest[0] === 'sing') {
                // Performer karaoke page: /[venue-slug]/[performer-slug]/sing
                rewritePath = `/organizations/${performerOrg.slug}/sing`;
              } else {
                // Other performer pages
                rewritePath = `/tipjar/${venueSlug}/${performerSlug}/${rest.join('/')}`;
              }
              
              // Set headers for organization context
              const response = await updateSession(request);
              const rewriteResponse = NextResponse.rewrite(new URL(rewritePath, request.url));
              rewriteResponse.headers.set('x-pathname', request.nextUrl.pathname);
              rewriteResponse.headers.set('x-product', 'tipjar');
              rewriteResponse.headers.set('x-venue-id', venueOrg.id);
              rewriteResponse.headers.set('x-performer-id', performerOrg.id);
              rewriteResponse.headers.set('x-organization-id', performerOrg.id);
              response.headers.forEach((value, key) => {
                if (key.startsWith('x-') || key === 'set-cookie') {
                  rewriteResponse.headers.set(key, value);
                }
              });
              return rewriteResponse;
            }
          }
        } catch (error) {
          // If lookup fails, continue with normal routing
          console.error('Error checking venue/performer:', error);
        }
      }
      
      // Check for venue-only path (venue landing page): /[venue-slug]
      if (pathParts.length === 1) {
        const [slug] = pathParts;
        
        try {
          const venueOrg = await getOrganizationBySlugNormalized(slug, {
            organization_type: 'venue'
          });
          
          if (venueOrg) {
            // Route to venue landing page
            rewritePath = `/tipjar/venue/${slug}`;
            
            const response = await updateSession(request);
            const rewriteResponse = NextResponse.rewrite(new URL(rewritePath, request.url));
            rewriteResponse.headers.set('x-pathname', request.nextUrl.pathname);
            rewriteResponse.headers.set('x-product', 'tipjar');
            rewriteResponse.headers.set('x-venue-id', venueOrg.id);
            response.headers.forEach((value, key) => {
              if (key.startsWith('x-') || key === 'set-cookie') {
                rewriteResponse.headers.set(key, value);
              }
            });
            return rewriteResponse;
          }
        } catch (error) {
          // If lookup fails, continue with normal routing
          console.error('Error checking venue:', error);
        }
      }
      
      // Fallback to existing slug-based routing
      const slug = pathParts[0];
      const subPath = pathParts[1];
      
      // Redirect old slug to new slug
      if (slug === 'm10dj') {
        const redirectPath = subPath ? `/m10djcompany/${subPath}` : '/m10djcompany';
        url.pathname = redirectPath;
        return NextResponse.redirect(url, 301); // Permanent redirect
      }
      
      if (slug && slug !== 'api' && slug !== '_next' && slug !== '_nextjs') {
        // Handle /[slug]/requests -> route to organization requests page
        if (subPath === 'requests') {
          rewritePath = `/organizations/${slug}/requests`;
        } else if (subPath === 'sing') {
          // Handle /[slug]/sing -> route to karaoke signup page
          rewritePath = `/organizations/${slug}/sing`;
        } else {
          // Route to artist page (e.g., /m10djcompany -> /tipjar/m10djcompany)
          rewritePath = `/tipjar/${slug}`;
        }
      }
    }

    // Update session and add headers
    const response = await updateSession(request);
    
    if (rewritePath) {
      // Rewrite to the marketing route
      url.pathname = rewritePath;
      const rewriteResponse = NextResponse.rewrite(url);
      rewriteResponse.headers.set('x-pathname', request.nextUrl.pathname);
      rewriteResponse.headers.set('x-product', 'tipjar');
      // Copy session headers from updateSession
      response.headers.forEach((value, key) => {
        if (key.startsWith('x-') || key === 'set-cookie') {
          rewriteResponse.headers.set(key, value);
        }
      });
      return rewriteResponse;
    }
    
    // For other paths, let Next.js handle routing normally but set product header
    response.headers.set('x-pathname', url.pathname);
    response.headers.set('x-product', 'tipjar');
    return response;
  }
  
  // Route djdash.net to marketing pages
  if (isDJDashDomain) {
    const path = url.pathname;
    let rewritePath = '';
    
    // Route sitemap and robots to domain-specific versions
    if (path === '/sitemap.xml' || path === '/sitemap') {
      url.pathname = '/sitemap-djdash.xml';
      return NextResponse.rewrite(url);
    } else if (path === '/robots.txt' || path === '/robots') {
      url.pathname = '/robots-djdash.txt';
      return NextResponse.rewrite(url);
    }
    
    // Rewrite paths to djdash marketing routes
    if (path === '/' || path === '') {
      rewritePath = '/djdash';
    } else if (path === '/business' || path.startsWith('/business/')) {
      rewritePath = '/djdash/business';
    } else if (path.startsWith('/dj/')) {
      // Rewrite /dj/[slug] to /djdash/dj/[slug] for DJ profile pages
      rewritePath = '/djdash' + path;
    } else if (path.startsWith('/find-dj/')) {
      // Rewrite /find-dj/* to /djdash/find-dj/*
      rewritePath = '/djdash' + path;
    } else if (path.startsWith('/dj-gigs/')) {
      // Rewrite /dj-gigs/* to /djdash/dj-gigs/*
      rewritePath = '/djdash' + path;
    } else if (path.startsWith('/djdash/')) {
      // If path already starts with /djdash/, let it pass through (no rewrite needed)
      rewritePath = '';
    } else if (path === '/pricing' || path.startsWith('/pricing/')) {
      rewritePath = '/djdash/pricing';
    } else if (path === '/features' || path.startsWith('/features/')) {
      rewritePath = '/djdash/features';
    } else if (path === '/how-it-works' || path.startsWith('/how-it-works/')) {
      rewritePath = '/djdash/how-it-works';
    } else if (path === '/signup' || path.startsWith('/signup/')) {
      rewritePath = '/djdash/signup';
    } else if (path === '/use-cases' || path.startsWith('/use-cases/')) {
      rewritePath = '/djdash/use-cases';
    } else if (path === '/signin' || path.startsWith('/signin/')) {
      // Signin is in app/signin, let it pass through
      rewritePath = '';
    } else if (path === '/privacy-policy' || path.startsWith('/privacy-policy/')) {
      // Privacy policy is in pages router, let it pass through
      rewritePath = '';
    } else if (path === '/terms-of-service' || path.startsWith('/terms-of-service/')) {
      // Terms of service is in pages router, let it pass through
      rewritePath = '';
    }

    // Update session and add headers
    const response = await updateSession(request);
    
    if (rewritePath) {
      // Rewrite to the marketing route
      url.pathname = rewritePath;
      const rewriteResponse = NextResponse.rewrite(url);
      rewriteResponse.headers.set('x-pathname', request.nextUrl.pathname);
      rewriteResponse.headers.set('x-product', 'djdash');
      // Copy session headers from updateSession
      response.headers.forEach((value, key) => {
        if (key.startsWith('x-') || key === 'set-cookie') {
          rewriteResponse.headers.set(key, value);
        }
      });
      return rewriteResponse;
    }
    
    // For other paths, let Next.js handle routing normally but set product header
    response.headers.set('x-pathname', url.pathname);
    response.headers.set('x-product', 'djdash');
    return response;
  }
  
  // Extract subdomain (e.g., "m10dj" from "m10dj.yourdomain.com")
  const subdomain = hostname.split('.')[0];
  const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'm10djcompany.com';
  const mainDomainLower = mainDomain.toLowerCase();
  
  // Skip subdomain routing for:
  // - Main domain (m10djcompany.com uses Pages Router)
  // - www subdomain
  // - Explicitly exclude main domain from marketing routing
  const isMainDomain = hostnameLower === mainDomainLower || 
                       hostnameLower === `www.${mainDomainLower}` ||
                       hostnameLower.endsWith(`.${mainDomainLower}`);
  
  // If this is the main domain, let Pages Router handle it (pages/index.js)
  // Make sure we're not matching tipjar or djdash domains
  if (isMainDomain && !isTipJarDomain && !isDJDashDomain) {
    // Block go-live page on main domain - redirect to tipjar.live
    if (url.pathname.startsWith('/dashboard/go-live')) {
      const tipjarUrl = new URL('https://tipjar.live/dashboard/go-live');
      // Preserve query params if any
      tipjarUrl.search = url.search;
      return NextResponse.redirect(tipjarUrl);
    }
    
    // Note: /onboarding/* pages will handle domain redirects client-side
    // based on user product_context (see pages/onboarding/stripe-complete.tsx)
    
    const response = await updateSession(request);
    response.headers.set('x-pathname', request.nextUrl.pathname);
    return response;
  }
  
  // Handle subdomain routing for organizations
  if (!isMainDomain && subdomain && subdomain !== 'www') {
    // Check if subdomain matches an organization slug
    try {
      // Skip lookup for localhost/development
      if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
        // In development, you can test with ?org=slug query param
        const orgSlug = url.searchParams.get('org');
          if (orgSlug) {
            const org = await getOrganizationBySlugNormalized(orgSlug);
            
            if (org) {
            url.pathname = `/organizations/${org.slug}`;
            return NextResponse.rewrite(url);
          }
        }
      } else {
        // Production: lookup by subdomain (with normalized slug matching)
        const org = await getOrganizationBySlugNormalized(subdomain);
        
        if (org) {
          // Organization found - route to organization pages
          // Map common paths to organization-specific routes
          const path = url.pathname;
          
          // Root path -> organization homepage
          if (path === '/' || path === '') {
            url.pathname = `/organizations/${org.slug}`;
            return NextResponse.rewrite(url);
          }
          
          // Requests page
          if (path === '/requests' || path.startsWith('/requests')) {
            url.pathname = `/organizations/${org.slug}/requests`;
            return NextResponse.rewrite(url);
          }
          
          // Contact page
          if (path === '/contact' || path.startsWith('/contact')) {
            url.pathname = `/organizations/${org.slug}/contact`;
            return NextResponse.rewrite(url);
          }
          
          // Services page
          if (path === '/services' || path.startsWith('/services')) {
            url.pathname = `/organizations/${org.slug}/services`;
            return NextResponse.rewrite(url);
          }
          
          // For other paths, add organization context
          // Store organization slug in header for pages to use
          const response = await updateSession(request);
          response.headers.set('x-organization-slug', org.slug);
          response.headers.set('x-organization-id', org.id);
          response.headers.set('x-pathname', url.pathname);
          return response;
        }
      }
    } catch (error) {
      console.error('Error checking organization subdomain:', error);
      // Continue with normal routing if lookup fails
    }
  }

  // Add pathname to headers so we can access it in app/layout.tsx
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);

  // Update Supabase session and handle refresh tokens
  const response = await updateSession(request);
  
  // Preserve the pathname header in the response
  response.headers.set('x-pathname', request.nextUrl.pathname);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};