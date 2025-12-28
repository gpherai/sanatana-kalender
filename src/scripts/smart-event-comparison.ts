import 'dotenv/config';
import { prisma } from '@/lib/db';
import { readFileSync } from 'fs';

// Name normalization and matching
function normalizeEventName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/puja/g, '')
    .replace(/vrat/g, '')
    .replace(/jayanti/g, '')
    .replace(/ekadashi/g, 'ekadasi')
    .replace(/chaturthi/g, 'chaturthi')
    .replace(/ashtami/g, 'ashtami')
    .replace(/navami/g, 'navami')
    .replace(/janmotsava/g, 'jayanti')
    .replace(/\*/g, '')
    .replace(/@.+$/g, '') // Remove location suffixes
    .trim();
}

function findSimilarEvent(drikName: string, ourEvents: string[]): string | null {
  const normalized = normalizeEventName(drikName);

  for (const ourEvent of ourEvents) {
    const ourNormalized = normalizeEventName(ourEvent);

    // Exact match
    if (normalized === ourNormalized) return ourEvent;

    // Contains match
    if (normalized.includes(ourNormalized) || ourNormalized.includes(normalized)) {
      // But exclude partial matches that are too short
      if (ourNormalized.length > 5) return ourEvent;
    }

    // Special cases
    if (normalized.includes('ram navami') && ourNormalized.includes('ram navami')) return ourEvent;
    if (normalized.includes('rakhi') && ourNormalized.includes('raksha bandhan')) return ourEvent;
    if (normalized.includes('janmashtami') && ourNormalized.includes('krishna janmashtami')) return ourEvent;
    if (normalized.includes('guru purnima') && ourNormalized.includes('guru purnima')) return ourEvent;
  }

  return null;
}

async function smartComparison() {
  // Parse Drik file
  const drikContent = readFileSync('/home/gerald/projects/Claude/dharma-calendar/events_dp_2025.txt', 'utf-8');
  const drikEvents = drikContent
    .split('\n')
    .filter(line => {
      const trimmed = line.trim();
      // Event names are lines that start with capital letter and don't contain dates
      return trimmed.match(/^[A-Z]/) && !trimmed.match(/\d{4}/) && !trimmed.includes('===') && !trimmed.includes('Panchang');
    })
    .map(line => line.trim())
    .filter((name, index, arr) => arr.indexOf(name) === index); // Unique

  console.log(`📊 Drik Panchang 2025: ${drikEvents.length} unique events\n`);

  // Get our events
  const ourEvents = await prisma.event.findMany({
    select: { name: true },
  });
  const ourEventNames = ourEvents.map(e => e.name);

  console.log(`📊 Our database: ${ourEventNames.length} events\n`);

  // Categorize
  const matched: Array<{ drik: string; ours: string }> = [];
  const missing: string[] = [];

  for (const drikEvent of drikEvents) {
    const match = findSimilarEvent(drikEvent, ourEventNames);
    if (match) {
      matched.push({ drik: drikEvent, ours: match });
    } else {
      missing.push(drikEvent);
    }
  }

  console.log(`✅ Matched: ${matched.length}`);
  console.log(`❌ Missing: ${missing.length}\n`);

  console.log(`\n${'='.repeat(70)}`);
  console.log(`❌ TRULY MISSING EVENTS (${missing.length}):`);
  console.log(`${'='.repeat(70)}\n`);

  for (const event of missing) {
    console.log(`  - ${event}`);
  }

  await prisma.$disconnect();
}

smartComparison().catch(console.error);
