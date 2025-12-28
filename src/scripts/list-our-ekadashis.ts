import 'dotenv/config';
import { prisma } from '@/lib/db';

async function listOurEkadashis() {
  const ekadashis = await prisma.event.findMany({
    where: {
      OR: [
        { name: { contains: 'Ekadashi' } },
        { name: { contains: 'Ekadasi' } },
      ],
    },
    select: { name: true, maas: true, tithi: true },
    orderBy: { name: 'asc' },
  });

  console.log(`\n📊 Ekadashis in database: ${ekadashis.length}\n`);
  ekadashis.forEach(e => {
    console.log(`  ${e.name.padEnd(40)} ${e.maas || 'no maas'} ${e.tithi || 'no tithi'}`);
  });

  await prisma.$disconnect();
}

listOurEkadashis().catch(console.error);
