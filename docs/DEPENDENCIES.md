# 📦 Dharma Calendar - Dependencies

> **Laatst bijgewerkt:** 27 november 2025

---

## Versie Overzicht

### Core Framework

| Package | Versie | Doel |
|---------|--------|------|
| `next` | **16.0.4** | React framework met App Router |
| `react` | **19.2.0** | UI library |
| `react-dom` | **19.2.0** | React DOM renderer |
| `typescript` | **5.7.x** | Type safety (ES2022 target) |

### Database & ORM

| Package | Versie | Doel |
|---------|--------|------|
| `prisma` | **7.0.0** | Database toolkit (dev) |
| `@prisma/client` | **7.0.0** | Prisma query builder |

> 🚀 **Prisma 7:** Rust-free client is nu standaard. Kleinere bundle, snellere cold starts.

### Styling

| Package | Versie | Doel |
|---------|--------|------|
| `tailwindcss` | **4.1.17** | Utility-first CSS |
| `tailwind-merge` | **3.4.0** | Tailwind class merging |
| `clsx` | **2.1.1** | Conditional classnames |

### UI Components

| Package | Versie | Doel |
|---------|--------|------|
| `react-big-calendar` | **1.19.4** | Kalender weergave |
| `lucide-react` | **0.555.0** | Iconen library |
| `focus-trap-react` | **11.0.4** | Modal accessibility |

### Utilities

| Package | Versie | Doel |
|---------|--------|------|
| `date-fns` | **4.1.0** | Datum manipulatie |
| `zod` | **4.1.13** | Schema validatie |
| `suncalc` | **1.9.0** | Zon/maan berekeningen |

> 🚀 **Zod 4:** 2-7x sneller dan v3. Nieuwe API met top-level validators.

### Type Definitions (indien nodig)

| Package | Versie | Doel |
|---------|--------|------|
| `@types/react` | **19.x** | React types |
| `@types/react-dom` | **19.x** | React DOM types |
| `@types/react-big-calendar` | **1.16.3** | Kalender types |
| `@types/suncalc` | **1.9.x** | Suncalc types |

---

## package.json Template

```json
{
  "name": "dharma-calendar",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "next": "^16.0.4",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "@prisma/client": "^7.0.0",
    "tailwindcss": "^4.1.17",
    "tailwind-merge": "^3.4.0",
    "clsx": "^2.1.1",
    "react-big-calendar": "^1.19.4",
    "lucide-react": "^0.555.0",
    "focus-trap-react": "^11.0.4",
    "date-fns": "^4.1.0",
    "zod": "^4.1.0",
    "suncalc": "^1.9.0"
  },
  "devDependencies": {
    "typescript": "^5.7.2",
    "prisma": "^7.0.0",
    "tsx": "^4.19.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/react-big-calendar": "^1.16.3",
    "@types/suncalc": "^1.9.2",
    "eslint": "^9.0.0",
    "eslint-config-next": "^16.0.0"
  }
}
```

---

## Installatie Commando's

### Nieuwe Installatie

```bash
# Project aanmaken met Next.js
npx create-next-app@latest dharma-calendar --typescript --tailwind --eslint --app --src-dir

# Navigeer naar project
cd dharma-calendar

# Installeer dependencies
npm install @prisma/client@7 react-big-calendar lucide-react focus-trap-react date-fns zod@4 suncalc tailwind-merge clsx

# Installeer dev dependencies
npm install -D prisma@7 tsx @types/react-big-calendar @types/suncalc
```

### Prisma Setup

```bash
# Initialiseer Prisma met PostgreSQL
npx prisma init --datasource-provider postgresql

# Na schema aanpassen
npx prisma generate
npx prisma db push

# Database seeden
npm run db:seed
```

---

## Belangrijke API Changes

### Zod 4 Changes

Zod 4 heeft enkele breaking changes. Hier de belangrijkste:

