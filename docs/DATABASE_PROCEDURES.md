# Database Procedures

> **Laatst bijgewerkt:** 21 maart 2026

---

## Database Reset & Seed Procedure

Na een database reset moeten **altijd** de volgende stappen worden uitgevoerd:

### Stap 1: Database reset en seed

```bash
npm run db:reset
```

Dit voert uit (`prisma migrate reset --force && tsx ... seed.ts`):
- Alle migraties opnieuw toepassen (reset met `--force`, geen bevestigingsprompt)
- Seeding van categorieën
- Seeding van DailyInfo (panchanga data voor meerdere jaren)
- Seeding van Events (basisset)

### Stap 2: Event naming catalog synchroniseren

```bash
npx tsx --tsconfig tsconfig.json src/scripts/generate-events-from-naming.ts
```

Dit synchroniseert de events in `src/config/event-naming.ts` naar de database. Events worden opgezocht via hun stabiele `namingKey` en aangemaakt of bijgewerkt. Parent-child series worden ook gekoppeld.

### Stap 3: Occurrences regenereren (VERPLICHT)

**⚠️ BELANGRIJK:** Na elke seed/reset altijd occurrences regenereren via API:

```bash
# Start de dev server als die niet draait
npm run dev

# Wacht tot server draait, dan:
curl -X POST http://localhost:3000/api/events/generate-occurrences \
  -H "Content-Type: application/json" \
  -d '{"startDate":"2025-01-01", "endDate":"2029-12-31", "replace": true}'
```

**Waarom nodig:**
- Seed script genereert occurrences niet volledig voor alle YEARLY_LUNAR events
- Bulk regeneratie via API zorgt voor complete en correcte occurrences
- Dit voorkomt missing events in de kalender

### Verificatie

Check of alle events occurrences hebben:

```bash
npx tsx --tsconfig tsconfig.json -e "
import { prisma } from './src/lib/db.ts';
const events = await prisma.event.findMany({
  where: { recurrenceType: { not: 'NONE' } },
  select: { name: true, recurrenceType: true, _count: { select: { occurrences: true } } }
});
const missing = events.filter(e => e._count.occurrences === 0);
console.log(missing.length === 0
  ? '✅ Alle events hebben occurrences'
  : \`❌ \${missing.length} events missen occurrences:\`);
missing.forEach(e => console.log(\`  - \${e.name} (\${e.recurrenceType})\`));
await prisma.\$disconnect();
"
```

---

## Tithi Berekening

### Huidige implementatie: Udaya Tithi (Astronomisch)

De applicatie gebruikt **udaya tithi** — de tithi die prevaleert bij zonsopgang.

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
import { parseCalendarDate } from '@/lib/date-utils';

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

**Implementatie:**
```typescript
// src/lib/date-utils.ts
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
2. Check `src/lib/date-utils.ts` — moet `Date.UTC()` gebruiken
3. Reseed database en regenereer occurrences

### Issue: Events hebben geen occurrences

**Symptoom:** Events gedefinieerd maar verschijnen niet in kalender

**Oorzaak:** Occurrences niet gegenereerd na seed, of naming catalog niet gesynchroniseerd

**Oplossing:**
1. Run stap 2 (naming catalog sync) en stap 3 (occurrences regenereren) uit de reset procedure
2. Verifieer met het verificatie-script hierboven

---

## Referenties

- **Drik Panchang:** https://www.drikpanchang.com (referentie voor verificatie)
- **Swiss Ephemeris:** Astronomische engine voor panchanga berekeningen
- **Panchanga Service:** `src/services/panchanga.service.ts`
- **Naming Catalog:** `src/config/event-naming.ts` (single source of truth voor events)
