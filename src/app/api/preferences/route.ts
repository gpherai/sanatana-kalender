import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { updatePreferencesSchema } from "@/lib/validations";
import { serverError, validationError } from "@/lib/api-response";
import { DEFAULT_LOCATION, DEFAULT_PREFERENCES_ID } from "@/lib/domain";
import { DEFAULT_THEME_NAME } from "@/config/themes";
import { logError } from "@/lib/utils";
import { Prisma } from "@prisma/client";
import { EventType, CalendarView } from "@prisma/client";

/**
 * Default preferences object (not persisted until first PUT)
 * Uses DEFAULT_LOCATION from constants for consistency
 */
const DEFAULT_PREFERENCES = {
  id: DEFAULT_PREFERENCES_ID,
  currentTheme: DEFAULT_THEME_NAME,
  defaultView: CalendarView.month,
  weekStartsOn: 1,
  timezone: DEFAULT_LOCATION.timezone,
  locationName: DEFAULT_LOCATION.name,
  locationLat: DEFAULT_LOCATION.lat,
  locationLon: DEFAULT_LOCATION.lon,
  visibleEventTypes: [] as EventType[],
  visibleCategories: [] as string[], // Category IDs (CUIDs)
  notificationsEnabled: false,
  notificationDaysBefore: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * GET /api/preferences
 * Haal de gebruikersvoorkeuren op (single user systeem)
 *
 * Returns existing preferences or default values (without writing to DB)
 * This keeps GET idempotent and side-effect free
 */
export async function GET() {
  try {
    const preferences = await prisma.userPreference.findUnique({
      where: { id: DEFAULT_PREFERENCES_ID },
    });

    if (!preferences) {
      // Return default preferences without creating in DB
      // This keeps GET idempotent (no side effects)
      return NextResponse.json(DEFAULT_PREFERENCES);
    }

    return NextResponse.json(preferences);
  } catch (error) {
    logError("Error fetching preferences:", error);
    return serverError("Kon voorkeuren niet ophalen");
  }
}

/**
 * PUT /api/preferences
 * Update de gebruikersvoorkeuren (upsert pattern)
 *
 * Creates preferences if they don't exist, updates if they do
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const result = updatePreferencesSchema.safeParse(body);
    if (!result.success) {
      return validationError(result.error);
    }

    const data = result.data;

    // Cast validated strings to Prisma enum types
    // Zod has already validated these are valid enum values
    const visibleEventTypes = data.visibleEventTypes as EventType[] | undefined;
    const defaultView = data.defaultView as CalendarView | undefined;

    // Use upsert pattern for cleaner code
    const preferences = await prisma.userPreference.upsert({
      where: { id: DEFAULT_PREFERENCES_ID }, // Fixed ID for single-user system
      create: {
        id: DEFAULT_PREFERENCES_ID,
        currentTheme: data.currentTheme ?? DEFAULT_PREFERENCES.currentTheme,
        defaultView: defaultView ?? DEFAULT_PREFERENCES.defaultView,
        weekStartsOn: data.weekStartsOn ?? DEFAULT_PREFERENCES.weekStartsOn,
        timezone: data.timezone ?? DEFAULT_PREFERENCES.timezone,
        locationName: data.locationName ?? DEFAULT_PREFERENCES.locationName,
        locationLat: data.locationLat ?? DEFAULT_PREFERENCES.locationLat,
        locationLon: data.locationLon ?? DEFAULT_PREFERENCES.locationLon,
        visibleEventTypes: visibleEventTypes ?? DEFAULT_PREFERENCES.visibleEventTypes,
        visibleCategories:
          data.visibleCategories ?? DEFAULT_PREFERENCES.visibleCategories,
        notificationsEnabled:
          data.notificationsEnabled ?? DEFAULT_PREFERENCES.notificationsEnabled,
        notificationDaysBefore:
          data.notificationDaysBefore ?? DEFAULT_PREFERENCES.notificationDaysBefore,
      },
      update: {
        ...(data.currentTheme !== undefined && { currentTheme: data.currentTheme }),
        ...(defaultView !== undefined && { defaultView }),
        ...(data.weekStartsOn !== undefined && { weekStartsOn: data.weekStartsOn }),
        ...(data.timezone !== undefined && { timezone: data.timezone }),
        ...(data.locationName !== undefined && { locationName: data.locationName }),
        ...(data.locationLat !== undefined && { locationLat: data.locationLat }),
        ...(data.locationLon !== undefined && { locationLon: data.locationLon }),
        ...(visibleEventTypes !== undefined && { visibleEventTypes }),
        ...(data.visibleCategories !== undefined && {
          visibleCategories: data.visibleCategories,
        }),
        ...(data.notificationsEnabled !== undefined && {
          notificationsEnabled: data.notificationsEnabled,
        }),
        ...(data.notificationDaysBefore !== undefined && {
          notificationDaysBefore: data.notificationDaysBefore,
        }),
      },
    });

    return NextResponse.json(preferences);
  } catch (error) {
    logError("Error updating preferences:", error);

    // Handle specific Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return serverError("Voorkeuren bestaan al");
      }
    }

    return serverError("Kon voorkeuren niet bijwerken");
  }
}
