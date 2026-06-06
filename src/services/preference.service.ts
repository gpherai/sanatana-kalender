import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { findPreferences, upsertPreferences } from "@/repositories/preference.repository";

export function getPreferences() {
  return findPreferences();
}

export function savePreferences(
  create: Prisma.UserPreferenceCreateInput,
  update: Prisma.UserPreferenceUpdateInput
) {
  return upsertPreferences(create, update);
}
