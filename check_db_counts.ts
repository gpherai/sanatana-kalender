import { prisma } from "./src/lib/db";

async function checkCounts() {
  try {
    const eventCount = await prisma.event.count();
    const occurrenceCount = await prisma.eventOccurrence.count();
    const eventsByType = await prisma.event.groupBy({
      by: ["recurrenceType"],
      _count: { id: true },
    });
    console.log(JSON.stringify({ eventCount, occurrenceCount, eventsByType }, null, 2));
  } catch (error) {
    console.error("Error checking counts:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCounts();
