/**
 * CLI Script: Generate Event Occurrences
 *
 * Generates EventOccurrence records for all events with recurrence rules.
 * This is the CLI equivalent of POST /api/events/generate-occurrences.
 * No running HTTP server required.
 *
 * Usage:
 *   npm run db:occurrences
 *   npm run db:occurrences -- --start 2025-01-01 --end 2027-12-31 --replace
 *
 * Options:
 *   --start   Start date (default: 2025-01-01)
 *   --end     End date   (default: 2027-12-31)
 *   --replace Delete existing occurrences in range before inserting (default: false)
 */

import "dotenv/config";
import { prisma } from "@/lib/db";
import { generateOccurrencesForEvents } from "@/services/recurrence.service";
import { DEFAULT_LOCATION } from "@/lib/domain";
import { parseCalendarDate } from "@/lib/date-utils";

// ---------------------------------------------------------------------------
// Parse CLI arguments
// ---------------------------------------------------------------------------

function getArg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

const startArg = getArg("start") ?? "2025-01-01";
const endArg = getArg("end") ?? "2027-12-31";
const replace = process.argv.includes("--replace");

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const startDate = parseCalendarDate(startArg);
  const endDate = parseCalendarDate(endArg);

  if (startDate > endDate) {
    console.error("❌  --start must be before --end");
    process.exit(1);
  }

  console.log(
    `🔄 Generating occurrences ${startArg} → ${endArg}${replace ? " (replace)" : ""}\n`
  );

  const events = await prisma.event.findMany({
    where: { recurrenceType: { not: "NONE" } },
  });

  if (events.length === 0) {
    console.log("⚠️  No events with recurrence found.");
    return;
  }

  console.log(`📋 Found ${events.length} events with recurrence rules`);

  const { results: occurrencesMap } = await generateOccurrencesForEvents(events, {
    startDate,
    endDate,
    location: DEFAULT_LOCATION,
    timezone: DEFAULT_LOCATION.timezone,
  });

  let totalDeleted = 0;
  let totalGenerated = 0;

  await prisma.$transaction(async (tx) => {
    for (const [eventId, occurrences] of occurrencesMap.entries()) {
      if (replace) {
        const deleted = await tx.eventOccurrence.deleteMany({
          where: { eventId, date: { gte: startDate, lte: endDate } },
        });
        totalDeleted += deleted.count;
      }

      if (occurrences.length > 0) {
        const inserted = await tx.eventOccurrence.createMany({
          data: occurrences.map((occ) => ({
            eventId,
            date: occ.date,
            endDate: occ.endDate,
            startTime: occ.startTime,
            endTime: occ.endTime,
            notes: occ.notes,
          })),
          skipDuplicates: true,
        });
        totalGenerated += inserted.count;
      }
    }
  });

  console.log(`\n${"=".repeat(60)}`);
  console.log(`📊 Summary:`);
  if (replace) console.log(`   Deleted:   ${totalDeleted}`);
  console.log(`   Generated: ${totalGenerated}`);
  console.log(`   Events:    ${events.length}`);
  console.log(`${"=".repeat(60)}\n`);
  console.log(`✅ Done!`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
