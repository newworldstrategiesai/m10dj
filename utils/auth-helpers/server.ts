'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getURL, getErrorRedirect, getStatusRedirect } from 'utils/helpers';
import { getAuthTypes } from 'utils/auth-helpers/settings';
import { getRoleBasedRedirectUrl } from '@/utils/auth-helpers/role-redirect';

function isValidEmail(email: string) {
  var regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return regex.test(email);
}

export async function redirectToPath(path: string) {
  return redirect(path);
}

export async function SignOut(formData: FormData) {
  const pathName = String(formData.get('pathName')).trim();

  const supabase = createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return getErrorRedirect(
      pathName,
      'Hmm... Something went wrong.',
      'You could not be signed out.'
    );
  }

  return '/signin';
}

export async function signInWithEmail(formData: FormData) {
  const cookieStore = cookies();
  const callbackURL = getURL('/auth/callback');

  const email = String(formData.get('email')).trim();
  let redirectPath: string;

  if (!isValidEmail(email)) {
    redirectPath = getErrorRedirect(
      '/signin/email_signin',
      'Invalid email address.',
      'Please try again.'
    );
  }

  const supabase = createClient();
  let options = {
    emailRedirectTo: callbackURL,
    shouldCreateUser: true
  };

  // If allowPassword is false, do not create a new user
  const { allowPassword } = getAuthTypes();
  if (allowPassword) options.shouldCreateUser = false;
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: options
  });

  if (error) {
    redirectPath = getErrorRedirect(
      '/signin/email_signin',
      'You could not be signed in.',
      error.message
    );
  } else if (data) {
    cookieStore.set('preferredSignInView', 'email_signin', { path: '/' });
    redirectPath = getStatusRedirect(
      '/signin/email_signin',
      'Success!',
      'Please check your email for a magic link. You may now close this tab.',
      true
    );
  } else {
    redirectPath = getErrorRedirect(
      '/signin/email_signin',
      'Hmm... Something went wrong.',
      'You could not be signed in.'
    );
  }

  return redirectPath;
}

export async function requestPasswordUpdate(formData: FormData) {
  const callbackURL = getURL('/auth/reset_password');

  // Get form data
  const email = String(formData.get('email')).trim();
  const productContext = String(formData.get('productContext') || '').trim();
  let redirectPath: string;

  // Determine if this is a TipJar request
  const supabase = createClient();
  let isTipJar = productContext === 'tipjar';
  
  // If product context not provided, try to determine from user's account
  if (!isTipJar) {
    try {
      // Try to look up user by email to check their product context
      // Note: We can't directly query by email, but we can check if current user has tipjar context
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.product_context === 'tipjar') {
        isTipJar = true;
      }
    } catch (error) {
      // User not logged in, continue with default behavior
    }
  }

  if (!isValidEmail(email)) {
    const forgotPasswordPath = isTipJar 
      ? '/tipjar/signin/forgot_password'
      : '/signin/forgot_password';
    redirectPath = getErrorRedirect(
      forgotPasswordPath,
      'Invalid email address.',
      'Please try again.'
    );
    return redirectPath;
  }

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: callbackURL
  });

  const forgotPasswordPath = isTipJar 
    ? '/tipjar/signin/forgot_password'
    : '/signin/forgot_password';

  if (error) {
    redirectPath = getErrorRedirect(
      forgotPasswordPath,
      error.message,
      'Please try again.'
    );
  } else if (data) {
    redirectPath = getStatusRedirect(
      forgotPasswordPath,
      'Success!',
      'Please check your email for a password reset link. You may now close this tab.',
      true
    );
  } else {
    redirectPath = getErrorRedirect(
      forgotPasswordPath,
      'Hmm... Something went wrong.',
      'Password reset email could not be sent.'
    );
  }

  return redirectPath;
}

