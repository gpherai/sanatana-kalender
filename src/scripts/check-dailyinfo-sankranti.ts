import 'dotenv/config';
import { prisma } from '@/lib/db';

async function checkDailyInfoSankranti() {
  // Check if DailyInfo has sankranti data
  const sankrantiCount = await prisma.dailyInfo.count({
    where: {
      sankranti: { not: null },
    },
  });

  console.log(`\n📊 DailyInfo records with sankranti: ${sankrantiCount}`);

  // Sample a few
  const samples = await prisma.dailyInfo.findMany({
    where: {
      sankranti: { not: null },
    },
    take: 10,
    select: {
      date: true,
      sankranti: true,
      sankrantiTime: true,
    },
    orderBy: {
      date: 'asc',
    },
  });

  console.log(`\n📋 Sample sankranti records:`);
  for (const record of samples) {
    console.log(`  ${record.date.toISOString().split('T')[0]}: ${record.sankranti} at ${record.sankrantiTime || 'unknown'}`);
  }

  // Check specific Makara Sankranti dates (should be Jan 14-15)
  const makaraSankrantis = await prisma.dailyInfo.findMany({
    where: {
      sankranti: 'MAKARA_SANKRANTI',
    },
    select: {
      date: true,
      sankrantiTime: true,
    },
    orderBy: {
      date: 'asc',
    },
  });

  console.log(`\n🌞 Makara Sankranti occurrences in DailyInfo (${makaraSankrantis.length}):`);
  for (const record of makaraSankrantis) {
    console.log(`  ${record.date.toISOString().split('T')[0]} at ${record.sankrantiTime || 'unknown'}`);
  }

  await prisma.$disconnect();
}

checkDailyInfoSankranti().catch(console.error);
