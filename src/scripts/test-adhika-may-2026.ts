import "dotenv/config";
import { PanchangaSwissService } from "@/server/panchanga/services/PanchangaSwissService";

const service = new PanchangaSwissService();
const location = { name: "Den Haag", lat: 52.0705, lon: 4.3007, timezone: "Europe/Amsterdam" };

async function testMay2026() {
  console.log('Testing Adhika detection for May 2026...\n');

  const testDates = [
    '2026-05-20', // Should be regular Jyeshtha
    '2026-05-26', // Padmini Ekadashi - should be Adhika per Drik Panchang
    '2026-05-31', // Adhika Purnima - should be Adhika
    '2026-06-05', // Should be Adhika?
    '2026-06-11', // Parama Ekadashi - should be Adhika per Drik Panchang
    '2026-06-15', // Should be regular Jyeshtha
  ];

  for (const dateStr of testDates) {
    const panchanga = await service.computeDaily(dateStr, location);
    console.log(`${dateStr}:`);
    console.log(`  Maas: ${panchanga.maas?.name} (isAdhika=${panchanga.maas?.isAdhika})`);
    console.log(`  Tithi: ${panchanga.tithi.name} (${panchanga.maas?.paksha})`);
    console.log();
  }
}

testMay2026().catch(console.error);
