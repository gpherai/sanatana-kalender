/**
 * Sadhana Repository
 *
 * Data access layer for all Sadhana related tables.
 *
 * @module repositories/sadhana
 */

import "server-only";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { utcDateFromDateOnly } from "@/lib/default-location-date";

// =============================================================================
// SESSIONS
// =============================================================================

export async function findAllSessions() {
  return prisma.sadhanaSession.findMany({
    include: {
      items: {
        include: { practice: true },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      },
    },
    orderBy: { date: "desc" },
  });
}

export async function findSessionsByDateRange(start: Date, end: Date) {
  return prisma.sadhanaSession.findMany({
    where: {
      date: { gte: start, lte: end },
    },
    include: {
      items: {
        include: { practice: true },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      },
    },
    orderBy: { date: "desc" },
  });
}

export async function findSessionById(id: string) {
  return prisma.sadhanaSession.findUnique({
    where: { id },
    include: {
      items: {
        include: { practice: true },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      },
    },
  });
}

// =============================================================================
// PRACTICES
// =============================================================================

export async function findAllPractices(activeOnly = false) {
  return prisma.sadhanaPractice.findMany({
    where: activeOnly ? { active: true } : {},
    orderBy: { createdAt: "asc" },
  });
}

export async function createPractice(data: Prisma.SadhanaPracticeCreateInput) {
  return prisma.sadhanaPractice.create({
    data,
  });
}

export async function updatePractice(
  id: string,
  data: Prisma.SadhanaPracticeUpdateInput
) {
  return prisma.sadhanaPractice.update({
    where: { id },
    data,
  });
}

export async function deletePractice(id: string) {
  return prisma.sadhanaPractice.update({
    where: { id },
    data: { active: false },
  });
}

export async function findPracticeById(id: string) {
  return prisma.sadhanaPractice.findUnique({
    where: { id },
  });
}

// =============================================================================
// GOALS
// =============================================================================

export async function findGoalsWithPractices() {
  return prisma.sadhanaGoal.findMany({
    orderBy: { createdAt: "desc" },
    include: { practices: true },
  });
}

export async function createGoal(data: Prisma.SadhanaGoalCreateInput) {
  return prisma.sadhanaGoal.create({
    data,
    include: { practices: true },
  });
}

export async function findGoalById(id: string) {
  return prisma.sadhanaGoal.findUnique({ where: { id }, include: { practices: true } });
}

export async function updateGoal(id: string, data: Prisma.SadhanaGoalUpdateInput) {
  return prisma.sadhanaGoal.update({
    where: { id },
    data,
    include: { practices: true },
  });
}

export async function deleteGoal(id: string) {
  return prisma.sadhanaGoal.delete({
    where: { id },
  });
}

export async function createSessionWithItems(
  date: string,
  startedAt: string | null | undefined,
  durationMinutes: number | null | undefined,
  notes: string | null | undefined,
  items: {
    practiceId: string;
    quantity: number;
    unit?: string;
    durationMinutes?: number | null;
    notes?: string | null;
  }[]
) {
  return prisma.sadhanaSession.create({
    data: {
      date: utcDateFromDateOnly(date),
      startedAt: startedAt ? new Date(startedAt) : null,
      durationMinutes: durationMinutes ?? null,
      notes: notes ?? null,
      items: {
        create: items.map((item) => ({
          practiceId: item.practiceId,
          quantity: item.quantity,
          unit: (item.unit as "malas" | "count") ?? "malas",
          durationMinutes: item.durationMinutes ?? null,
          notes: item.notes ?? null,
        })),
      },
    },
    include: {
      items: {
        include: { practice: true },
        orderBy: { createdAt: "asc" as const },
      },
    },
  });
}

export async function updateSessionWithItems(
  id: string,
  date: string,
  startedAt: string | null | undefined,
  durationMinutes: number | null | undefined,
  notes: string | null | undefined,
  items: {
    practiceId: string;
    quantity: number;
    unit?: string;
    durationMinutes?: number | null;
    notes?: string | null;
  }[]
) {
  return prisma.sadhanaSession.update({
    where: { id },
    data: {
      date: utcDateFromDateOnly(date),
      startedAt: startedAt ? new Date(startedAt) : null,
      durationMinutes: durationMinutes ?? null,
      notes: notes ?? null,
      items: {
        deleteMany: {},
        create: items.map((item) => ({
          practiceId: item.practiceId,
          quantity: item.quantity,
          unit: (item.unit as "malas" | "count") ?? "malas",
          durationMinutes: item.durationMinutes ?? null,
          notes: item.notes ?? null,
        })),
      },
    },
    include: {
      items: {
        include: { practice: true },
        orderBy: { createdAt: "asc" as const },
      },
    },
  });
}

export async function deleteSession(id: string) {
  return prisma.sadhanaSession.delete({
    where: { id },
  });
}

export async function findUniqueSessionDates() {
  return prisma.sadhanaSession.findMany({
    select: { date: true },
    distinct: ["date"],
    orderBy: { date: "desc" },
  });
}

export async function findDailyGoal() {
  return prisma.sadhanaGoal.findFirst({
    where: { type: "daily", active: true },
    orderBy: { createdAt: "desc" },
  });
}

// =============================================================================
// ROUTINES
// =============================================================================

export async function findAllRoutines() {
  return prisma.sadhanaRoutine.findMany({
    where: { active: true },
    include: {
      items: {
        include: { practice: true },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function findRoutineById(id: string) {
  return prisma.sadhanaRoutine.findUnique({
    where: { id },
    include: {
      items: { include: { practice: true }, orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function createRoutine(data: Prisma.SadhanaRoutineCreateInput) {
  return prisma.sadhanaRoutine.create({
    data,
    include: {
      items: { include: { practice: true }, orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function updateRoutineWithItems(
  id: string,
  name: string,
  items: {
    practiceId: string;
    quantity: number;
    unit: string;
    sortOrder: number;
  }[],
  active?: boolean
) {
  return prisma.$transaction(async (tx) => {
    await tx.sadhanaRoutineItem.deleteMany({ where: { routineId: id } });
    return tx.sadhanaRoutine.update({
      where: { id },
      data: {
        name,
        ...(active !== undefined && { active }),
        items: {
          create: items.map((it) => ({
            practiceId: it.practiceId,
            quantity: it.quantity,
            unit: it.unit as "malas" | "count",
            sortOrder: it.sortOrder,
          })),
        },
      },
      include: {
        items: { include: { practice: true }, orderBy: { sortOrder: "asc" } },
      },
    });
  });
}

export async function updateRoutine(id: string, data: Prisma.SadhanaRoutineUpdateInput) {
  return prisma.sadhanaRoutine.update({
    where: { id },
    data,
    include: {
      items: { include: { practice: true }, orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function deleteRoutine(id: string) {
  return prisma.sadhanaRoutine.update({
    where: { id },
    data: { active: false },
  });
}
