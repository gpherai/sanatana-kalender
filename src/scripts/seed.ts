// Dharma Calendar - Seed Script
// Run met: npm run db:seed
//
// Wat dit script doet (pure infrastructuur):
//   0. DailyInfo: Panchanga-data via Swiss Ephemeris (2025-2027)
//   1. Categories: upsert vanuit config/categories.ts
//   2. UserPreferences: aanmaken indien nog niet aanwezig
//
// Events worden NIET hier beheerd — gebruik:
//   npm run db:events      → sync EVENT_NAMING_CATALOG naar DB
//   npm run db:occurrences → genereer EventOccurrence records
//   npm run db:setup       → alles in één keer
import "dotenv/config";
import { prisma } from "@/lib/db";
import { CATEGORY_CATALOG } from "@/config/categories";
import { DEFAULT_LOCATION, DEFAULT_PREFERENCES_ID } from "@/lib/domain";
import { DEFAULT_THEME_NAME } from "@/config/themes";
import { panchangaService } from "@/services/panchanga.service";
import { parseCalendarDate } from "@/lib/date-utils";
import {
  convertTithiToEnum,
  getMoonPhaseType,
  mapNakshatraToEnum,
  convertMaasToEnum,
  convertSankrantiToEnum,
} from "@/scripts/seed-helpers";
import { DateTime } from "luxon";

