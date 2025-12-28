/**
 * Compare Drik Panchang 2025 events with our database events
 */

import "dotenv/config";
import { readFileSync } from 'fs';
import { prisma } from "@/lib/db";

interface DrikEvent {
  name: string;
  date: string;
  info: string;
  month: string;
}

function parseDrikPanchang2025(): DrikEvent[] {
  const content = readFileSync('/home/gerald/projects/Claude/dharma-calendar/events_dp_2025.txt', 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(l => l);

  const events: DrikEvent[] = [];
  let currentMonth = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if it's a month header
    if (line.match(/^(January|February|March|April|May|June|July|August|September|October|November|December) 2025$/)) {
      currentMonth = line.replace(' 2025', '');
      continue;
    }

    // Parse event (name, date, info pattern)
    if (i + 2 < lines.length) {
      const name = line;
      const date = lines[i + 1];
      const info = lines[i + 2];

      // Check if this looks like an event (date line has comma and year)
      if (date && date.includes(',') && date.includes('2025')) {
        events.push({ name, date, info, month: currentMonth });
        i += 2; // Skip the next 2 lines we just processed
      }
    }
  }

  return events;
}

async function compareEvents() {
  console.log('📊 Comparing Drik Panchang 2025 events with our database\n');
  console.log('='.repeat(70));

  // Parse Drik Panchang events
  const drikEvents = parseDrikPanchang2025();
  console.log(`\n📖 Drik Panchang: ${drikEvents.length} events total`);

  // Get our events
  const ourEvents = await prisma.event.findMany({
    select: {
      name: true,
      eventType: true,
      recurrenceType: true,
    },
  });
  console.log(`💾 Our database: ${ourEvents.length} events\n`);

  // Categorize Drik events
  const categories = {
    ekadashi: [] as DrikEvent[],
    purnima: [] as DrikEvent[],
    sankranti: [] as DrikEvent[],
    jayanti: [] as DrikEvent[],
    eclipse: [] as DrikEvent[],
    majorFestivals: [] as DrikEvent[],
    other: [] as DrikEvent[],
  };

  drikEvents.forEach(event => {
    const nameLower = event.name.toLowerCase();

    if (nameLower.includes('ekadashi')) {
      categories.ekadashi.push(event);
    } else if (nameLower.includes('purnima')) {
      categories.purnima.push(event);
    } else if (nameLower.includes('sankranti')) {
      categories.sankranti.push(event);
    } else if (nameLower.includes('jayanti') || nameLower.includes('janmotsava')) {
      categories.jayanti.push(event);
    } else if (nameLower.includes('grahan')) {
      categories.eclipse.push(event);
    } else if (
      nameLower.includes('diwali') ||
      nameLower.includes('holi') ||
      nameLower.includes('dussehra') ||
      nameLower.includes('ganesh') ||
      nameLower.includes('shivaratri') ||
      nameLower.includes('janmashtami') ||
      nameLower.includes('navratri') ||
      nameLower.includes('pongal') ||
      nameLower.includes('rama navami')
    ) {
      categories.majorFestivals.push(event);
    } else {
      categories.other.push(event);
    }
  });

  console.log('📋 Drik Panchang breakdown:');
  console.log(`   Ekadashi:        ${categories.ekadashi.length}`);
  console.log(`   Purnima:         ${categories.purnima.length}`);
  console.log(`   Sankranti:       ${categories.sankranti.length}`);
  console.log(`   Jayanti:         ${categories.jayanti.length}`);
  console.log(`   Eclipses:        ${categories.eclipse.length}`);
  console.log(`   Major Festivals: ${categories.majorFestivals.length}`);
  console.log(`   Other:           ${categories.other.length}`);

  // Find missing categories
  console.log('\n' + '='.repeat(70));
  console.log('\n🔍 Coverage Analysis:\n');

  // Check Ekadashi coverage
  const ourEkadashiCount = ourEvents.filter(e =>
    e.name.toLowerCase().includes('ekadashi')
  ).length;
  console.log(`📿 Ekadashi:`);
  console.log(`   Drik Panchang: ${categories.ekadashi.length} events`);
  console.log(`   Our database:  ${ourEkadashiCount} events`);
  console.log(`   Missing:       ${categories.ekadashi.length - ourEkadashiCount} events`);

  // Check major festivals
  const majorFestivalNames = [
    'diwali', 'holi', 'dussehra', 'ganesh chaturthi', 'shivaratri',
    'janmashtami', 'navratri', 'rama navami', 'raksha bandhan'
  ];

  console.log(`\n🎉 Major Festivals:`);
  majorFestivalNames.forEach(festivalName => {
    const inDrik = categories.majorFestivals.some(e =>
      e.name.toLowerCase().includes(festivalName)
    );
    const inOurs = ourEvents.some(e =>
      e.name.toLowerCase().includes(festivalName)
    );

    const status = inOurs ? '✅' : '❌';
    console.log(`   ${status} ${festivalName.padEnd(20)} - ${inDrik ? 'In Drik' : 'Not in Drik'}, ${inOurs ? 'In DB' : 'NOT in DB'}`);
  });

  // Show some Drik events we don't have
  console.log(`\n📝 Sample events from Drik Panchang we might be missing:\n`);

  const sampleMissing = drikEvents
    .filter(drik => {
      // Skip very generic names
      if (drik.name.includes('Purnima') && drik.name.split(' ').length === 2) return false;

      // Check if we have something similar
      return !ourEvents.some(our =>
        our.name.toLowerCase().includes(drik.name.toLowerCase().split(' ')[0]) ||
        drik.name.toLowerCase().includes(our.name.toLowerCase().split(' ')[0])
      );
    })
    .slice(0, 20);

  sampleMissing.forEach(event => {
    console.log(`   • ${event.name}`);
    console.log(`     ${event.date.split(',')[0]} - ${event.info.split(',')[0]}`);
  });

  console.log('\n' + '='.repeat(70));
  console.log(`\n📊 Summary:`);
  console.log(`   Drik Panchang total:    ${drikEvents.length} events`);
  console.log(`   Our database total:     ${ourEvents.length} events`);
  console.log(`   Approximate gap:        ~${drikEvents.length - ourEvents.length} events`);
  console.log(`\n💡 Note: This is a rough comparison. Many Drik events are monthly/`);
  console.log(`   generic entries. For Phase 2, we'll auto-generate events from rules.`);
}

compareEvents()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error('Error:', error);
    prisma.$disconnect();
    process.exit(1);
  });
