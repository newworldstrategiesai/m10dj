/**
 * Environment Variable Validation
 * Validates all required environment variables on startup
 * Fails fast if any are missing or invalid
 */

import { z } from 'zod';

const envSchema = z.object({
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),

  // Twilio Configuration (optional in some environments)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  ADMIN_PHONE_NUMBER: z.string().optional(),

  // Email Configuration
  RESEND_API_KEY: z.string().optional(),

  // Site Configuration
  NEXT_PUBLIC_SITE_URL: z.string().url('Invalid site URL').optional(),

  // Admin Configuration
  DEFAULT_ADMIN_USER_ID: z.string().uuid('Invalid admin user ID format').optional(),

  // API Keys (optional)
  ADMIN_API_KEY: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

let validatedEnv: Env | null = null;

/**
 * Validates environment variables
 * Call this at app startup
 * @throws Error if validation fails
 */
export function validateEnv(): Env {
  if (validatedEnv) {
    return validatedEnv;
  }

  try {
    validatedEnv = envSchema.parse(process.env);
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      const errorMessage = `❌ Environment validation failed:\n${missingVars.join('\n')}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
    throw error;
  }
}

/**
 * Gets validated environment variables
 * Validates on first call, then caches result
 */
export function getEnv(): Env {
  return validateEnv();
}

/**
 * Gets a specific environment variable
 * @param key - Environment variable key
 * @param defaultValue - Optional default value
 */
export function getEnvVar<K extends keyof Env>(
  key: K,
  defaultValue?: Env[K]
): Env[K] | undefined {
  const env = getEnv();
  return env[key] ?? defaultValue;
}

/**
 * Checks if we're in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Checks if we're in production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

// Validate on module load (will throw if invalid)
if (typeof window === 'undefined') {
  // Only validate on server side
  try {
    validateEnv();
  } catch (error) {
    // In development, warn but don't crash
    if (isDevelopment()) {
      console.warn('⚠️ Environment validation failed (development mode):', error);
    } else {
      // In production, throw immediately
      throw error;
    }
  }
}

