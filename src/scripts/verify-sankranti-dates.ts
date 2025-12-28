import 'dotenv/config';
import { prisma } from '@/lib/db';

async function verifySankrantiDates() {
  // Check Makara Sankranti (should be Jan 14 each year)
  const makaraSankranti = await prisma.event.findFirst({
    where: { name: 'Makara Sankranti', ruleType: 'SOLAR' },
    include: {
      occurrences: {
        orderBy: { date: 'asc' },
      },
    },
  });

  console.log('\n🌞 Makara Sankranti (should be ~Jan 14):');
  makaraSankranti?.occurrences.forEach(occ => {
    console.log(`  ${occ.date.toISOString().split('T')[0]} at ${occ.startTime}`);
  });

  // Check Karka Sankranti (should be ~Jul 16)
  const karkaSankranti = await prisma.event.findFirst({
    where: { name: 'Karka Sankranti', ruleType: 'SOLAR' },
    include: {
      occurrences: {
        orderBy: { date: 'asc' },
      },
    },
  });

  console.log('\n☀️  Karka Sankranti (should be ~Jul 16):');
  karkaSankranti?.occurrences.forEach(occ => {
    console.log(`  ${occ.date.toISOString().split('T')[0]} at ${occ.startTime}`);
  });

  // Check a TITHI rule event (Nirjala Ekadashi)
  const nirjalaEkadashi = await prisma.event.findFirst({
    where: { name: 'Nirjala Ekadashi', ruleType: 'TITHI' },
    include: {
      occurrences: {
        orderBy: { date: 'asc' },
      },
    },
  });

  console.log('\n🙏 Nirjala Ekadashi (Jyeshtha Shukla Ekadashi):');
  nirjalaEkadashi?.occurrences.forEach(occ => {
    console.log(`  ${occ.date.toISOString().split('T')[0]} ${occ.endTime ? `(ends ${occ.endTime})` : ''}`);
  });

  await prisma.$disconnect();
}

verifySankrantiDates().catch(console.error);
