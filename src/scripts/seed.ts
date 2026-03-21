// Dharma Calendar - Seed Script
// Run met: npm run db:seed
//
// Features:
// - Uses shared Prisma client from db.ts (DRY)
// - Uses upsert pattern (non-destructive)
// - Categories imported from config/categories.ts (single source of truth)
// - AUTO-GENERATES occurrences for events with recurrence (2025-2027)
// - Manual occurrences for NONE recurrence events
// - Default location: Den Haag
//
// ⚠️ IMPORTANT: After db:reset, ALWAYS regenerate occurrences via API:
//    POST /api/events/generate-occurrences with replace: true
//    See docs/DATABASE_PROCEDURES.md for complete procedure
//
// Note: Themes are NOT seeded - they live in src/config/themes.ts
import "dotenv/config";
import { prisma } from "@/lib/db";
import { CATEGORY_CATALOG } from "@/config/categories";
import { generateOccurrences } from "@/services/recurrence.service";
import { DEFAULT_LOCATION } from "@/lib/domain";
import { panchangaService } from "@/services/panchanga.service";
import { parseCalendarDate } from "@/lib/date-utils";
import {
  calendarDate,
  convertTithiToEnum,
  getMoonPhaseType,
  mapNakshatraToEnum,
  convertMaasToEnum,
  convertSankrantiToEnum,
} from "@/scripts/seed-helpers";
import { DateTime } from "luxon";
import type {
  Tithi,
  Nakshatra,
  Maas,
  Importance,
  EventType,
  RecurrenceType,
} from "@prisma/client";

// Event interface for type safety
interface EventData {
  name: string;
  description: string;
  eventType: EventType;
  recurrenceType: RecurrenceType;
  importance: Importance;
  categoryName: string; // Will be resolved to categoryId
  tithi?: Tithi;
  nakshatra?: Nakshatra;
  maas?: Maas;
  tags: string[];
  /** Traditional observation time window (HH:MM, 24h). Only for events with fixed times. */
  startTime?: string;
  endTime?: string;
  // Optional: For NONE recurrence or seed dates for solar events
  occurrences?: Array<{ date: Date; endDate?: Date; notes?: string }>;
}

