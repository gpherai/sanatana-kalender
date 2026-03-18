import { prisma } from "./src/lib/db";

async function listEvents() {
  try {
    const events = await prisma.event.findMany({
      select: { name: true },
      orderBy: { name: "asc" },
    });
    console.log(
      JSON.stringify(
        events.map((e) => e.name),
        null,
        2
      )
    );
    console.log(`Total events: ${events.length}`);
  } catch (error) {
    console.error("Error listing events:", error);
  } finally {
    await prisma.$disconnect();
  }
}

listEvents();
