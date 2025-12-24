/**
 * Super Admin Authentication Helper
 * Checks if user is the super admin (djbenmurray@gmail.com)
 * Used for sensitive operations like YouTube audio downloads
 */

import { AuthenticatedUser } from './api-auth';

const SUPER_ADMIN_EMAIL = 'djbenmurray@gmail.com';

/**
 * Check if user email is super admin
 */
export function isSuperAdminEmail(userEmail: string | null | undefined): boolean {
  if (!userEmail) {
    return false;
  }
  return userEmail.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

/**
 * Check if authenticated user is super admin
 */
export function isSuperAdmin(user: AuthenticatedUser | null): boolean {
  if (!user || !user.email) {
    return false;
  }
  return isSuperAdminEmail(user.email);
}

