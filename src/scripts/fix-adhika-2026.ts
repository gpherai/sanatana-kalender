/**
 * Migration: Fix Adhika Month Maas Calculation
 *
 * Applies two corrections to the database:
 *
 * 1. Re-seeds DailyInfo for 2025-2027 using the corrected
 *    PanchangaSwissService (Amavasya-based maas naming).
 *    Previously, (sunSignIdx + 1) % 12 caused all months after
 *    Adhika Jyeshtha 2026 to be labeled one month too early.
 *
 * 2. Deletes all auto-generated EventOccurrences for 2025-2027
 *    and regenerates them from the corrected DailyInfo data.
 *    This also fixes Maha Shivaratri (maas was MAGHA, now PHALGUNA in seed.ts).
 *
 * Safe to re-run (idempotent upserts for DailyInfo, delete+insert for occurrences).
 *
 * Run: npx tsx src/scripts/fix-adhika-2026.ts
 */

import "dotenv/config";
import { DateTime } from "luxon";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { panchangaService } from "@/services/panchanga.service";
import { generateOccurrences } from "@/services/recurrence.service";
import { DEFAULT_LOCATION } from "@/lib/constants";
import { parseCalendarDate } from "@/lib/utils";
import {
  convertTithiToEnum,
  getMoonPhaseType,
  mapNakshatraToEnum,
  convertMaasToEnum,
  convertSankrantiToEnum,
} from "@/scripts/seed-helpers";

// =============================================================================
// CONFIG
// =============================================================================

const WINDOW_START = DateTime.fromObject(
  { year: 2025, month: 1, day: 1 },
  { zone: DEFAULT_LOCATION.timezone }
);
const WINDOW_END = DateTime.fromObject(
  { year: 2027, month: 12, day: 31 },
  { zone: DEFAULT_LOCATION.timezone }
);

// =============================================================================
// PHASE 1: RE-SEED DAILYINFO
// =============================================================================

async function reseedDailyInfo(): Promise<void> {
  const total = Math.ceil(WINDOW_END.diff(WINDOW_START, "days").days) + 1;

  console.log(
    `\n🌙 Phase 1: Re-seeding DailyInfo (${WINDOW_START.toISODate()} → ${WINDOW_END.toISODate()}, ${total} days)...`
  );

  // Clear the panchanga cache so we get fresh calculations with the fixed algorithm
  panchangaService.clearCache();

  let current = WINDOW_START;
  let inserted = 0;
  let errors = 0;

  while (current <= WINDOW_END) {
    const dateStr = current.toISODate()!;

    try {
      const panchanga = await panchangaService.calculateDaily(
        current.toJSDate(),
        DEFAULT_LOCATION,
        DEFAULT_LOCATION.timezone
      );

      const tithiEnum = convertTithiToEnum(
        panchanga.tithi.number,
        panchanga.tithi.paksha
      );
      const nakshatraEnum = mapNakshatraToEnum(panchanga.nakshatra.number);
      const pakshaEnum = panchanga.tithi.paksha === "Shukla" ? "SHUKLA" : "KRISHNA";
      const moonPhaseType = getMoonPhaseType(
        Math.round(panchanga.moon.illuminationPct),
        panchanga.moon.waxing
      );
      const maasEnum = panchanga.maas ? convertMaasToEnum(panchanga.maas.name) : null;

      const dateForDb = parseCalendarDate(dateStr);

      // Same upsert shape as seed.ts — single source of truth for field mapping
      const fields = {
        locationName: panchanga.location.name,
        locationLat: panchanga.location.lat,
        locationLon: panchanga.location.lon,
        sunrise: panchanga.sunriseLocal,
        sunset: panchanga.sunsetLocal,
        moonrise: panchanga.moonriseLocal ?? null,
        moonset: panchanga.moonsetLocal ?? null,
        moonPhasePercent: Math.round(panchanga.moon.illuminationPct),
        moonPhaseType: moonPhaseType,
        isWaxing: panchanga.moon.waxing,
        tithi: tithiEnum,
        tithiEndTime: panchanga.tithi.endLocal ?? null,
        nakshatra: nakshatraEnum,
        nakshatraEndTime: panchanga.nakshatra.endLocal ?? null,
        yogaName: panchanga.yoga.name,
        yogaEndTime: panchanga.yoga.endLocal ?? null,
        karanaName: panchanga.karana.name,
        karanaType: panchanga.karana.type,
        karanaEndTime: panchanga.karana.endLocal ?? null,
        paksha: pakshaEnum,
        maas: maasEnum,
        isAdhika: panchanga.maas?.isAdhika ?? false,
        sankranti: panchanga.sankranti?.name
          ? convertSankrantiToEnum(panchanga.sankranti.name)
          : null,
        sankrantiTime: panchanga.sankranti?.time ?? null,
        maasName: panchanga.maas?.name ?? null,
        maasType: panchanga.maas?.type ?? null,
        lunarDay: panchanga.maas?.lunarDay ?? null,
        vikramaSamvatYear: panchanga.vikramaSamvat?.year ?? null,
        vikramaSamvatName: panchanga.vikramaSamvat?.name ?? null,
        samvatsaraName: panchanga.samvatsara?.name ?? null,
        samvatsaraNumber: panchanga.samvatsara?.number ?? null,
        shakaSamvatYear: panchanga.shakaSamvat?.year ?? null,
        shakaSamvatName: panchanga.shakaSamvat?.name ?? null,
        sunSignNumber: panchanga.sunSign?.number ?? null,
        sunSignName: panchanga.sunSign?.name ?? null,
        sunSignUpto: panchanga.sunSign?.uptoLocal ?? null,
        moonSignNumber: panchanga.moonSign?.number ?? null,
        moonSignName: panchanga.moonSign?.name ?? null,
        moonSignUpto: panchanga.moonSign?.uptoLocal ?? null,
        daysSinceSankranti: panchanga.pravishte?.daysSinceSankranti ?? null,
        currentRashi: panchanga.pravishte?.currentRashi ?? null,
        lastSankrantiDate: panchanga.pravishte?.lastSankrantiDate
          ? parseCalendarDate(panchanga.pravishte.lastSankrantiDate)
          : null,
        nextTithiNumber: panchanga.nextTithi?.number ?? null,
        nextTithiName: panchanga.nextTithi?.name ?? null,
        nextTithiPaksha: panchanga.nextTithi?.paksha ?? null,
        nextTithiEndTime: panchanga.nextTithi?.endLocal ?? null,
        nextNakshatraNumber: panchanga.nextNakshatra?.number ?? null,
        nextNakshatraName: panchanga.nextNakshatra?.name ?? null,
        nextNakshatraPada: panchanga.nextNakshatra?.pada ?? null,
        nextNakshatraEndTime: panchanga.nextNakshatra?.endLocal ?? null,
        nextYogaNumber: panchanga.nextYoga?.number ?? null,
        nextYogaName: panchanga.nextYoga?.name ?? null,
        nextYogaEndTime: panchanga.nextYoga?.endLocal ?? null,
        nextKaranaNumber: panchanga.nextKarana?.number ?? null,
        nextKaranaName: panchanga.nextKarana?.name ?? null,
        nextKaranaType: panchanga.nextKarana?.type ?? null,
        nextKaranaEndTime: panchanga.nextKarana?.endLocal ?? null,
      };

      await prisma.dailyInfo.upsert({
        where: { date: dateForDb },
        create: { date: dateForDb, ...fields } as Prisma.DailyInfoUncheckedCreateInput,
        update: fields as Prisma.DailyInfoUncheckedUpdateInput,
      });

      inserted++;

      if (inserted % 30 === 0) {
        const pct = ((inserted / total) * 100).toFixed(1);
        console.log(`   ${inserted}/${total} (${pct}%) — last: ${dateStr}`);
      }
    } catch (err) {
      console.error(`   ❌ Error for ${dateStr}:`, err);
      errors++;
    }

    current = current.plus({ days: 1 });
  }

  console.log(`   ✅ DailyInfo: ${inserted} upserted, ${errors} errors`);
  if (errors > 0) {
    console.warn(`   ⚠️  ${errors} days failed — review errors above`);
  }
}

