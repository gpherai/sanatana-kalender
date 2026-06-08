import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const { checkDatabaseHealth } = vi.hoisted(() => ({
  checkDatabaseHealth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  checkDatabaseHealth,
}));

import { GET } from "../health/route";

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns healthy status when database is up", async () => {
    vi.stubEnv("APP_VERSION", "0.10.0");
    checkDatabaseHealth.mockResolvedValue(true);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.status).toBe("healthy");
    expect(json.checks.database.status).toBe("up");
    expect(json.version).toBe("0.10.0");
  });

  it("returns unhealthy status when database is down", async () => {
    checkDatabaseHealth.mockResolvedValue(false);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.status).toBe("unhealthy");
    expect(json.checks.database.status).toBe("down");
  });
});
