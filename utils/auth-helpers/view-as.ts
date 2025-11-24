/**
 * View-As Mode Helpers
 * 
 * Allows super admins to view the app from a specific organization's perspective
 */

/**
 * Get view-as organization ID from cookies (client-side)
 */
export function getViewAsOrgId(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const viewAs = document.cookie
    .split('; ')
    .find(row => row.startsWith('admin_view_as_org_id='))
    ?.split('=')[1];

  return viewAs || null;
}

/**
 * Get view-as organization ID from request cookies (server-side)
 */
export function getViewAsOrgIdFromRequest(req: { cookies?: { [key: string]: string } }): string | null {
  if (!req.cookies) {
    return null;
  }

  return req.cookies.admin_view_as_org_id || null;
}