// =============================================================================
// PHASE 2: REGENERATE EVENT OCCURRENCES
// =============================================================================

async function regenerateOccurrences(): Promise<void> {
  const startDate = parseCalendarDate("2025-01-01");
  const endDate = parseCalendarDate("2027-12-31");

  console.log(`\n🔁 Phase 2: Regenerating EventOccurrences (2025-01-01 → 2027-12-31)...`);

  // Only process events with recurrence — NONE events have manual occurrences
  // that are owned by seed.ts or the user and must not be touched.
  const events = await prisma.event.findMany({
    where: { recurrenceType: { not: "NONE" } },
  });

  console.log(`   Found ${events.length} events with recurrence`);

  let totalDeleted = 0;
  let totalCreated = 0;

  for (const event of events) {
    // Delete stale occurrences in the window first (replace semantics)
    const deleted = await prisma.eventOccurrence.deleteMany({
      where: {
        eventId: event.id,
        date: { gte: startDate, lte: endDate },
      },
    });
    totalDeleted += deleted.count;

    // Regenerate from corrected DailyInfo
    let occurrences: Awaited<ReturnType<typeof generateOccurrences>> = [];
    try {
      occurrences = await generateOccurrences(event, {
        startDate,
        endDate,
        location: DEFAULT_LOCATION,
        timezone: DEFAULT_LOCATION.timezone,
      });
    } catch (err) {
      console.error(`   ❌ Failed to generate for "${event.name}":`, err);
      continue;
    }

    for (const occ of occurrences) {
      await prisma.eventOccurrence.create({
        data: {
          eventId: event.id,
          date: occ.date,
          endDate: occ.endDate ?? null,
          startTime: occ.startTime ?? null,
          endTime: occ.endTime ?? null,
          notes: occ.notes ?? null,
        },
      });
    }

    totalCreated += occurrences.length;
    console.log(`   ${event.name}: −${deleted.count} old / +${occurrences.length} new`);
  }

  console.log(`   ✅ Occurrences: ${totalDeleted} deleted, ${totalCreated} created`);
}

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {
  console.log("🔧 Migration: fix-adhika-2026");
  console.log("   Corrects DailyInfo maas labels affected by Adhika Jyeshtha 2026");
  console.log("   and fixes Maha Shivaratri (maas was MAGHA → now PHALGUNA)\n");

  const t0 = Date.now();

  await reseedDailyInfo();
  await regenerateOccurrences();

  const elapsed = ((Date.now() - t0) / 1000 / 60).toFixed(1);
  console.log(`\n✅ Migration complete in ${elapsed} min`);
  console.log(
    "\n   Verify results with:\n" +
      '   SELECT date, maas, tithi, "isAdhika" FROM "DailyInfo"\n' +
      "   WHERE date BETWEEN '2026-06-01' AND '2026-07-31'\n" +
      "   ORDER BY date;"
  );
}

main()
  .catch((err) => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
