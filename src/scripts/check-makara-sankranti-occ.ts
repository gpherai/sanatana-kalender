import 'dotenv/config';
import { prisma } from '@/lib/db';

async function checkMakaraSankrantiOccurrences() {
  const event = await prisma.event.findFirst({
    where: {
      name: 'Makara Sankranti',
      ruleType: 'SOLAR',
    },
    include: {
      occurrences: {
        orderBy: { date: 'asc' },
      },
    },
  });

  if (!event) {
    console.log('❌ Event not found');
    return;
  }

  console.log(`\n📊 Makara Sankranti occurrences: ${event.occurrences.length}`);
  for (const occ of event.occurrences) {
    console.log(`  - ${occ.date.toISOString().split('T')[0]} at ${occ.startTime || 'no time'}`);
  }

  await prisma.$disconnect();
}

checkMakaraSankrantiOccurrences().catch(console.error);
