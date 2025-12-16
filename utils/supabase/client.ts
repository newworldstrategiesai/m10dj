import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types_db';

// Singleton instance to prevent multiple GoTrueClient instances
let clientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null;

// Define a function to create a Supabase client for client-side operations
// Uses singleton pattern to prevent multiple instances
export const createClient = () => {
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

  return clientInstance;
};
