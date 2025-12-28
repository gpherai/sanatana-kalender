import "dotenv/config";
import * as swisseph from "swisseph";
import { calculateSunriseSunset, swe_calc_ut } from "@/server/panchanga/utils/astro";

swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);

async function getSunRashi(jd: number): Promise<number> {
  const flags = swisseph.SEFLG_SIDEREAL | swisseph.SEFLG_MOSEPH;
  const sunPos = await swe_calc_ut(jd, swisseph.SE_SUN, flags);
  const sidLongitude = (sunPos.longitude + 360) % 360;
  return Math.floor(sidLongitude / 30);
}

async function debugAdhika() {
  const location = { lat: 52.0705, lon: 4.3007, timezone: "Europe/Amsterdam" };

  // Test Amavasyas (new moons) - Adhika is determined by Amavasya boundaries!
  const amavasyaDates = [
    "2026-05-16", // Amavasya before Adhika period
    "2026-06-15", // Amavasya during/after Adhika period
  ];

  console.log("🔍 Debugging Adhika Detection (using AMAVASYA)\n");
  console.log("Checking Sun's rashi at Amavasyas:\n");

  for (const dateStr of amavasyaDates) {
    const astro = await calculateSunriseSunset(dateStr, location.lat, location.lon, location.timezone);
    const rashi = await getSunRashi(astro.sunriseJD);
    const rashiNames = ["Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
                        "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena"];

    console.log(`${dateStr}: Sun in ${rashiNames[rashi]} (rashi ${rashi})`);
  }

  console.log("\nExpected: If two consecutive Amavasyas have SAME rashi → Adhika");
  console.log("If May 16 and June 15 have same rashi → period between is Adhika");
}

debugAdhika().catch(console.error);
