import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const isDbUp = await checkDatabaseHealth();

  if (isDbUp) {
    return NextResponse.json(
      {
        status: "healthy",
        checks: {
          database: {
            status: "up",
          },
        },
        version: process.env.npm_package_version || "1.0.0",
      },
      { status: 200 }
    );
  } else {
    return NextResponse.json(
      {
        status: "unhealthy",
        checks: {
          database: {
            status: "down",
          },
        },
      },
      { status: 503 }
    );
  }
}