async function main() {
  console.log("🌱 Seeding Dharma Calendar database...\n");

  // ============================================
  // 0. DAILY INFO (populate Panchanga data using Swiss Ephemeris)
  // ============================================
  console.log("🌙 Generating DailyInfo for 2025-2030...");

  const dailyInfoStart = DateTime.fromObject(
    { year: 2025, month: 1, day: 1 },
    { zone: DEFAULT_LOCATION.timezone }
  );
  const dailyInfoEnd = DateTime.fromObject(
    { year: 2030, month: 12, day: 31 },
    { zone: DEFAULT_LOCATION.timezone }
  );

  // Find the highest date already in the database to avoid recalculating existing data
  const latestRow = await prisma.dailyInfo.findFirst({
    orderBy: { date: "desc" },
    select: { date: true },
  });
  const latestDate = latestRow?.date
    ? DateTime.fromJSDate(latestRow.date, { zone: DEFAULT_LOCATION.timezone })
    : null;

  const forceReseed = process.env.FORCE_RESEED === "true";
  const needsFill = forceReseed || !latestDate || latestDate < dailyInfoEnd;

  if (needsFill) {
    // Start from day after the last existing record (unless forced full reseed)
    const fillFrom =
      forceReseed || !latestDate ? dailyInfoStart : latestDate.plus({ days: 1 });

    if (!forceReseed && latestDate) {
      console.log(
        `   Extending from ${fillFrom.toISODate()} to ${dailyInfoEnd.toISODate()}...`
      );
    } else {
      console.log("   Computing Panchanga data (Swiss Ephemeris)...");
    }

    let current = fillFrom;
    let insertedCount = 0;
    let errorCount = 0;
    const total = Math.ceil(dailyInfoEnd.diff(fillFrom, "days").days) + 1;

    while (current <= dailyInfoEnd) {
      try {
        const dateForLog = current.toISODate();

        // Calculate Panchanga using Swiss Ephemeris
        const panchanga = await panchangaService.calculateDaily(
          current.toJSDate(),
          DEFAULT_LOCATION,
          DEFAULT_LOCATION.timezone
        );

        // Map tithi to enum
        const tithiEnum = convertTithiToEnum(
          panchanga.tithi.number,
          panchanga.tithi.paksha
        );
        const nakshatraEnum = mapNakshatraToEnum(panchanga.nakshatra.number);
        // Paksha is stored independently (not gated by tithi mapping)
        const pakshaEnum = panchanga.tithi.paksha === "Shukla" ? "SHUKLA" : "KRISHNA";
        const moonPhaseType = getMoonPhaseType(
          Math.round(panchanga.moon.illuminationPct),
          panchanga.moon.waxing
        );
        // Convert maas to enum
        const maasEnum = panchanga.maas ? convertMaasToEnum(panchanga.maas.name) : null;

        // Upsert to database
        // Use parseCalendarDate to ensure UTC date storage (prevents -1 day offset)
        const dateForDb = parseCalendarDate(current.toISODate()!);
        await prisma.dailyInfo.upsert({
          where: { date: dateForDb },
          create: {
            date: dateForDb,
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
            // Solar transition (Sankranti)
            sankranti: panchanga.sankranti?.name
              ? convertSankrantiToEnum(panchanga.sankranti.name)
              : null,
            sankrantiTime: panchanga.sankranti?.time ?? null,
            // Drik Panchang extended fields
            maasType: panchanga.maas?.type ?? null,
            lunarDay: panchanga.maas?.lunarDay ?? null,
            vikramaSamvatYear: panchanga.vikramaSamvat?.year ?? null,
            vikramaSamvatName: panchanga.vikramaSamvat?.name ?? null,
            samvatsaraName: panchanga.samvatsara?.name ?? null,
            samvatsaraNumber: panchanga.samvatsara?.number ?? null,
            shakaSamvatYear: panchanga.shakaSamvat?.year ?? null,
            shakaSamvatName: panchanga.shakaSamvat?.name ?? null,
            sunSignNumber: panchanga.sunSign?.number ?? null,
            sunSignUpto: panchanga.sunSign?.uptoLocal ?? null,
            moonSignNumber: panchanga.moonSign?.number ?? null,
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
          },
          update: {
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
            // Solar transition (Sankranti)
            sankranti: panchanga.sankranti?.name
              ? convertSankrantiToEnum(panchanga.sankranti.name)
              : null,
            sankrantiTime: panchanga.sankranti?.time ?? null,
            // Drik Panchang extended fields
            maasType: panchanga.maas?.type ?? null,
            lunarDay: panchanga.maas?.lunarDay ?? null,
            vikramaSamvatYear: panchanga.vikramaSamvat?.year ?? null,
            vikramaSamvatName: panchanga.vikramaSamvat?.name ?? null,
            samvatsaraName: panchanga.samvatsara?.name ?? null,
            samvatsaraNumber: panchanga.samvatsara?.number ?? null,
            shakaSamvatYear: panchanga.shakaSamvat?.year ?? null,
            shakaSamvatName: panchanga.shakaSamvat?.name ?? null,
            sunSignNumber: panchanga.sunSign?.number ?? null,
            sunSignUpto: panchanga.sunSign?.uptoLocal ?? null,
            moonSignNumber: panchanga.moonSign?.number ?? null,
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
          },
        });

        insertedCount++;

        // Progress logging every 30 days
        if (insertedCount % 30 === 0) {
          const progress = ((insertedCount / total) * 100).toFixed(1);
          console.log(
            `   Progress: ${insertedCount}/${total} (${progress}%) - Last: ${dateForLog}`
          );
        }
      } catch (error) {
        console.error(`   ❌ Error for ${current.toISODate()}:`, error);
        errorCount++;
      }

      // Move to next day (Luxon handles DST correctly)
      current = current.plus({ days: 1 });
    }

    console.log(
      `   ✅ DailyInfo bijgevuld: ${insertedCount} dagen, ${errorCount} fouten`
    );

    if (errorCount > 0) {
      console.warn(`   ⚠️  ${errorCount} days failed - review errors above`);
    }
  } else {
    console.log(
      `   ℹ️  DailyInfo already up-to-date tot ${latestDate?.toISODate()}. Skipping.`
    );
    console.log(`      Use FORCE_RESEED=true to regenerate all.`);
  }

  // ============================================
  // 1. CATEGORIES (upsert from config)
  // ============================================
  console.log("📁 Seeding categories...");
  const categoryMap = new Map<string, string>();

  for (const cat of CATEGORY_CATALOG) {
    const result = await prisma.category.upsert({
      where: { name: cat.name },
      update: {
        displayName: cat.displayName,
        icon: cat.icon,
        color: cat.color,
        colorDark: cat.colorDark ?? null,
        sortOrder: cat.sortOrder,
        description: cat.description ?? null,
      },
      create: {
        name: cat.name,
        displayName: cat.displayName,
        icon: cat.icon,
        color: cat.color,
        colorDark: cat.colorDark ?? null,
        sortOrder: cat.sortOrder,
        description: cat.description ?? null,
      },
    });
    categoryMap.set(cat.name, result.id);
  }
  console.log(`   ✓ ${CATEGORY_CATALOG.length} categories`);

  // ============================================
  // 2. USER PREFERENCES (upsert single user)
  // ============================================
  console.log("⚙️  Seeding user preferences...");
  const existingPref = await prisma.userPreference.findFirst();
  if (!existingPref) {
    await prisma.userPreference.create({
      data: {
        id: DEFAULT_PREFERENCES_ID,
        currentTheme: DEFAULT_THEME_NAME,
        defaultView: "month",
        timezone: "Europe/Amsterdam",
        locationName: "Den Haag",
        locationLat: 52.0705,
        locationLon: 4.3007,
        visibleEventTypes: [],
        visibleCategories: [],
        notificationsEnabled: false,
        notificationDaysBefore: 1,
      },
    });
    console.log("   ✓ Created default preferences (Den Haag)");
  } else {
    console.log("   ⏭️  Preferences already exist, skipping");
  }

  // ============================================
  // 3. SUMMARY
  // ============================================
  console.log("\n📊 Database summary:");
  const counts = await Promise.all([
    prisma.category.count(),
    prisma.event.count(),
    prisma.eventOccurrence.count(),
    prisma.userPreference.count(),
  ]);
  console.log(`   Categories:    ${counts[0]}`);
  console.log(`   Events:        ${counts[1]}`);
  console.log(`   Occurrences:   ${counts[2]}`);
  console.log(`   Preferences:   ${counts[3]}`);

  console.log("\n✅ Seeding complete!");
  console.log(
    "   Volgende stap: npm run db:events && npm run db:occurrences -- --start 2026-01-01 --end 2030-12-31 --replace"
  );
  console.log("   Of alles in één keer: npm run db:setup\n");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
