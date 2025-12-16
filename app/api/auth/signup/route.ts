import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getURL } from '@/utils/helpers';

function isValidEmail(email: string) {
  const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return regex.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('password') || '').trim();
    const businessName = String(formData.get('businessName') || '').trim();

    // Validate email
    if (!email || !isValidEmail(email)) {
      return NextResponse.redirect(
        new URL(`/tipjar/signup?error=${encodeURIComponent('Invalid email address. Please try again.')}`, request.url)
      );
    }

    // Validate password
    if (!password || password.length < 8) {
      return NextResponse.redirect(
        new URL(`/tipjar/signup?error=${encodeURIComponent('Password must be at least 8 characters.')}`, request.url)
      );
    }

    const supabase = createClient();
    const callbackURL = getURL('/auth/callback');

    // Sign up the user with TipJar product context
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: callbackURL,
        data: {
          organization_name: businessName || undefined,
          product_context: 'tipjar', // Mark user as TipJar signup
        }
      }
    });

    if (error) {
      // Check if user already exists
      const isExistingUser = 
        error.message?.toLowerCase().includes('user already registered') ||
        error.message?.toLowerCase().includes('email already registered') ||
        error.message?.toLowerCase().includes('already been registered') ||
        error.code === 'signup_disabled' ||
        error.message?.toLowerCase().includes('user already exists');
      
      if (isExistingUser) {
        // Redirect to sign in with helpful message and pre-filled email
        return NextResponse.redirect(
          new URL(`/tipjar/signin/password_signin?email=${encodeURIComponent(email)}&message=${encodeURIComponent('An account with this email already exists. Please sign in instead.')}`, request.url)
        );
      }
      
      return NextResponse.redirect(
        new URL(`/tipjar/signup?error=${encodeURIComponent(error.message)}`, request.url)
      );
    }

    if (data.user) {
      if (data.session) {
        // User is signed in immediately - redirect to TipJar dashboard
        // The product context is already set in metadata, so future redirects will use it
        return NextResponse.redirect(new URL('/tipjar/dashboard', request.url));
      } else {
        // Email confirmation required
        return NextResponse.redirect(
          new URL(`/tipjar/signup?success=${encodeURIComponent('Account created! Please check your email to confirm your account.')}`, request.url)
        );
      }
    }

    return NextResponse.redirect(
      new URL(`/tipjar/signup?error=${encodeURIComponent('Something went wrong. Please try again.')}`, request.url)
    );
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.redirect(
      new URL(`/tipjar/signup?error=${encodeURIComponent(error.message || 'An error occurred. Please try again.')}`, request.url)
    );
  }
}

