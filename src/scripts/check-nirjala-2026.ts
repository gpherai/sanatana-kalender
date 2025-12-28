import 'dotenv/config';
import { prisma } from '@/lib/db';

async function checkNirjala2026() {
  // Get Nirjala Ekadashi event
  const nirjala = await prisma.event.findFirst({
    where: { name: 'Nirjala Ekadashi' },
    include: {
      occurrences: {
        where: {
          date: {
            gte: new Date('2026-01-01'),
            lte: new Date('2026-12-31'),
          },
        },
        orderBy: { date: 'asc' },
      },
    },
  });

  console.log('\n🙏 Nirjala Ekadashi in 2026:');
  console.log(`  Event config: maas=${nirjala?.maas}, tithi=${nirjala?.tithi}`);
  console.log(`  includeAdhika: ${nirjala?.includeAdhika}`);
  console.log(`  isAdhikaOnly: ${nirjala?.isAdhikaOnly}`);
  console.log(`\n  Occurrences (${nirjala?.occurrences.length}):`);

  for (const occ of nirjala?.occurrences || []) {
    // Get DailyInfo for this date
    const daily = await prisma.dailyInfo.findUnique({
      where: { date: occ.date },
      select: { maas: true, isAdhika: true, tithi: true },
    });

    console.log(`    ${occ.date.toISOString().split('T')[0]}: ` +
      `maas=${daily?.maas}, isAdhika=${daily?.isAdhika}, tithi=${daily?.tithi}`);
  }

  // Also check if there's a Jyeshtha Shukla Ekadashi in regular Jyeshtha 2026
  console.log('\n🔍 All EKADASHI_SHUKLA in JYESHTHA in 2026:');
  const jyeshthaEkadashis = await prisma.dailyInfo.findMany({
    where: {
      date: {
        gte: new Date('2026-01-01'),
        lte: new Date('2026-12-31'),
      },
      maas: 'JYESHTHA',
      tithi: 'EKADASHI_SHUKLA',
    },
    select: {
      date: true,
      isAdhika: true,
    },
    orderBy: { date: 'asc' },
  });

  for (const day of jyeshthaEkadashis) {
    console.log(`  ${day.date.toISOString().split('T')[0]}: isAdhika=${day.isAdhika}`);
  }

  await prisma.$disconnect();
}

checkNirjala2026().catch(console.error);
