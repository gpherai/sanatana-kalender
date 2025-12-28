/**
 * Environment Variable Validation
 *
 * Uses Zod to validate environment variables at build/runtime.
 * Fails fast with clear error messages if required variables are missing.
 *
 * Usage:
 *   import { env } from '@/lib/env';
 *   console.log(env.DATABASE_URL);
 *
 * @see https://env.t3.gg/ for pattern inspiration
 */

import { z } from "zod";

// =============================================================================
// SCHEMA DEFINITION
// =============================================================================

/**
 * Environment variables schema.
 * Server-side only - secrets should never be exposed to the client.
 */
const envSchema = z.object({
  // Database connection string (required)
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .refine(
      (url) => url.startsWith("postgresql://") || url.startsWith("postgres://"),
      "DATABASE_URL must be a PostgreSQL connection string (postgresql://...)"
    ),

  // Node environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate and parse environment variables.
 * Throws a detailed error if validation fails.
 */
function validateEnv() {
  const envVars = {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
  };

  const result = envSchema.safeParse(envVars);

  if (!result.success) {
    const formatted = result.error.format();

    console.error("Environment validation failed:");
    console.error("-".repeat(50));

    for (const [key, value] of Object.entries(formatted)) {
      if (key === "_errors") continue;
      const errors = (value as { _errors?: string[] })?._errors;
      if (errors && errors.length > 0) {
        console.error(`  ${key}: ${errors.join(", ")}`);
      }
    }

    console.error("-".repeat(50));
    console.error("Please check your .env file or environment variables.");

    throw new Error("Environment validation failed. See console for details.");
  }

  return result.data;
}

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * Validated environment variables.
 * Use this instead of process.env for type-safe access.
 *
 * @example
 * import { env } from '@/lib/env';
 * const dbUrl = env.DATABASE_URL; // Type-safe, guaranteed to exist
 */
export const env = validateEnv();

/**
 * Type for the validated environment.
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Check if we're in development mode.
 */
export const isDev = env.NODE_ENV === "development";

/**
 * Check if we're in production mode.
 */
export const isProd = env.NODE_ENV === "production";

/**
 * Check if we're in test mode.
 */
export const isTest = env.NODE_ENV === "test";
