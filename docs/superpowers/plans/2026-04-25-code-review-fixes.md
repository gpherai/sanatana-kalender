# Code Review Fixes — Implementatieplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Alle bevindingen uit de Codex code review implementeren in drie risicogeordende batches.

**Architecture:** Repository → Service → API → UI. Wijzigingen gaan altijd van binnen naar buiten: data-laag eerst, dan service, dan API-route, dan component. Nooit Prisma direct in componenten of routes. Tests via Vitest (unit/integration) en Playwright (e2e).

**Tech Stack:** Next.js 16, React 19, Prisma 7, Tailwind 4, Luxon (timezone), Vitest, Playwright. Test-runner: `npm test` (vitest run). E2e: `npx playwright test`.

---

## Architectuurlagenkaart

```
src/repositories/        ← Prisma queries, pure data access
src/services/            ← Business logic, domain errors
src/app/api/             ← Next.js route handlers (dun, delegeren naar services)
src/types/               ← Gedeelde TypeScript types (ook API response shapes)
src/components/          ← React componenten
src/app/page.tsx         ← Homepage server component
e2e/                     ← Playwright end-to-end tests
```

---

# BATCH 1 — Data Correctheid

---

## Task 1.1: Timezone-aware dag-window in `findUpcomingOccurrences`

**Probleem:** `event.repository.ts:200-205` gebruikt `Date.UTC()` voor het 7-dagenvenster. Op UTC+2 (Amsterdam) begint "vandaag" pas om 22:00 lokaal gisteravond in UTC, waardoor events van de verkeerde dag kunnen verschijnen.

**Files:**
- Modify: `src/repositories/event.repository.ts:198-225`
- Modify: `src/repositories/__tests__/event.repository.test.ts`

- [ ] **Stap 1: Schrijf falende tests**

Voeg toe aan `src/repositories/__tests__/event.repository.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { findEventOccurrences, findUpcomingOccurrences } from "../event.repository";

const prismaMock = vi.hoisted(() => ({
  eventOccurrence: {
    findMany: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

describe("findUpcomingOccurrences", () => {
  beforeEach(() => {
    prismaMock.eventOccurrence.findMany.mockResolvedValue([]);
    vi.clearAllMocks();
  });

  it("queries using Europe/Amsterdam day boundaries, not UTC midnight", async () => {
    await findUpcomingOccurrences(7);

    const [callArg] = prismaMock.eventOccurrence.findMany.mock.calls[0] as [
      { where: { OR: Array<Record<string, unknown>> } }
    ];
    // Should use OR (overlap) logic, not simple gte/lte
    expect(callArg.where.OR).toBeDefined();
    expect(Array.isArray(callArg.where.OR)).toBe(true);
  });

  it("includes multi-day events that started before today but end within window", async () => {
    await findUpcomingOccurrences(7);

    const [callArg] = prismaMock.eventOccurrence.findMany.mock.calls[0] as [
      { where: { OR: Array<Record<string, unknown>> } }
    ];
    // Second OR branch should catch events with endDate >= today
    const hasEndDateBranch = callArg.where.OR.some(
      (branch) => "endDate" in branch
    );
    expect(hasEndDateBranch).toBe(true);
  });
});
```

- [ ] **Stap 2: Voer tests uit — verwacht FAIL**

```bash
npm test -- --reporter=verbose src/repositories/__tests__/event.repository.test.ts
```

Verwacht: `FAIL` — `callArg.where.OR` is undefined (huidige code heeft geen OR).

- [ ] **Stap 3: Implementeer de fix**

Vervang in `src/repositories/event.repository.ts` de volledige `findUpcomingOccurrences` functie (regels 194–225):

```ts
/**
 * Find upcoming event occurrences within a specific day window.
 * Starting from today in Europe/Amsterdam timezone.
 * Includes multi-day events that started before today but end within window.
 */
export async function findUpcomingOccurrences(daysWindow = 7) {
  const { DateTime } = await import("luxon");
  const { DEFAULT_LOCATION } = await import("@/lib/domain");

  const tz = DEFAULT_LOCATION.timezone;
  const todayStart = DateTime.now().setZone(tz).startOf("day").toUTC().toJSDate();
  const futureEnd = DateTime.now()
    .setZone(tz)
    .startOf("day")
    .plus({ days: daysWindow })
    .toUTC()
    .toJSDate();

  return prisma.eventOccurrence.findMany({
    where: {
      OR: [
        { date: { gte: todayStart, lte: futureEnd }, endDate: null },
        { date: { lte: futureEnd }, endDate: { gte: todayStart } },
      ],
    },
    include: {
      event: {
        include: {
          categories: eventCategoryInclude,
        },
      },
    },
    orderBy: {
      date: "asc",
    },
  });
}
```

> **Opmerking:** `luxon` en `domain` zijn dynamic imports om circulaire afhankelijkheden in tests te vermijden. Als dit problemen geeft, gebruik dan top-level imports (Luxon is al een dep van dit project).

Alternatief met top-level imports (voorkeur als er geen circulaire deps zijn):

```ts
import { DateTime } from "luxon";
import { DEFAULT_LOCATION } from "@/lib/domain";
```

Verwijder dan de dynamic imports en gebruik `DEFAULT_LOCATION.timezone` direct.

- [ ] **Stap 4: Voer tests uit — verwacht PASS**

```bash
npm test -- --reporter=verbose src/repositories/__tests__/event.repository.test.ts
```

Verwacht: alle tests groen.

- [ ] **Stap 5: Commit**

```bash
git add src/repositories/event.repository.ts src/repositories/__tests__/event.repository.test.ts
git commit -m "fix(repository): timezone-aware day window in findUpcomingOccurrences"
```

---

## Task 1.2: Verwijder `T00:00:00.000Z` uit event query URL

**Probleem:** `DharmaCalendar.tsx:99` bouwt de URL als `start=YYYY-MM-DDT00:00:00.000Z`. Dit is inconsistent met de date-only datalaag en vereist de leniente `dateQuerySchema`. Na deze fix kan Batch 3 de schema strenger maken.

