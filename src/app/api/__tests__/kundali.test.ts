import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../kundali/route";

function kundaliRequest(body: unknown) {
  return new NextRequest("http://localhost/api/kundali", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("API Kundali", () => {
  it("rejects invalid JSON", async () => {
    const request = new NextRequest("http://localhost/api/kundali", {
      method: "POST",
      body: "{",
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("VALIDATION_ERROR");
    expect(json.message).toBe("Ongeldig JSON");
  });

  it("rejects coordinates outside valid ranges", async () => {
    const response = await POST(
      kundaliRequest({
        date: "1987-11-20",
        time: "10:30",
        lat: 91,
        lon: 4.9041,
        tz: "Europe/Amsterdam",
      })
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("VALIDATION_ERROR");
    expect(json.details[0].field).toBe("lat");
  });

  it("rejects invalid IANA timezones", async () => {
    const response = await POST(
      kundaliRequest({
        date: "1987-11-20",
        time: "10:30",
        lat: 52.3676,
        lon: 4.9041,
        tz: "Amsterdam",
      })
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("VALIDATION_ERROR");
    expect(json.details[0].field).toBe("tz");
  });

  it("rejects ambiguous daylight-saving birth times", async () => {
    const response = await POST(
      kundaliRequest({
        date: "2024-10-27",
        time: "02:30",
        lat: 52.3676,
        lon: 4.9041,
        tz: "Europe/Amsterdam",
      })
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.message).toMatch(/Ambigue geboortetijd/);
  });
});
