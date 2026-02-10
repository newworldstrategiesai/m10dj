// Boolean toggles to determine which auth types are allowed
const allowOauth = true;
const allowEmail = true;
const allowPassword = true;

// When false, sign-up is hidden and blocked (e.g. M10 DJ Company: admin-only accounts).
// Set NEXT_PUBLIC_ALLOW_PUBLIC_SIGNUP=false on M10 deployment to disable signup globally.
const defaultAllowSignup = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_ALLOW_PUBLIC_SIGNUP !== 'false';

// Boolean toggle to determine whether auth interface should route through server or client
// (Currently set to false because screen sometimes flickers with server redirects)
const allowServerRedirect = false;

// Check that at least one of allowPassword and allowEmail is true
if (!allowPassword && !allowEmail)
  throw new Error('At least one of allowPassword and allowEmail must be true');

export const getAuthTypes = () => {
  return { allowOauth, allowEmail, allowPassword };
};

/**
 * Valid view types for the sign-in page.
 * @param allowSignup - When false, 'signup' is excluded (e.g. for M10 admin-only). Defaults from env NEXT_PUBLIC_ALLOW_PUBLIC_SIGNUP.
 */
export const getViewTypes = (allowSignup: boolean = defaultAllowSignup) => {
  let viewTypes: string[] = [];
  if (allowEmail) {
    viewTypes = [...viewTypes, 'email_signin'];
  }
  if (allowPassword) {
    viewTypes = [
      ...viewTypes,
      'password_signin',
      'forgot_password',
      'update_password',
      ...(allowSignup ? ['signup'] : []),
    ];
  }

  return viewTypes;
};

/**
 * Default sign-in view. Never returns 'signup' when allowSignup is false.
 */
export const getDefaultSignInView = (preferredSignInView: string | null, allowSignup: boolean = defaultAllowSignup) => {
  let defaultView = allowPassword ? 'password_signin' : 'email_signin';
  const viewTypes = getViewTypes(allowSignup);
  if (preferredSignInView && viewTypes.includes(preferredSignInView)) {
    defaultView = preferredSignInView;
  }
  return defaultView;
};

export const getRedirectMethod = () => {
  return allowServerRedirect ? 'server' : 'client';
};
