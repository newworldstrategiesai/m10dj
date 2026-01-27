import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types_db';

// Singleton instance to prevent multiple GoTrueClient instances
// Use global to ensure persistence across module reloads/hot reloads
const SUPABASE_CLIENT_KEY = '__supabase_client_singleton_v3__';

declare global {
  var __supabase_client_singleton_v3__: ReturnType<typeof createBrowserClient<Database>> | undefined;
}

// Define a function to create a Supabase client for client-side operations
// Uses singleton pattern to prevent multiple instances
export const createClient = () => {
  // Check global first (persists across hot reloads)
  // Also check window object for browser context
  if (typeof window !== 'undefined') {
    if ((window as any)[SUPABASE_CLIENT_KEY]) {
      return (window as any)[SUPABASE_CLIENT_KEY];
    }
  }
  
  if (globalThis[SUPABASE_CLIENT_KEY]) {
    return globalThis[SUPABASE_CLIENT_KEY];
  }

  // Create new instance only if it doesn't exist
  const clientInstance = createBrowserClient<Database>(
    // Pass Supabase URL and anonymous key from the environment to the client
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Store in both global and window to persist across hot reloads
  globalThis[SUPABASE_CLIENT_KEY] = clientInstance;
  if (typeof window !== 'undefined') {
    (window as any)[SUPABASE_CLIENT_KEY] = clientInstance;
  }

  // Add debug logging to track client creation
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 Supabase client created (singleton)');
  }

  return clientInstance;
};
