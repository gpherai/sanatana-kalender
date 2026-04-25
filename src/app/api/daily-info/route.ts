import { NextRequest, NextResponse } from "next/server";
import { errorResponse, serverError } from "@/lib/api-response";
import { logError } from "@/lib/utils";
import { panchangaService } from "@/services/panchanga.service";
import { DEFAULT_LOCATION } from "@/lib/domain";
import { transformToApiResponse } from "@/lib/api-transformers";
import { dateQuerySchema } from "@/lib/validations";
import { DateTime } from "luxon";

// =============================================================================
// API ROUTE HANDLER
// =============================================================================

/**
 * GET /api/daily-info
 *
 * Query params:
 * - date: Single date (YYYY-MM-DD)
 * - start, end: Date range (YYYY-MM-DD)
 *
 * Without params: Returns today's data
 *
 * Location and timezone come from DEFAULT_LOCATION.
 * Results are cached for performance.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get("date");
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");

    // =========================================================================
    // STEP 1: Use fixed application location and timezone
    // =========================================================================
    const location = DEFAULT_LOCATION;
    const timezone = DEFAULT_LOCATION.timezone;

    // =========================================================================
    // STEP 2: Parse and validate date parameters
    // =========================================================================

    if (dateParam) {
      // ---------------------------------------------------------------------
      // Single date mode
      // ---------------------------------------------------------------------

      const parsed = dateQuerySchema.safeParse(dateParam);
      if (!parsed.success) {
        return errorResponse("Ongeldige datum formaat. Gebruik YYYY-MM-DD.", 400);
      }

      // IMPORTANT: Parse date in the selected timezone, not UTC!
      const dt = DateTime.fromISO(parsed.data, { zone: timezone });
      const date = dt.toJSDate();

      // Calculate Panchanga using service layer
      const panchanga = await panchangaService.calculateDaily(date, location, timezone);

      // Transform to API response format
      const response = transformToApiResponse(panchanga);

      return NextResponse.json(response);
    } else if (startParam && endParam) {
      // ---------------------------------------------------------------------
      // Date range mode
      // ---------------------------------------------------------------------

      const parsedStart = dateQuerySchema.safeParse(startParam);
      const parsedEnd = dateQuerySchema.safeParse(endParam);

      if (!parsedStart.success || !parsedEnd.success) {
        return errorResponse("Ongeldige datum formaat. Gebruik YYYY-MM-DD.", 400);
      }

      const startDt = DateTime.fromISO(parsedStart.data, { zone: timezone });
      const endDt = DateTime.fromISO(parsedEnd.data, { zone: timezone });
      const start = startDt.toJSDate();
      const end = endDt.toJSDate();

      if (start > end) {
        return errorResponse("Startdatum moet voor einddatum liggen.", 400);
      }

      // Limit to max 90 days for API requests
      const diffDays = Math.ceil(endDt.diff(startDt, "days").days) + 1;
      if (diffDays > 90) {
        return errorResponse("Maximum bereik is 90 dagen.", 400);
      }

      // Calculate range using service layer
      const panchangas = await panchangaService.calculateRange(
        start,
        end,
        location,
        timezone
      );

      // Transform all results
      const responses = panchangas.map(transformToApiResponse);

      return NextResponse.json(responses);
    } else {
      // ---------------------------------------------------------------------
      // Default: Today's data
      // ---------------------------------------------------------------------

      const today = new Date();
      const panchanga = await panchangaService.calculateDaily(today, location, timezone);
      const response = transformToApiResponse(panchanga);

      return NextResponse.json(response);
    }
  } catch (error) {
    logError("[API] GET /api/daily-info error:", error);
    return serverError("Kon Panchanga niet berekenen");
  }
}
