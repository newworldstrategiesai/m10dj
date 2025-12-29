"use strict";
/**
 * Supabase Authentication
 *
 * Handles DJ authentication via Supabase for the companion app.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseAuth = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const readline = __importStar(require("readline"));
const logger_1 = require("../utils/logger");
class SupabaseAuth {
    supabase;
    session = null;
    constructor(supabaseUrl, supabaseAnonKey) {
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey, {
            auth: {
                persistSession: false, // Don't persist in browser storage
                autoRefreshToken: true
            }
        });
    }
    /**
     * Check for existing session
     */
    async checkSession() {
        const { data: { session } } = await this.supabase.auth.getSession();
        this.session = session;
        return session;
    }
    /**
     * Sign in with email and password
     */
    async signIn(email, password) {
        logger_1.logger.info(`Signing in as ${email}...`);
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) {
            logger_1.logger.error('Sign in failed', error.message);
            throw new Error(`Sign in failed: ${error.message}`);
        }
        if (!data.session) {
            throw new Error('No session returned after sign in');
        }
        this.session = data.session;
        logger_1.logger.info('Sign in successful');
        return data.session;
    }
    /**
     * Interactive sign in via command line
     */
    async signInInteractive() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const question = (prompt) => {
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
            const password = await new Promise((resolve) => {
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
                    }
                    else if (c === '\u0003') {
                        // Ctrl+C
                        process.exit();
                    }
                    else if (c === '\u007F') {
                        // Backspace
                        password = password.slice(0, -1);
                    }
                    else {
                        password += c;
                        process.stdout.write('*');
                    }
                });
            });
            rl.close();
            return await this.signIn(email, password);
        }
        catch (error) {
            rl.close();
            throw error;
        }
    }
    /**
     * Sign out
     */
    async signOut() {
        await this.supabase.auth.signOut();
        this.session = null;
        logger_1.logger.info('Signed out');
    }
    /**
     * Get current session
     */
    getSession() {
        return this.session;
    }
    /**
     * Get access token for API calls
     */
    getAccessToken() {
        return this.session?.access_token ?? null;
    }
    /**
     * Get user ID
     */
    getUserId() {
        return this.session?.user?.id ?? null;
    }
    /**
     * Get user email
     */
    getUserEmail() {
        return this.session?.user?.email ?? null;
    }
    /**
     * Listen for auth state changes
     */
    onAuthStateChange(callback) {
        this.supabase.auth.onAuthStateChange((event, session) => {
            this.session = session;
            callback(session);
        });
    }
    /**
     * Refresh the session token
     */
    async refreshSession() {
        const { data: { session }, error } = await this.supabase.auth.refreshSession();
        if (error) {
            logger_1.logger.error('Failed to refresh session', error.message);
            return null;
        }
        this.session = session;
        return session;
    }
}
exports.SupabaseAuth = SupabaseAuth;
//# sourceMappingURL=supabase.js.map