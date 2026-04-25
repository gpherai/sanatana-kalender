import { NextRequest, NextResponse } from "next/server";
import { updatePreferencesSchema } from "@/lib/validations";
import { serverError, validationError } from "@/lib/api-response";
import { DEFAULT_PREFERENCES_ID } from "@/lib/domain";
import { DEFAULT_THEME_NAME } from "@/config/themes";
import { logError } from "@/lib/utils";
import { Prisma } from "@prisma/client";
import { EventType, CalendarView } from "@prisma/client";
import { findPreferences, upsertPreferences } from "@/repositories/preference.repository";

/**
 * Default preferences object (not persisted until first PUT)
 * Location/timezone are fixed via DEFAULT_LOCATION, not user preferences.
 */
const DEFAULT_PREFERENCES = {
  id: DEFAULT_PREFERENCES_ID,
  currentTheme: DEFAULT_THEME_NAME,
  defaultView: CalendarView.month,
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
 */
export async function GET() {
  try {
    const preferences = await findPreferences();

    if (!preferences) {
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
    const visibleEventTypes = data.visibleEventTypes as EventType[] | undefined;
    const defaultView = data.defaultView as CalendarView | undefined;

    const preferences = await upsertPreferences(
      {
        id: DEFAULT_PREFERENCES_ID,
        currentTheme: data.currentTheme ?? DEFAULT_PREFERENCES.currentTheme,
        defaultView: defaultView ?? DEFAULT_PREFERENCES.defaultView,
        visibleEventTypes: visibleEventTypes ?? DEFAULT_PREFERENCES.visibleEventTypes,
        visibleCategories:
          data.visibleCategories ?? DEFAULT_PREFERENCES.visibleCategories,
        notificationsEnabled:
          data.notificationsEnabled ?? DEFAULT_PREFERENCES.notificationsEnabled,
        notificationDaysBefore:
          data.notificationDaysBefore ?? DEFAULT_PREFERENCES.notificationDaysBefore,
      },
      {
        ...(data.currentTheme !== undefined && { currentTheme: data.currentTheme }),
        ...(defaultView !== undefined && { defaultView }),
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
      }
    );

    return NextResponse.json(preferences);
  } catch (error) {
    logError("Error updating preferences:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return serverError("Voorkeuren bestaan al");
      }
    }

    return serverError("Kon voorkeuren niet bijwerken");
  }
}
