import type { SadhanaPractice, SadhanaSession, SadhanaSessionItem } from "@prisma/client";

// =============================================================================
// TYPES
// =============================================================================

export type SessionWithItems = SadhanaSession & {
  items: (SadhanaSessionItem & { practice: SadhanaPractice })[];
};

// =============================================================================
// FORMATTERS
// =============================================================================

export function formatPractice(p: SadhanaPractice) {
  return {
    id: p.id,
    name: p.name,
    type: p.type,
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

  return {
    id: item.id,
    practice_id: item.practiceId,
    practice_name: item.practice.name,
    practice_type: item.practice.type,
    quantity: item.quantity,
    unit: item.unit,
    mantra_count,
    duration_minutes: item.durationMinutes,
    notes: item.notes,
    created_at: item.createdAt.toISOString(),
  };
}

export function formatSession(session: SessionWithItems) {
  const japaItems = session.items.filter((i) => i.practice.type === "mantra_japa");
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
  return new Date(dateStr + "T00:00:00.000Z");
}

/** YYYY-MM-DD from a Date (UTC) */
export function dateStr(d: Date): string {
  return d.toISOString().split("T")[0]!;
}

/** Today as YYYY-MM-DD (UTC) */
export function todayStr(): string {
  return dateStr(new Date());
}
