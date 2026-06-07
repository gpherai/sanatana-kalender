"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { createEventSchema, updateEventSchema, cuidSchema } from "@/lib/validations";
import {
  CategoryNotFoundError,
  createEvent,
  deleteEvent,
  deleteEventOccurrence,
  EventNotFoundError,
  getEventForUpdate,
  OccurrenceNotFoundError,
  OccurrenceOwnershipError,
  updateEvent,
} from "@/services/event.service";
import { logError } from "@/lib/utils";
import { formatDateLocal } from "@/lib/date-utils";
import { dbTimeToStr } from "@/lib/timing-utils";

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

function prismaErrorMessage(error: unknown): string | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return null;
  switch (error.code) {
    case "P2002":
      return "Uniek veld conflict";
    case "P2003":
      return "Gerelateerde data niet gevonden";
    case "P2025":
      return "Record niet gevonden";
    default:
      return null;
  }
}

function revalidateEventPaths(eventId?: string) {
  revalidatePath("/events");
  revalidatePath("/");
  if (eventId) revalidatePath(`/events/${eventId}`);
}

export async function createEventAction(
  payload: unknown
): Promise<ActionResult<{ id: string }>> {
  const result = createEventSchema.safeParse(payload);
  if (!result.success) {
    return { success: false, error: "Ongeldige invoer" };
  }

  try {
    const event = await createEvent({
      ...result.data,
      endDate: result.data.endDate ?? null,
      startTime: result.data.startTime ?? null,
      endTime: result.data.endTime ?? null,
      notes: result.data.notes ?? null,
    });
    revalidateEventPaths();
    return { success: true, data: { id: event.id } };
  } catch (error) {
    logError("[Action] createEvent failed", error);
    if (error instanceof CategoryNotFoundError) {
      return { success: false, error: "Categorie niet gevonden" };
    }
    return {
      success: false,
      error: prismaErrorMessage(error) ?? "Kon event niet aanmaken",
    };
  }
}

export async function updateEventAction(
  id: string,
  payload: unknown
): Promise<ActionResult> {
  if (!cuidSchema.safeParse(id).success) {
    return { success: false, error: "Ongeldig event ID" };
  }
  const result = updateEventSchema.safeParse(payload);
  if (!result.success) {
    return { success: false, error: "Ongeldige invoer" };
  }

  try {
    const existing = await getEventForUpdate(id);
    if (!existing) {
      return { success: false, error: "Event niet gevonden" };
    }

    const data = result.data;
    const firstOccurrence = existing.occurrences[0];
    const mergedStateCheck = createEventSchema.safeParse({
      name: data.name ?? existing.name,
      description:
        data.description !== undefined ? data.description : existing.description,
      eventType: data.eventType ?? existing.eventType,
      categoryId: data.categoryId !== undefined ? data.categoryId : undefined,
      recurrenceType: data.recurrenceType ?? existing.recurrenceType,
      tithi: data.tithi !== undefined ? data.tithi : existing.tithi,
      nakshatra: data.nakshatra !== undefined ? data.nakshatra : existing.nakshatra,
      maas: data.maas !== undefined ? data.maas : existing.maas,
      sankranti: data.sankranti !== undefined ? data.sankranti : existing.sankranti,
      tags: data.tags ?? existing.tags,
      date: data.date ?? (firstOccurrence ? formatDateLocal(firstOccurrence.date) : ""),
      endDate:
        data.endDate !== undefined
          ? data.endDate
          : firstOccurrence?.endDate
            ? formatDateLocal(firstOccurrence.endDate)
            : null,
      startTime:
        data.startTime !== undefined
          ? data.startTime
          : (dbTimeToStr(firstOccurrence?.startTime) ?? null),
      endTime:
        data.endTime !== undefined
          ? data.endTime
          : (dbTimeToStr(firstOccurrence?.endTime) ?? null),
      notes: data.notes !== undefined ? data.notes : (firstOccurrence?.notes ?? null),
    });
    if (!mergedStateCheck.success) {
      return { success: false, error: "Ongeldige invoer" };
    }

    await updateEvent(id, result.data, existing.occurrences[0]?.id);
    revalidateEventPaths(id);
    return { success: true };
  } catch (error) {
    logError("[Action] updateEvent failed", error);
    if (error instanceof EventNotFoundError) {
      return { success: false, error: "Event niet gevonden" };
    }
    if (error instanceof CategoryNotFoundError) {
      return { success: false, error: "Categorie niet gevonden" };
    }
    return {
      success: false,
      error: prismaErrorMessage(error) ?? "Kon event niet bijwerken",
    };
  }
}

export async function deleteEventAction(id: string): Promise<ActionResult> {
  if (!cuidSchema.safeParse(id).success) {
    return { success: false, error: "Ongeldig event ID" };
  }

  try {
    await deleteEvent(id);
    revalidateEventPaths(id);
    return { success: true };
  } catch (error) {
    logError("[Action] deleteEvent failed", error);
    if (error instanceof EventNotFoundError) {
      return { success: false, error: "Event niet gevonden" };
    }
    return {
      success: false,
      error: prismaErrorMessage(error) ?? "Kon event niet verwijderen",
    };
  }
}

export async function deleteOccurrenceAction(
  eventId: string,
  occurrenceId: string
): Promise<ActionResult> {
  if (
    !cuidSchema.safeParse(eventId).success ||
    !cuidSchema.safeParse(occurrenceId).success
  ) {
    return { success: false, error: "Ongeldig ID formaat" };
  }

  try {
    await deleteEventOccurrence(eventId, occurrenceId);
    revalidateEventPaths(eventId);
    return { success: true };
  } catch (error) {
    logError("[Action] deleteOccurrence failed", error);
    if (error instanceof OccurrenceNotFoundError) {
      return { success: false, error: "Herhaling niet gevonden" };
    }
    if (error instanceof OccurrenceOwnershipError) {
      return { success: false, error: "Herhaling behoort niet tot dit event" };
    }
    return {
      success: false,
      error: prismaErrorMessage(error) ?? "Kon herhaling niet verwijderen",
    };
  }
}
