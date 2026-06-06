import type {
  SadhanaPractice,
  SadhanaSession,
  SadhanaSessionItem,
  SadhanaGoal,
  SadhanaRoutine,
  SadhanaRoutineItem,
} from "@/generated/prisma/client";
import type {
  Practice,
  SessionItemData,
  SessionData,
  Goal,
  Routine,
} from "@/types/sadhana";
import {
  dateOnlyFromUtcDate,
  defaultLocationDate,
  utcDateFromDateOnly,
} from "@/lib/date-utils";
import { MALA_BEAD_COUNT } from "@/lib/domain";

// =============================================================================
// TYPES
// =============================================================================

export type SessionWithItems = SadhanaSession & {
  items: (SadhanaSessionItem & { practice: SadhanaPractice })[];
};

export type RoutineWithItems = SadhanaRoutine & {
  items: (SadhanaRoutineItem & { practice: SadhanaPractice })[];
};

// =============================================================================
// FORMATTERS
// =============================================================================

export function formatPractice(p: SadhanaPractice): Practice {
  return {
    id: p.id,
    name: p.name,
    type: p.type as Practice["type"],
    mantraText: p.mantraText ?? null,
    countSize: p.countSize ?? null,
    notes: p.notes,
    active: p.active,
    createdAt: p.createdAt.toISOString(),
  };
}

export function formatSessionItem(
  item: SadhanaSessionItem & { practice: SadhanaPractice }
): SessionItemData {
  const isJapa = item.practice.type === "mantra_japa";
  const mantraCount = isJapa
    ? item.unit === "malas"
      ? item.quantity * MALA_BEAD_COUNT
      : item.quantity
    : null;

  const countTotal =
    !isJapa && item.unit === "count" && item.practice.countSize
      ? item.quantity * item.practice.countSize
      : null;

  return {
    id: item.id,
    practiceId: item.practiceId,
    practiceName: item.practice.name,
    practiceType: item.practice.type as SessionItemData["practiceType"],
    quantity: item.quantity,
    unit: item.unit as SessionItemData["unit"],
    mantraCount,
    countTotal,
    durationMinutes: item.durationMinutes,
    notes: item.notes,
    createdAt: item.createdAt.toISOString(),
  };
}

export function formatSession(session: SessionWithItems): SessionData {
  const japaItems = session.items.filter((i) => i.practice.type === "mantra_japa");
  const nonJapaCount = session.items
    .filter((i) => i.practice.type !== "mantra_japa" && i.unit === "count")
    .reduce((s, i) => s + i.quantity, 0);
  const totalMalas = japaItems
    .filter((i) => i.unit === "malas")
    .reduce((s, i) => s + i.quantity, 0);
  const totalMantras =
    totalMalas * MALA_BEAD_COUNT +
    japaItems.filter((i) => i.unit === "count").reduce((s, i) => s + i.quantity, 0);

  return {
    id: session.id,
    date: (session.date as Date).toISOString().split("T")[0]!,
    startedAt: session.startedAt?.toISOString() ?? null,
    durationMinutes: session.durationMinutes,
    totalMalas,
    totalMantras,
    totalCount: nonJapaCount,
    notes: session.notes,
    createdAt: session.createdAt.toISOString(),
    items: session.items.map(formatSessionItem),
  };
}

// =============================================================================
// DATE HELPERS
// =============================================================================

/** UTC midnight for a YYYY-MM-DD string */
export function utcDate(dateStr: string): Date {
  return utcDateFromDateOnly(dateStr);
}

/** YYYY-MM-DD from a Date (UTC) */
export function dateStr(d: Date): string {
  return dateOnlyFromUtcDate(d);
}

/** Today as YYYY-MM-DD in the fixed application timezone */
export function todayStr(): string {
  return defaultLocationDate();
}

// =============================================================================
// GOALS
// =============================================================================

export function formatGoal(
  g: SadhanaGoal & { practices?: SadhanaPractice[] }
): Omit<Goal, "progressMalas" | "progressMinutes"> {
  return {
    id: g.id,
    type: g.type as Goal["type"],
    name: g.name,
    targetMalas: g.targetMalas,
    targetMinutes: g.targetMinutes,
    active: g.active,
    createdAt: g.createdAt.toISOString(),
    practices: g.practices ? g.practices.map((p) => ({ id: p.id, name: p.name })) : [],
  };
}

export function formatRoutine(routine: RoutineWithItems): Routine {
  return {
    id: routine.id,
    name: routine.name,
    active: routine.active,
    createdAt: routine.createdAt.toISOString(),
    items: routine.items.map((item) => ({
      id: item.id,
      practiceId: item.practiceId,
      practiceName: item.practice.name,
      practiceType: item.practice.type as Routine["items"][number]["practiceType"],
      quantity: item.quantity,
      unit: item.unit as Routine["items"][number]["unit"],
      sortOrder: item.sortOrder,
    })),
  };
}

// =============================================================================
// PRACTICE STATS
// =============================================================================

export function computePracticeStats(
  sessions: SessionWithItems[],
  opts: { insertionOrder?: boolean } = {}
) {
  const map = new Map<
    string,
    { id: string; name: string; type: string; malas: number; countQty: number }
  >();

  for (const s of sessions) {
    for (const item of s.items) {
      const p = item.practice;
      if (!map.has(p.id)) {
        map.set(p.id, { id: p.id, name: p.name, type: p.type, malas: 0, countQty: 0 });
      }
      const entry = map.get(p.id)!;
      if (item.unit === "malas") entry.malas += item.quantity;
      else entry.countQty += item.quantity;
    }
  }

  const rows = [...map.values()].map((d) => ({
    practiceId: d.id,
    practiceName: d.name,
    practiceType: d.type as "mantra_japa" | "parayana" | "other",
    totalQuantity: d.type === "mantra_japa" ? d.malas : d.countQty,
    totalMantras:
      d.type === "mantra_japa" ? d.malas * MALA_BEAD_COUNT + d.countQty : null,
  }));

  if (opts.insertionOrder) return rows;
  return rows.sort((a, b) => b.totalQuantity - a.totalQuantity);
}
