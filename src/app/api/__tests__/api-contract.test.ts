import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET as getEvents } from "../events/route";

describe("API Contracts (Read-Only Consumers)", () => {
  describe("GET /api/events query parameters", () => {
    it("rejects ISO datetime strings and requires YYYY-MM-DD", async () => {
      // Act
      const request = new NextRequest(
        "http://localhost/api/events?start=2025-01-01T12:00:00Z&end=2025-01-31T12:00:00Z"
      );
      const response = await getEvents(request);
      const json = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(json.error).toBe("VALIDATION_ERROR");

      const messages = json.details.map((d: { message: string }) => d.message).join(" ");
      expect(messages).toContain("Ongeldig datum formaat (gebruik YYYY-MM-DD)"); // Matches the validation message from shared.ts
    });

    it("accepts valid YYYY-MM-DD date strings", async () => {
      // Act
      const request = new NextRequest(
        "http://localhost/api/events?start=2025-01-01&end=2025-01-31"
      );
      const response = await getEvents(request);

      // Assert
      // As long as it's not a validation error, it means the contract is respected
      expect(response.status).not.toBe(400);
    });
  });
});
