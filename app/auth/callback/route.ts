import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getErrorRedirect, getStatusRedirect } from '@/utils/helpers';
import { getRoleBasedRedirectUrl } from '@/utils/auth-helpers/role-redirect';

export async function GET(request: NextRequest) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the `@supabase/ssr` package. It exchanges an auth code for the user's session.
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        getErrorRedirect(
          `${requestUrl.origin}/signin`,
          error.name,
          "Sorry, we weren't able to log you in. Please try again."
        )
      );
    }

    // After successful authentication, link existing contacts to this user
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && user.email) {
        // Use service role to update contacts
        const { createClient: createServiceClient } = await import('@supabase/supabase-js');
        const serviceSupabase = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Find contacts with this email that don't have a user_id yet
        const { data: contacts, error: contactsError } = await serviceSupabase
          .from('contacts')
          .select('id')
          .eq('email_address', user.email.toLowerCase().trim())
          .is('user_id', null)
          .is('deleted_at', null);

        if (!contactsError && contacts && contacts.length > 0) {
          // Link these contacts to the new user
          const { error: updateError } = await serviceSupabase
            .from('contacts')
            .update({ user_id: user.id })
            .in('id', contacts.map(c => c.id));

          if (updateError) {
            console.error('Error linking contacts to user:', updateError);
          } else {
            console.log(`Linked ${contacts.length} contact(s) to user ${user.id}`);
          }
        }
      }
    } catch (linkError) {
      // Don't fail the auth flow if linking fails
      console.error('Error linking contacts during auth callback:', linkError);
    }
  }

  // Get role-based redirect URL
  const redirectUrl = await getRoleBasedRedirectUrl(requestUrl.origin);
  
  // URL to redirect to after sign in process completes
  return NextResponse.redirect(
    getStatusRedirect(
      redirectUrl,
      'Success!',
      'You are now signed in.'
    )
  );
}
