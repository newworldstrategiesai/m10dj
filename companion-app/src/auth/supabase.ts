/**
 * Supabase Authentication
 * 
 * Handles DJ authentication via Supabase for the companion app.
 */

import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';
import * as readline from 'readline';
import { logger } from '../utils/logger';

export class SupabaseAuth {
  private supabase: SupabaseClient;
  private session: Session | null = null;

  constructor(supabaseUrl: string, supabaseAnonKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // Don't persist in browser storage
        autoRefreshToken: true
      }
    });
  }

  /**
   * Check for existing session
   */
  async checkSession(): Promise<Session | null> {
    const { data: { session } } = await this.supabase.auth.getSession();
    this.session = session;
    return session;
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<Session> {
    logger.info(`Signing in as ${email}...`);

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      logger.error('Sign in failed', error.message);
      throw new Error(`Sign in failed: ${error.message}`);
    }

    if (!data.session) {
      throw new Error('No session returned after sign in');
    }

    this.session = data.session;
    logger.info('Sign in successful');
    
    return data.session;
  }

  /**
   * Interactive sign in via command line
   */
  async signInInteractive(): Promise<Session> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (prompt: string): Promise<string> => {
      return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
          resolve(answer);
        });
      });
    };

    try {
      console.log('\n📧 Sign in with your DJ account:\n');
      
      const email = await question('Email: ');
      
      // Hide password input
      process.stdout.write('Password: ');
      const password = await new Promise<string>((resolve) => {
        let password = '';
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.on('data', (char) => {
          const c = char.toString();
          if (c === '\n' || c === '\r') {
            process.stdin.setRawMode(false);
            process.stdin.pause();
            console.log(''); // New line after password
            resolve(password);
          } else if (c === '\u0003') {
            // Ctrl+C
            process.exit();
          } else if (c === '\u007F') {
            // Backspace
            password = password.slice(0, -1);
          } else {
            password += c;
            process.stdout.write('*');
          }
        });
      });

      rl.close();
      
      return await this.signIn(email, password);

    } catch (error) {
      rl.close();
      throw error;
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
    this.session = null;
    logger.info('Signed out');
  }

  /**
   * Get current session
   */
  getSession(): Session | null {
    return this.session;
  }

  /**
   * Get access token for API calls
   */
  getAccessToken(): string | null {
    return this.session?.access_token ?? null;
  }

  /**
   * Get user ID
   */
  getUserId(): string | null {
    return this.session?.user?.id ?? null;
  }

  /**
   * Get user email
   */
  getUserEmail(): string | null {
    return this.session?.user?.email ?? null;
  }

  /**
   * Listen for auth state changes
   */
  onAuthStateChange(callback: (session: Session | null) => void): void {
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.session = session;
      callback(session);
    });
  }

  /**
   * Refresh the session token
   */
  async refreshSession(): Promise<Session | null> {
    const { data: { session }, error } = await this.supabase.auth.refreshSession();
    
    if (error) {
      logger.error('Failed to refresh session', error.message);
      return null;
    }

    this.session = session;
    return session;
  }
}

