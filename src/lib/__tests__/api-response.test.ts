import { describe, it, expect } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import {
  getErrorCode,
  errorResponse,
  handlePrismaError,
  validationError,
  notFoundError,
  conflictError,
  unauthorizedError,
  forbiddenError,
  rateLimitError,
  serverError,
} from "../api-response";

describe("API Response Helpers", () => {
  describe("getErrorCode", () => {
    it("maps known status codes", () => {
      expect(getErrorCode(400)).toBe("VALIDATION_ERROR");
      expect(getErrorCode(401)).toBe("UNAUTHORIZED");
      expect(getErrorCode(403)).toBe("FORBIDDEN");
      expect(getErrorCode(404)).toBe("NOT_FOUND");
      expect(getErrorCode(409)).toBe("CONFLICT");
      expect(getErrorCode(429)).toBe("RATE_LIMITED");
      expect(getErrorCode(500)).toBe("INTERNAL_ERROR");
    });

    it("defaults to internal error for unknown status", () => {
      expect(getErrorCode(418)).toBe("INTERNAL_ERROR");
    });
  });

  describe("errorResponse", () => {
    it("returns a response with status and body", async () => {
      const response = errorResponse("Test error", 409, { reason: "conflict" });
      const json = await response.json();

      expect(response.status).toBe(409);
      expect(json).toEqual({
        error: "CONFLICT",
        message: "Test error",
        details: { reason: "conflict" },
      });
    });

    it("omits details when not provided", async () => {
      const response = errorResponse("No details", 500);
      const json = await response.json();

      expect(json).not.toHaveProperty("details");
    });
  });

  describe("validationError", () => {
    it("formats zod issues into details", async () => {
      const schema = z.object({ name: z.string().min(1) });
      const result = schema.safeParse({ name: "" });

      if (result.success) {
        throw new Error("Expected validation error");
      }

      const response = validationError(result.error);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe("VALIDATION_ERROR");
      expect(Array.isArray(json.details)).toBe(true);
      expect(json.details[0].field).toBe("name");
      expect(json.details[0].message.length).toBeGreaterThan(0);
    });
  });

  describe("specific error helpers", () => {
    it("returns default messages and status codes", async () => {
      const notFound = await notFoundError().json();
      const conflict = await conflictError().json();
      const unauthorized = await unauthorizedError().json();
      const forbidden = await forbiddenError().json();
      const rateLimited = await rateLimitError().json();
      const server = await serverError().json();

      expect(notFound).toEqual({
        error: "NOT_FOUND",
        message: "Resource niet gevonden",
      });
      expect(conflict).toEqual({
        error: "CONFLICT",
        message: "Resource bestaat al",
      });
      expect(unauthorized).toEqual({
        error: "UNAUTHORIZED",
        message: "Authenticatie vereist",
      });
      expect(forbidden).toEqual({
        error: "FORBIDDEN",
        message: "Geen toegang",
      });
      expect(rateLimited).toEqual({
        error: "RATE_LIMITED",
        message: "Te veel verzoeken, probeer later opnieuw",
      });
      expect(server).toEqual({
        error: "INTERNAL_ERROR",
        message: "Er is een fout opgetreden",
      });
    });
  });

  describe("handlePrismaError", () => {
    it("maps known Prisma errors to standardized responses", async () => {
      const unique = handlePrismaError(
        new Prisma.PrismaClientKnownRequestError("Conflict", {
          code: "P2002",
          clientVersion: "test",
        })
      );
      const foreignKey = handlePrismaError(
        new Prisma.PrismaClientKnownRequestError("Foreign key", {
          code: "P2003",
          clientVersion: "test",
        }),
        { foreignKey: "Beoefening niet gevonden" }
      );
      const notFound = handlePrismaError(
        new Prisma.PrismaClientKnownRequestError("Not found", {
          code: "P2025",
          clientVersion: "test",
        }),
        { notFound: "Event niet gevonden" }
      );

      expect(unique?.status).toBe(409);
      await expect(unique?.json()).resolves.toMatchObject({
        error: "CONFLICT",
        message: "Uniek veld conflict",
      });

      expect(foreignKey?.status).toBe(400);
      await expect(foreignKey?.json()).resolves.toMatchObject({
        error: "VALIDATION_ERROR",
        message: "Beoefening niet gevonden",
      });

      expect(notFound?.status).toBe(404);
      await expect(notFound?.json()).resolves.toMatchObject({
        error: "NOT_FOUND",
        message: "Event niet gevonden",
      });
    });

    it("returns null for unknown errors and unmapped Prisma codes", () => {
      expect(handlePrismaError(new Error("Unknown"))).toBeNull();
      expect(
        handlePrismaError(
          new Prisma.PrismaClientKnownRequestError("Other", {
            code: "P2034",
            clientVersion: "test",
          })
        )
      ).toBeNull();
    });
  });
});
