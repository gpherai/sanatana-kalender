/**
 * Preference Repository
 *
 * Data access layer for user preferences.
 *
 * @module repositories/preference
 */

import { prisma } from "@/lib/db";
import { DEFAULT_PREFERENCES_ID } from "@/lib/domain";
import { Prisma } from "@prisma/client";

/**
 * Find preferences for the default user.
 */
export async function findPreferences() {
  return prisma.userPreference.findUnique({
    where: { id: DEFAULT_PREFERENCES_ID },
  });
}

/**
 * Upsert preferences for the default user.
 */
export async function upsertPreferences(
  create: Prisma.UserPreferenceCreateInput,
  update: Prisma.UserPreferenceUpdateInput
) {
  return prisma.userPreference.upsert({
    where: { id: DEFAULT_PREFERENCES_ID },
    create,
    update,
  });
}
