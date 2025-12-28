import 'dotenv/config';
import { prisma } from '@/lib/db';
import { generateOccurrences } from '@/services/recurrence.service';

async function testSolarGeneration() {
  // Get one Sankranti event
  const makaraSankranti = await prisma.event.findFirst({
    where: {
      name: 'Makara Sankranti',
      ruleType: 'SOLAR',
    },
  });

  if (!makaraSankranti) {
    console.log('❌ Makara Sankranti event not found');
    return;
  }

  console.log('\n🔍 Testing Makara Sankranti generation:');
  console.log(`  Event ID: ${makaraSankranti.id}`);
  console.log(`  Name: ${makaraSankranti.name}`);
  console.log(`  ruleType: ${makaraSankranti.ruleType}`);
  console.log(`  sankranti field: ${makaraSankranti.sankranti}`);
  console.log(`  ruleConfig: ${JSON.stringify(makaraSankranti.ruleConfig)}`);
  console.log(`  recurrenceType: ${makaraSankranti.recurrenceType}`);

  // Try to generate occurrences
  console.log('\n🔄 Calling generateOccurrences...');

  try {
    const occurrences = await generateOccurrences(makaraSankranti, {
      startDate: new Date('2025-01-01'),
      endDate: new Date('2027-12-31'),
    });

    console.log(`\n✅ Generated ${occurrences.length} occurrences:`);
    for (const occ of occurrences) {
      console.log(`  - ${occ.date.toISOString().split('T')[0]} at ${occ.startTime || 'no time'}`);
    }
  } catch (error) {
    console.error('\n❌ Error during generation:', error);
  }

  // Also check DailyInfo directly
  console.log('\n🔍 Checking DailyInfo for MAKARA_SANKRANTI:');
  const dailyData = await prisma.dailyInfo.findMany({
    where: {
      date: {
        gte: new Date('2025-01-01'),
        lte: new Date('2027-12-31'),
      },
      sankranti: 'MAKARA_SANKRANTI',
    },
    select: {
      date: true,
      sankrantiTime: true,
    },
    orderBy: {
      date: 'asc',
    },
  });

  console.log(`  Found ${dailyData.length} records in DailyInfo:`);
  for (const day of dailyData) {
    console.log(`  - ${day.date.toISOString().split('T')[0]} at ${day.sankrantiTime || 'no time'}`);
  }

  await prisma.$disconnect();
}

testSolarGeneration().catch(console.error);