export async function signInWithPassword(formData: FormData) {
  const cookieStore = cookies();
  const email = String(formData.get('email')).trim();
  const password = String(formData.get('password')).trim();
  const redirectTo = formData.get('redirect') as string;
  const productContext = String(formData.get('productContext') || '').trim();
  let redirectPath: string;

  const supabase = createClient();
  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    // Use productContext from form data (set by client component based on URL path)
    // This works even when sign-in fails because we can't check user metadata
    const signinPath = productContext === 'tipjar' 
      ? '/tipjar/signin/password_signin'
      : '/signin/password_signin';
    
    redirectPath = getErrorRedirect(
      signinPath,
      'Sign in failed.',
      error.message
    );
  } else if (data.user) {
    cookieStore.set('preferredSignInView', 'password_signin', { path: '/' });
    
    // Check product context to determine redirect
    const productContext = data.user.user_metadata?.product_context;
    let finalRedirectUrl: string;
    
    if (redirectTo) {
      finalRedirectUrl = decodeURIComponent(redirectTo);
    } else if (productContext === 'tipjar') {
      // Use product-based redirect for TipJar users
      const { getProductBasedRedirectUrl } = await import('./product-redirect');
      finalRedirectUrl = await getProductBasedRedirectUrl();
    } else {
      // Use role-based redirect for other users
      finalRedirectUrl = await getRoleBasedRedirectUrl();
    }
    
    redirectPath = getStatusRedirect(finalRedirectUrl, 'Success!', 'You are now signed in.');
  } else {
    // Use productContext from form data for error redirect
    const signinPath = productContext === 'tipjar' 
      ? '/tipjar/signin/password_signin'
      : '/signin/password_signin';
    
    redirectPath = getErrorRedirect(
      signinPath,
      'Hmm... Something went wrong.',
      'You could not be signed in.'
    );
  }

  return redirectPath;
}

export async function signUp(formData: FormData) {
  const callbackURL = getURL('/auth/callback');

  const email = String(formData.get('email')).trim();
  const password = String(formData.get('password')).trim();
  let redirectPath: string;

  if (!isValidEmail(email)) {
    redirectPath = getErrorRedirect(
      '/signin/signup',
      'Invalid email address.',
      'Please try again.'
    );
  }

  const supabase = createClient();
  const businessName = String(formData.get('businessName') || '').trim();
  
  // Pass business name and product context in metadata for organization creation
  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: callbackURL,
      data: {
        organization_name: businessName || undefined, // Only include if provided
        product_context: 'm10dj', // Mark user as M10 DJ Company signup
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
      // Redirect to sign in with helpful message
      redirectPath = getStatusRedirect(
        `/signin/password_signin?email=${encodeURIComponent(email)}`,
        'Account Already Exists',
        'An account with this email already exists. Please sign in instead.'
      );
    } else {
      redirectPath = getErrorRedirect(
        '/signin/signup',
        'Sign up failed.',
        error.message
      );
    }
  } else if (data.session) {
    // User is signed in immediately - redirect to onboarding for SaaS customers
    // The role-based redirect will handle sending them to the right place
    const redirectUrl = await getRoleBasedRedirectUrl();
    redirectPath = getStatusRedirect(redirectUrl, 'Success!', 'You are now signed in.');
  } else if (
    data.user &&
    data.user.identities &&
    data.user.identities.length == 0
  ) {
    // User exists but has no identities - account already exists
    redirectPath = getStatusRedirect(
      `/signin/password_signin?email=${encodeURIComponent(email)}`,
      'Account Already Exists',
      'An account with this email already exists. Please sign in instead.'
    );
  } else if (data.user) {
    // User created but no session (email confirmation required)
    // For SaaS onboarding, redirect to onboarding even without confirmed email
    // The onboarding page will handle unconfirmed users
    const redirectUrl = await getRoleBasedRedirectUrl();
    redirectPath = getStatusRedirect(
      redirectUrl,
      'Account created!',
      'Please check your email to confirm your account. You can still access onboarding.'
    );
  } else {
    redirectPath = getErrorRedirect(
      '/signin/signup',
      'Hmm... Something went wrong.',
      'You could not be signed up.'
    );
  }

  return redirectPath;
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get('password')).trim();
  const passwordConfirm = String(formData.get('passwordConfirm')).trim();
  let redirectPath: string;

  const supabase = createClient();
  
  // Check that the password and confirmation match
  if (password !== passwordConfirm) {
    // Get user to determine product context for error redirect
    const { data: { user } } = await supabase.auth.getUser();
    const productContext = user?.user_metadata?.product_context;
    const updatePasswordPath = productContext === 'tipjar' 
      ? '/tipjar/signin/update_password'
      : '/signin/update_password';
    
    redirectPath = getErrorRedirect(
      updatePasswordPath,
      'Your password could not be updated.',
      'Passwords do not match.'
    );
    return redirectPath;
  }

  const { error, data } = await supabase.auth.updateUser({
    password
  });

  if (error) {
    // Get user to determine product context for error redirect
    const { data: { user } } = await supabase.auth.getUser();
    const productContext = user?.user_metadata?.product_context;
    const updatePasswordPath = productContext === 'tipjar' 
      ? '/tipjar/signin/update_password'
      : '/signin/update_password';
    
    redirectPath = getErrorRedirect(
      updatePasswordPath,
      'Your password could not be updated.',
      error.message
    );
  } else if (data.user) {
    // Get user's product context to redirect to correct dashboard
    const productContext = data.user.user_metadata?.product_context;
    
    if (productContext === 'tipjar') {
      redirectPath = getStatusRedirect(
        '/admin/crowd-requests',
        'Success!',
        'Your password has been updated.'
      );
    } else {
      // Use product-based redirect for M10 DJ users
      const redirectUrl = await getRoleBasedRedirectUrl();
      redirectPath = getStatusRedirect(
        redirectUrl,
        'Success!',
        'Your password has been updated.'
      );
    }
  } else {
    // Get user to determine product context for error redirect
    const { data: { user } } = await supabase.auth.getUser();
    const productContext = user?.user_metadata?.product_context;
    const updatePasswordPath = productContext === 'tipjar' 
      ? '/tipjar/signin/update_password'
      : '/signin/update_password';
    
    redirectPath = getErrorRedirect(
      updatePasswordPath,
      'Hmm... Something went wrong.',
      'Your password could not be updated.'
    );
  }

  return redirectPath;
}

