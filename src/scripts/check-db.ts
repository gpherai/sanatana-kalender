import { prisma } from '../lib/db';

async function checkDB() {
  console.log("\n2) DB DailyInfo (is data correct opgeslagen?)\n");

  const dailyInfos = await prisma.dailyInfo.findMany({
    where: {
      date: {
        gte: new Date('2025-01-01T00:00:00.000Z'),
        lte: new Date('2025-01-15T00:00:00.000Z')
      }
    },
    orderBy: { date: 'asc' },
    select: {
      date: true,
      tithi: true,
      paksha: true,
      tithiEndTime: true
    }
  });

  console.log("Date\t\tTithi\t\t\tPaksha\t\tEnds");
  console.log("─".repeat(70));
  for (const info of dailyInfos) {
    const dateStr = info.date.toISOString().split('T')[0];
    const tithiPad = info.tithi?.padEnd(20) || 'null'.padEnd(20);
    const pakshaStr = info.paksha || 'null';
    const endTime = info.tithiEndTime || 'null';
    console.log(`${dateStr}\t${tithiPad}\t${pakshaStr}\t${endTime}`);
  }

  console.log("\n\n3) EventOccurrences (loopt event-laag achter?)\n");

  const occurrences = await prisma.eventOccurrence.findMany({
    where: {
      date: {
        gte: new Date('2025-01-01T00:00:00.000Z'),
        lte: new Date('2025-01-31T00:00:00.000Z')
      },
      event: {
        name: {
          in: [
            'Putrada Ekadashi',
            'Pausha Purnima',
            'Sakat Chauth (Sankashti)',
            'Sat-tila Ekadashi'
          ]
        }
      }
    },
    include: {
      event: {
        select: {
          name: true,
          tithiShukla: true,
          tithiKrishna: true,
          maas: true
        }
      }
    },
    orderBy: [
      { event: { name: 'asc' } },
      { date: 'asc' }
    ]
  });

  console.log("Event Name\t\t\tDate\t\tExpected Tithi\t\tMaas");
  console.log("─".repeat(80));
  for (const occ of occurrences) {
    const dateStr = occ.date.toISOString().split('T')[0];
    const namePad = occ.event.name.padEnd(30);
    const tithi = occ.event.tithiShukla || occ.event.tithiKrishna || 'null';
    const maas = occ.event.maas || 'null';
    console.log(`${namePad}\t${dateStr}\t${tithi}\t\t${maas}`);
  }

  console.log("\n\n4) Event definitie (tithi/maas klopt in seed?)\n");

  const events = await prisma.event.findMany({
    where: {
      name: {
        in: [
          'Putrada Ekadashi',
          'Pausha Purnima',
          'Sakat Chauth (Sankashti)',
          'Sat-tila Ekadashi'
        ]
      }
    },
    select: {
      name: true,
      tithiShukla: true,
      tithiKrishna: true,
      maas: true
    }
  });

  console.log("Event Name\t\t\tTithi Shukla\t\tTithi Krishna\t\tMaas");
  console.log("─".repeat(80));
  for (const event of events) {
    const namePad = event.name.padEnd(30);
    const shukla = event.tithiShukla || '-';
    const krishna = event.tithiKrishna || '-';
    const maas = event.maas || 'null';
    console.log(`${namePad}\t${shukla}\t\t${krishna}\t\t${maas}`);
  }

  await prisma.$disconnect();
}

checkDB()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
