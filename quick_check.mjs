import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:postgres@localhost:5432/dharma_calendar?schema=public"
    }
  }
});

async function check() {
  // Check DailyInfo with maas
  const totalDaily = await prisma.dailyInfo.count();
  const withMaas = await prisma.dailyInfo.count({ where: { maas: { not: null } } });

  console.log(`\n📊 DailyInfo: ${totalDaily} total, ${withMaas} with maas`);

  // Check a sample
  const sample = await prisma.dailyInfo.findFirst({
    where: { maas: { not: null } },
    orderBy: { date: 'asc' }
  });

  if (sample) {
    console.log(`\n✅ Sample DailyInfo:`);
    console.log(`   Date: ${sample.date.toISOString().split('T')[0]}`);
    console.log(`   Maas: ${sample.maas} (${sample.maasName} - ${sample.maasType})`);
    console.log(`   Lunar Day: ${sample.lunarDay}`);
    console.log(`   Vikrama Samvat: ${sample.vikramaSamvatYear}`);
  }

  // Check Maha Shivaratri
  const shivaratri = await prisma.event.findFirst({
    where: { name: 'Maha Shivaratri' },
    include: { occurrences: { orderBy: { date: 'asc' } } }
  });

  if (shivaratri) {
    console.log(`\n✅ Maha Shivaratri:`);
    console.log(`   Recurrence: ${shivaratri.recurrenceType}`);
    console.log(`   Tithi: ${shivaratri.tithi}, Maas: ${shivaratri.maas}`);
    console.log(`   Occurrences: ${shivaratri.occurrences.length}`);
    shivaratri.occurrences.forEach(o => {
      console.log(`      - ${o.date.toISOString().split('T')[0]}`);
    });
  }

  await prisma.$disconnect();
}

check().catch(console.error);