```typescript
// ✅ Zod 4 - Nieuwe API (aanbevolen)
import { z } from "zod";

const emailSchema = z.email();           // Was: z.string().email()
const uuidSchema = z.uuidv4();           // Was: z.string().uuid()
const urlSchema = z.url();               // Was: z.string().url()
const dateSchema = z.iso.date();         // ISO date string
const datetimeSchema = z.iso.datetime(); // ISO datetime string

// ✅ Object schemas - ongewijzigd
const userSchema = z.object({
  name: z.string(),
  email: z.email(),
  age: z.number().min(0),
});

// ✅ Error handling - kleine change
try {
  schema.parse(data);
} catch (err) {
  if (err instanceof z.ZodError) {
    console.log(err.issues);  // Was: err.errors (deprecated)
  }
}

// ✅ Oude API werkt nog (deprecated)
z.string().email();  // Werkt, maar deprecated
```

### Prisma 7 Changes

Prisma 7 heeft config changes:

```prisma
// schema.prisma - Prisma 7
generator client {
  provider = "prisma-client-js"
  // engineType niet meer nodig - Rust-free is standaard
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

```typescript
// .env loading is niet meer automatisch!
// Gebruik dotenv of zet env vars handmatig

// prisma/seed.ts
import 'dotenv/config';  // Voeg toe als je .env wilt laden
import { PrismaClient } from '@prisma/client';
```

---

## Versie Keuzes & Rationale

### Next.js 16

| Aspect | Next.js 16 |
|--------|-----------|
| Status | Nieuw (okt 2025) |
| Turbopack | Stable (default) |
| React Compiler | Stable |
| Caching | Opt-in (Cache Components) |

**Keuze: Next.js 16** - Turbopack is stabiel en sneller, caching is explicieter.

### Prisma 7

| Aspect | Prisma 7.0 |
|--------|-----------|
| Status | Nieuw (nov 2025) |
| Rust-free | Standaard |
| Bundle size | Kleiner |
| Cold start | Sneller |

**Keuze: Prisma 7** - Nieuwste features, Rust-free standaard.

> ⚠️ **Fallback:** Als we problemen tegenkomen, downgraden naar Prisma 6.16.

### Zod 4

| Aspect | Zod 4.1 |
|--------|--------|
| Status | Nieuw (juli 2025) |
| Performance | 2-7x sneller dan v3 |
| API | Nieuwe top-level validators |
| Bundle | Beter tree-shakeable |

**Keuze: Zod 4** - Sneller, moderner, beter te tree-shaken.

> ⚠️ **Fallback:** Als we problemen tegenkomen, downgraden naar Zod 3.25.

### React 19.2

De nieuwste React versie met:
- `<Activity>` component voor prioritized rendering
- `useEffectEvent` hook (stable)
- Performance improvements

---

## Compatibiliteit Matrix

| Package | Minimum Node | React Version |
|---------|-------------|---------------|
| Next.js 16 | 20.x | 19.x |
| Prisma 7 | 18.x | - |
| Tailwind 4.x | 20.x | - |
| Zod 4 | 18.x | - |
| react-big-calendar | 18.x | 18.x / 19.x |

**Aanbevolen Node.js versie:** 20.x LTS of 22.x

---

## Updates Checken

```bash
# Check voor outdated packages
npm outdated

# Update alle packages
npm update

# Update specifieke package naar nieuwste
npm install package@latest
```

---

## Bekende Limitaties

| Package | Limitatie | Workaround |
|---------|-----------|------------|
| suncalc | Laatste update 4 jaar geleden | Stabiel, geen updates nodig |
| react-big-calendar | Types kunnen achterlopen | `@types/react-big-calendar` apart installeren |
| Prisma 7 | .env niet auto-loaded | `import 'dotenv/config'` toevoegen |
| Zod 4 | Sommige libraries nog op v3 | Subpath imports: `zod/v3` als backup |

---

## Fallback Strategie

Als we problemen tegenkomen:

### Prisma 7 → 6.16
```bash
npm install prisma@6.16 @prisma/client@6.16
```

### Zod 4 → 3.25
```bash
npm install zod@3.25
```
En imports aanpassen van `z.email()` naar `z.string().email()`.

---

## Referenties

- [Next.js 16 Release Notes](https://nextjs.org/blog/next-16)
- [React 19.2 Release Notes](https://react.dev/blog/2025/10/01/react-19-2)
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)
- [Prisma 7 Upgrade Guide](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7)
- [Zod v4 Release Notes](https://zod.dev/v4)
- [react-big-calendar Docs](https://github.com/jquense/react-big-calendar)
