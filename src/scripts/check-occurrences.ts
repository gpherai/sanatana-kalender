import 'dotenv/config';
import { prisma } from '@/lib/db';

async function checkOccurrences() {
  // Total occurrences
  const total = await prisma.eventOccurrence.count();
  const dateRange = await prisma.eventOccurrence.aggregate({
    _min: { date: true },
    _max: { date: true },
  });

  console.log(`\n📊 Total Occurrences: ${total}`);
  console.log(`📅 Date Range: ${dateRange._min.date?.toISOString().split('T')[0]} to ${dateRange._max.date?.toISOString().split('T')[0]}\n`);

  // Sankranti occurrences
  const sankrantiEvents = await prisma.event.findMany({
    where: { ruleType: 'SOLAR' },
    include: { _count: { select: { occurrences: true } } },
  });

  console.log(`🌞 Sankranti Events (${sankrantiEvents.length}):`);
  for (const event of sankrantiEvents) {
    console.log(`  ${event.name}: ${event._count.occurrences} occurrences`);
  }

  // Ekadashi occurrences (sample a few)
  const ekadashiEvents = await prisma.event.findMany({
    where: {
      name: { contains: 'Ekadashi' },
    },
    take: 5,
    include: { _count: { select: { occurrences: true } } },
  });

  console.log(`\n🙏 Sample Ekadashi Events (${ekadashiEvents.length}):`);
  for (const event of ekadashiEvents) {
    console.log(`  ${event.name}: ${event._count.occurrences} occurrences`);
  }

  // Check Adhika-specific events
  const adhikaEvents = await prisma.event.findMany({
    where: { isAdhikaOnly: true },
    include: {
      _count: { select: { occurrences: true } },
      occurrences: {
        select: { date: true },
        orderBy: { date: 'asc' },
      },
    },
  });

  console.log(`\n🌙 Adhika-Only Events (${adhikaEvents.length}):`);
  for (const event of adhikaEvents) {
    console.log(`  ${event.name}: ${event._count.occurrences} occurrences`);
    event.occurrences.forEach(occ => {
      console.log(`    - ${occ.date.toISOString().split('T')[0]}`);
    });
  }

  await prisma.$disconnect();
}

checkOccurrences().catch(console.error);
