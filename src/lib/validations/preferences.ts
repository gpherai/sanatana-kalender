import { z } from "zod";
import { eventTypeEnum, calendarViewEnum } from "./shared";
import { isValidThemeName } from "@/config/themes";

export const updatePreferencesSchema = z
  .object({
    currentTheme: z
      .string()
      .refine(isValidThemeName, {
        error: "Ongeldig thema",
      })
      .optional(),
    defaultView: calendarViewEnum.optional(),
    visibleEventTypes: z.array(eventTypeEnum).optional(),
    visibleCategories: z.array(z.cuid()).optional(),
    notificationsEnabled: z.boolean().optional(),
    notificationDaysBefore: z.number().int().min(0).max(30).optional(),
  })
  .strict();
