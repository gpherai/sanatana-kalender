# Database Procedures

## Database Reset & Seed Procedure

Na een database reset moeten **altijd** de volgende stappen worden uitgevoerd:

### Stap 1: Database reset en seed
```bash
npm run db:reset
```

Dit voert uit:
- Prisma migrate reset
- Seeding van DailyInfo (panchanga data)
- Seeding van Events
- **Let op:** Seed script genereert NIET altijd alle occurrences compleet

### Stap 2: Occurrences regenereren (VERPLICHT)

**⚠️ BELANGRIJK:** Na elke seed/reset altijd occurrences regenereren via API:

```bash
# Start de dev server als die niet draait
npm run dev

# Wacht tot server draait, dan:
curl -X POST http://localhost:3000/api/events/generate-occurrences \
  -H "Content-Type: application/json" \
  -d '{"startDate":"2025-01-01", "endDate":"2027-12-31", "replace": true}'
```

**Waarom nodig:**
- Seed script genereert occurrences niet volledig voor alle YEARLY_LUNAR events
- Bulk regeneratie via API zorgt voor complete en correcte occurrences
- Dit voorkomt missing events in de kalender

### Verificatie

Check of alle YEARLY_LUNAR events occurrences hebben:

```bash
# Gebruik je eigen DATABASE_URL uit .env of pas aan voor je omgeving
npx tsx -e "
import { prisma } from './src/lib/db';
const events = await prisma.event.findMany({
  where: { recurrenceType: 'YEARLY_LUNAR' },
  select: { name: true, _count: { select: { occurrences: true } } }
});
const missing = events.filter(e => e._count.occurrences === 0);
console.log(missing.length === 0
  ? '✅ Alle events hebben occurrences'
  : \`❌ \${missing.length} events missen occurrences\`);
await prisma.\$disconnect();
"
```

---

## Tithi Berekening

### Huidige implementatie: Udaya Tithi (Astronomisch)

De applicatie gebruikt **udaya tithi** - de tithi die prevails bij zonsopgang.

- **Bron:** Swiss Ephemeris (wetenschappelijk accurate berekeningen)
- **Verificatie:** Komt exact overeen met Drik Panchang daily panchang
- **Status:** ✅ Correct geïmplementeerd

### Toekomstige feature: Ekadashi Observance Rules

Voor religieuze observance (bijvoorbeeld Ekadashi vastendagen) gelden soms andere regels:

- **Smarta traditie:** Vaak eerste dag bij spanning tithi
- **Vaishnava/ISKCON:** Specifieke regels voor Ekadashi fasting

**Implementatie:**
- ⏸️ Niet als bugfix maar als aparte feature
- Plan: Voeg `observanceDate` veld toe aan EventOccurrence
- Filter optie: "Astronomical" vs "Smarta" vs "Vaishnava"

---

## Datum Opslag

### Kritieke regel: Gebruik parseCalendarDate()

**✅ Correct (huidige implementatie):**
```typescript
import { parseCalendarDate } from '@/lib/utils';

// Voor calendar events (festivals, tithis)
const date = parseCalendarDate('2025-01-09');
// Internals: new Date(Date.UTC(2025, 0, 9))
// → Returns: Date representing 2025-01-09 00:00:00 UTC
// → Stored in @db.Date as: 2025-01-09 ✅
```

**❌ Fout (veroorzaakt -1 dag offset):**
```typescript
// NIET gebruiken voor calendar dates in Nederland (UTC+1):
const [year, month, day] = '2025-01-09'.split('-').map(Number);
const date = new Date(year, month - 1, day);
// → Creates: 2025-01-09 00:00:00 CET (UTC+1)
// → In UTC: 2025-01-08 23:00:00 UTC
// → Stored in @db.Date as: 2025-01-08 ❌ (wrong day!)
```

**Waarom UTC midnight nodig is:**
- PostgreSQL `@db.Date` slaat alleen de **date component** op (geen tijd/timezone)
- Prisma converteert JavaScript Date naar UTC voordat het de date component extraheert
- Local midnight (00:00 CET) wordt 23:00 UTC **vorige dag** → verkeerde datum in DB
- **Oplossing:** `parseCalendarDate()` gebruikt `Date.UTC()` → UTC midnight → correcte datum

**Implementatie details:**
```typescript
// src/lib/utils.ts line 148
export function parseCalendarDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  return date; // UTC midnight, safe for @db.Date storage
}
```

---

## Bekende Issues & Oplossingen

### Issue: Events verschijnen 1 dag te vroeg/laat

**Symptoom:** Event op 2025-01-09 verschijnt als 2025-01-08 in database

**Oorzaak:** Verkeerde datum parsing (local midnight i.p.v. UTC)

**Oplossing:**
1. Controleer of `parseCalendarDate()` wordt gebruikt voor alle event dates
2. Check `src/lib/utils.ts` - moet `Date.UTC()` gebruiken
3. Reseed database en regenereer occurrences

### Issue: YEARLY_LUNAR events hebben geen occurrences

**Symptoom:** Events gedefinieerd maar verschijnen niet in kalender

**Oorzaak:** Occurrences niet gegenereerd na seed

**Oplossing:**
1. Run API endpoint: `POST /api/events/generate-occurrences`
2. Zie "Database Reset & Seed Procedure" hierboven

---

## Contact & Referenties

- **Drik Panchang:** https://www.drikpanchang.com (referentie voor verificatie)
- **Swiss Ephemeris:** Astronomische engine voor panchanga berekeningen
- **Panchanga Service:** `src/services/panchanga.service.ts`
