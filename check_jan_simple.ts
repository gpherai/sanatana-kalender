import 'dotenv/config';
import { prisma } from './src/lib/db';

async function check() {
  console.log("🔍 Checking January 2025 events vs Drik Panchang\n");

  // Get all DailyInfo for January 2025
  const dailyInfo = await prisma.dailyInfo.findMany({
    where: {
      date: {
        gte: new Date('2025-01-01'),
        lte: new Date('2025-01-31'),
      },
    },
    orderBy: { date: 'asc' },
  });

  console.log("Key dates from our database:\n");

  // Check specific dates mentioned by Drik Panchang
  const importantDates = [
    { date: '2025-01-09', drikEvent: 'Pausha Putrada Ekadashi', drikTithi: 'Pausha, Shukla Ekadashi' },
    { date: '2025-01-10', drikEvent: 'Vaikuntha Ekadashi (solar)', drikTithi: 'Pausha, Shukla Ekadashi' },
    { date: '2025-01-13', drikEvent: 'Pausha Purnima', drikTithi: 'Pausha, Shukla Purnima' },
    { date: '2025-01-17', drikEvent: 'Sakat Chauth/Lambodara Sankashti', drikTithi: 'Magha, Krishna Chaturthi' },
    { date: '2025-01-25', drikEvent: 'Shattila Ekadashi', drikTithi: 'Magha, Krishna Ekadashi' },
  ];

  for (const important of importantDates) {
    const ourData = dailyInfo.find(d => d.date.toISOString().split('T')[0] === important.date);

    if (ourData) {
      console.log(`${important.date} - ${important.drikEvent}`);
      console.log(`  Drik Panchang: ${important.drikTithi}`);
      console.log(`  Our data:      ${ourData.maasName}, ${ourData.paksha} ${ourData.tithi}`);

      // Check if tithi matches
      const tithiMatch =
        (important.drikTithi.includes('Ekadashi') && ourData.tithi?.includes('EKADASHI')) ||
        (important.drikTithi.includes('Purnima') && ourData.tithi === 'PURNIMA') ||
        (important.drikTithi.includes('Chaturthi') && ourData.tithi?.includes('CHATURTHI'));

      console.log(`  Match: ${tithiMatch ? '✅' : '❌'}`);
      console.log();
    }
  }

  // Check if there's a pattern - maybe we're 1 day off?
  console.log("\n📊 Checking for systematic offset:\n");

  const ekadashiDates = dailyInfo.filter(d => d.tithi?.includes('EKADASHI'));
  console.log("Ekadashi dates in January 2025:");
  ekadashiDates.forEach(d => {
    console.log(`  ${d.date.toISOString().split('T')[0]}: ${d.maasName} ${d.paksha} ${d.tithi}`);
  });

  const purnimaDates = dailyInfo.filter(d => d.tithi === 'PURNIMA');
  console.log("\nPurnima dates in January 2025:");
  purnimaDates.forEach(d => {
    console.log(`  ${d.date.toISOString().split('T')[0]}: ${d.maasName} ${d.paksha} ${d.tithi}`);
  });

  const chaturthiDates = dailyInfo.filter(d => d.tithi?.includes('CHATURTHI') && d.paksha === 'KRISHNA');
  console.log("\nKrishna Chaturthi dates in January 2025:");
  chaturthiDates.forEach(d => {
    console.log(`  ${d.date.toISOString().split('T')[0]}: ${d.maasName} ${d.paksha} ${d.tithi}`);
  });

  await prisma.$disconnect();
}

check().catch(console.error);
