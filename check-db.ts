import { prisma } from "./src/lib/db";

async function main() {
  const occs = await prisma.eventOccurrence.findMany({
    where: {
      event: {
        name: { contains: "Vikata Sankashti Chaturthi" },
      },
    },
    include: { event: true },
  });
  console.log(JSON.stringify(occs, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
