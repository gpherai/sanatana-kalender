import { prisma } from '../lib/db';

async function checkVaikunthaEkadashi() {
  console.log("\n🔍 Checking Vaikuntha Ekadashi and surrounding dates\n");

  const dailyInfos = await prisma.dailyInfo.findMany({
    where: {
      date: {
        gte: new Date('2025-01-08T00:00:00.000Z'),
        lte: new Date('2025-01-12T00:00:00.000Z')
      }
    },
    orderBy: { date: 'asc' }
  });

  for (const info of dailyInfos) {
    console.log(`${info.date.toISOString().split('T')[0]} = ${info.maas}, ${info.paksha} ${info.tithi}`);
  }

  console.log("\n📅 Events on 2025-01-10:\n");
  const occurrences = await prisma.eventOccurrence.findMany({
    where: {
      date: new Date('2025-01-10T00:00:00.000Z')
    },
    include: {
      event: true
    }
  });

  for (const occ of occurrences) {
    console.log(`  - ${occ.event.name} (${occ.event.recurrenceType})`);
    if (occ.event.tithiShukla || occ.event.tithiKrishna) {
      console.log(`    Expected tithi: ${occ.event.tithiShukla || occ.event.tithiKrishna}`);
    }
  }

  await prisma.$disconnect();
}

checkVaikunthaEkadashi()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
