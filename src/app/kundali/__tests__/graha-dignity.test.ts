import { describe, expect, it } from "vitest";
import { getGrahaDignity } from "../graha-dignity";

describe("getGrahaDignity", () => {
  it("prefers moolatrikona ranges over broad sign dignity", () => {
    expect(getGrahaDignity("chandra", 2, 5)).toBe("moolatrikona");
    expect(getGrahaDignity("budha", 6, 16)).toBe("moolatrikona");
  });

  it("falls back to broad exaltation and own-sign dignity", () => {
    expect(getGrahaDignity("chandra", 2, 2)).toBe("uchcha");
    expect(getGrahaDignity("surya", 5, 25)).toBe("swarashi");
  });
});
