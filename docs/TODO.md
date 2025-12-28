# 📋 Dharma Calendar - TODO / Roadmap

> **Status:** Production Ready + Almanac Feature  
> **Laatst bijgewerkt:** 19 december 2025

---

## ✅ Session 35 - Panchang Almanac Page (19 december 2025)

### Almanac v2 - Complete Redesign
- [x] Split-view layout (no popup, details always visible)
- [x] Year navigation + 12-month strip
- [x] Filter toggles in month strip (Maanfases, Speciale dagen, Events)
- [x] Moon phases timeline with all 4 phases
- [x] Month grid with sunrise/sunset AND moonrise/moonset per day
- [x] Special lunar days calculated from tithi:
  - [x] Chaturthi (4th) - Ganesha (Vinayaka/Sankashti)
  - [x] Ashtami (8th) - Durga
  - [x] Ekadashi (11th) - Vishnu vasten
  - [x] Pradosham (13th) - Shiva
  - [x] Chaturdashi (14th) - Pre-Purnima/Amavasya
- [x] Sticky right panel with day details
- [x] Color-coded day cells (blue=moon, purple=special, amber=events)
- [x] Responsive design

---

## ✅ Session 34 - Semantic Tokens & Ganesha Events (19 december 2025)

### Design System
- [x] Eliminate slash notation (bg-theme-primary/15 → bg-theme-primary-15)
- [x] Add semantic tokens system to generate-theme-css.ts
  - [x] Background tokens (--theme-bg, --theme-surface, etc.)
  - [x] Text tokens (--theme-fg, --theme-fg-muted, etc.)
  - [x] Border tokens (--theme-border, --theme-divider, etc.)
  - [x] Interactive state tokens (--theme-hover, --theme-active, etc.)
  - [x] Status color tokens (--theme-success, --theme-error, etc.)
- [x] Generate utility classes for semantic tokens

### Ganesha Events
- [x] Ganesh Jayanti (Magha Shukla Chaturthi)
- [x] Sakat Chauth / Tilkut Chauth
- [x] Angaraki Sankashti Chaturthi (dinsdag occurrences)
- [x] Vinayaka Chaturthi (maandelijks Shukla Paksha)
- [x] Sankashti Chaturthi (maandelijks Krishna Paksha) - 25 dates
- [x] Ganesha Visarjan (Anant Chaturdashi)

### ⚠️ Actie vereist na deze sessie:
```bash
npm run generate:css   # Regenereer globals.css
npm run db:seed        # Seed nieuwe events
```

---

## 🔮 Future: Semantic Token Migration

Nu dat semantic tokens beschikbaar zijn, kunnen hardcoded zinc/gray kleuren
geleidelijk worden vervangen:

### High Priority (veel voorkomend)
- [ ] `bg-white dark:bg-zinc-900` → `bg-theme-surface`
- [ ] `text-zinc-800 dark:text-zinc-100` → `text-theme-fg`
- [ ] `text-zinc-500 dark:text-zinc-400` → `text-theme-fg-muted`
- [ ] `border-zinc-200 dark:border-zinc-700` → `border-theme-border`

### Medium Priority
- [ ] `bg-zinc-100 dark:bg-zinc-800` → `bg-theme-surface-raised`
- [ ] `hover:bg-zinc-100 dark:hover:bg-zinc-800` → `hover:bg-theme-hover`
- [ ] `text-zinc-600 dark:text-zinc-300` → `text-theme-fg-secondary`

### Components to Update
- [ ] Header.tsx
- [ ] FilterSidebar.tsx
- [ ] EventCard.tsx
- [ ] EventForm.tsx
- [ ] Settings pages

---

## ✅ Session 33 - Code Quality Audit (19 december 2025)

### Infrastructure Layer
- [x] Environment validation with Zod (`lib/env.ts`)
- [x] Centralized regex patterns (`lib/patterns.ts`)
- [x] Updated `db.ts` to use validated env
- [x] Fixed lint-staged configuration

### Domain Layer
- [x] Consolidated constants (removed duplicate categories.ts)
- [x] Form vs API schema separation
- [x] Prisma error handling utilities
- [x] Improved date parsing

