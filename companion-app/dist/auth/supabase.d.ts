/**
 * Supabase Authentication
 *
 * Handles DJ authentication via Supabase for the companion app.
 */
import { Session } from '@supabase/supabase-js';
export declare class SupabaseAuth {
    private supabase;
    private session;
    constructor(supabaseUrl: string, supabaseAnonKey: string);
    /**
     * Check for existing session
     */
    checkSession(): Promise<Session | null>;
    /**
     * Sign in with email and password
     */
    signIn(email: string, password: string): Promise<Session>;
    /**
     * Interactive sign in via command line
     */
    signInInteractive(): Promise<Session>;
    /**
     * Sign out
     */
    signOut(): Promise<void>;
    /**
     * Get current session
     */
    getSession(): Session | null;
    /**
     * Get access token for API calls
     */
    getAccessToken(): string | null;
    /**
     * Get user ID
     */
    getUserId(): string | null;
    /**
     * Get user email
     */
    getUserEmail(): string | null;
    /**
     * Listen for auth state changes
     */
    onAuthStateChange(callback: (session: Session | null) => void): void;
    /**
     * Refresh the session token
     */
    refreshSession(): Promise<Session | null>;
}
//# sourceMappingURL=supabase.d.ts.map