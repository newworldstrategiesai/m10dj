import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client for organization lookups
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';
  
  // Extract subdomain (e.g., "m10dj" from "m10dj.yourdomain.com")
  const subdomain = hostname.split('.')[0];
  const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'm10djcompany.com';
  
  // Skip subdomain routing for:
  // - Main domain
  // - www subdomain
  // - API routes
  // - Static files
  // - Admin routes (when on main domain)
  const isMainDomain = hostname === mainDomain || hostname === `www.${mainDomain}`;
  const isApiRoute = url.pathname.startsWith('/api');
  const isStaticFile = url.pathname.startsWith('/_next') || 
                       url.pathname.startsWith('/favicon') ||
                       url.pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/);
  
  // Handle subdomain routing
  if (!isMainDomain && !isApiRoute && !isStaticFile && subdomain && subdomain !== 'www') {
    // Check if subdomain matches an organization slug
    try {
      // Skip lookup for localhost/development
      if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
        // In development, you can test with ?org=slug query param
        const orgSlug = url.searchParams.get('org');
        if (orgSlug) {
          const { data: org, error } = await supabase
            .from('organizations')
            .select('slug, id, name')
            .eq('slug', orgSlug)
            .single();
          
          if (!error && org) {
            url.pathname = `/organizations/${org.slug}`;
            return NextResponse.rewrite(url);
          }
        }
      } else {
        // Production: lookup by subdomain
        const { data: org, error } = await supabase
          .from('organizations')
          .select('slug, id, name')
          .eq('slug', subdomain)
          .single();
        
        if (!error && org) {
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