### Service Layer
- [x] Barrel exports for services
- [x] Type-safe moon phase calculations

### Presentation Layer
- [x] Conditional logging utilities (`logError`, `logWarn`, `logDebug`)
- [x] Theme token consistency (CalendarToolbar)
- [x] Toast duration constant
- [x] Dead code removal (deprecated ui/ files)
- [x] Barrel exports verified

### Documentation
- [x] ARCHITECTURE.md v3.0

---

## ✅ Theme System Refactor v2 (10 december 2025)

### Architecture
```
src/config/themes.ts (SINGLE SOURCE OF TRUTH)
        │
        ├──► npm run generate:css ──► globals.css
        │
        ├──► ThemeProvider (uses THEME_CATALOG directly)
        │
        └──► npm run db:seed ──► Database (optional backup)
```

### Completed
- [x] TypeScript as single source of truth
- [x] CSS generator script
- [x] Offline-first ThemeProvider
- [x] Special themes support (Shri Ganesha)
- [x] ADR-002 documented

---

## ✅ All Development Phases — COMPLETE

<details>
<summary>📦 Phase 0-6: Foundation to Deployment</summary>

### Phase 0: Foundation Setup
- [x] Next.js 16, TypeScript, Tailwind CSS v4
- [x] PostgreSQL + Prisma 7 schema
- [x] Seed data

### Phase 1: View & Navigate
- [x] react-big-calendar integration
- [x] Event detail modal
- [x] Dark mode support

### Phase 2: Create & Manage
- [x] Event CRUD operations
- [x] Zod validation
- [x] Toast notifications

### Phase 3: Filter & Search
- [x] Filter sidebar
- [x] URL state sync
- [x] Debounced search

### Phase 4: Settings & Preferences
- [x] UserPreference model
- [x] suncalc integration
- [x] Auto-save settings

### Phase 5: Advanced Features
- [x] TodayHero component
- [x] MoonPhase SVG
- [x] Sanskrit day names

### Phase 6: Deployment
- [x] Docker multi-stage build
- [x] docker-compose.yml
- [x] Health endpoint

</details>

---

## 📅 Future Improvements — BACKLOG

### High Priority
- [ ] EventOccurrence: startTime/endTime fields in database
- [ ] Recurring events generation from templates

### Medium Priority
- [ ] Import/Export (CSV, ICS)
- [ ] Browser notifications
- [ ] PWA support

### Low Priority
- [ ] Panchang API integration
- [ ] Multi-user support with authentication
- [ ] Custom theme creator (in-app)
- [ ] Drag-and-drop events in calendar
- [ ] Keyboard shortcuts

---

## 📊 Progress Overview

| Area | Status |
|------|--------|
| Foundation | ✅ Complete |
| Views & Navigation | ✅ Complete |
| CRUD Operations | ✅ Complete |
| Filters & Search | ✅ Complete |
| Settings | ✅ Complete |
| Advanced Features | ✅ Complete |
| Deployment | ✅ Complete |
| Theme System | ✅ Complete |
| Code Quality Audit | ✅ Complete |

---

## 🛠️ Tech Stack

| Package | Version |
|---------|---------|
| Node.js | 24.x LTS |
| Next.js | 16.0.4 |
| React | 19.2.0 |
| TypeScript | 5.7.x |
| Tailwind CSS | 4.1.x |
| Prisma | 7.0.x |
| Zod | 4.1.x |
| PostgreSQL | 17+ |

---

## 🔧 Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run validate         # Format + lint + type-check

# Database
npm run db:seed          # Seed database
npm run db:push          # Push schema changes
npm run db:studio        # Open Prisma Studio

# Theme Development
npm run generate:css     # Generate theme CSS from TypeScript
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| ARCHITECTURE.md | Technical architecture (v3.0) |
| CHANGELOG.md | Development history |
| DEPLOYMENT.md | Docker deployment guide |
| ADR-001-theme-system.md | Original theme architecture |
| ADR-002-theme-system-refactor.md | Theme refactor v2 |
