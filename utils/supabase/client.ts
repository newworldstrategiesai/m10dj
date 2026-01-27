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
  // Check window object first (browser context)
  if (typeof window !== 'undefined') {
    const windowClient = (window as any)[SUPABASE_CLIENT_KEY];
    if (windowClient) {
      return windowClient;
    }
  }
  
  // Check globalThis (works in both browser and Node.js contexts)
  if (typeof globalThis !== 'undefined' && globalThis[SUPABASE_CLIENT_KEY]) {
    const globalClient = globalThis[SUPABASE_CLIENT_KEY];
    // Also store in window if available for consistency
    if (typeof window !== 'undefined') {
      (window as any)[SUPABASE_CLIENT_KEY] = globalClient;
    }
    return globalClient;
  }

  // Check global (Node.js fallback)
  if (typeof global !== 'undefined' && (global as any)[SUPABASE_CLIENT_KEY]) {
    const globalClient = (global as any)[SUPABASE_CLIENT_KEY];
    // Store in globalThis and window for consistency
    globalThis[SUPABASE_CLIENT_KEY] = globalClient;
    if (typeof window !== 'undefined') {
      (window as any)[SUPABASE_CLIENT_KEY] = globalClient;
    }
    return globalClient;
  }

  // Create new instance only if it doesn't exist anywhere
  const clientInstance = createBrowserClient<Database>(
    // Pass Supabase URL and anonymous key from the environment to the client
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Store in all available global objects to ensure persistence
  globalThis[SUPABASE_CLIENT_KEY] = clientInstance;
  if (typeof window !== 'undefined') {
    (window as any)[SUPABASE_CLIENT_KEY] = clientInstance;
  }
  if (typeof global !== 'undefined') {
    (global as any)[SUPABASE_CLIENT_KEY] = clientInstance;
  }

  // Add debug logging to track client creation
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 Supabase client created (singleton)');
  }

  return clientInstance;
};
