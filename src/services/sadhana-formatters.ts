import type {
  SadhanaPractice,
  SadhanaSession,
  SadhanaSessionItem,
  SadhanaGoal,
  SadhanaRoutine,
  SadhanaRoutineItem,
} from "@prisma/client";
import {
  dateOnlyFromUtcDate,
  defaultLocationDate,
  utcDateFromDateOnly,
} from "@/lib/default-location-date";

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

export function formatPractice(p: SadhanaPractice) {
  return {
    id: p.id,
    name: p.name,
    type: p.type,
    mantra_text: p.mantraText ?? null,
    count_size: p.countSize ?? null,
    notes: p.notes,
    active: p.active,
    created_at: p.createdAt.toISOString(),
  };
}

export function formatSessionItem(
  item: SadhanaSessionItem & { practice: SadhanaPractice }
) {
  const isJapa = item.practice.type === "mantra_japa";
  const mantra_count = isJapa
    ? item.unit === "malas"
      ? item.quantity * 108
      : item.quantity
    : null;

  const count_total =
    !isJapa && item.unit === "count" && item.practice.countSize
      ? item.quantity * item.practice.countSize
      : null;

  return {
    id: item.id,
    practice_id: item.practiceId,
    practice_name: item.practice.name,
    practice_type: item.practice.type,
    quantity: item.quantity,
    unit: item.unit,
    mantra_count,
    count_total,
    duration_minutes: item.durationMinutes,
    notes: item.notes,
    created_at: item.createdAt.toISOString(),
  };
}

export function formatSession(session: SessionWithItems) {
  const japaItems = session.items.filter((i) => i.practice.type === "mantra_japa");
  const nonJapaCount = session.items
    .filter((i) => i.practice.type !== "mantra_japa" && i.unit === "count")
    .reduce((s, i) => s + i.quantity, 0);
  const totalMalas = japaItems
    .filter((i) => i.unit === "malas")
    .reduce((s, i) => s + i.quantity, 0);
  const totalMantras =
    totalMalas * 108 +
    japaItems.filter((i) => i.unit === "count").reduce((s, i) => s + i.quantity, 0);

  return {
    id: session.id,
    date: (session.date as Date).toISOString().split("T")[0]!,
    started_at: session.startedAt?.toISOString() ?? null,
    duration_minutes: session.durationMinutes,
    total_malas: totalMalas,
    total_mantras: totalMantras,
    total_count: nonJapaCount,
    notes: session.notes,
    created_at: session.createdAt.toISOString(),
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

export function formatGoal(g: SadhanaGoal & { practices?: SadhanaPractice[] }) {
  return {
    id: g.id,
    type: g.type,
    name: g.name,
    target_malas: g.targetMalas,
    target_minutes: g.targetMinutes,
    active: g.active,
    created_at: g.createdAt.toISOString(),
    practices: g.practices ? g.practices.map((p) => ({ id: p.id, name: p.name })) : [],
  };
}

export function formatRoutine(routine: RoutineWithItems) {
  return {
    id: routine.id,
    name: routine.name,
    active: routine.active,
    created_at: routine.createdAt.toISOString(),
    items: routine.items.map((item) => ({
      id: item.id,
      practice_id: item.practiceId,
      practice_name: item.practice.name,
      practice_type: item.practice.type,
      quantity: item.quantity,
      unit: item.unit,
      sort_order: item.sortOrder,
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
    practice_id: d.id,
    practice_name: d.name,
    practice_type: d.type,
    total_quantity: d.type === "mantra_japa" ? d.malas : d.countQty,
    total_mantras: d.type === "mantra_japa" ? d.malas * 108 + d.countQty : null,
  }));

  if (opts.insertionOrder) return rows;
  return rows.sort((a, b) => b.total_quantity - a.total_quantity);
}
