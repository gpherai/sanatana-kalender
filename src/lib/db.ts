/**
 * Prisma Client Setup with PostgreSQL Adapter
 *
 * Features:
 * - Environment variable validation via Zod
 * - Connection pooling configuration
 * - Singleton pattern for development hot-reload
 * - Graceful shutdown handling
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { env } from "@/lib/env";

// =============================================================================
// PRISMA CLIENT SETUP
// =============================================================================

// Pass PoolConfig directly to PrismaPg — Prisma manages the pool internally.
// This avoids @types/pg version conflicts between our dependency and Prisma's bundled types.
const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
  max: 10,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Singleton pattern for development (prevents hot-reload connection leaks)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// =============================================================================
// GRACEFUL SHUTDOWN
// =============================================================================

/**
 * Cleanup function to close database connections gracefully.
 * Called automatically on process termination signals.
 */
async function shutdown() {
  console.log("[DB] Shutting down database connections...");

  try {
    await prisma.$disconnect();
    console.log("[DB] Database connections closed.");
  } catch (error) {
    console.error("[DB] Error during shutdown:", error);
  }
}

// Register shutdown handlers (only once, not in hot-reload)
if (typeof globalForPrisma.prisma === "undefined") {
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

// =============================================================================
// HEALTH CHECK HELPERS
// =============================================================================

/**
 * Check database connectivity.
 * @returns true if connected, false otherwise
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("[DB] Health check failed:", error);
    return false;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default prisma;
