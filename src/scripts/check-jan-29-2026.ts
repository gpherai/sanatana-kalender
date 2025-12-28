import 'dotenv/config';
import { prisma } from '@/lib/db';

async function checkJan292026() {
  // Check what's on Jan 29, 2026
  const dailyInfo = await prisma.dailyInfo.findUnique({
    where: { date: new Date('2026-01-29') },
  });

  console.log('\n📅 DailyInfo for 2026-01-29:');
  console.log(`  tithi: ${dailyInfo?.tithi}`);
  console.log(`  maas: ${dailyInfo?.maas}`);
  console.log(`  paksha: ${dailyInfo?.paksha}`);
  console.log(`  isAdhika: ${dailyInfo?.isAdhika}`);

  // Check the Nirjala Ekadashi occurrence
  const occurrence = await prisma.eventOccurrence.findFirst({
    where: {
      date: new Date('2026-01-29'),
    },
    include: {
      event: {
        select: {
          name: true,
          tithi: true,
          maas: true,
        },
      },
    },
  });

  console.log(`\n🔍 Event occurrence on 2026-01-29:`);
  console.log(`  Event: ${occurrence?.event.name}`);
  console.log(`  Event tithi: ${occurrence?.event.tithi}`);
  console.log(`  Event maas: ${occurrence?.event.maas}`);

  await prisma.$disconnect();
}

checkJan292026().catch(console.error);
