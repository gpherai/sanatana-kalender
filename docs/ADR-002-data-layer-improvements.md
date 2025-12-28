# ADR-002: Data Layer Improvements

**Status:** Accepted  
**Datum:** 3 december 2025  
**Auteur:** Gerald (met AI assistentie)

## Context

Na een code review van Codex en Gemini werden diverse verbeterpunten geïdentificeerd in de data/schema laag van de Dharma Calendar applicatie. De belangrijkste bevindingen waren:

1. **Category als string veld** - Risico op typos en drift t.o.v. de CATEGORIES constant
2. **Destructief seed script** - `deleteMany()` wist alle data bij elke run
3. **Geen migratie historie** - `db push` biedt geen rollback mogelijkheid
4. **Inconsistente default locatie** - Rotterdam vs Den Haag op verschillende plekken
5. **Geen unique constraint** - Geen bescherming tegen duplicate EventOccurrences
6. **DRY schending** - Seed script maakte eigen Prisma client i.p.v. hergebruik

## Besluit

### 1. Category als aparte tabel met FK

**Was:**
```prisma
model Event {
  category String? // "ganesha", "shiva", etc.
}
```

**Wordt:**
```prisma
model Category {
  id          String @id @default(cuid())
  name        String @unique
  displayName String
  icon        String
  color       String
  // ...
}

model Event {
  categoryId String?
  category   Category? @relation(fields: [categoryId], references: [id])
}
```

**Rationale:** Database-level referentiële integriteit, voorkomt typos, maakt categorieën bewerkbaar.

### 2. Event.name als @unique

**Was:**
```prisma
model Event {
  name String
}
```

**Wordt:**
```prisma
model Event {
  name String @unique
}
```

**Rationale:** Maakt upsert mogelijk op basis van naam, voorkomt duplicaten.

### 3. Unique constraint op EventOccurrence

```prisma
model EventOccurrence {
  @@unique([eventId, date])
}
```

**Rationale:** Voorkomt dat hetzelfde event meerdere keren op dezelfde datum kan voorkomen.

### 4. @db.Date voor pure datums

**Was:**
```prisma
date DateTime
```

**Wordt:**
```prisma
date DateTime @db.Date
```

**Rationale:** PostgreSQL DATE type slaat alleen de datum op zonder tijdcomponent, voorkomt timezone issues.

### 5. Non-destructief seed script

**Was:**
```typescript
await tx.event.deleteMany({});
// create new events
```

**Wordt:**
```typescript
await prisma.event.upsert({
  where: { name: eventData.name },
  update: { ... },
  create: { ... },
});
```

**Rationale:** Bestaande data blijft behouden, alleen updates worden toegepast.

### 6. Shared Prisma client

**Was:**
```typescript
// seed.ts
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
```

**Wordt:**
```typescript
// seed.ts
import { prisma } from "@/lib/db";
```

**Rationale:** DRY principe, dezelfde configuratie en connection pooling.

### 7. Migraties i.p.v. db push

**Was:**
```bash
npm run db:push
```

**Wordt:**
```bash
npm run db:migrate     # Development
npm run db:migrate:deploy  # Production
```

**Rationale:** Migraties zijn traceerbaar, versiebeheerbaar, en kunnen worden teruggedraaid.

### 8. Consistente default locatie

**Keuze:** Den Haag (52.0705, 4.3007)

Alle plekken waar een default locatie wordt gebruikt:
- `schema.prisma` → DailyInfo defaults
- `schema.prisma` → UserPreference defaults
- `constants.ts` → DEFAULT_LOCATION
- `seed.ts` → UserPreference data

## Consequenties

### Positief
- Betere data integriteit
- Veiligere seed operaties
- Traceerbare database wijzigingen
- Consistente configuratie

### Negatief
- Bestaande data moet gemigreerd worden
- Category lookup vereist JOIN of include

## Migratie Stappen

1. Run `npm run db:migrate` om de migratie te genereren
2. Review de gegenereerde SQL
3. Run het seed script om categories te vullen
4. Verifieer data integriteit

## Referenties

- Codex code review feedback (dec 2025)
- Gemini code review feedback (dec 2025)
- Prisma 7 migration documentation
