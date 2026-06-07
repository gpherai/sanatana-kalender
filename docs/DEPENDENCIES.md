# 📦 Dharma Calendar - Dependencies

> **Laatst bijgewerkt:** 7 juni 2026

---

## Versie Overzicht

### Core Framework

| Package | Versie | Doel |
|---------|--------|------|
| `next` | **16.2.6** | React framework met App Router |
| `react` | **19.2.6** | UI library |
| `react-dom` | **19.2.6** | React DOM renderer |
| `typescript` | **6.0.x** | Type safety (strict mode, ES2022 target) |

### Database & ORM

| Package | Versie | Doel |
|---------|--------|------|
| `prisma` | **7.7.0** | Database toolkit (dev) |
| `@prisma/client` | **7.7.0** | Prisma query builder |
| `@prisma/adapter-pg` | **7.7.0** | PostgreSQL adapter (pg-native) |
| `pg` | **8.21.0** | PostgreSQL client |

> **Prisma 7:** Rust-free client is standaard. Generator is `prisma-client` (niet `prisma-client-js`). Output: `src/generated/prisma/`. Config via `prisma.config.ts` — `.env` wordt niet automatisch geladen; dit bestand bevat `import 'dotenv/config'`.

### Panchanga & Astronomie

| Package | Versie | Doel |
|---------|--------|------|
| `swisseph` | **0.5.17** | Swiss Ephemeris — astronomische berekeningen (native Node addon, vereist python3/make/g++ bij build) |
| `luxon` | **3.7.2** | Datum/tijd met timezone support (vervangt suncalc + date-fns) |

> **Let op:** `swisseph` is een native Node.js addon. De Dockerfile installeert `python3 make g++ py3-setuptools` in de deps-stage voor compilatie. De `.node` binary wordt apart gekopieerd naar de runner-stage (niet opgenomen in Next.js standalone output).

### Styling

| Package | Versie | Doel |
|---------|--------|------|
| `tailwindcss` | **4.3.0** | Utility-first CSS (v4 native CSS, geen config.js) |
| `tailwind-merge` | **3.6.0** | Tailwind class merging |
| `clsx` | **2.1.1** | Conditional classnames |

### UI Components

| Package | Versie | Doel |
|---------|--------|------|
| `react-big-calendar` | **1.19.4** | Kalender weergave |
| `lucide-react` | **1.16.0** | Iconen library |
| `focus-trap-react` | **12.0.2** | Modal accessibility |
| `leaflet` | **1.9.4** | Interactieve kaarten |
| `react-leaflet` | **5.0.0** | React wrapper voor Leaflet |

### Content & Export

| Package | Versie | Doel |
|---------|--------|------|
| `next-mdx-remote` | **6.0.0** | MDX rendering voor encyclopedie pagina's |
| `gray-matter` | **4.0.3** | Frontmatter parsing voor MDX bestanden |
| `ical-generator` | **10.1.0** | iCal export van kalendergebeurtenissen |

### Utilities

| Package | Versie | Doel |
|---------|--------|------|
| `date-fns` | **4.2.1** | Datum manipulatie |
| `zod` | **4.4.3** | Schema validatie |
| `server-only` | **0.0.1** | Markeer modules als server-only (build-time check) |

> **Zod 4:** 2-7x sneller dan v3. Nieuwe top-level validators (`z.email()`, `z.url()`, `z.iso.date()`). Fallback via `zod/v3` subpath import als libraries nog v3 verwachten.

---

## Dev Dependencies

### Testing

| Package | Versie | Doel |
|---------|--------|------|
| `vitest` | **4.1.6** | Test runner |
| `@vitest/coverage-v8` | **4.1.6** | Code coverage |
| `vitest-mock-extended` | **4.0.0** | TypeScript-aware mocking |
| `@testing-library/react` | **16.3.2** | React component tests |
| `@testing-library/dom` | **10.4.1** | DOM queries |
| `@testing-library/jest-dom` | **6.9.1** | Custom matchers |
| `@testing-library/user-event` | **14.6.1** | Gebruikersinteractie simulatie |
| `@vitejs/plugin-react` | **6.0.2** | React plugin voor Vitest |
| `jsdom` | **29.1.1** | Browser environment simulatie |
| `@playwright/test` | **1.60.0** | End-to-end browser tests |

### Code Quality

| Package | Versie | Doel |
|---------|--------|------|
| `eslint` | **9.39.4** | Linting |
| `eslint-config-next` | **16.2.6** | Next.js ESLint regels |
| `prettier` | **3.8.2** | Code formatting |
| `prettier-plugin-tailwindcss` | **0.8.0** | Tailwind class sortering |
| `husky` | **9.1.7** | Git hooks |
| `lint-staged` | **17.0.5** | Pre-commit hooks op gewijzigde bestanden |
| `knip` | **6.14.1** | Ongebruikte exports/bestanden/deps detecteren |

### Build & Tooling

