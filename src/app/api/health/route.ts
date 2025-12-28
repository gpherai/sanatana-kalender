import { NextResponse } from "next/server";
import { checkDatabaseHealth, getPoolStats } from "@/lib/db";
import packageJson from "../../../../package.json";

/**
 * Health check endpoint for monitoring and container orchestration.
 *
 * Returns:
 * - 200 OK: Service is healthy
 * - 503 Service Unavailable: Database connection failed
 *
 * Response format:
 * {
 *   status: "healthy" | "unhealthy",
 *   timestamp: ISO date string,
 *   version: string,
 *   uptime: number,
 *   checks: {
 *     database: { status: "up" | "down", pool?: {...} }
 *   }
 * }
 */
export async function GET() {
  // Database health check
  const dbHealthy = await checkDatabaseHealth();
  const poolStats = getPoolStats();

  // Overall health status
  const isHealthy = dbHealthy;

  const response = {
    status: isHealthy ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    version: packageJson.version,
    uptime: Math.round(process.uptime()),
    checks: {
      database: {
        status: dbHealthy ? "up" : "down",
        pool: {
          total: poolStats.totalCount,
          idle: poolStats.idleCount,
          waiting: poolStats.waitingCount,
        },
      },
    },
  };

  return NextResponse.json(response, {
    status: isHealthy ? 200 : 503,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
