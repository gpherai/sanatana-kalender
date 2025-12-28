import "dotenv/config";
import { prisma } from "@/lib/db";

async function checkSankrantis() {
  const sankrantis = await prisma.dailyInfo.findMany({
    where: {
      sankranti: { not: null }
    },
    select: {
      date: true,
      sankranti: true,
      sankrantiTime: true,
    },
    orderBy: {
      date: 'asc'
    },
    take: 40
  });

  console.log(`✅ Found ${sankrantis.length} Sankrantis in database:\n`);
  sankrantis.forEach(s => {
    const dateStr = s.date.toISOString().split('T')[0];
    console.log(`${dateStr}: ${s.sankranti?.padEnd(25)} at ${s.sankrantiTime}`);
  });

  await prisma.$disconnect();
}

checkSankrantis().catch(console.error);
