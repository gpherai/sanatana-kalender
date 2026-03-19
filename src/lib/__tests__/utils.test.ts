import { describe, it, expect } from "vitest";
import { cn, truncate, logDebug } from "../utils";

describe("General Utilities", () => {
  // =============================================================================
  // Class Name Utilities
  // =============================================================================
  describe("cn", () => {
    it("should merge classes correctly", () => {
      expect(cn("base", "extra")).toBe("base extra");
    });
    it("should handle conditional classes", () => {
      expect(cn("base", true && "included", false && "excluded")).toBe("base included");
    });
    it("should resolve tailwind conflicts", () => {
      expect(cn("p-2", "p-4")).toBe("p-4");
    });
  });

  describe("truncate", () => {
    it("truncates long text", () => {
      expect(truncate("Hello World", 8)).toBe("Hello...");
    });
    it("keeps short text", () => {
      expect(truncate("Hi", 10)).toBe("Hi");
    });
  });

  describe("Logging", () => {
    it("does not crash", () => {
      logDebug("test");
      expect(true).toBe(true);
    });
  });
});
