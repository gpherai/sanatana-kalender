/**
 * Prisma Client Setup with PostgreSQL Adapter
 *
 * Features:
 * - Environment variable validation via Zod
 * - Connection pooling configuration
 * - Singleton pattern for development hot-reload
 * - Graceful shutdown handling
 */

import { Pool, PoolConfig } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/lib/env";

// =============================================================================
// CONNECTION POOL CONFIGURATION
// =============================================================================

const poolConfig: PoolConfig = {
  connectionString: env.DATABASE_URL,
  // Pool settings optimized for homelab/local development
  max: 10, // Maximum connections in pool
  min: 2, // Minimum connections to keep open
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 5000, // Timeout if can't connect in 5s
};

const pool = new Pool(poolConfig);

// Log unexpected pool errors (connection drops, etc.)
pool.on("error", (err) => {
  console.error("[DB] Unexpected pool error:", err);
});

// =============================================================================
// PRISMA CLIENT SETUP
// =============================================================================

const adapter = new PrismaPg(pool);

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
    await pool.end();
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

/**
 * Get pool statistics for monitoring.
 * Useful for debugging connection issues.
 */
export function getPoolStats() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default prisma;