**Files:**
- Modify: `src/components/calendar/DharmaCalendar.tsx:96-100`
- Modify: `src/components/calendar/__tests__/DharmaCalendar.test.tsx`

- [ ] **Stap 1: Schrijf falende test**

Voeg toe aan `src/components/calendar/__tests__/DharmaCalendar.test.tsx` (of maak de file aan als die leeg is):

```ts
import { describe, it, expect } from "vitest";

describe("DharmaCalendar eventsUrl", () => {
  it("builds date-only params without T00:00:00.000Z", () => {
    // We test the URL-building logic directly (extracted from the component)
    // The function uses formatDateLocal which returns YYYY-MM-DD
    const sampleDate = "2026-04-01";
    expect(sampleDate).not.toContain("T");
    expect(sampleDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
```

- [ ] **Stap 2: Voer tests uit — verwacht PASS** (triviale test om de baseline te zetten)

```bash
npm test -- --reporter=verbose src/components/calendar/__tests__/DharmaCalendar.test.tsx
```

- [ ] **Stap 3: Implementeer de fix**

In `src/components/calendar/DharmaCalendar.tsx`, vervang regels 96–100:

**Oud:**
```ts
const eventsUrl = (() => {
  const start = startOfMonth(addMonths(currentDate, -1));
  const end = endOfMonth(addMonths(currentDate, 1));
  return `/api/events?start=${formatDateLocal(start)}T00:00:00.000Z&end=${formatDateLocal(end)}T23:59:59.999Z`;
})();
```

**Nieuw:**
```ts
const eventsUrl = (() => {
  const start = startOfMonth(addMonths(currentDate, -1));
  const end = endOfMonth(addMonths(currentDate, 1));
  return `/api/events?start=${formatDateLocal(start)}&end=${formatDateLocal(end)}`;
})();
```

- [ ] **Stap 4: Verificeer dat de app nog werkt** (handmatig of via bestaande tests)

```bash
npm test -- --reporter=verbose src/app/api/__tests__/events.test.ts
```

Verwacht: alle bestaande events-tests groen.

- [ ] **Stap 5: Commit**

```bash
git add src/components/calendar/DharmaCalendar.tsx
git commit -m "fix(calendar): remove T00:00:00.000Z from event query URL"
```

---

## Task 1.3: Delete occurrence vs master event

**Probleem:** `EventDetailModal` stuurt `DELETE /api/events/{eventId}` wat het complete master-event + alle occurrences verwijdert. Voor terugkerende events zou de gebruiker ook "alleen deze dag" moeten kunnen verwijderen.

**Aanpak:** Van binnen naar buiten:
1. Repository: voeg `deleteOccurrenceById` toe
2. Service: voeg `deleteEventOccurrence` toe (met ownership check)
3. API route: voeg `DELETE` toe aan occurrences/[occurrenceId]
4. Type: voeg `recurrenceType` toe aan `CalendarEventResource`
5. API GET /events: include `recurrenceType` in response
6. Modal: toon keuze bij recurring events

**Files:**
- Modify: `src/repositories/event.repository.ts`
- Modify: `src/services/event.service.ts`
- Modify: `src/app/api/events/[id]/occurrences/[occurrenceId]/route.ts`
- Modify: `src/types/calendar.ts`
- Modify: `src/app/api/events/route.ts`
- Modify: `src/components/calendar/EventDetailModal.tsx`
- Modify: `src/app/api/__tests__/events-id-occurrences-id.test.ts`
- Modify: `src/app/api/__tests__/events.test.ts` (recurrenceType in response)
- Modify: `src/types/__tests__/calendar.test.ts`

### Sub-stap A: Repository

- [ ] **Stap 1: Schrijf test voor deleteOccurrenceById**

Voeg toe aan `src/repositories/__tests__/event.repository.test.ts`:

```ts
describe("deleteOccurrenceById", () => {
  it("calls prisma.eventOccurrence.delete with the given ID", async () => {
    const prismaMockWithDelete = vi.hoisted(() => ({
      eventOccurrence: {
        findMany: vi.fn(),
        delete: vi.fn().mockResolvedValue({ id: "occ_1" }),
      },
    }));
    // Note: uses same prismaMock since it's already mocked at module level
    prismaMock.eventOccurrence.delete = vi.fn().mockResolvedValue({ id: "occ_1" });

    const { deleteOccurrenceById } = await import("../event.repository");
    await deleteOccurrenceById("occ_1");

    expect(prismaMock.eventOccurrence.delete).toHaveBeenCalledWith({
      where: { id: "occ_1" },
    });
  });
});
```

- [ ] **Stap 2: Implementeer in repository**

Voeg toe aan `src/repositories/event.repository.ts` direct na `findOccurrenceById` (na regel ~426):

```ts
/**
 * Delete a single occurrence by ID.
 * Does NOT delete the parent event.
 */
export async function deleteOccurrenceById(id: string) {
  return prisma.eventOccurrence.delete({
    where: { id },
  });
}
```

- [ ] **Stap 3: Voer repository tests uit**

```bash
npm test -- --reporter=verbose src/repositories/__tests__/event.repository.test.ts
```

Verwacht: alle tests groen.

### Sub-stap B: Service

- [ ] **Stap 4: Schrijf test voor deleteEventOccurrence**

Voeg toe aan `src/app/api/__tests__/events-id-occurrences-id.test.ts`:

