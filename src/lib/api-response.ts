/**
 * Standardized API Response Helpers
 *
 * Provides consistent error response formatting across all API routes.
 * User-facing messages are in Dutch, error codes are in English.
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Validation error detail structure.
 */
export interface ValidationDetail {
  field: string;
  message: string;
}

/**
 * Standardized API error response structure.
 */
export interface ApiErrorResponse {
  error: ErrorCode;
  message: string;
  details?: ValidationDetail[] | Record<string, unknown>;
}

/**
 * Known error codes.
 */
export type ErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

// =============================================================================
// ERROR CODE MAPPING
// =============================================================================

/**
 * Map HTTP status code to error code string.
 */
export function getErrorCode(status: number): ErrorCode {
  switch (status) {
    case 400:
      return "VALIDATION_ERROR";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 429:
      return "RATE_LIMITED";
    case 500:
    default:
      return "INTERNAL_ERROR";
  }
}

// =============================================================================
// GENERIC ERROR RESPONSE
// =============================================================================

/**
 * Create a standardized error response.
 *
 * @param message - User-facing error message (Dutch)
 * @param status - HTTP status code
 * @param details - Optional additional error details
 */
export function errorResponse(
  message: string,
  status: number = 500,
  details?: ValidationDetail[] | Record<string, unknown>
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    error: getErrorCode(status),
    message,
  };

  if (details !== undefined) {
    response.details = details;
  }

  return NextResponse.json(response, { status });
}

// =============================================================================
// SPECIFIC ERROR HELPERS
// =============================================================================

/**
 * Create a validation error response from Zod errors.
 * HTTP 400 Bad Request
 */
export function validationError(zodError: ZodError): NextResponse<ApiErrorResponse> {
  const details: ValidationDetail[] = zodError.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));

  return errorResponse("Validatiefout", 400, details);
}

/**
 * Create a not found error response.
 * HTTP 404 Not Found
 *
 * @param resource - Name of the resource that wasn't found
 */
export function notFoundError(
  resource: string = "Resource"
): NextResponse<ApiErrorResponse> {
  return errorResponse(`${resource} niet gevonden`, 404);
}

/**
 * Create a conflict error response.
 * HTTP 409 Conflict
 *
 * @param message - Description of the conflict
 */
export function conflictError(
  message: string = "Resource bestaat al"
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 409);
}

/**
 * Create an unauthorized error response.
 * HTTP 401 Unauthorized
 *
 * Use when authentication is required but not provided.
 */
export function unauthorizedError(
  message: string = "Authenticatie vereist"
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 401);
}

/**
 * Create a forbidden error response.
 * HTTP 403 Forbidden
 *
 * Use when authenticated but not authorized for this action.
 */
export function forbiddenError(
  message: string = "Geen toegang"
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 403);
}

/**
 * Create a rate limit error response.
 * HTTP 429 Too Many Requests
 */
export function rateLimitError(
  message: string = "Te veel verzoeken, probeer later opnieuw"
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 429);
}

/**
 * Create an internal server error response.
 * HTTP 500 Internal Server Error
 *
 * @param message - User-facing error message (should not expose internals)
 */
export function serverError(
  message: string = "Er is een fout opgetreden"
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 500);
}
