import { describe, it, expect, vi } from "vitest";
import { cn, truncate, logDebug, logError, logWarn } from "../utils";

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
    it("logError calls console.error", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      logError("error msg", { detail: 1 });
      expect(spy).toHaveBeenCalledWith("[Error] error msg", { detail: 1 });
      spy.mockRestore();
    });

    it("logWarn calls console.warn", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      logWarn("warn msg");
      expect(spy).toHaveBeenCalledWith("[Warn] warn msg");
      spy.mockRestore();
    });

    it("logDebug is suppressed in test/production environment", () => {
      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      logDebug("debug msg");
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it("logDebug calls console.log in development environment", async () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.resetModules();
      const { logDebug: logDebugDev } = await import("../utils");

      const spy = vi.spyOn(console, "log").mockImplementation(() => {});
      logDebugDev("debug msg", 123);
      expect(spy).toHaveBeenCalledWith("[Debug] debug msg", 123);

      spy.mockRestore();
      vi.unstubAllEnvs();
      vi.resetModules();
    });
  });
});
