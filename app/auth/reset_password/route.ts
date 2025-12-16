import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getErrorRedirect, getStatusRedirect } from '@/utils/helpers';

export async function GET(request: NextRequest) {
  // The `/auth/reset_password` route handles password reset email links
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      // Check if this is a TipJar user based on referrer or try to detect
      const isTipJar = requestUrl.hostname.includes('tipjar') || 
                       request.headers.get('referer')?.includes('tipjar');
      
      const forgotPasswordPath = isTipJar 
        ? `${requestUrl.origin}/tipjar/signin/forgot_password`
        : `${requestUrl.origin}/signin/forgot_password`;
      
      return NextResponse.redirect(
        getErrorRedirect(
          forgotPasswordPath,
          error.name,
          "Sorry, we weren't able to log you in. Please try again."
        )
      );
    }

    // After successful code exchange, check user's product context
    const { data: { user } } = await supabase.auth.getUser();
    const productContext = user?.user_metadata?.product_context;
    
    // Determine redirect path based on product context
    let updatePasswordPath: string;
    if (productContext === 'tipjar') {
      updatePasswordPath = `${requestUrl.origin}/tipjar/signin/update_password`;
    } else {
      updatePasswordPath = `${requestUrl.origin}/signin/update_password`;
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(
      getStatusRedirect(
        updatePasswordPath,
        'You are now signed in.',
        'Please enter a new password for your account.'
      )
    );
  }

  // No code provided - redirect to appropriate forgot password page
  const isTipJar = requestUrl.hostname.includes('tipjar') || 
                   request.headers.get('referer')?.includes('tipjar');
  const forgotPasswordPath = isTipJar 
    ? `${requestUrl.origin}/tipjar/signin/forgot_password`
    : `${requestUrl.origin}/signin/forgot_password`;
  
  return NextResponse.redirect(forgotPasswordPath);
}