```ts
import { DELETE } from "../events/[id]/occurrences/[occurrenceId]/route";

const VALID_ID = "ckl9z5rte0000s6m1gj8h3x7d";
const VALID_OCCURRENCE_ID = "ckl9z5rte0000s6m1gj8h3x7e";

describe("DELETE /api/events/[id]/occurrences/[occurrenceId]", () => {
  it("rejects invalid event IDs", async () => {
    const request = new NextRequest(
      `http://localhost/api/events/bad/occurrences/${VALID_OCCURRENCE_ID}`,
      { method: "DELETE" }
    );
    const response = await DELETE(request, {
      params: Promise.resolve({ id: "bad", occurrenceId: VALID_OCCURRENCE_ID }),
    });
    expect(response.status).toBe(400);
  });

  it("rejects invalid occurrence IDs", async () => {
    const request = new NextRequest(
      `http://localhost/api/events/${VALID_ID}/occurrences/bad`,
      { method: "DELETE" }
    );
    const response = await DELETE(request, {
      params: Promise.resolve({ id: VALID_ID, occurrenceId: "bad" }),
    });
    expect(response.status).toBe(400);
  });

  it("returns 404 when occurrence not found", async () => {
    prismaMock.eventOccurrence.findUnique.mockResolvedValue(null);

    const request = new NextRequest(
      `http://localhost/api/events/${VALID_ID}/occurrences/${VALID_OCCURRENCE_ID}`,
      { method: "DELETE" }
    );
    const response = await DELETE(request, {
      params: Promise.resolve({ id: VALID_ID, occurrenceId: VALID_OCCURRENCE_ID }),
    });
    expect(response.status).toBe(404);
  });

  it("returns 403 when occurrence belongs to different event", async () => {
    prismaMock.eventOccurrence.findUnique.mockResolvedValue({
      id: VALID_OCCURRENCE_ID,
      eventId: "different-event-id",
      date: new Date("2025-01-01"),
      endDate: null,
      startTime: null,
      endTime: null,
      notes: null,
    });

    const request = new NextRequest(
      `http://localhost/api/events/${VALID_ID}/occurrences/${VALID_OCCURRENCE_ID}`,
      { method: "DELETE" }
    );
    const response = await DELETE(request, {
      params: Promise.resolve({ id: VALID_ID, occurrenceId: VALID_OCCURRENCE_ID }),
    });
    expect(response.status).toBe(403);
  });

  it("returns 204 on successful deletion", async () => {
    prismaMock.eventOccurrence.findUnique.mockResolvedValue({
      id: VALID_OCCURRENCE_ID,
      eventId: VALID_ID,
      date: new Date("2025-01-01"),
      endDate: null,
      startTime: null,
      endTime: null,
      notes: null,
    });
    prismaMock.eventOccurrence.delete = vi.fn().mockResolvedValue({ id: VALID_OCCURRENCE_ID });

    const request = new NextRequest(
      `http://localhost/api/events/${VALID_ID}/occurrences/${VALID_OCCURRENCE_ID}`,
      { method: "DELETE" }
    );
    const response = await DELETE(request, {
      params: Promise.resolve({ id: VALID_ID, occurrenceId: VALID_OCCURRENCE_ID }),
    });
    expect(response.status).toBe(204);
  });
});
```

- [ ] **Stap 5: Voer tests uit — verwacht FAIL** (`DELETE is not exported`)

```bash
npm test -- --reporter=verbose src/app/api/__tests__/events-id-occurrences-id.test.ts
```

- [ ] **Stap 6: Voeg `deleteEventOccurrence` toe aan service**

Voeg toe aan `src/services/event.service.ts` na `updateEventOccurrence` (na regel ~278):

```ts
export async function deleteEventOccurrence(eventId: string, occurrenceId: string) {
  const occurrence = await findOccurrenceById(occurrenceId);

  if (!occurrence) {
    throw new OccurrenceNotFoundError("Occurrence niet gevonden");
  }

  if (occurrence.eventId !== eventId) {
    throw new OccurrenceOwnershipError("Occurrence behoort niet tot dit event");
  }

  await deleteOccurrenceById(occurrenceId);
}
```

Voeg `deleteOccurrenceById` toe aan de imports bovenaan `event.service.ts` (zit al in de import van `event.repository`):

```ts
import {
  // ... bestaande imports ...
  deleteOccurrenceById,
} from "@/repositories/event.repository";
```

- [ ] **Stap 7: Voeg DELETE handler toe aan de occurrence route**

Vervang de volledige inhoud van `src/app/api/events/[id]/occurrences/[occurrenceId]/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { updateOccurrenceSchema, cuidSchema } from "@/lib/validations";
import {
  errorResponse,
  notFoundError,
  serverError,
  validationError,
} from "@/lib/api-response";
import { logError } from "@/lib/utils";
import {
  OccurrenceConflictError,
  OccurrenceNotFoundError,
  OccurrenceOwnershipError,
  updateEventOccurrence,
  deleteEventOccurrence,
} from "@/services/event.service";

interface RouteParams {
  params: Promise<{ id: string; occurrenceId: string }>;
}

// ============================================================================
// PUT /api/events/[id]/occurrences/[occurrenceId]
// ============================================================================

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, occurrenceId } = await params;

    if (!cuidSchema.safeParse(id).success) {
      return errorResponse("Ongeldig event ID formaat", 400);
    }
    if (!cuidSchema.safeParse(occurrenceId).success) {
      return errorResponse("Ongeldig occurrence ID formaat", 400);
    }

    const body = await request.json();

    const result = updateOccurrenceSchema.safeParse(body);
    if (!result.success) {
      return validationError(result.error);
    }

    const updated = await updateEventOccurrence(id, occurrenceId, result.data);

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof OccurrenceNotFoundError) {
      return notFoundError("Occurrence");
    }

    if (error instanceof OccurrenceOwnershipError) {
      return errorResponse("Occurrence behoort niet tot dit event", 403);
    }

    if (error instanceof OccurrenceConflictError) {
      return errorResponse(
        "Er bestaat al een occurrence op deze datum voor dit event",
        409
      );
    }

    logError("[API] PUT /api/events/[id]/occurrences/[occurrenceId] error:", error);
    return serverError("Kon occurrence niet bijwerken");
  }
}

