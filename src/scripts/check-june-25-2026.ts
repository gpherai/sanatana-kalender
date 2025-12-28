import 'dotenv/config';
import { prisma } from '@/lib/db';

async function checkJune252026() {
  const daily = await prisma.dailyInfo.findUnique({
    where: { date: new Date('2026-06-25') },
  });

  console.log('\n📅 DailyInfo for 2026-06-25:');
  console.log(`  tithi: ${daily?.tithi}`);
  console.log(`  maas: ${daily?.maas}`);
  console.log(`  paksha: ${daily?.paksha}`);
  console.log(`  isAdhika: ${daily?.isAdhika}`);

  // Also check the surrounding days to understand the month boundaries
  const surrounding = await prisma.dailyInfo.findMany({
    where: {
      date: {
        gte: new Date('2026-06-20'),
        lte: new Date('2026-06-30'),
      },
    },
    select: {
      date: true,
      maas: true,
      isAdhika: true,
      tithi: true,
    },
    orderBy: { date: 'asc' },
  });

  console.log('\n📋 June 20-30, 2026:');
  for (const day of surrounding) {
    console.log(`  ${day.date.toISOString().split('T')[0]}: ` +
      `${day.maas}${day.isAdhika ? ' (Adhika)' : ''}, ${day.tithi}`);
  }

  await prisma.$disconnect();
}

checkJune252026().catch(console.error);
