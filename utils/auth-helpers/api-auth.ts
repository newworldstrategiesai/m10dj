/**
 * Centralized API Authentication Middleware
 * Provides consistent authentication patterns across all API routes
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { getEnv } from '@/utils/env-validator';
import { isAdminEmail } from './admin-roles';

export interface AuthenticatedUser {
  id: string;
  email: string;
  user_metadata?: Record<string, any>;
}

export interface AuthResult {
  user: AuthenticatedUser | null;
  error: string | null;
}

/**
 * Authenticate user from request (server-side)
 * Supports both Bearer token and session-based auth
 */
export async function authenticateRequest(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<AuthResult> {
  try {
    // Try Bearer token first (for API calls)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const env = getEnv();
      
      const supabase = createClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return { user: null, error: 'Invalid token' };
      }

      return { user: user as AuthenticatedUser, error: null };
    }

    // Fallback to session-based auth (for server-side rendering)
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session || !session.user) {
      return { user: null, error: 'Not authenticated' };
    }

    return { user: session.user as AuthenticatedUser, error: null };
  } catch (error) {
    console.error('Authentication error:', error);
    return { user: null, error: 'Authentication failed' };
  }
}

/**
 * Require authentication for API route
 * Returns 401 if not authenticated
 */
export async function requireAuth(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<AuthenticatedUser> {
  const { user, error } = await authenticateRequest(req, res);

  if (!user || error) {
    if (!res.headersSent) {
      res.status(401).json({ error: error || 'Unauthorized' });
    }
    throw new Error(error || 'Unauthorized');
  }

  return user;
}

/**
 * Require admin access for API route
 * Returns 403 if not admin
 */
export async function requireAdmin(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<AuthenticatedUser> {
  const user = await requireAuth(req, res);

  if (!user.email) {
    if (!res.headersSent) {
    res.status(403).json({ error: 'Admin access required' });
    }
    throw new Error('Admin access required');
  }

  const isAdmin = await isAdminEmail(user.email);
  
  if (!isAdmin) {
    if (!res.headersSent) {
    res.status(403).json({ error: 'Admin access required' });
    }
    throw new Error('Admin access required');
  }

  return user;
}

/**
 * Optional authentication - returns user if authenticated, null otherwise
 * Does not throw errors
 */
export async function optionalAuth(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<AuthenticatedUser | null> {
  const { user } = await authenticateRequest(req, res);
  return user;
}

/**
 * Require super admin access for API route
 * Returns 403 if not super admin
 */
export async function requireSuperAdmin(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<AuthenticatedUser> {
  let user: AuthenticatedUser;
  
  try {
    user = await requireAuth(req, res);
  } catch (error) {
    // requireAuth already sent response and threw error, re-throw
    throw error;
  }

  if (!user.email) {
    if (!res.headersSent) {
      res.status(403).json({ error: 'Super admin access required', reason: 'No email found' });
    }
    throw new Error('Super admin access required - no email');
  }

  const { isSuperAdminEmail } = await import('./super-admin');
  const isSuper = isSuperAdminEmail(user.email);
  
  if (!isSuper) {
    if (!res.headersSent) {
      res.status(403).json({ error: 'Super admin access required', reason: 'Not super admin email' });
    }
    throw new Error('Super admin access required - not authorized');
  }

  return user;
}

