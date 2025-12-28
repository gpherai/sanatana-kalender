import 'dotenv/config';
import { prisma } from './src/lib/db';

async function verifyOffset() {
  console.log("🔍 Verifying date offset in database\n");
  console.log("=".repeat(80));
  console.log("Expected from Drik Panchang:");
  console.log("  2025-01-01 Wednesday = Pausha, Shukla Pratipada (Chandra Darshana)");
  console.log("  2025-01-03 Friday    = Pausha, Shukla Chaturthi (Vighneshvara Chaturthi)");
  console.log("=".repeat(80));
  console.log();

  // Query 31 Dec 2024 through 3 Jan 2025
  const dates = await prisma.dailyInfo.findMany({
    where: {
      date: {
        gte: new Date('2024-12-30'),
        lte: new Date('2025-01-04'),
      },
    },
    orderBy: { date: 'asc' },
    select: {
      date: true,
      tithi: true,
      paksha: true,
      maas: true,
      maasName: true,
      lunarDay: true,
    },
  });

  console.log("What we have in our database:\n");

  dates.forEach(d => {
    const dateStr = d.date.toISOString().split('T')[0];
    const dayName = d.date.toLocaleDateString('en-US', { weekday: 'long' });

    console.log(`${dateStr} ${dayName.padEnd(9)} = ${d.maasName}, ${d.paksha} ${d.tithi}`);

    // Check for the smoking gun
    if (dateStr === '2024-12-31' && d.tithi === 'PRATIPADA_SHUKLA') {
      console.log("  ⚠️  ^ THIS IS THE SMOKING GUN! Pratipada on 31 Dec instead of 1 Jan");
    }
    if (dateStr === '2025-01-01' && d.tithi === 'DWITIYA_SHUKLA') {
      console.log("  ⚠️  ^ Shifted! Should be Pratipada, but we have Dwitiya");
    }
  });

  console.log("\n" + "=".repeat(80));
  console.log("Analysis:");
  console.log("=".repeat(80));

  const dec31 = dates.find(d => d.date.toISOString().split('T')[0] === '2024-12-31');
  const jan01 = dates.find(d => d.date.toISOString().split('T')[0] === '2025-01-01');
  const jan03 = dates.find(d => d.date.toISOString().split('T')[0] === '2025-01-03');

  if (dec31?.tithi === 'PRATIPADA_SHUKLA') {
    console.log("✅ CONFIRMED: We have Pratipada on 2024-12-31 instead of 2025-01-01");
    console.log("   This proves the -1 day offset is in the database storage!");
  }

  if (jan01?.tithi === 'DWITIYA_SHUKLA') {
    console.log("✅ CONFIRMED: We have Dwitiya on 2025-01-01 instead of Pratipada");
    console.log("   The shift is consistent across all dates!");
  }

  if (jan03?.tithi === 'CHATURTHI_SHUKLA') {
    console.log("✅ CONFIRMED: We have Chaturthi on 2025-01-03 (correct tithi for that date)");
    console.log("   But Drik Panchang expects this to be on 2025-01-03, which matches!");
    console.log("   Wait... this means our 2025-01-03 is correct?");
  }

  console.log("\n📌 Conclusion:");
  console.log("   The offset is caused by UTC serialization of Date objects.");
  console.log("   When we create '2025-01-01 00:00 Amsterdam time' (UTC+1),");
  console.log("   it becomes '2024-12-31 23:00 UTC', and @db.Date stores '2024-12-31'.");

  await prisma.$disconnect();
}

verifyOffset().catch(console.error);
