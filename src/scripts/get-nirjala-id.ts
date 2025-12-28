import 'dotenv/config';
import { prisma } from '@/lib/db';

async function getNirjalaId() {
  const event = await prisma.event.findFirst({
    where: { name: 'Nirjala Ekadashi' },
    select: { id: true, name: true },
  });

  console.log(`${event?.id}`);

  await prisma.$disconnect();
}

getNirjalaId().catch(console.error);
