import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types_db';

// Singleton instance to prevent multiple GoTrueClient instances
// Use global to ensure persistence across module reloads/hot reloads
const SUPABASE_CLIENT_KEY = '__supabase_client_singleton__';

declare global {
  var __supabase_client_singleton__: ReturnType<typeof createBrowserClient<Database>> | undefined;
}

// Define a function to create a Supabase client for client-side operations
// Uses singleton pattern to prevent multiple instances
export const createClient = () => {
  // Check global first (persists across hot reloads)
  if (globalThis[SUPABASE_CLIENT_KEY]) {
    return globalThis[SUPABASE_CLIENT_KEY];
  }

  // Check module-level variable for same-module calls
  let clientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null;

  // Return existing instance if available
  if (clientInstance) {
    return clientInstance;
  }

  // Create new instance only if it doesn't exist
  clientInstance = createBrowserClient<Database>(
    // Pass Supabase URL and anonymous key from the environment to the client
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Store in global to persist across hot reloads
  globalThis[SUPABASE_CLIENT_KEY] = clientInstance;

  return clientInstance;
};
