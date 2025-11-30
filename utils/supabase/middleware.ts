import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export const createClient = (request: NextRequest) => {
  // Create an unmodified response
  let response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // If the cookie is updated, update the cookies for the request and response
          request.cookies.set({
            name,
            value,
            ...options
          });
          response = NextResponse.next({
            request: {
              headers: request.headers
            }
          });
          response.cookies.set({
            name,
            value,
            ...options
          });
        },
        remove(name: string, options: CookieOptions) {
          // If the cookie is removed, update the cookies for the request and response
          request.cookies.set({
            name,
            value: '',
            ...options
          });
          response = NextResponse.next({
            request: {
              headers: request.headers
            }
          });
          response.cookies.set({
            name,
            value: '',
            ...options
          });
        }
      }
    }
  );

  return { supabase, response };
};

export const updateSession = async (request: NextRequest) => {
  try {
    const { supabase, response } = createClient(request);

    // This will refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const { error } = await supabase.auth.getUser();

    // If we get a refresh token error, clear the invalid session
    if (error && (error.message.includes('refresh_token_not_found') || 
                  error.message.includes('Invalid Refresh Token') ||
                  error.code === 'refresh_token_not_found')) {
      // Sign out to clear all invalid session cookies
      // This will properly clean up all auth-related cookies
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        // Ignore sign out errors - we're just trying to clean up invalid tokens
        // The session is already invalid, so we can continue
      }
    }

    return response;
  } catch (e) {
    // If there's an error creating the client or any other error,
    // return a response without breaking the request
    return NextResponse.next({
      request: {
        headers: request.headers
      }
    });
  }
};