| Package | Versie | Doel |
|---------|--------|------|
| `typescript` | **6.0.3** | TypeScript compiler |
| `tsx` | **4.22.3** | TypeScript uitvoeren zonder build stap (scripts) |
| `prisma` | **7.7.0** | Prisma CLI + migraties |
| `dotenv` | **17.4.1** | `.env` laden in scripts en `prisma.config.ts` |
| `@tailwindcss/postcss` | **4.3.0** | PostCSS plugin voor Tailwind v4 |
| `babel-plugin-react-compiler` | **1.0.0** | React Compiler babel plugin |

### Type Definitions

| Package | Versie |
|---------|--------|
| `@types/node` | **25.9.0** |
| `@types/react` | **19** |
| `@types/react-dom` | **19** |
| `@types/react-big-calendar` | **1.16.3** |
| `@types/leaflet` | **1.9.21** |
| `@types/luxon` | **3.7.1** |
| `@types/pg` | **8.20.0** |

---

## Vereisten

| Resource | Minimum |
|----------|---------|
| Node.js | **26.0.0+** (vastgelegd in `engines` in package.json) |
| PostgreSQL | **15+** (productie: PostgreSQL 18 via Docker) |

---

## package.json (huidig)

```json
{
  "name": "kalender-site",
  "version": "0.10.0",
  "private": true,
  "engines": {
    "node": ">=26.0.0"
  },
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "lint:fix": "eslint --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "validate": "npm run format:check && npm run lint && npm run type-check && npm run knip",
    "ci": "npm run validate && npm run test",
    "prepare": "husky",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:migrate:reset": "prisma migrate reset",
    "db:seed": "tsx --tsconfig tsconfig.scripts.json src/scripts/seed.ts",
    "db:cleanup": "tsx --tsconfig tsconfig.scripts.json src/scripts/cleanup-legacy-events.ts",
    "db:events": "tsx --tsconfig tsconfig.scripts.json src/scripts/generate-events-from-naming.ts",
    "db:occurrences": "tsx --tsconfig tsconfig.scripts.json src/scripts/generate-occurrences.ts",
    "db:setup": "npm run db:seed && npm run db:events && npm run db:occurrences -- --start 2026-01-01 --end 2029-12-31 --replace",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset --force && npm run db:setup",
    "check:events": "tsx --tsconfig tsconfig.scripts.json src/scripts/check-event-references.ts",
    "backup": "bash scripts/backup.sh",
    "backup:db": "docker compose --profile backup run --rm backup",
    "deploy:prod": "bash scripts/deploy-prod.sh",
    "deploy:prod:pull": "bash scripts/deploy-prod.sh --pull",
    "db:pull-prod": "bash scripts/db-pull-prod.sh",
    "db:import-dump": "bash scripts/db-import-dump.sh",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "knip": "knip"
  }
}
```

---

## Prisma 7 Setup

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client"          // niet "prisma-client-js"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
  // URL via prisma.config.ts — GEEN url = env("DATABASE_URL") hier
}
```

```typescript
// prisma.config.ts — laadt .env en geeft DATABASE_URL door
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: env("DATABASE_URL") },
});
```

```typescript
// Scripts die Prisma gebruiken hoeven geen dotenv import —
// prisma.config.ts regelt dit. Maar tsx-scripts die direct
// DB-connectie nodig hebben gebruiken src/lib/db.ts.
import { prisma } from "@/lib/db";
```

---

## Zod 4 API

```typescript
// ✅ Nieuwe top-level validators
import { z } from "zod";

const emailSchema = z.email();           // Was: z.string().email()
const uuidSchema = z.uuidv4();           // Was: z.string().uuid()
const urlSchema = z.url();               // Was: z.string().url()
const dateSchema = z.iso.date();         // ISO date string
const datetimeSchema = z.iso.datetime(); // ISO datetime string

// ✅ Object schemas — ongewijzigd
const schema = z.object({ name: z.string(), email: z.email() });

// ✅ Error handling
try {
  schema.parse(data);
} catch (err) {
  if (err instanceof z.ZodError) {
    console.log(err.issues);  // Was: err.errors (deprecated)
  }
}

// ✅ Oude z.string().email() werkt nog (deprecated)
```

---

## Verwijderde Packages

| Package | Reden |
|---------|-------|
| `suncalc` | Vervangen door `swisseph` (Swiss Ephemeris) voor astronomische precisie |
| `@types/suncalc` | Idem |

---

## Bekende Limitaties

| Package | Limitatie | Workaround |
|---------|-----------|------------|
| `swisseph` | Native addon — vereist build tools (python3/make/g++) | Dockerfile installeert deze in deps-stage |
| `swisseph` | Niet in Next.js standalone output | Handmatig gekopieerd in Dockerfile runner-stage |
| `zod` | Sommige libraries verwachten nog v3 | Subpath import: `import { z } from "zod/v3"` |
| `leaflet` | SSR incompatibel | Gebruik `dynamic(() => import(...), { ssr: false })` |

---

## Referenties

- [Next.js 16 Release Notes](https://nextjs.org/blog/next-16)
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)
- [Prisma 7 Upgrade Guide](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7)
- [Zod v4 Release Notes](https://zod.dev/v4)
- [Swiss Ephemeris Docs](https://www.astro.com/swisseph/)
- [react-big-calendar Docs](https://github.com/jquense/react-big-calendar)
