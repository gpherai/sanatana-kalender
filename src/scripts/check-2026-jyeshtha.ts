import 'dotenv/config';
import { prisma } from '@/lib/db';

async function check2026Jyeshtha() {
  // Find all Jyeshtha maas days in 2026 (both Adhika and regular)
  const jyeshthaDays = await prisma.dailyInfo.findMany({
    where: {
      date: {
        gte: new Date('2026-01-01'),
        lte: new Date('2026-12-31'),
      },
      maas: 'JYESHTHA',
    },
    select: {
      date: true,
      maas: true,
      isAdhika: true,
      tithi: true,
    },
    orderBy: {
      date: 'asc',
    },
  });

  console.log(`\n📊 All Jyeshtha days in 2026: ${jyeshthaDays.length} days\n`);

  const adhikaDays = jyeshthaDays.filter(d => d.isAdhika);
  const regularDays = jyeshthaDays.filter(d => !d.isAdhika);

  console.log(`🌙 Adhika Jyeshtha: ${adhikaDays.length} days`);
  console.log(`  ${adhikaDays[0]?.date.toISOString().split('T')[0]} to ${adhikaDays[adhikaDays.length-1]?.date.toISOString().split('T')[0]}`);

  console.log(`\n🌙 Regular Jyeshtha: ${regularDays.length} days`);
  console.log(`  ${regularDays[0]?.date.toISOString().split('T')[0]} to ${regularDays[regularDays.length-1]?.date.toISOString().split('T')[0]}`);

  // Find Shukla Ekadashi in both
  const adhikaEkadashi = adhikaDays.find(d => d.tithi === 'EKADASHI_SHUKLA');
  const regularEkadashi = regularDays.find(d => d.tithi === 'EKADASHI_SHUKLA');

  console.log(`\n🙏 Jyeshtha Shukla Ekadashi (Nirjala):`);
  console.log(`  Adhika Jyeshtha: ${adhikaEkadashi?.date.toISOString().split('T')[0] || 'not found'}`);
  console.log(`  Regular Jyeshtha: ${regularEkadashi?.date.toISOString().split('T')[0] || 'not found'}`);

  // Check Nirjala Ekadashi event
  const nirjalaEvent = await prisma.event.findFirst({
    where: { name: 'Nirjala Ekadashi' },
    select: {
      isAdhikaOnly: true,
      includeAdhika: true,
      maas: true,
      tithi: true,
    },
  });

  console.log(`\n📋 Nirjala Ekadashi event config:`);
  console.log(`  maas: ${nirjalaEvent?.maas}`);
  console.log(`  tithi: ${nirjalaEvent?.tithi}`);
  console.log(`  isAdhikaOnly: ${nirjalaEvent?.isAdhikaOnly}`);
  console.log(`  includeAdhika: ${nirjalaEvent?.includeAdhika}`);

  await prisma.$disconnect();
}

check2026Jyeshtha().catch(console.error);
