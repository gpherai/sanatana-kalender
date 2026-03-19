import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/db";
import packageJson from "../../../../package.json";

/**
 * Health check endpoint for monitoring and container orchestration.
 *
 * Returns:
 * - 200 OK: Service is healthy
 * - 503 Service Unavailable: Database connection failed
 */
export async function GET() {
  const dbHealthy = await checkDatabaseHealth();
  const isHealthy = dbHealthy;

  const response = {
    status: isHealthy ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    version: packageJson.version,
    uptime: Math.round(process.uptime()),
    checks: {
      database: {
        status: dbHealthy ? "up" : "down",
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
