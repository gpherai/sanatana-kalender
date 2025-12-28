import 'dotenv/config';
import { prisma } from '@/lib/db';
import { readFileSync } from 'fs';

interface DrikEvent {
  name: string;
  date: string;
  month: string;
  tithi?: string;
}

function parseDrikPanchang(filePath: string): DrikEvent[] {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const events: DrikEvent[] = [];
  let currentMonth = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Month header
    if (line.match(/^[A-Z][a-z]+ 2025$/)) {
      currentMonth = line.replace(' 2025', '');
      continue;
    }

    // Date line format: "January 9, 2025, Thursday"
    if (line.match(/^[A-Z][a-z]+ \d{1,2}, 2025/)) {
      // Previous line is the event name
      const eventName = lines[i - 1]?.trim();
      if (eventName && !eventName.includes(',') && !eventName.match(/2025/)) {
        // Next line might be tithi description
        const nextLine = lines[i + 1]?.trim();
        const tithi = (nextLine && nextLine.includes(',') && !nextLine.match(/2025/)) ? nextLine : undefined;

        events.push({
          name: eventName,
          date: line,
          month: currentMonth,
          tithi,
        });
      }
    }
  }

  return events;
}

async function analyzeEvents() {
  const drikEvents = parseDrikPanchang('/home/gerald/projects/Claude/dharma-calendar/events_dp_2025.txt');

  console.log(`📊 Parsed ${drikEvents.length} events from Drik Panchang 2025\n`);

  // Get our events
  const ourEvents = await prisma.event.findMany({
    select: { name: true },
  });
  const ourNames = new Set(ourEvents.map(e => e.name.toLowerCase().trim()));

  // Categorize
  const categories = {
    ekadashi: [] as DrikEvent[],
    sankranti: [] as DrikEvent[],
    purnima: [] as DrikEvent[],
    jayanti: [] as DrikEvent[],
    festivals: [] as DrikEvent[],
    vrat: [] as DrikEvent[],
    other: [] as DrikEvent[],
  };

  const missing: DrikEvent[] = [];
  const found: DrikEvent[] = [];

  for (const event of drikEvents) {
    const nameLower = event.name.toLowerCase();

    // Check if we have it
    if (ourNames.has(nameLower) ||
        ourNames.has(nameLower.replace(' ekadashi', '')) ||
        ourNames.has(nameLower.replace(' purnima', '')) ||
        ourNames.has(nameLower.replace(' sankranti', ''))) {
      found.push(event);
      continue;
    }

    // Categorize
    if (nameLower.includes('ekadashi') || nameLower.includes('ekadasi')) {
      categories.ekadashi.push(event);
    } else if (nameLower.includes('sankranti')) {
      categories.sankranti.push(event);
    } else if (nameLower.includes('purnima')) {
      categories.purnima.push(event);
    } else if (nameLower.includes('jayanti') || nameLower.includes('janmotsava')) {
      categories.jayanti.push(event);
    } else if (nameLower.includes('vrat')) {
      categories.vrat.push(event);
    } else if (nameLower.includes('holi') || nameLower.includes('diwali') || nameLower.includes('navratri') ||
               nameLower.includes('puja') || nameLower.includes('teej') || nameLower.includes('chhath')) {
      categories.festivals.push(event);
    } else {
      categories.other.push(event);
    }

    missing.push(event);
  }

  console.log(`✅ Found: ${found.length}`);
  console.log(`❌ Missing: ${missing.length}\n`);

  console.log(`📊 Missing Events by Category:\n`);
  console.log(`  Ekadashis: ${categories.ekadashi.length}`);
  console.log(`  Sankrantis: ${categories.sankranti.length}`);
  console.log(`  Purnimas: ${categories.purnima.length}`);
  console.log(`  Jayantis: ${categories.jayanti.length}`);
  console.log(`  Vrats: ${categories.vrat.length}`);
  console.log(`  Festivals: ${categories.festivals.length}`);
  console.log(`  Other: ${categories.other.length}`);

  // Print detailed missing events
  console.log(`\n\n${'='.repeat(70)}`);
  console.log(`MISSING EKADASHIS (${categories.ekadashi.length}):`);
  console.log(`${'='.repeat(70)}`);
  categories.ekadashi.forEach(e => {
    console.log(`${e.name} - ${e.date}`);
    if (e.tithi) console.log(`  ${e.tithi}`);
  });

  console.log(`\n\n${'='.repeat(70)}`);
  console.log(`MISSING PURNIMAS (${categories.purnima.length}):`);
  console.log(`${'='.repeat(70)}`);
  categories.purnima.forEach(e => {
    console.log(`${e.name} - ${e.date}`);
    if (e.tithi) console.log(`  ${e.tithi}`);
  });

  console.log(`\n\n${'='.repeat(70)}`);
  console.log(`MISSING JAYANTIS (${categories.jayanti.length}):`);
  console.log(`${'='.repeat(70)}`);
  categories.jayanti.forEach(e => {
    console.log(`${e.name} - ${e.date}`);
    if (e.tithi) console.log(`  ${e.tithi}`);
  });

  console.log(`\n\n${'='.repeat(70)}`);
  console.log(`MISSING FESTIVALS (${categories.festivals.length}):`);
  console.log(`${'='.repeat(70)}`);
  categories.festivals.forEach(e => {
    console.log(`${e.name} - ${e.date}`);
    if (e.tithi) console.log(`  ${e.tithi}`);
  });

  await prisma.$disconnect();
}

analyzeEvents().catch(console.error);