export async function updateEmail(formData: FormData) {
  // Get form data
  const newEmail = String(formData.get('newEmail')).trim();

  // Check that the email is valid
  if (!isValidEmail(newEmail)) {
    return getErrorRedirect(
      '/account',
      'Your email could not be updated.',
      'Invalid email address.'
    );
  }

  const supabase = createClient();

  const callbackUrl = getURL(
    getStatusRedirect('/account', 'Success!', `Your email has been updated.`)
  );

  const { error } = await supabase.auth.updateUser(
    { email: newEmail },
    {
      emailRedirectTo: callbackUrl
    }
  );

  if (error) {
    return getErrorRedirect(
      '/account',
      'Your email could not be updated.',
      error.message
    );
  } else {
    return getStatusRedirect(
      '/account',
      'Confirmation emails sent.',
      `You will need to confirm the update by clicking the links sent to both the old and new email addresses.`
    );
  }
}

export async function updateName(formData: FormData) {
  // Get form data
  const fullName = String(formData.get('fullName')).trim();

  const supabase = createClient();
  const { error, data } = await supabase.auth.updateUser({
    data: { full_name: fullName }
  });

  if (error) {
    return getErrorRedirect(
      '/account',
      'Your name could not be updated.',
      error.message
    );
  } else if (data.user) {
    return getStatusRedirect(
      '/account',
      'Success!',
      'Your name has been updated.'
    );
  } else {
    return getErrorRedirect(
      '/account',
      'Hmm... Something went wrong.',
      'Your name could not be updated.'
    );
  }
}

export async function updateAdminPhoneNumber(formData: FormData) {
  const supabase = createClient();
  const newPhoneNumber = formData.get('newAdminPhoneNumber') as string;

  if (!newPhoneNumber) {
    return getErrorRedirect('/account', 'Phone number is required');
  }

  // Clean phone number (remove spaces, dashes, parentheses)
  const cleanedPhone = newPhoneNumber.replace(/[\s\-\(\)]/g, '');

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return getErrorRedirect('/account', 'Authentication required');
  }

  // Update or insert admin phone number setting
  const { error } = await (supabase as any)
    .from('admin_settings')
    .upsert(
      {
        user_id: user.id,
        setting_key: 'admin_phone_number',
        setting_value: cleanedPhone
      },
      {
        onConflict: 'user_id,setting_key'
      }
    );

  if (error) {
    console.error('Error updating admin phone number:', error);
    return getErrorRedirect('/account', 'Failed to update phone number');
  }

  return getStatusRedirect('/account', 'Success!', 'Phone number updated successfully');
}
