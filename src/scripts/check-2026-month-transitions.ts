import "dotenv/config";
import { prisma } from "@/lib/db";

async function checkMonthTransitions() {
  // Get all days from May to July 2026 to see month transitions
  const days = await prisma.dailyInfo.findMany({
    where: {
      date: {
        gte: new Date("2026-05-01"),
        lte: new Date("2026-07-15"),
      },
    },
    select: {
      date: true,
      maas: true,
      isAdhika: true,
      tithi: true,
    },
    orderBy: { date: "asc" },
  });

  console.log("\n📅 Month transitions May-July 2026:\n");

  let prevMaas = "";
  let prevAdhika = false;

  for (const day of days) {
    const maasLabel = `${day.maas}${day.isAdhika ? " (Adhika)" : ""}`;

    // Mark month transitions
    if (day.maas !== prevMaas || day.isAdhika !== prevAdhika) {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`🔄 NEW MONTH: ${maasLabel}`);
      console.log(`${"=".repeat(60)}`);
    }

    // Highlight Purnimas and special dates
    const markers: string[] = [];
    if (day.tithi === "PURNIMA") markers.push("🌕 PURNIMA");
    if (day.tithi === "PRATIPADA_SHUKLA")
      markers.push("📅 Month start (Shukla Pratipada)");
    if (day.tithi === "EKADASHI_SHUKLA") markers.push("🙏 Shukla Ekadashi");
    if (day.tithi === "AMAVASYA") markers.push("🌑 AMAVASYA");

    const markerStr = markers.length > 0 ? ` ${markers.join(", ")}` : "";

    console.log(
      `  ${day.date.toISOString().split("T")[0]}: ${maasLabel.padEnd(25)} ${day.tithi}${markerStr}`
    );

    prevMaas = day.maas ?? "";
    prevAdhika = day.isAdhika;
  }

  await prisma.$disconnect();
}

checkMonthTransitions()
  .catch(console.error)
  .finally(() => process.exit(0));
