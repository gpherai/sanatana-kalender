/**
 * Sadhana Repository
 *
 * Data access layer for all Sadhana related tables.
 *
 * @module repositories/sadhana
 */

import "server-only";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { utcDateFromDateOnly } from "@/lib/date-utils";

// =============================================================================
// SESSIONS
// =============================================================================

export async function findAllSessions(opts?: { take?: number; skip?: number }) {
  return prisma.sadhanaSession.findMany({
    include: {
      items: {
        include: { practice: true },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      },
    },
    orderBy: { date: "desc" },
    ...(opts?.take !== undefined && { take: opts.take }),
    ...(opts?.skip !== undefined && { skip: opts.skip }),
  });
}

export async function findSessionsByDateRange(
  start: Date,
  end: Date,
  opts?: { take?: number; skip?: number }
) {
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
    ...(opts?.take !== undefined && { take: opts.take }),
    ...(opts?.skip !== undefined && { skip: opts.skip }),
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
    id?: string;
    practiceId: string;
    quantity: number;
    unit?: string;
    durationMinutes?: number | null;
    notes?: string | null;
  }[]
) {
  const keptIds = items.filter((it) => it.id).map((it) => it.id as string);

  return prisma.$transaction(async (tx) => {
    await tx.sadhanaSessionItem.deleteMany({
      where: {
        sessionId: id,
        ...(keptIds.length > 0 && { id: { notIn: keptIds } }),
      },
    });

    for (const item of items) {
      if (item.id) {
        const updateResult = await tx.sadhanaSessionItem.updateMany({
          where: { id: item.id, sessionId: id },
          data: {
            practiceId: item.practiceId,
            quantity: item.quantity,
            unit: (item.unit as "malas" | "count") ?? "malas",
            durationMinutes: item.durationMinutes ?? null,
            notes: item.notes ?? null,
          },
        });
        if (updateResult.count !== 1) {
          throw new Error(`Sadhana session item ${item.id} kon niet worden bijgewerkt`);
        }
      } else {
        await tx.sadhanaSessionItem.create({
          data: {
            sessionId: id,
            practiceId: item.practiceId,
            quantity: item.quantity,
            unit: (item.unit as "malas" | "count") ?? "malas",
            durationMinutes: item.durationMinutes ?? null,
            notes: item.notes ?? null,
          },
        });
      }
    }

    return tx.sadhanaSession.update({
      where: { id },
      data: {
        date: utcDateFromDateOnly(date),
        startedAt: startedAt ? new Date(startedAt) : null,
        durationMinutes: durationMinutes ?? null,
        notes: notes ?? null,
      },
      include: {
        items: {
          include: { practice: true },
          orderBy: { createdAt: "asc" as const },
        },
      },
    });
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
    id?: string;
    practiceId: string;
    quantity: number;
    unit: string;
    sortOrder: number;
  }[],
  active?: boolean
) {
  const keptIds = items.filter((it) => it.id).map((it) => it.id as string);

  return prisma.$transaction(async (tx) => {
    await tx.sadhanaRoutineItem.deleteMany({
      where: {
        routineId: id,
        ...(keptIds.length > 0 && { id: { notIn: keptIds } }),
      },
    });

    for (const item of items) {
      if (item.id) {
        const updateResult = await tx.sadhanaRoutineItem.updateMany({
          where: { id: item.id, routineId: id },
          data: {
            practiceId: item.practiceId,
            quantity: item.quantity,
            unit: item.unit as "malas" | "count",
            sortOrder: item.sortOrder,
          },
        });
        if (updateResult.count !== 1) {
          throw new Error(`Sadhana routine item ${item.id} kon niet worden bijgewerkt`);
        }
      } else {
        await tx.sadhanaRoutineItem.create({
          data: {
            routineId: id,
            practiceId: item.practiceId,
            quantity: item.quantity,
            unit: item.unit as "malas" | "count",
            sortOrder: item.sortOrder,
          },
        });
      }
    }

    return tx.sadhanaRoutine.update({
      where: { id },
      data: {
        name,
        ...(active !== undefined && { active }),
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