async function main() {
  console.log("🌱 Seeding Dharma Calendar database...\n");

  // ============================================
  // 0. DAILY INFO (populate Panchanga data using Swiss Ephemeris)
  // ============================================
  console.log("🌙 Generating DailyInfo for 2025-2027...");

  const dailyInfoStart = DateTime.fromObject(
    { year: 2025, month: 1, day: 1 },
    { zone: DEFAULT_LOCATION.timezone }
  );
  const dailyInfoEnd = DateTime.fromObject(
    { year: 2027, month: 12, day: 31 },
    { zone: DEFAULT_LOCATION.timezone }
  );

  // Check if we already have data
  const existingDailyInfo = await prisma.dailyInfo.count({
    where: {
      date: {
        gte: dailyInfoStart.toJSDate(),
        lte: dailyInfoEnd.toJSDate(),
      },
    },
  });

  if (existingDailyInfo === 0 || process.env.FORCE_RESEED === "true") {
    console.log("   Computing Panchanga data (Swiss Ephemeris)...");

    let current = dailyInfoStart;
    let insertedCount = 0;
    let errorCount = 0;
    const total = Math.ceil(dailyInfoEnd.diff(dailyInfoStart, "days").days) + 1;

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

    console.log(`   ✅ DailyInfo seeded: ${insertedCount} days, ${errorCount} errors`);

    if (errorCount > 0) {
      console.warn(`   ⚠️  ${errorCount} days failed - review errors above`);
    }
  } else {
    console.log(
      `   ℹ️  DailyInfo already exists (${existingDailyInfo} records). Skipping.`
    );
    console.log(`      Use FORCE_RESEED=true to regenerate.`);
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
        sortOrder: cat.sortOrder,
        description: cat.description ?? null,
      },
      create: {
        name: cat.name,
        displayName: cat.displayName,
        icon: cat.icon,
        color: cat.color,
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
        id: "default", // ← FIX: Use consistent "default" ID across app
        currentTheme: "spiritual-minimal",
        defaultView: "month",
        weekStartsOn: 1, // Monday
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
  // 3. EVENTS (upsert by unique name)
  // ============================================
  console.log("📅 Seeding events...");

  const events: EventData[] = [
    // ==========================================
    // MAJOR FESTIVALS 2025
    // ==========================================
    {
      name: "Maha Shivaratri",
      description:
        "De grote nacht van Shiva. Bhakta's (devotees) houden een vrat (vasten) en blijven de hele nacht wakker ter ere van Heer Shiva. Er worden speciale abhishekam rituelen uitgevoerd met melk, honing en bilvabladeren.",
      eventType: "FESTIVAL",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MAJOR",
      categoryName: "shiva",
      tithi: "CHATURDASHI_KRISHNA",
      maas: "PHALGUNA",
      tags: ["abhishekam", "nachtelijk", "shiva", "vasten"],
    },
    {
      name: "Holi",
      description:
        "Het festival van kleuren. Viert de overwinning van goed over kwaad en de komst van de lente. De avond ervoor wordt Holika Dahan gevierd met een ritueel vreugdevuur.",
      eventType: "FESTIVAL",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MAJOR",
      categoryName: "krishna",
      tithi: "PURNIMA",
      maas: "PHALGUNA",
      tags: ["holika", "kleuren", "lente", "vishnu"],
    },
    {
      name: "Ram Navami",
      description:
        "Verschijningsdag van Heer Rama, de zevende avatar van Vishnu. Wordt gevierd met bhajans, het lezen van de Ramayana en het aanbieden van prasad in tempels.",
      eventType: "JAYANTI",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MAJOR",
      categoryName: "rama",
      tithi: "NAVAMI_SHUKLA",
      maas: "CHAITRA",
      tags: ["avatar", "geboorte", "rama", "ramayana"],
    },
    {
      name: "Hanuman Jayanti",
      description:
        "Verschijningsdag van Heer Hanuman, de trouwe dienaar van Heer Rama. Bhakta's bezoeken tempels en reciteren de Hanuman Chalisa en Sundara Kanda.",
      eventType: "JAYANTI",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MAJOR",
      categoryName: "hanuman",
      tithi: "PURNIMA",
      maas: "CHAITRA",
      tags: ["chalisa", "geboorte", "hanuman", "sundara kanda"],
    },
    {
      name: "Akshaya Tritiya",
      description:
        "Een van de meest gunstige dagen in de Hindu kalender. Elke goede daad, dana, of japa verricht op deze dag geeft onvergankelijke (akshaya) verdienste.",
      eventType: "TITHI",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MAJOR",
      categoryName: "vishnu",
      tithi: "TRITIYA_SHUKLA",
      maas: "VAISHAKHA",
      tags: ["akshaya", "dana", "goud", "gunstig"],
    },
    {
      name: "Guru Purnima",
      description:
        "Dag ter ere van spirituele leraren (guru's). Traditioneel de geboortedag van Ved Vyasa, de auteur van de Mahabharata. Studenten drukken dankbaarheid uit aan hun leraren.",
      eventType: "PUJA",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MAJOR",
      categoryName: "vishnu",
      tithi: "PURNIMA",
      maas: "ASHADHA",
      tags: ["dankbaarheid", "guru", "onderwijs", "vyasa"],
    },
    {
      name: "Raksha Bandhan",
      description:
        "Festival van de broeder-zuster band. Zussen binden een rakhi (beschermende draad) om de pols van hun broers, die beloven hen te beschermen.",
      eventType: "FESTIVAL",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MAJOR",
      categoryName: "general",
      tithi: "PURNIMA",
      maas: "SHRAVANA",
      tags: ["bescherming", "broer", "rakhi", "zus"],
    },
    {
      name: "Krishna Janmashtami",
      description:
        "Verschijningsdag van Heer Krishna. Wordt gevierd met een vrat (vasten) tot middernacht (het geboorte-moment), gevolgd door aarti, bhajans en het breken van de vasten met prasad.",
      eventType: "JAYANTI",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MAJOR",
      categoryName: "krishna",
      tithi: "ASHTAMI_KRISHNA",
      maas: "SHRAVANA",
      tags: ["dahi handi", "geboorte", "krishna", "middernacht"],
    },
    {
      name: "Ganesh Chaturthi",
      description:
        "Verschijningsdag van Heer Ganesha, de god van wijsheid en nieuw begin. Tien dagen van festiviteiten met dagelijkse puja's, eindigend met visarjan (onderdompeling) op Anant Chaturdashi.",
      eventType: "FESTIVAL",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MAJOR",
      categoryName: "ganesha",
      tithi: "CHATURTHI_SHUKLA",
      maas: "BHADRAPADA",
      tags: ["ganesha", "geboorte", "modak", "visarjan"],
    },
    {
      name: "Navaratri",
      description:
        "Negen nachten gewijd aan Godin Durga in haar negen vormen. Elke dag heeft een specifieke kleur en vorm van de Devi. Wordt afgesloten met Vijayadashami (Dussehra).",
      eventType: "FESTIVAL",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MAJOR",
      categoryName: "durga",
      tithi: "PRATIPADA_SHUKLA",
      maas: "ASHWIN",
      tags: ["dandiya", "devi", "durga", "garba", "negen nachten"],
    },
    {
      name: "Dussehra (Vijayadashami)",
      description:
        "Overwinning van Heer Rama op Ravana en van Godin Durga op Mahishasura. Symboliseert de triomf van goed over kwaad. Ravana-effigie's worden verbrand.",
      eventType: "FESTIVAL",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MAJOR",
      categoryName: "rama",
      tithi: "DASHAMI_SHUKLA",
      maas: "ASHWIN",
      tags: ["durga", "overwinning", "rama", "ravana"],
    },
    {
      name: "Diwali",
      description:
        "Het festival van lichten. Viert de terugkeer van Heer Rama naar Ayodhya na 14 jaar ballingschap. Huizen worden verlicht met diyas en er wordt Lakshmi puja gedaan voor welvaart.",
      eventType: "FESTIVAL",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MAJOR",
      categoryName: "lakshmi",
      tithi: "AMAVASYA",
      maas: "KARTIK",
      tags: ["diyas", "lakshmi", "lichten", "rama", "welvaart"],
    },

    // ==========================================
    // DECEMBER 2025 EVENTS
    // ==========================================
    {
      name: "Karthigai Deepam",
      description:
        "Tamil festival van lichten gevierd in de maand Karthigai. Huizen worden verlicht met olielampen (kuthuvilakku). In Tiruvannamalai wordt een enorm vuur ontstoken op de Arunachala berg.",
      eventType: "FESTIVAL",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MAJOR",
      categoryName: "shiva",
      tithi: "PURNIMA",
      maas: "KARTIK",
      tags: ["arunachala", "deepam", "lichten", "tamil", "tiruvannamalai"],
    },
    {
      name: "Gita Jayanti",
      description:
        "Viert de dag waarop Lord Krishna de Bhagavad Gita onderwees aan Arjuna op het slagveld van Kurukshetra. Er worden speciale lezingen en recitaties van de Gita gehouden.",
      eventType: "JAYANTI",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MAJOR",
      categoryName: "krishna",
      tithi: "EKADASHI_SHUKLA",
      maas: "MARGASHIRSHA",
      tags: ["arjuna", "filosofie", "gita", "krishna", "kurukshetra"],
    },
    {
      name: "Vaikunta Ekadashi",
      description:
        "De meest heilige Ekadashi, ook bekend als Mukkoti Ekadashi. Het wordt geloofd dat de poorten van Vaikunta (Vishnu's verblijf) op deze dag opengaan. Zeer belangrijk in Zuid-India.",
      eventType: "VRAT",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MAJOR",
      categoryName: "vishnu",
      tithi: "EKADASHI_SHUKLA",
      maas: "MARGASHIRSHA",
      tags: ["ekadashi", "moksha", "poort", "vaikunta", "vishnu"],
    },
    {
      name: "Dattatreya Jayanti",
      description:
        "Geboortedag van Lord Dattatreya, een samensmelting van Brahma, Vishnu en Shiva. Hij is de adi-guru (eerste leraar) en wordt vereerd door zowel Shaiva als Vaishnava tradities.",
      eventType: "JAYANTI",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MODERATE",
      categoryName: "dattatreya",
      tithi: "PURNIMA",
      maas: "MARGASHIRSHA",
      tags: ["avadhuta", "dattatreya", "guru", "trimurti"],
    },
    {
      name: "Akhuratha Sankashti Chaturthi",
      description:
        "Maandelijkse Chaturthi gewijd aan Lord Ganesha. Devotees vasten en breken het vasten na het zien van de maan. December's Sankashti wordt Akhuratha genoemd.",
      eventType: "VRAT",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MINOR",
      categoryName: "ganesha",
      tithi: "CHATURTHI_KRISHNA",
      maas: "MARGASHIRSHA",
      tags: ["chaturthi", "ganesha", "maandag vasten", "sankashti"],
    },
    {
      name: "Saphala Ekadashi",
      description:
        "Betekent 'vruchtbaar/succesvol'. Het vasten op deze dag brengt succes in alle ondernemingen en helpt spirituele vooruitgang. Valt in de Krishna paksha van Pausha maand.",
      eventType: "VRAT",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MODERATE",
      categoryName: "vishnu",
      tithi: "EKADASHI_KRISHNA",
      maas: "PAUSHA",
      tags: ["ekadashi", "succes", "vasten", "vruchten"],
    },
    {
      name: "Amavasya - December",
      description:
        "Nieuwe maan dag. Traditioneel een dag voor pitru tarpan (voorouder verering) en introspectie. Gunstig voor meditatie en spirituele praktijken.",
      eventType: "TITHI",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MINOR",
      categoryName: "general",
      tithi: "AMAVASYA",
      maas: "PAUSHA",
      tags: ["amavasya", "meditatie", "nieuwe maan", "voorouders"],
    },

    // ==========================================
    // JANUARY 2026 EVENTS
    // ==========================================
    {
      name: "Putrada Ekadashi",
      description:
        "Ekadashi in Pausha Shukla paksha. Het vasten op deze dag wordt geloofd zonen te schenken aan degenen die ernaar verlangen. Ook gunstig voor algemene voorspoed.",
      eventType: "VRAT",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MODERATE",
      categoryName: "vishnu",
      tithi: "EKADASHI_SHUKLA",
      maas: "PAUSHA",
      tags: ["ekadashi", "kinderen", "vasten", "zegen"],
    },
    {
      name: "Pausha Purnima",
      description:
        "Volle maan in Pausha maand. Een gunstige dag voor rituele baden, dana (liefdadigheid), en spirituele praktijken. Markeert het midden van de winter.",
      eventType: "TITHI",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MODERATE",
      categoryName: "vishnu",
      tithi: "PURNIMA",
      maas: "PAUSHA",
      tags: ["baden", "liefdadigheid", "purnima", "volle maan"],
    },
    {
      name: "Thai Pongal",
      description:
        "Tamil oogstfestival dat de zonnewende viert. Pongal (zoete rijst) wordt gekookt tot het overkookt als teken van overvloed. Valt samen met Makar Sankranti.",
      eventType: "FESTIVAL",
      recurrenceType: "YEARLY_SOLAR",
      importance: "MAJOR",
      categoryName: "surya",
      tags: ["oogst", "overvloed", "pongal", "tamil", "zon"],
      occurrences: [
        {
          date: calendarDate(2026, 1, 14),
          endDate: calendarDate(2026, 1, 17),
          notes: "Bhogi (14), Thai Pongal (15), Mattu Pongal (16), Kaanum Pongal (17)",
        },
      ],
    },

    // ==========================================
    // 2025 PUJA'S & JAYANTI'S
    // ==========================================
    {
      name: "Vasant Panchami (Saraswati Puja)",
      description:
        "Geboortedag van Goddess Saraswati, godin van kennis, muziek en kunst. Studenten vereren boeken en muziekinstrumenten. Gele kleding wordt gedragen als symbool van de lente.",
      eventType: "PUJA",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MODERATE",
      categoryName: "saraswati",
      tithi: "PANCHAMI_SHUKLA",
      maas: "MAGHA",
      tags: ["geel", "kennis", "lente", "muziek", "saraswati"],
    },
    {
      name: "Varuthini Ekadashi",
      description:
        "Een belangrijke Ekadashi in Vaishakha maand. Het vasten op deze dag wordt gezegd alle zonden weg te nemen en moksha te bevorderen.",
      eventType: "VRAT",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MODERATE",
      categoryName: "vishnu",
      tithi: "EKADASHI_KRISHNA",
      maas: "VAISHAKHA",
      tags: ["ekadashi", "moksha", "vasten", "vishnu"],
    },
    {
      name: "Narasimha Jayanti",
      description:
        "Geboortedag van Lord Narasimha, de half-mens half-leeuw avatar van Vishnu. Hij versloeg de demon Hiranyakashipu om zijn devotee Prahlada te beschermen.",
      eventType: "JAYANTI",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MODERATE",
      categoryName: "narasimha",
      tithi: "CHATURDASHI_SHUKLA",
      maas: "VAISHAKHA",
      tags: ["avatar", "bescherming", "narasimha", "prahlada"],
    },
    {
      name: "Shani Jayanti",
      description:
        "Geboortedag van Shani Dev (Saturnus). Devotees aanbidden Shani om negatieve effecten van Saturnus in hun horoscoop te verminderen. Til (sesam) olie wordt geofferd.",
      eventType: "JAYANTI",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MINOR",
      categoryName: "general",
      tithi: "AMAVASYA",
      maas: "JYESHTHA",
      tags: ["graha", "saturnus", "shani", "til"],
    },
    {
      name: "Jagannath Rath Yatra",
      description:
        "Jaarlijkse processie van Lord Jagannath, Balabhadra en Subhadra in Puri. De deities worden op enorme houten wagens (ratha's) door de straten getrokken.",
      eventType: "FESTIVAL",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MAJOR",
      categoryName: "vishnu",
      tithi: "DWITIYA_SHUKLA",
      maas: "ASHADHA",
      tags: ["jagannath", "processie", "puri", "ratha"],
    },
    {
      name: "Karwa Chauth",
      description:
        "Vastendag voor gehuwde vrouwen die vasten voor het lange leven van hun echtgenoten. Het vasten wordt gebroken na het zien van de maan door een zeef.",
      eventType: "VRAT",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MODERATE",
      categoryName: "durga",
      tithi: "CHATURTHI_KRISHNA",
      maas: "KARTIK",
      tags: ["huwelijk", "maan", "vasten", "vrouwen"],
    },
    {
      name: "Tulsi Vivah",
      description:
        "Ceremonieel huwelijk van de Tulsi plant met Lord Vishnu (als Shaligram). Markeert het einde van Chaturmas en het begin van het huwelijksseizoen.",
      eventType: "PUJA",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MODERATE",
      categoryName: "vishnu",
      tithi: "DWADASHI_SHUKLA",
      maas: "KARTIK",
      tags: ["huwelijk", "shaligram", "tulsi", "vishnu"],
    },

    // ==========================================
    // EKADASHI VRATS 2025 (Full year)
    // ==========================================
    {
      name: "Sat-tila Ekadashi",
      description:
        "Ekadashi in Magha maand. Het offeren van til (sesam) in zeven vormen (sapta-tila) is traditioneel op deze dag voor het zuiveren van zonden.",
      eventType: "VRAT",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MODERATE",
      categoryName: "vishnu",
      tithi: "EKADASHI_KRISHNA",
      maas: "MAGHA",
      tags: ["ekadashi", "sesam", "til", "vasten"],
    },
    {
      name: "Jaya Ekadashi",
      description:
        "Deze Ekadashi valt in Magha Shukla paksha. Het vasten bevrijdt van onwetendheid en brengt spirituele overwinning (jaya).",
      eventType: "VRAT",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MODERATE",
      categoryName: "vishnu",
      tithi: "EKADASHI_SHUKLA",
      maas: "MAGHA",
      tags: ["ekadashi", "overwinning", "vasten", "vishnu"],
    },
    {
      name: "Vijaya Ekadashi",
      description:
        "Ekadashi voor spirituele overwinning. Lord Rama vastte op deze dag voordat hij naar Lanka ging om Sita te redden.",
      eventType: "VRAT",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MODERATE",
      categoryName: "vishnu",
      tithi: "EKADASHI_KRISHNA",
      maas: "PHALGUNA",
      tags: ["ekadashi", "overwinning", "rama", "vasten"],
    },
    {
      name: "Amalaki Ekadashi",
      description:
        "Ekadashi gewijd aan de amalaki (amla) boom, heilig voor Lord Vishnu. Het vasten rond een amalaki boom brengt grote verdienste.",
      eventType: "VRAT",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MODERATE",
      categoryName: "vishnu",
      tithi: "EKADASHI_SHUKLA",
      maas: "PHALGUNA",
      tags: ["amla", "ekadashi", "vasten", "vishnu"],
    },
    {
      name: "Papmochani Ekadashi",
      description:
        "Betekent 'verwijderaar van zonden'. Een krachtige Ekadashi die alle papa (zonden) uit verleden levens kan zuiveren.",
      eventType: "VRAT",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MODERATE",
      categoryName: "vishnu",
      tithi: "EKADASHI_KRISHNA",
      maas: "CHAITRA",
      tags: ["ekadashi", "vasten", "zonden", "zuivering"],
    },
    {
      name: "Kamada Ekadashi",
      description:
        "Ekadashi die alle wensen (kama) vervult. Het verhaal vertelt van een Gandharva die door dit vasten van een vloek werd bevrijd.",
      eventType: "VRAT",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MODERATE",
      categoryName: "vishnu",
      tithi: "EKADASHI_SHUKLA",
      maas: "CHAITRA",
      tags: ["ekadashi", "vasten", "verlossing", "wensen"],
    },
    {
      name: "Devshayani Ekadashi",
      description:
        "Begin van Chaturmas, de vier maanden waarin Lord Vishnu slaapt. Geen huwelijken of nieuwe ondernemingen worden gestart tot Prabodhini Ekadashi.",
      eventType: "VRAT",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MAJOR",
      categoryName: "vishnu",
      tithi: "EKADASHI_SHUKLA",
      maas: "ASHADHA",
      tags: ["chaturmas", "ekadashi", "vasten", "vishnu slaapt"],
    },
    {
      name: "Prabodhini Ekadashi (Dev Uthani)",
      description:
        "Lord Vishnu ontwaakt uit zijn vier maanden slaap. Dit markeert het einde van Chaturmas en het begin van het huwelijksseizoen.",
      eventType: "VRAT",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MAJOR",
      categoryName: "vishnu",
      tithi: "EKADASHI_SHUKLA",
      maas: "KARTIK",
      tags: ["ekadashi", "huwelijksseizoen", "vasten", "vishnu ontwaakt"],
    },
    {
      name: "Mokshada Ekadashi",
      description:
        "Ekadashi voor moksha (bevrijding). Valt samen met Gita Jayanti. Het luisteren naar en reciteren van de Bhagavad Gita is bijzonder verdienstelijk.",
      eventType: "VRAT",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MAJOR",
      categoryName: "vishnu",
      tithi: "EKADASHI_SHUKLA",
      maas: "MARGASHIRSHA",
      tags: ["bevrijding", "ekadashi", "gita", "moksha", "vasten"],
    },

    // ==========================================
    // SANKRANTI & SOLAR EVENTS
    // (Makar Sankranti en alle andere Sankrantis worden beheerd via
    //  event-naming.ts + generate-events-from-naming.ts script)
    // ==========================================
    {
      name: "Pongal",
      description:
        "Tamil oogstfestival van vier dagen. Pongal (zoete rijstpudding) wordt gekookt tot het overkookt als symbool van overvloed. Koeien worden versierd en geëerd.",
      eventType: "FESTIVAL",
      recurrenceType: "YEARLY_SOLAR",
      importance: "MAJOR",
      categoryName: "surya",
      tags: ["koeien", "oogst", "overvloed", "rijst", "tamil"],
      occurrences: [
        {
          date: calendarDate(2025, 1, 14),
          endDate: calendarDate(2025, 1, 17),
          notes: "Bhogi (14), Thai Pongal (15), Mattu Pongal (16), Kaanum Pongal (17)",
        },
      ],
    },

    // ==========================================
    // GANESHA FESTIVALS & CHATURTHI'S
    // ==========================================
    {
      name: "Ganesh Jayanti",
      description:
        "Geboortedag van Lord Ganesha volgens de Magha traditie. Wordt gevierd op Shukla Chaturthi in de Magha maand. Devotees vasten, voeren puja's uit en bieden modak en durva gras aan.",
      eventType: "JAYANTI",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MAJOR",
      categoryName: "ganesha",
      tithi: "CHATURTHI_SHUKLA",
      maas: "MAGHA",
      tags: ["durva", "ganesha", "geboorte", "jayanti", "modak"],
    },
    {
      name: "Sakat Chauth (Sankashti)",
      description:
        "Ook bekend als Tilkut Chauth of Lambodara Sankashti. Eerste Sankashti Chaturthi van het jaar. Devotees vasten tot maanzicht en bieden til (sesam) laddoos aan Ganesha.",
      eventType: "VRAT",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MODERATE",
      categoryName: "ganesha",
      tithi: "CHATURTHI_KRISHNA",
      maas: "MAGHA",
      tags: ["ganesha", "sakat", "sankashti", "tilkut", "vasten"],
    },
    {
      name: "Angaraki Sankashti Chaturthi",
      description:
        "De meest gunstige Sankashti Chaturthi - wanneer deze op dinsdag (Mangalvar) valt. Dinsdag is de dag van Hanuman en Mars, wat de kracht van het vasten versterkt.",
      eventType: "VRAT",
      recurrenceType: "NONE", // Must be manual: occurs when K.C. falls on Tuesday (weekday constraint)
      importance: "MAJOR",
      categoryName: "ganesha",
      tithi: "CHATURTHI_KRISHNA",
      tags: ["angaraki", "dinsdag", "ganesha", "mangalvar", "sankashti"],
      occurrences: [
        {
          date: calendarDate(2025, 4, 15),
          notes: "Angaraki Sankashti - dinsdag, extra gunstig",
        },
        {
          date: calendarDate(2025, 9, 9),
          notes: "Angaraki Sankashti - dinsdag",
        },
        {
          date: calendarDate(2026, 3, 31),
          notes: "Angaraki Sankashti - dinsdag",
        },
        {
          date: calendarDate(2026, 8, 25),
          notes: "Angaraki Sankashti - dinsdag",
        },
      ],
    },
    {
      name: "Vinayaka Chaturthi (Maandelijks)",
      description:
        "Maandelijkse viering op Shukla Paksha Chaturthi. Gunstig voor het starten van nieuwe ondernemingen, studies en belangrijke beslissingen. Ganesha wordt aangeroepen als Vighnaharta.",
      eventType: "PUJA",
      recurrenceType: "MONTHLY_LUNAR",
      importance: "MINOR",
      categoryName: "ganesha",
      tithi: "CHATURTHI_SHUKLA",
      tags: ["chaturthi", "ganesha", "maandelijks", "nieuw begin", "vinayaka"],
      occurrences: [
        { date: calendarDate(2025, 1, 3), notes: "Eerste Vinayaka Chaturthi 2025" },
        { date: calendarDate(2025, 2, 1) },
        { date: calendarDate(2025, 3, 3) },
        { date: calendarDate(2025, 4, 1) },
        { date: calendarDate(2025, 5, 1) },
        { date: calendarDate(2025, 5, 31) },
        { date: calendarDate(2025, 6, 29) },
        { date: calendarDate(2025, 7, 29) },
        { date: calendarDate(2025, 10, 25) },
        { date: calendarDate(2025, 11, 24) },
        { date: calendarDate(2025, 12, 23) },
      ],
    },
    {
      name: "Sankashti Chaturthi (Maandelijks)",
      description:
        "Maandelijkse Ganesha viering op Krishna Paksha Chaturthi. Devotees vasten de hele dag en breken het vasten na maanzicht. Ganesha Atharvashirsha wordt gereciteerd.",
      eventType: "VRAT",
      recurrenceType: "MONTHLY_LUNAR",
      importance: "MODERATE",
      categoryName: "ganesha",
      tithi: "CHATURTHI_KRISHNA",
      tags: ["ganesha", "maan", "maandelijks", "sankashti", "vasten"],
      occurrences: [
        // 2025 Sankashti dates
        { date: calendarDate(2025, 1, 17), notes: "Shakambhari Sankashti" },
        { date: calendarDate(2025, 2, 16), notes: "Bhalachandra Sankashti" },
        { date: calendarDate(2025, 3, 17), notes: "Lambodara Sankashti" },
        { date: calendarDate(2025, 4, 15), notes: "Angaraki Sankashti (dinsdag!)" },
        { date: calendarDate(2025, 5, 15), notes: "Gajanana Sankashti" },
        { date: calendarDate(2025, 6, 13), notes: "Heramba Sankashti" },
        { date: calendarDate(2025, 7, 13), notes: "Vighnaraja Sankashti" },
        { date: calendarDate(2025, 8, 11), notes: "Vakratunda Sankashti" },
        { date: calendarDate(2025, 9, 9), notes: "Angaraki Sankashti (dinsdag!)" },
        { date: calendarDate(2025, 10, 9), notes: "Ekadanta Sankashti" },
        { date: calendarDate(2025, 11, 7), notes: "Kapila Sankashti" },
        { date: calendarDate(2025, 12, 18), notes: "Akhuratha Sankashti" },
        // 2026 Sankashti dates
        { date: calendarDate(2026, 1, 7), notes: "Sakat Chauth" },
        { date: calendarDate(2026, 2, 5) },
        { date: calendarDate(2026, 3, 7) },
        { date: calendarDate(2026, 3, 31), notes: "Angaraki Sankashti (dinsdag!)" },
        { date: calendarDate(2026, 5, 5) },
        { date: calendarDate(2026, 6, 3) },
        { date: calendarDate(2026, 7, 2) },
        { date: calendarDate(2026, 8, 1) },
        { date: calendarDate(2026, 8, 25), notes: "Angaraki Sankashti (dinsdag!)" },
        { date: calendarDate(2026, 9, 29) },
        { date: calendarDate(2026, 10, 28) },
        { date: calendarDate(2026, 11, 27) },
        { date: calendarDate(2026, 12, 26) },
      ],
    },
    {
      name: "Ganesha Visarjan",
      description:
        "De onderdompeling van Ganesha murti's op Anant Chaturdashi, 10 dagen na Ganesh Chaturthi. Grote processies begeleiden de beelden naar water voor visarjan.",
      eventType: "FESTIVAL",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MAJOR",
      categoryName: "ganesha",
      tithi: "CHATURDASHI_SHUKLA",
      maas: "BHADRAPADA",
      tags: ["anant chaturdashi", "ganesha", "processie", "visarjan"],
    },

    // ==========================================
    // SKANDA / MURUGAN FESTIVALS
    // ==========================================
    {
      name: "Skanda Sashti",
      description:
        "Zes dagen durend festival ter ere van Heer Murugan/Skanda. Viert zijn overwinning op de demon Surapadman. Zeer populair in Tamil Nadu en andere Zuid-Indiase staten.",
      eventType: "FESTIVAL",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MAJOR",
      categoryName: "skanda",
      tithi: "SHASHTHI_SHUKLA",
      maas: "KARTIK",
      tags: ["murugan", "skanda", "surapadman", "tamil", "vel"],
    },
    {
      name: "Thaipusam",
      description:
        "Festival ter ere van Heer Murugan. Bhakta's dragen kavadi's (versierde structuren) en sommigen doorboren hun lichaam met speren als teken van devotie en boetedoening.",
      eventType: "FESTIVAL",
      recurrenceType: "YEARLY_LUNAR",
      importance: "MAJOR",
      categoryName: "skanda",
      tithi: "PURNIMA",
      maas: "MAGHA",
      tags: ["devotie", "kavadi", "maleisië", "murugan", "tamil"],
    },
  ];

  // Process all events
  let eventCount = 0;
  let manualOccurrenceCount = 0;
  let autoGeneratedOccurrenceCount = 0;

  console.log("📅 Seeding events...");

  // Step 1: Upsert all Events (without occurrences)
  const createdEvents: Map<string, { id: string; recurrenceType: RecurrenceType }> =
    new Map();

  for (const eventData of events) {
    const categoryId = categoryMap.get(eventData.categoryName);
    if (!categoryId) {
      console.warn(
        `   ⚠️  Unknown category: ${eventData.categoryName} for event ${eventData.name}`
      );
      continue;
    }

    // Find by name first since name is no longer unique in Prisma
    const existingEvent = await prisma.event.findFirst({
      where: { name: eventData.name },
    });

    let event;
    if (existingEvent) {
      event = await prisma.event.update({
        where: { id: existingEvent.id },
        data: {
          description: eventData.description,
          eventType: eventData.eventType,
          recurrenceType: eventData.recurrenceType,
          importance: eventData.importance,
          categoryId,
          tithi: eventData.tithi,
          nakshatra: eventData.nakshatra,
          maas: eventData.maas,
          tags: eventData.tags,
          startTime: eventData.startTime ?? null,
          endTime: eventData.endTime ?? null,
        },
      });
    } else {
      event = await prisma.event.create({
        data: {
          name: eventData.name,
          description: eventData.description,
          eventType: eventData.eventType,
          recurrenceType: eventData.recurrenceType,
          importance: eventData.importance,
          categoryId,
          tithi: eventData.tithi,
          nakshatra: eventData.nakshatra,
          maas: eventData.maas,
          tags: eventData.tags,
          startTime: eventData.startTime ?? null,
          endTime: eventData.endTime ?? null,
        },
      });
    }
    eventCount++;
    createdEvents.set(eventData.name, {
      id: event.id,
      recurrenceType: event.recurrenceType,
    });

    // If manual occurrences provided (for NONE recurrence or seed dates), insert them
    if (eventData.occurrences && eventData.occurrences.length > 0) {
      for (const occ of eventData.occurrences) {
        await prisma.eventOccurrence.upsert({
          where: {
            eventId_date: {
              eventId: event.id,
              date: occ.date,
            },
          },
          update: {
            endDate: occ.endDate,
            notes: occ.notes,
          },
          create: {
            eventId: event.id,
            date: occ.date,
            endDate: occ.endDate,
            notes: occ.notes,
          },
        });
        manualOccurrenceCount++;
      }
    }
  }

  console.log(`   ✓ ${eventCount} events created/updated`);
  console.log(`   ✓ ${manualOccurrenceCount} manual occurrences inserted`);

  // Step 2: Auto-generate occurrences for events with recurrence
  console.log("🔁 Auto-generating occurrences (2025-2027)...");

  const eventsWithRecurrence = await prisma.event.findMany({
    where: {
      recurrenceType: {
        not: "NONE",
      },
    },
  });

  const generationWindow = {
    startDate: calendarDate(2025, 1, 1),
    endDate: calendarDate(2027, 12, 31),
    location: DEFAULT_LOCATION,
    timezone: DEFAULT_LOCATION.timezone,
  };

  for (const event of eventsWithRecurrence) {
    try {
      console.log(`   🔄 Generating for "${event.name}" (${event.recurrenceType})...`);

      const occurrences = await generateOccurrences(event, generationWindow);

      // Insert generated occurrences
      for (const occ of occurrences) {
        await prisma.eventOccurrence.upsert({
          where: {
            eventId_date: {
              eventId: event.id,
              date: occ.date,
            },
          },
          update: {
            endDate: occ.endDate,
            startTime: occ.startTime,
            endTime: occ.endTime,
            notes: occ.notes,
          },
          create: {
            eventId: event.id,
            date: occ.date,
            endDate: occ.endDate,
            startTime: occ.startTime,
            endTime: occ.endTime,
            notes: occ.notes,
          },
        });
        autoGeneratedOccurrenceCount++;
      }

      console.log(`      ✓ ${occurrences.length} occurrences generated`);
    } catch (error) {
      console.error(`   ❌ Failed to generate occurrences for "${event.name}":`, error);
    }
  }

  console.log(`   ✓ ${autoGeneratedOccurrenceCount} auto-generated occurrences inserted`);
  console.log(
    `   📊 Total: ${manualOccurrenceCount + autoGeneratedOccurrenceCount} occurrences`
  );

  // ============================================
  // 4. SUMMARY
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
  console.log("\n⚠️  NEXT STEP: Regenerate all occurrences via API");
  console.log("   curl -X POST http://localhost:3000/api/events/generate-occurrences \\");
  console.log('     -H "Content-Type: application/json" \\');
  console.log(
    '     -d \'{"startDate":"2025-01-01", "endDate":"2027-12-31", "replace": true}\''
  );
  console.log("\n   See docs/DATABASE_PROCEDURES.md for details");
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
