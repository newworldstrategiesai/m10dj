/**
 * Platform Admin Helpers
 * 
 * Platform admins (Ben Murray, etc.) have access to ALL organizations' data.
 * SaaS customers only see their own organization's data.
 */

/**
 * List of platform admin emails
 * These users have access to all data across all organizations
 */
export const PLATFORM_ADMIN_EMAILS = [
  'admin@m10djcompany.com',
  'manager@m10djcompany.com',
  'djbenmurray@gmail.com' // Ben Murray - Owner
];

/**
 * Check if a user is a platform admin
 */
export function isPlatformAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return PLATFORM_ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Require platform admin access - throws if not admin
 */
export function requirePlatformAdmin(email: string | null | undefined): void {
  if (!isPlatformAdmin(email)) {
    throw new Error('Platform admin access required');
  }
}

/**
 * Get admin check result for API routes
 */
export function getAdminCheck(userEmail: string | null | undefined) {
  return {
    isAdmin: isPlatformAdmin(userEmail),
    isSaaS: !isPlatformAdmin(userEmail)
  };
}