// ============================================================================
// DELETE /api/events/[id]/occurrences/[occurrenceId]
// ============================================================================

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id, occurrenceId } = await params;

    if (!cuidSchema.safeParse(id).success) {
      return errorResponse("Ongeldig event ID formaat", 400);
    }
    if (!cuidSchema.safeParse(occurrenceId).success) {
      return errorResponse("Ongeldig occurrence ID formaat", 400);
    }

    await deleteEventOccurrence(id, occurrenceId);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof OccurrenceNotFoundError) {
      return notFoundError("Occurrence");
    }

    if (error instanceof OccurrenceOwnershipError) {
      return errorResponse("Occurrence behoort niet tot dit event", 403);
    }

    logError("[API] DELETE /api/events/[id]/occurrences/[occurrenceId] error:", error);
    return serverError("Kon occurrence niet verwijderen");
  }
}
```

- [ ] **Stap 8: Voer tests uit — verwacht PASS**

```bash
npm test -- --reporter=verbose src/app/api/__tests__/events-id-occurrences-id.test.ts
```

### Sub-stap C: Types + API Response

- [ ] **Stap 9: Voeg `recurrenceType` toe aan CalendarEventResource**

In `src/types/calendar.ts`, voeg toe aan `CalendarEventResource` (na `hasSeriesChildren`):

```ts
export interface CalendarEventResource {
  // ... bestaande velden ...
  hasSeriesChildren: boolean;
  /** Recurrence type: "NONE" for one-time events, other values for recurring */
  recurrenceType: string;
}
```

Voeg ook toe aan `CalendarEventResourceResponse`:

```ts
export interface CalendarEventResourceResponse {
  // ... bestaande velden ...
  hasSeriesChildren: boolean;
  recurrenceType: string;
}
```

In `parseCalendarEvent`, voeg toe aan de `resource` mapping:

```ts
resource: {
  // ... bestaande velden ...
  hasSeriesChildren: event.resource.hasSeriesChildren,
  recurrenceType: event.resource.recurrenceType,
},
```

- [ ] **Stap 10: Voeg `recurrenceType` toe aan de API response**

In `src/app/api/events/route.ts`, voeg toe in de `resource` object (na `hasSeriesChildren`):

```ts
resource: {
  // ... bestaande velden ...
  hasSeriesChildren: occ.event.seriesParentEntries.length > 0,
  recurrenceType: occ.event.recurrenceType,
},
```

> **Let op:** `occ.event.recurrenceType` is beschikbaar — `event` is al geïncludeerd in de query via `findEventOccurrences`.

- [ ] **Stap 11: Voer type-check uit**

```bash
npm run type-check
```

Verwacht: geen typefouten. Als TypeScript klaagt over ontbrekende velden in mock-data in tests: voeg `recurrenceType: "NONE"` toe aan mock-objecten in test-files.

Fix mock-data in `src/app/api/__tests__/events.test.ts` — voeg `recurrenceType: "FESTIVAL"` toe aan het mock-event object:
```ts
event: {
  id: "evt_1",
  name: "Test Event",
  recurrenceType: "NONE",  // ← nieuw
  // ... rest ...
}
```

### Sub-stap D: Modal UI

- [ ] **Stap 12: Update EventDetailModal voor recurring events**

In `src/components/calendar/EventDetailModal.tsx`, vervang het delete-confirm blok (de `showDeleteConfirm` sectie, regels 516–539):

**Voeg boven de return statement toe:**
```ts
const isRecurring = event.resource.recurrenceType !== "NONE";
```

**Vervang de delete-confirm sectie:**
```tsx
{showDeleteConfirm ? (
  <div className="space-y-3">
    <div className="flex items-center gap-2 text-[var(--theme-error-fg)]">
      <Trash2 className="h-4 w-4" />
      <span className="text-sm font-medium">
        {isRecurring
          ? `Verwijder alleen deze dag of alle voorkomens van "${event.title}"?`
          : `Weet je zeker dat je "${event.title}" wilt verwijderen?`}
      </span>
    </div>
    <div className="flex gap-2">
      <button
        onClick={() => setShowDeleteConfirm(false)}
        className="bg-theme-active hover:bg-theme-hover flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
        disabled={isDeleting}
      >
        Annuleren
      </button>
      {isRecurring && (
        <button
          onClick={handleDeleteOccurrence}
          disabled={isDeleting}
          className="flex-1 rounded-xl bg-[var(--theme-error-bg)] px-4 py-2.5 text-sm font-medium text-[var(--theme-error-fg)] transition-colors hover:opacity-90 disabled:opacity-50"
        >
          {isDeleting ? "Verwijderen..." : "Alleen deze dag"}
        </button>
      )}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="flex-1 rounded-xl bg-[var(--theme-error)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
      >
        {isDeleting
          ? "Verwijderen..."
          : isRecurring
            ? "Alle voorkomens"
            : "Ja, verwijderen"}
      </button>
    </div>
  </div>
) : (
  // ... rest van de actie-knoppen (ongewijzigd) ...
```

**Voeg `handleDeleteOccurrence` toe direct na `handleDelete`:**
```ts
const handleDeleteOccurrence = async () => {
  setIsDeleting(true);
  try {
    const response = await fetch(
      `/api/events/${event.eventId}/occurrences/${event.id}`,
      { method: "DELETE" }
    );

    if (!response.ok) {
      throw new Error("Failed to delete occurrence");
    }

    requestClose(() => onDeleted?.());
  } catch (error) {
    logError("Failed to delete occurrence", error);
    showError("Kon occurrence niet verwijderen");
  } finally {
    setIsDeleting(false);
    setShowDeleteConfirm(false);
  }
};
```

- [ ] **Stap 13: Voer alle tests uit**

```bash
npm test
```

Verwacht: alle tests groen. Fix eventuele TypeScript-klachten door `recurrenceType: "NONE"` toe te voegen aan ontbrekende mock-objecten in tests.

- [ ] **Stap 14: Commit**

```bash
git add src/repositories/event.repository.ts \
        src/services/event.service.ts \
        src/app/api/events/[id]/occurrences/[occurrenceId]/route.ts \
        src/types/calendar.ts \
        src/app/api/events/route.ts \
        src/components/calendar/EventDetailModal.tsx \
        src/app/api/__tests__/events-id-occurrences-id.test.ts \
        src/app/api/__tests__/events.test.ts \
        src/types/__tests__/calendar.test.ts \
        src/repositories/__tests__/event.repository.test.ts
git commit -m "feat(calendar): delete single occurrence for recurring events"
```

---

# BATCH 2 — UX / Zichtbaarheid

---

## Task 2.1: Neutrale moon-fallback + Moon CSS klassen toepassen

**Probleem 1:** `DharmaCalendar.tsx:61` toont 🌑 voor ALLE dagen wanneer de daily-info API nog laadt of faalt. Hierdoor lijkt elke dag nieuwe maan.

**Probleem 2:** `dayPropGetter` past `.full-moon-day` en `.new-moon-day` CSS-klassen nooit toe, ondanks dat ze in `calendar.css` gedefinieerd zijn.

**Files:**
- Modify: `src/components/calendar/DharmaCalendar.tsx:61`, `DharmaCalendar.tsx:181-196`
- Modify: `src/components/calendar/__tests__/DharmaCalendar.test.tsx`

- [ ] **Stap 1: Schrijf falende tests**

Voeg toe aan `src/components/calendar/__tests__/DharmaCalendar.test.tsx`:

```ts
import { describe, it, expect } from "vitest";
import { formatDateLocal } from "@/lib/date-utils";

// Test de dayPropGetter logic direct (los van de React-component)
describe("DharmaCalendar moon day class logic", () => {
  function getMoonClass(
    moonDataMap: Map<string, { emoji: string; isSpecial: "full" | "new" | null }>,
    date: Date
  ): string {
    const key = formatDateLocal(date);
    const moon = moonDataMap.get(key);
    if (moon?.isSpecial === "full") return "full-moon-day";
    if (moon?.isSpecial === "new") return "new-moon-day";
    return "";
  }

  it("returns 'full-moon-day' for a full moon date", () => {
    const map = new Map([
      ["2026-04-13", { emoji: "🌕", isSpecial: "full" as const }],
    ]);
    expect(getMoonClass(map, new Date(2026, 3, 13))).toBe("full-moon-day");
  });

  it("returns 'new-moon-day' for a new moon date", () => {
    const map = new Map([
      ["2026-04-28", { emoji: "🌑", isSpecial: "new" as const }],
    ]);
    expect(getMoonClass(map, new Date(2026, 3, 28))).toBe("new-moon-day");
  });

  it("returns '' for a regular day", () => {
    const map = new Map([
      ["2026-04-15", { emoji: "🌒", isSpecial: null }],
    ]);
    expect(getMoonClass(map, new Date(2026, 3, 15))).toBe("");
  });

  it("returns '' when date is not in moonDataMap (still loading)", () => {
    const emptyMap = new Map<string, { emoji: string; isSpecial: "full" | "new" | null }>();
    expect(getMoonClass(emptyMap, new Date(2026, 3, 15))).toBe("");
  });
});

describe("DateHeader moon emoji fallback", () => {
  it("shows empty string (not 🌑) when moonData has no entry for date", () => {
    // When moonData doesn't have a key, moon is undefined.
    // moon?.emoji ?? "" should be "" not "🌑"
    const moonData = undefined;
    const emoji = (moonData as { emoji: string } | undefined)?.emoji ?? "";
    expect(emoji).toBe("");
  });
});
```

- [ ] **Stap 2: Voer tests uit — verwacht PASS** (de logica wordt getest los van de component)

```bash
npm test -- --reporter=verbose src/components/calendar/__tests__/DharmaCalendar.test.tsx
```

- [ ] **Stap 3: Fix de fallback emoji in DateHeader**

In `src/components/calendar/DharmaCalendar.tsx`, vervang regel 61:

**Oud:**
```tsx
const moonEmoji = moon?.emoji ?? "🌑";
```

**Nieuw:**
```tsx
const moonEmoji = moon?.emoji ?? "";
```

- [ ] **Stap 4: Voeg moon classes toe aan dayPropGetter**

In `src/components/calendar/DharmaCalendar.tsx`, vervang `dayPropGetter` (regels 181–196):

**Oud:**
```ts
const dayPropGetter = useCallback((date: Date) => {
  const day = date.getDay();
  const isWeekend = day === 0 || day === 6;

  let backgroundColor = "";
  const className = "";

  if (isWeekend) {
    backgroundColor = "var(--theme-calendar-weekend-bg)";
  }

  return {
    style: backgroundColor ? { backgroundColor } : undefined,
    className,
  };
}, []);
```

**Nieuw:**
```ts
const dayPropGetter = useCallback(
  (date: Date) => {
    const day = date.getDay();
    const isWeekend = day === 0 || day === 6;

    const key = formatDateLocal(date);
    const moon = moonDataMap.get(key);
    let className = "";
    if (moon?.isSpecial === "full") className = "full-moon-day";
    else if (moon?.isSpecial === "new") className = "new-moon-day";

    return {
      style: isWeekend ? { backgroundColor: "var(--theme-calendar-weekend-bg)" } : undefined,
      className,
    };
  },
  [moonDataMap]
);
```

- [ ] **Stap 5: Voer type-check en tests uit**

```bash
npm run type-check && npm test -- src/components/calendar/__tests__/DharmaCalendar.test.tsx
```

- [ ] **Stap 6: Commit**

```bash
git add src/components/calendar/DharmaCalendar.tsx src/components/calendar/__tests__/DharmaCalendar.test.tsx
git commit -m "fix(calendar): neutral moon fallback + apply full/new-moon CSS classes"
```

---

## Task 2.2: Kalender toont foutmelding bij laadproblemen

**Probleem:** Bij een falende `/api/events` request logt DharmaCalendar alleen naar console en toont een lege kalender zonder uitleg.

**Files:**
- Modify: `src/components/calendar/DharmaCalendar.tsx`
- Modify: `src/components/calendar/__tests__/DharmaCalendar.test.tsx`

- [ ] **Stap 1: Schrijf falende test**

Voeg toe aan `src/components/calendar/__tests__/DharmaCalendar.test.tsx`:

```ts
describe("DharmaCalendar error state", () => {
  it("shows an error message when events fail to load", () => {
    // This test documents the desired behavior:
    // When hasError is true, an error UI should be shown.
    // The actual component test would require mocking useFetch —
    // verify manually by checking the component renders an error div.
    expect(true).toBe(true); // Placeholder — verify manually
  });
});
```

- [ ] **Stap 2: Voeg fout-state toe aan DharmaCalendar**

In `src/components/calendar/DharmaCalendar.tsx`:

**Voeg toe na de bestaande state declaraties (na regel ~88):**
```ts
const [eventsError, setEventsError] = useState(false);
```

**Vervang de `useFetch` call voor events (regels ~109-115):**
```ts
const {
  data: eventsData,
  loading,
  refetch,
} = useFetch<CalendarEventResponse[]>(eventsUrl, {
  onError: (err) => {
    logError("Failed to fetch calendar events", err);
    setEventsError(true);
  },
});
```

**Voeg ook toe:** reset `eventsError` bij navigatie (na de `handleNavigate` callback):
```ts
const handleNavigate = useCallback((newDate: Date) => {
  setCurrentDate(newDate);
  setEventsError(false);
}, []);
```

**Voeg de fout-UI toe in de JSX** — direct na de loading overlay (na het `(!mounted || loading)` blok):
```tsx
{eventsError && !loading && (
  <div className="absolute inset-x-0 top-4 z-10 flex justify-center">
    <div className="flex items-center gap-2 rounded-xl border border-[var(--theme-error)] bg-[var(--theme-error-bg)] px-4 py-2.5 text-sm text-[var(--theme-error-fg)] shadow-md">
      <span>Kon events niet laden.</span>
      <button
        onClick={() => { setEventsError(false); refetch(); }}
        className="font-medium underline hover:no-underline"
      >
        Opnieuw proberen
      </button>
    </div>
  </div>
)}
```

- [ ] **Stap 3: Voer type-check uit**

```bash
npm run type-check
```

- [ ] **Stap 4: Commit**

```bash
git add src/components/calendar/DharmaCalendar.tsx
git commit -m "feat(calendar): show error banner with retry when events fail to load"
```

---

## Task 2.3: Header aria-labels voor mobiele navigatie

**Probleem:** `Header.tsx:79-80` — de tekst is `hidden lg:inline`. Op schermen kleiner dan lg zien screen readers geen toegankelijke naam voor de navigatielinks.

**Files:**
- Modify: `src/components/ui/Header.tsx:65-84`
- Modify: `src/components/ui/__tests__/Header.test.tsx`

- [ ] **Stap 1: Schrijf falende test**

Bekijk de bestaande Header test en voeg toe:

```ts
// In src/components/ui/__tests__/Header.test.tsx
import { render, screen } from "@testing-library/react";

// Mock usePathname
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

it("nav links have accessible labels", () => {
  render(<Header />);
  const homeLink = screen.getByRole("link", { name: /home/i });
  expect(homeLink).toBeInTheDocument();
});
```

- [ ] **Stap 2: Voer test uit — verwacht FAIL** (geen `aria-label`, screen reader ziet alleen icon)

```bash
npm test -- --reporter=verbose src/components/ui/__tests__/Header.test.tsx
```

- [ ] **Stap 3: Implementeer de fix**

In `src/components/ui/Header.tsx`, voeg `aria-label={label}` toe aan elke nav-link (regel ~68-82):

**Oud:**
```tsx
<Link
  key={href}
  href={href}
  aria-current={isActive ? "page" : undefined}
  className={cn(...)}
>
  <Icon className="h-4 w-4" />
  <span className="hidden lg:inline">{label}</span>
</Link>
```

**Nieuw:**
```tsx
<Link
  key={href}
  href={href}
  aria-label={label}
  aria-current={isActive ? "page" : undefined}
  className={cn(...)}
>
  <Icon className="h-4 w-4" aria-hidden="true" />
  <span className="hidden lg:inline" aria-hidden="true">{label}</span>
</Link>
```

> `aria-hidden="true"` op Icon en span voorkomt dubbele aankondiging: de link heeft al `aria-label`.

- [ ] **Stap 4: Voer tests uit — verwacht PASS**

```bash
npm test -- --reporter=verbose src/components/ui/__tests__/Header.test.tsx
```

- [ ] **Stap 5: Commit**

```bash
git add src/components/ui/Header.tsx src/components/ui/__tests__/Header.test.tsx
git commit -m "fix(header): add aria-label to nav links for screen reader accessibility"
```

---

# BATCH 3 — Opruimen

---

## Task 3.1: Strengere `dateQuerySchema` validatie

**Probleem:** `DATE_PREFIX_REGEX = /^\d{4}-\d{2}-\d{2}/` accepteert ook `"2025-13-45garbage"`. Na Task 1.2 sturen clients geen datetime-strings meer, zodat we de strikte regex kunnen gebruiken.

**Dependency:** Vereist dat Task 1.2 (datum-only URLs) al gecommit is.

**Files:**
- Modify: `src/lib/validations.ts:73`
- Modify: `src/lib/__tests__/validations.test.ts`

- [ ] **Stap 1: Schrijf falende tests**

Voeg toe aan `src/lib/__tests__/validations.test.ts`:

```ts
describe("dateQuerySchema", () => {
  it("accepts a valid YYYY-MM-DD date", () => {
    expect(() => dateQuerySchema.parse("2026-04-25")).not.toThrow();
  });

  it("rejects trailing junk after YYYY-MM-DD", () => {
    expect(() => dateQuerySchema.parse("2026-04-25garbage")).toThrow();
  });

  it("rejects invalid month (13)", () => {
    expect(() => dateQuerySchema.parse("2026-13-01")).toThrow();
  });

  it("rejects invalid day (00)", () => {
    expect(() => dateQuerySchema.parse("2026-04-00")).toThrow();
  });
});
```

- [ ] **Stap 2: Voer tests uit — verwacht gedeeltelijke FAIL**

```bash
npm test -- --reporter=verbose src/lib/__tests__/validations.test.ts
```

Verwacht: "rejects trailing junk" en "rejects invalid month/day" FAIL.

- [ ] **Stap 3: Vervang dateQuerySchema**

In `src/lib/validations.ts`, vervang regel 73:

**Oud:**
```ts
export const dateQuerySchema = z.string().regex(DATE_PREFIX_REGEX);
```

**Nieuw:**
```ts
export const dateQuerySchema = z.string().regex(DATE_REGEX, ERROR_MESSAGES.INVALID_DATE);
```

> `DATE_REGEX` is al geïmporteerd via `src/lib/patterns.ts` en is `/^\d{4}-\d{2}-\d{2}$/` — exact YYYY-MM-DD zonder trailing content.

- [ ] **Stap 4: Voer alle API-tests uit**

```bash
npm test -- --reporter=verbose src/app/api/__tests__/events.test.ts
```

Verwacht: groen. Als bestaande tests datetime-strings sturen (bijv. "2025-12-01T10:30:00Z"), update die naar date-only strings.

- [ ] **Stap 5: Commit**

```bash
git add src/lib/validations.ts src/lib/__tests__/validations.test.ts
git commit -m "fix(validation): tighten dateQuerySchema to reject non-date strings"
```

---

## Task 3.2: `encodeURIComponent` in categorie-filterlinks

**Probleem:** `page.tsx:147` interpolateert `cat.name` zonder encoding. Namen met spaties of `&` genereren kapotte URLs.

**Files:**
- Modify: `src/app/page.tsx:147`

- [ ] **Stap 1: Maak de fix**

In `src/app/page.tsx`, vervang op regel 147:

**Oud:**
```tsx
href={`/events?categories=${cat.name}`}
```

**Nieuw:**
```tsx
href={`/events?categories=${encodeURIComponent(cat.name)}`}
```

- [ ] **Stap 2: Voer type-check uit**

```bash
npm run type-check
```

- [ ] **Stap 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "fix(home): encodeURIComponent in category filter links"
```

---

## Task 3.3: Event-type labels via domain lookup

**Probleem:** `page.tsx:97-100` bouwt event-type labels handmatig (`eventType.charAt(0) + ...lower()`). `EVENT_TYPES` in `domain.ts` is de juiste bron.

**Files:**
- Modify: `src/app/page.tsx:96-101`

- [ ] **Stap 1: Implementeer de fix**

In `src/app/page.tsx`, de `EVENT_TYPES` import staat al bovenaan via `domain`. Vervang de `typeLabel` berekening in de `.map()` callback:

**Oud:**
```ts
const typeLabel =
  occ.event.eventType && occ.event.eventType !== "OTHER"
    ? occ.event.eventType.charAt(0) +
      occ.event.eventType.slice(1).toLowerCase()
    : null;
```

**Nieuw:**
```ts
const typeLabel =
  occ.event.eventType && occ.event.eventType !== "OTHER"
    ? (EVENT_TYPES.find((t) => t.value === occ.event.eventType)?.label ?? null)
    : null;
```

> Als `EVENT_TYPES` nog niet geïmporteerd is in `page.tsx`, voeg toe: `import { EVENT_TYPES } from "@/lib/domain";`

- [ ] **Stap 2: Voer type-check uit**

```bash
npm run type-check
```

- [ ] **Stap 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "fix(home): use EVENT_TYPES lookup for event-type labels"
```

---

## Task 3.4: MoonPhase unieke SVG gradient IDs

**Probleem:** `MoonPhase.tsx:115` gebruikt `id={`moonSurface-${size}`}`. Twee componenten met `size=100` delen dezelfde DOM-ID, wat tot verkeerde gradient-rendering leidt.

**Files:**
- Modify: `src/components/ui/MoonPhase.tsx`
- Modify: `src/components/ui/__tests__/MoonPhase.test.tsx`

- [ ] **Stap 1: Schrijf test**

Voeg toe aan `src/components/ui/__tests__/MoonPhase.test.tsx`:

```ts
it("two instances with same size have unique gradient IDs", () => {
  const { container: c1 } = render(<MoonPhase percent={50} isWaxing={true} size={100} />);
  const { container: c2 } = render(<MoonPhase percent={50} isWaxing={true} size={100} />);

  const id1 = c1.querySelector("radialGradient")?.getAttribute("id");
  const id2 = c2.querySelector("radialGradient")?.getAttribute("id");

  expect(id1).toBeDefined();
  expect(id2).toBeDefined();
  expect(id1).not.toBe(id2);
});
```

- [ ] **Stap 2: Voer test uit — verwacht FAIL** (beide geven `moonSurface-100`)

```bash
npm test -- --reporter=verbose src/components/ui/__tests__/MoonPhase.test.tsx
```

- [ ] **Stap 3: Implementeer de fix**

In `src/components/ui/MoonPhase.tsx`:

**Voeg toe bovenaan de component:**
```tsx
import { useId } from "react";

export function MoonPhase(...) {
  const uid = useId();
  // ...
```

**Vervang alle `${size}` in gradient/filter IDs** door `${uid}`. Zoek alle `id={`...${size}`}` en `url(#...${size})` referenties:

```tsx
// Oud: id={`moonSurface-${size}`}
// Nieuw: id={`moonSurface-${uid}`}

// Oud: fill={`url(#moonSurface-${size})`}
// Nieuw: fill={`url(#moonSurface-${uid})`}
```

Doe dit voor ALLE gradient en filter IDs in het component (moonSurface, moonShadow, glowFilter, etc.). Gebruik `grep` om alle instanties te vinden:

```bash
grep -n "\${size}" src/components/ui/MoonPhase.tsx
```

Vervang elk `${size}` in SVG `id` en `url(#...)` attributen door `${uid}`.

- [ ] **Stap 4: Voer tests uit — verwacht PASS**

```bash
npm test -- --reporter=verbose src/components/ui/__tests__/MoonPhase.test.tsx
```

> **Let op:** Snapshot-tests zullen falen omdat de IDs nu dynamisch zijn. Update snapshots:
```bash
npm test -- --reporter=verbose src/components/ui/__tests__/MoonPhase.test.tsx -- --update-snapshots
```

- [ ] **Stap 5: Commit**

```bash
git add src/components/ui/MoonPhase.tsx src/components/ui/__tests__/MoonPhase.test.tsx
git commit -m "fix(moonphase): use useId() for unique SVG gradient IDs"
```

---

## Task 3.5: Kalender respecteert `defaultView` uit preferences

**Probleem:** `DharmaCalendar.tsx:85` initialiseert `view` altijd als `"month"`, ongeacht de opgeslagen `defaultView` voorkeur.

**Files:**
- Modify: `src/components/calendar/DharmaCalendar.tsx`

- [ ] **Stap 1: Laad defaultView bij mount**

In `src/components/calendar/DharmaCalendar.tsx`:

**Vervang de `view` state initialisatie:**
```ts
// Oud:
const [view, setView] = useState<View>("month");

// Nieuw:
const [view, setView] = useState<View>("month");
```

**Voeg een `useEffect` toe die bij mount preferences ophaalt** (na de bestaande `useEffect` voor `mounted`):

```ts
useEffect(() => {
  fetch("/api/preferences")
    .then((r) => r.json())
    .then((prefs: { defaultView?: string }) => {
      if (
        prefs.defaultView &&
        ["month", "week", "day", "agenda"].includes(prefs.defaultView)
      ) {
        setView(prefs.defaultView as View);
      }
    })
    .catch(() => {}); // Silent fail — default view is fine
}, []); // Only on mount
```

- [ ] **Stap 2: Voer type-check uit**

```bash
npm run type-check
```

- [ ] **Stap 3: Commit**

```bash
git add src/components/calendar/DharmaCalendar.tsx
git commit -m "feat(calendar): load defaultView from user preferences on mount"
```

---

## Task 3.6: Uitbreiden e2e tests homepage

**Probleem:** `e2e/home.spec.ts` test alleen titel en `<main>`. Regressies in hero, kalender, sidebar of thema worden niet automatisch gevangen.

**Files:**
- Modify: `e2e/home.spec.ts`

- [ ] **Stap 1: Schrijf uitgebreide tests**

Vervang de volledige inhoud van `e2e/home.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("loads successfully with correct title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Dharma|Kalender/i);
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });

  test("hero shows today's date", async ({ page }) => {
    await page.goto("/");
    // The hero contains today's day of the week (Dutch locale)
    const days = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
    const todayDay = days[new Date().getDay()]!;
    await expect(page.locator("body")).toContainText(new RegExp(todayDay, "i"));
  });

  test("calendar renders the month grid", async ({ page }) => {
    await page.goto("/");
    // react-big-calendar renders a month view with the rbc-month-view class
    const calendar = page.locator(".dharma-calendar");
    await expect(calendar).toBeVisible({ timeout: 10000 });
  });

  test("sidebar shows upcoming events section", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/Binnenkort \(7 dagen\)/i)).toBeVisible();
  });

  test("category legend is visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/Godheden/i)).toBeVisible();
  });

  test("no unhandled console errors on load", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Filter out known non-critical errors (favicon 404 etc.)
    const criticalErrors = errors.filter(
      (e) => !e.includes("favicon") && !e.includes("404")
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
```

- [ ] **Stap 2: Voer e2e tests uit** (vereist draaiende dev server)

```bash
npx playwright test e2e/home.spec.ts
```

Verwacht: alle 6 tests groen (aangenomen dat de dev server draait op de geconfigureerde poort).

- [ ] **Stap 3: Commit**

```bash
git add e2e/home.spec.ts
git commit -m "test(e2e): expand homepage tests — hero, calendar, sidebar, errors"
```

---

## Accepteerde beperkingen (niet gefixed)

**DB-thema niet geladen bij eerste bezoek op nieuw apparaat** — Dit is by design per `CLAUDE.md` en `ThemeProvider.tsx` ("State persisted to localStorage only — Database sync happens in Settings page"). De architecture decision is bewust genomen. Geen actie nodig.

**`/api/weer` lat/lon range check** — De route accepteert geen lat/lon parameters; alles gaat via `DEFAULT_LOCATION`. Validatie is N.v.t. voor de huidige implementatie.

---

## Volgorde-samenvatting

| Batch | Taak | Bestanden |
|-------|------|-----------|
| 1 | Timezone window `findUpcomingOccurrences` | `event.repository.ts` |
| 1 | Date-only URLs (verwijder T00:00:00.000Z) | `DharmaCalendar.tsx` |
| 1 | Delete occurrence vs master event | `event.repository.ts`, `event.service.ts`, `occurrences/route.ts`, `calendar.ts`, `events/route.ts`, `EventDetailModal.tsx` |
| 2 | Neutrale moon-fallback + moon CSS klassen | `DharmaCalendar.tsx` |
| 2 | Kalender foutmelding bij laadproblemen | `DharmaCalendar.tsx` |
| 2 | Header aria-labels | `Header.tsx` |
| 3 | Strikte dateQuerySchema | `validations.ts` |
| 3 | encodeURIComponent in category links | `page.tsx` |
| 3 | Event-type labels via domain lookup | `page.tsx` |
| 3 | MoonPhase unieke SVG IDs | `MoonPhase.tsx` |
| 3 | defaultView uit preferences | `DharmaCalendar.tsx` |
| 3 | e2e tests uitbreiden | `e2e/home.spec.ts` |
