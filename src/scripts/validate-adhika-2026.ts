/**
 * Validation script for Adhika Maas detection in 2026
 *
 * According to Drik Panchang, 2026 has Adhika Jyeshtha month:
 * - Padmini Ekadashi: May 26, 2026 (Jyeshtha Adhika, Shukla Ekadashi)
 * - Jyeshtha Adhika Purnima: May 31, 2026
 * - Parama Ekadashi: June 11, 2026 (Jyeshtha Adhika, Krishna Ekadashi)
 *
 * This script validates that our Adhika detection correctly identifies
 * the Adhika Jyeshtha period in May-June 2026.
 */

import "dotenv/config";
import { prisma } from "@/lib/db";

async function validateAdhika2026() {
  console.log('🔍 Validating Adhika Maas Detection for 2026\n');
  console.log('Expected: Adhika Jyeshtha month in May-June 2026');
  console.log('='.repeat(70) + '\n');

  // Expected Adhika events from Drik Panchang
  const expectedAdhikaEvents = [
    { date: '2026-05-26', name: 'Padmini Ekadashi', tithi: 'EKADASHI_SHUKLA', maas: 'JYESHTHA' },
    { date: '2026-05-31', name: 'Jyeshtha Adhika Purnima', tithi: 'PURNIMA', maas: 'JYESHTHA' },
    { date: '2026-06-11', name: 'Parama Ekadashi', tithi: 'EKADASHI_KRISHNA', maas: 'JYESHTHA' },
  ];

  // Fetch DailyInfo for May-June 2026 where maas=JYESHTHA
  const jyeshthaRecords = await prisma.dailyInfo.findMany({
    where: {
      date: {
        gte: new Date('2026-05-01'),
        lte: new Date('2026-06-30'),
      },
      maas: 'JYESHTHA',
    },
    orderBy: {
      date: 'asc',
    },
    select: {
      date: true,
      maas: true,
      isAdhika: true,
      paksha: true,
      tithi: true,
      lunarDay: true,
    },
  });

  console.log(`📊 Found ${jyeshthaRecords.length} days with maas=JYESHTHA in May-June 2026\n`);

  // Group by isAdhika
  const adhikaRecords = jyeshthaRecords.filter(r => r.isAdhika);
  const regularRecords = jyeshthaRecords.filter(r => !r.isAdhika);

  console.log(`  Adhika Jyeshtha: ${adhikaRecords.length} days`);
  console.log(`  Regular Jyeshtha: ${regularRecords.length} days\n`);

  // Check if Adhika period is detected
  if (adhikaRecords.length === 0) {
    console.log('❌ FAIL: No Adhika Jyeshtha days detected!');
    console.log('   Expected ~30 days with isAdhika=true\n');
    return false;
  }

  console.log('📅 Adhika Jyeshtha Period:');
  const firstAdhika = adhikaRecords[0];
  const lastAdhika = adhikaRecords[adhikaRecords.length - 1];
  console.log(`   Start: ${firstAdhika.date.toISOString().split('T')[0]}`);
  console.log(`   End:   ${lastAdhika.date.toISOString().split('T')[0]}`);
  console.log(`   Duration: ${adhikaRecords.length} days\n`);

  // Validate expected Adhika events
  console.log('🎯 Validating Expected Adhika Events:\n');

  let allValid = true;
  for (const expected of expectedAdhikaEvents) {
    const record = jyeshthaRecords.find(
      r => r.date.toISOString().split('T')[0] === expected.date
    );

    if (!record) {
      console.log(`❌ ${expected.name} (${expected.date})`);
      console.log(`   NOT FOUND in database\n`);
      allValid = false;
      continue;
    }

    const isValid =
      record.isAdhika === true &&
      record.maas === expected.maas &&
      record.tithi === expected.tithi;

    if (isValid) {
      console.log(`✅ ${expected.name} (${expected.date})`);
      console.log(`   maas: ${record.maas} (Adhika=${record.isAdhika})`);
      console.log(`   tithi: ${record.tithi}`);
      console.log(`   paksha: ${record.paksha}, lunar day: ${record.lunarDay}\n`);
    } else {
      console.log(`❌ ${expected.name} (${expected.date})`);
      console.log(`   Expected: isAdhika=true, maas=${expected.maas}, tithi=${expected.tithi}`);
      console.log(`   Got:      isAdhika=${record.isAdhika}, maas=${record.maas}, tithi=${record.tithi}\n`);
      allValid = false;
    }
  }

  // Check that regular Jyeshtha also exists (after Adhika)
  console.log('📅 Regular Jyeshtha Period:');
  if (regularRecords.length > 0) {
    const firstRegular = regularRecords[0];
    const lastRegular = regularRecords[regularRecords.length - 1];
    console.log(`   Start: ${firstRegular.date.toISOString().split('T')[0]}`);
    console.log(`   End:   ${lastRegular.date.toISOString().split('T')[0]}`);
    console.log(`   Duration: ${regularRecords.length} days\n`);
  } else {
    console.log(`   ⚠️  No regular Jyeshtha found in May-June 2026\n`);
  }

  // Summary
  console.log('='.repeat(70));
  if (allValid && adhikaRecords.length > 0) {
    console.log('\n✅ SUCCESS: Adhika Maas detection is working correctly!');
    console.log(`   - Detected ${adhikaRecords.length} Adhika Jyeshtha days`);
    console.log(`   - All ${expectedAdhikaEvents.length} expected Adhika events validated`);
    return true;
  } else {
    console.log('\n❌ FAIL: Adhika Maas detection has issues');
    if (adhikaRecords.length === 0) {
      console.log('   - No Adhika days detected');
    }
    if (!allValid) {
      console.log('   - Some expected events did not validate');
    }
    return false;
  }
}

validateAdhika2026()
  .then((success) => {
    prisma.$disconnect();
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Error:', error);
    prisma.$disconnect();
    process.exit(1);
  });
