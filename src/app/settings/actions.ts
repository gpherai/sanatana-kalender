"use server";

import { revalidatePath } from "next/cache";
import { CalendarView, EventType } from "@prisma/client";
import { updatePreferencesSchema } from "@/lib/validations";
import { DEFAULT_PREFERENCES_ID } from "@/lib/domain";
import { DEFAULT_THEME_NAME } from "@/config/themes";
import { upsertPreferences } from "@/repositories/preference.repository";
import { logError } from "@/lib/utils";

type ActionResult = { success: true } | { success: false; error: string };

export async function savePreferencesAction(payload: unknown): Promise<ActionResult> {
  const result = updatePreferencesSchema.safeParse(payload);
  if (!result.success) {
    return { success: false, error: "Ongeldige invoer" };
  }

  const data = result.data;
  const visibleEventTypes = data.visibleEventTypes as EventType[] | undefined;
  const defaultView = data.defaultView as CalendarView | undefined;

  try {
    await upsertPreferences(
      {
        id: DEFAULT_PREFERENCES_ID,
        currentTheme: data.currentTheme ?? DEFAULT_THEME_NAME,
        defaultView: defaultView ?? CalendarView.month,
        visibleEventTypes: visibleEventTypes ?? [],
        visibleCategories: data.visibleCategories ?? [],
        notificationsEnabled: data.notificationsEnabled ?? false,
        notificationDaysBefore: data.notificationDaysBefore ?? 1,
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
    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    logError("[Action] savePreferences failed", error);
    return { success: false, error: "Kon voorkeuren niet opslaan" };
  }
}
