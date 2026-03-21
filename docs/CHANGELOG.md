# 📝 Dharma Calendar - Development Changelog

> **Huidige Versie:** 0.15.0
> **Status:** Production Ready
> **Laatst bijgewerkt:** 21 maart 2026

---

## Session 43 - Code Cleanup & Documentatie (21 maart 2026)

### 🧹 Dead Code Verwijderd

- `useFetchMultiple` hook — nergens in gebruik, verwijderd uit `useFetch.ts` en `hooks/index.ts`
- `ColorModeSelect` component — niet in UI geplaatst, verwijderd samen met bijbehorende test
- Ongebruikte Prisma type re-exports in `calendar.ts` (`Paksha`, `RecurrenceType`, `CalendarView`, `MoonPhaseType`)
- Dode re-exports van theme-constanten in `theme/index.ts` (`DEFAULT_THEME_NAME`, `THEME_NAMES`, etc.)
- Ad-hoc dev scripts `check_jan_simple.mjs` en `quick_check.mjs`

**Resultaat:** 450 regels dode code verwijderd, 323 tests slagen.

### 📚 Documentatie Bijgewerkt

- `TODO.md` volledig opgeschoond: voltooide items afgevinkt, verouderde backlog verwijderd
- `DATABASE_PROCEDURES.md`: naming catalog sync stap toegevoegd, fout in `parseCalendarDate` importpad hersteld (`@/lib/utils` → `@/lib/date-utils`)
- `ARCHITECTURE.md` v4.0: repository pattern gedocumenteerd, strategie-registry beschreven
- `README.md` v0.11.0: `repositories/` toegevoegd aan structuur, `MONTHLY_SOLAR` toegevoegd

---

## Session 42 - Repository Pattern & Strategy Registry (21 maart 2026)

### 🏗️ Architectuurverbeteringen

**Repository Pattern voor events:**
- Nieuw bestand `src/repositories/event.repository.ts`
- Filter-bouwlogica (~60 regels) verplaatst uit `GET /api/events` naar de repository
- `buildEventWhere()` + `findEventOccurrences()` — onafhankelijk testbaar
- Route is nu: valideer → repository aanroepen → response formatteren

**Strategy Registry voor recurrence:**
- Switch-statements in `recurrence.service.ts` vervangen door twee mappen:
  ```typescript
  const RULE_STRATEGIES = { SOLAR, TITHI };
  const RECURRENCE_STRATEGIES = { YEARLY_LUNAR, YEARLY_SOLAR, MONTHLY_LUNAR, MONTHLY_SOLAR };
  ```
- Nieuw recurrence-type toevoegen = één regel in de map (Open/Closed Principle)

**Bestanden:**
- `src/repositories/event.repository.ts` — NIEUW
- `src/app/api/events/route.ts` — GET vereenvoudigd
- `src/services/recurrence.service.ts` — switch vervangen door strategy maps

---

## Session 41 - Code Review Verbeteringen (maart 2026)

### 🔧 Code Review Fixes (K1-K3, H1-H6, G3, G5, G6, G9-G11)

**Kwaliteit (K):**
- K1: Expliciete return types op alle public service functies
- K2: `noUncheckedIndexedAccess` array-toegang verbeterd
- K3: Gedeelde Prisma-foutafhandeling utility

**Hardening (H):**
- H1-H3: `prisma.$transaction` voor atomaire delete+insert in generate-occurrences
- H4-H6: Verbeterde validatie, error codes en logging

**Gemini review (G):**
- G3: Moon phase drempelwaarden gecorrigeerd naar astronomisch correcte 45/55% (was 25/50/75%)
- G5, G6: Logging en waarschuwingen verbeterd
- G9-G11: Diverse kleinere verbeteringen

**Bestanden gewijzigd:** 14 bestanden, 324 tests slagen.

---

## Session 40 - Datum Bereik Filter (maart 2026)

### ✨ Nieuwe Feature: Datum Bereik Filter

- Datum bereik filter toegevoegd aan filterzijbalk
- Start- en einddatum selectie voor events
- Filterzijbalk herindeling voor betere bruikbaarheid

---

## Session 39 - Purnimanta Maas Berekening Fix (maart 2026)

### 🐛 Bug Fix: Krishna Paksha Maas

**Probleem:** Purnimanta maas berekening gaf verkeerde maand voor Krishna paksha tithis.

**Oorzaak:** In het Purnimanta systeem begint een maand op Purnima (volle maan). Krishna paksha (afnemende maan) valt daardoor aan het begin van de volgende maand — dit werd niet correct berekend.

**Oplossing:** Maas-berekening aangepast zodat Krishna paksha tithis correct aan de volgende Purnimanta maand worden toegewezen.

**Bestanden:**
- `src/server/panchanga/services/panchanga-swiss-service.ts`

---

## Session 37 - Moon Phase Fixes & Architecture Guidelines (26 december 2025)

### 🌙 Bug Fix: Moon Phase Visualization

**Problem:** Moon phase SVG rendering was incorrect at various illumination percentages.

**Issues Fixed:**
1. ❌ **Incorrect SVG path geometry** - At 34% illumination, moon showed almost completely black instead of proper crescent
2. ❌ **Wrong terminator calculation** - Used `sqrt(r² - offset²)` instead of `abs(offset)` for arc x-radius
3. ❌ **SVG arcs starting/ending at same point** - Path drew from center to center (no visible shape)

**Solution:**
```typescript
// OLD (incorrect):
const terminatorRadius = Math.sqrt(Math.max(0, r * r - terminatorX * terminatorX));
A ${terminatorRadius} ${r} 0 0 ${sweep} ${cx} ${cy - r}

// NEW (correct):
const terminatorCurve = Math.abs(offset);
A ${terminatorCurve} ${r} 0 0 ${sweep} ${cx} ${cy - r}
```

**Technical Details:**
- **Terminator x-radius**: Now uses `abs(offset)` which ranges from 0 (new/full moon) to r (half moon)
- **Path geometry**: Properly draws from top → arc (right/left) → terminator → back to top
- **At 34% illumination**: offset = -0.32r → terminatorCurve = 0.32r (gentle crescent curve)
- **Result**: Accurate moon phase visualization at all percentages (0-100%)

**Files Changed:**
- `src/components/ui/MoonPhase.tsx` - Complete path generation rewrite

---

### 📐 Architecture: Service Layer Decision Framework

**Context:** Gemini feedback identified "hybrid" pattern as risky - when is logic "complex enough" for a service?

**Solution:** Explicit criteria added to ARCHITECTURE.md §4.3.1

**New Guidelines:**

**✅ API Routes (Thin Controllers):**
- Simple CRUD: ~50 lines (e.g., `GET /api/categories`)
- CRUD + validation: ~150 lines (e.g., `PUT /api/preferences`)
- Complex CRUD: ~200 lines max (e.g., `GET /api/events`)

**Allowed in routes:**
- HTTP handling, Zod validation
- Direct Prisma queries (no extra repository layer)
- Simple query building, joins, transformations
- Transactions for related CRUD
- Prisma error handling

**❌ Services Required For:**
- Native addons (Swiss Ephemeris)
- Complex algorithms (lunar recurrence)
- External API calls
- Logic reused across >1 endpoint
- Routes exceeding 200 lines

**Code Review Checklist:**
```
□ Route < 200 lines?
□ Only HTTP + CRUD logic?
□ Logic not reused elsewhere?
□ Code readable and maintainable?
□ Only Prisma queries (no addons/APIs)?
```

**Key Principles:**
1. **Thin Controllers Pattern** - API routes do HTTP + CRUD orchestration
2. **No Repository Pattern** - Prisma IS already the repository layer
3. **Pragmatic Over Pure** - YAGNI principle, build abstractions when needed
4. **200-line threshold** - Clear signal to refactor

**Examples Documented:**
- `/api/events` (257 lines) = OK because it's Prisma orchestration, not business logic
- Extract to service when: >300 lines OR logic reused OR complex business rules added

**Result:**
- ✅ Clear boundaries prevent "spaghetti code"
- ✅ Developers know exactly when to extract services
- ✅ Avoids needless abstraction layers
- ✅ Maintains modern architecture best practices (2025)

**Files Changed:**
- `docs/ARCHITECTURE.md` v3.6 → v3.7
  - New section §4.3.1: API Routes vs Services Decision Framework
  - Updated §11.1: Key Design Decisions
  - Renumbered existing sections (4.3.2, 4.3.3)

---

### 🎨 Design System Documentation

**Context:** After implementing Priority 1 accessibility fixes (focus states), user requested analysis and documentation of the design system patterns.

**Task:** Analyze and document the visual hierarchy and design patterns used throughout the application.

**Analysis Results:**

1. **Shadow Hierarchy** (analyzed 34 instances)
   - `shadow-lg` (21×): Major sections, cards, modals
   - `shadow-md` (7×): Elevated interactive elements
   - `shadow-sm` (6×): Subtle depth on small elements
   - **Clear 3-tier hierarchy** - consistent usage pattern

2. **Border Radius Scale** (analyzed 135 instances)
   - `rounded-2xl` (20×): Major page sections
   - `rounded-xl` (27×): Cards and panels
   - `rounded-lg` (44×): Buttons and inputs
   - `rounded-full` (44×): Pills, badges, avatars
   - **Consistent scale** - larger containers get larger radius

3. **Spacing System** (analyzed 105 instances)
   - `gap-2` (67×): Default element spacing (8px)
   - `gap-3` (16×): Medium spacing (12px)
   - `gap-4` (14×): Large spacing (16px)
   - `gap-6` (8×): Extra large spacing (24px)
   - `p-4` (20×): Default container padding
   - **Based on Tailwind 4px scale** - clear semantic meaning

4. **Glassmorphism Pattern** (analyzed 12 instances)
   - All use `backdrop-blur-sm` for consistency
   - `bg-{color}/60` for interactive elements
   - `bg-{color}/10` for decorative backgrounds
   - **Consistent pattern** - no variations in blur strength

**Documentation Added:**

New section §3.9 in ARCHITECTURE.md with 4 subsections:

1. **§3.9.1 Shadow Hierarchy**
   - 3-tier system (lg, md, sm)
   - Usage guidelines and examples
   - Best practices

2. **§3.9.2 Border Radius Scale**
   - 4-tier system (2xl, xl, lg, full)
   - Rationale for progressive sizing
   - Example patterns

3. **§3.9.3 Spacing System**
   - Gap spacing pattern (2, 3, 4, 6)
   - Padding pattern (p-4, p-5, p-6)
   - Rationale based on 4px/8px grid
   - Tailwind scale integration

4. **§3.9.4 Glassmorphism Pattern**
   - Standard pattern: `backdrop-blur-sm + bg-{color}/opacity`
   - Opacity guidelines (60% interactive, 10% decorative)
   - Accessibility notes

**Result:**
- ✅ Complete design system documented
- ✅ Clear guidelines for future development
- ✅ Prevents inconsistencies in new components
- ✅ All patterns have rationale and examples
- ✅ Developers know exactly which values to use

**Files Changed:**
- `docs/ARCHITECTURE.md` v3.7 → v3.8
  - New section §3.9: Design System (4 subsections)
  - Updated version and changelog

---

## Session 36 - Semantic Tokens & Moonrise/Moonset (26 december 2025)

### 🎨 Theme System: Semantic Token Migration

**Goal:** Migrate all components from hardcoded Tailwind colors to semantic tokens for better theming.

**Completed:**
- ✅ **Semantic Token System Established** (documented in ARCHITECTURE.md v3.5)
  - CSS custom properties for theme-independent styling
  - Automatic light/dark mode support
  - 13 semantic tokens defined (surface layers, foreground, interactive states)

- ✅ **Component Migration** (9 bestanden, 100% coverage)
  - `almanac/page.tsx` - Full almanac page
  - `events/page.tsx` - Events overview
  - `events/new/page.tsx` - New event form
  - `events/[id]/page.tsx` - Edit event form
  - `page.tsx` - Homepage
  - `EventDetailModal.tsx` - Already used semantic tokens
  - `ColorModeToggle.tsx` - Theme toggle component
  - `TodayHero.tsx` - Hero section (already migrated)
  - `MoonPhase.tsx` - Moon visualization

**Vervangingen:**
- `text-zinc-500 dark:text-zinc-400` → `text-theme-fg-muted`
- `text-zinc-800 dark:text-zinc-100` → `text-theme-fg`
- `bg-white dark:bg-zinc-900` → `bg-theme-surface-raised`
- `hover:bg-zinc-100 dark:hover:bg-zinc-700` → `hover:bg-theme-surface-hover`
- `border-zinc-200 dark:border-zinc-700` → `border-theme-border`

**Result:**
- ✨ Consistent theming across entire application
- 🎨 All 7 themes work perfectly with all components
- 📱 Better dark mode support
- 🔧 Easier maintenance and future theming changes

---

### 🌙 Astronomical Calculations: Moonrise/Moonset with Swiss Ephemeris

**Goal:** Add precise moonrise/moonset calculations using Swiss Ephemeris, with relative time display ("over 2u 30m").

**Implementation:**

1. **Backend - Swiss Ephemeris Integration**
   - ✅ `calculateMoonriseMoonset()` function in `/server/panchanga/utils/astro.ts`
   - ✅ Uses `swe_rise_trans` with `swisseph.SE_MOON`
   - ✅ Returns JulianDay + local DateTime timestamps
   - ✅ Same precision as sunrise/sunset (second-level accuracy)

2. **Service Layer**
   - ✅ `PanchangaSwissService` now calculates moonrise/moonset for every day
   - ✅ Results cached in `PanchangaService` (365 days, 24h TTL)
   - ✅ Parallel calculation with sunrise/sunset for performance

3. **Type System**
   - ✅ `DailyPanchangaFull` extended with:
     - `moonriseLocal: string` (HH:mm:ss)
     - `moonsetLocal: string` (HH:mm:ss)
     - `moonriseUtcIso: string` (ISO timestamp)
     - `moonsetUtcIso: string` (ISO timestamp)

4. **API Route**
   - ✅ `/api/daily-info` now returns real moonrise/moonset values
   - ✅ Updated from `null` placeholder to actual calculated times

5. **UI - TodayHero Component**
   - ✅ Moonrise time with relative time ("over 2u 15m" / "1u geleden")
   - ✅ Moonset time with relative time
   - ✅ Real-time updates every minute
   - ✅ Consistent styling with sunrise/sunset section

**Technical Details:**
- **Precision:** Topocentric calculation (accounts for observer's location on Earth's surface)
- **Accuracy:** Second-level precision using Swiss Ephemeris `swe_rise_trans`
- **Performance:** Cached calculations, parallel execution with sunrise
- **Timezone:** Correctly handles all timezones via Luxon DateTime

**Result:**
```
Maantijden
🌙 Opkomst    06:42
              over 2u 15m

🌑 Ondergang  18:23
              1u geleden
```

---

### 📚 Documentation Updates

**ARCHITECTURE.md (v3.5 → v3.6):**
- ✅ Complete semantic token system documentation
  - All 13 tokens with descriptions
  - Migration guidelines
  - Before/after examples
  - Common replacements table
  - Best practices

- ✅ New section: Astronomical Calculations (4.3.2)
  - All Swiss Ephemeris functions documented
  - Implementation examples
  - Precision specifications
  - Performance notes

- ✅ Corrected Tithi calculation documentation (5.3)
  - Fixed incorrect moon phase percentage method
  - Documented correct elongation-based method
  - Explained why old method was wrong
  - Added end time calculation algorithm

**Files Updated:**
- `docs/ARCHITECTURE.md` - v3.5 → v3.6
- `docs/CHANGELOG.md` - Session 36 added

---

## Session 35 - Panchang Almanac Page (19 december 2025)

### 🎯 New Feature: Almanac Page
**Goal:** Create a comprehensive astronomical calendar page

### ✅ Wat is Bereikt

#### **Almanac Page (`/almanac`) - Complete Redesign**

**Layout:**
- Split-view design: Calendar left, details panel right (sticky)
- No popup/modal - details always visible, instant switching between days
- Responsive: stacks on mobile

**Year & Month Strip:**
- Year navigation with arrows
- 12-month horizontal strip
- Filter toggles: 🌙 Maanfases | 🙏 Speciale dagen | ⭐ Events

**Moon Phases Timeline:**
- All 4 phases: Nieuwe Maan, Eerste Kwartier, Volle Maan, Laatste Kwartier
- Clickable to navigate to that date
- Visual highlight for selected date

**Month Grid (7x5/6):**
- Each day cell shows:
  - Date number + moon emoji
  - Sunrise/sunset times (☀️)
  - Moonrise/moonset times (🌙)
  - Indicator badges for events/special days
- Color coding:
  - Blue: Moon phase days
  - Purple: Special lunar days
  - Amber: Major events
  - Primary ring: Today

**Special Lunar Days (calculated from moon %):**
- Chaturthi (4th tithi) - Vinayaka/Sankashti for Ganesha
- Ashtami (8th tithi) - Durga dag
- Ekadashi (11th tithi) - Vishnu vastendag
- Pradosham (13th tithi) - Shiva dag
- Chaturdashi (14th tithi) - Dag voor Purnima/Amavasya

**Right Panel (sticky, always visible):**
- Selected date header with Sanskrit day name
- Hindu month (Maas) + Tithi + Paksha
- Sun times card (sunrise, sunset)
- Moon times card (moonrise, moonset)
- Moon phase visualization with MoonPhase component
- Special lunar day info (if applicable)
- Events list

### 📂 Bestanden

```
src/app/almanac/
└── page.tsx              ← REWRITTEN (700+ lines)
```

### 🎹 Key Improvements over v1

| Issue | Solution |
|-------|----------|
| Popup annoying | Split-view, no modal |
| Empty space in month strip | Added filter toggles |
| Missing last quarter | Improved detection algorithm |
| No special lunar days | Added Chaturthi, Ekadashi, etc. |
| No moonrise/moonset in grid | Added to each day cell |

### 🐛 Layout Fix (v2.1)
- Fixed: Grid syntax `lg:grid-cols-[1fr,380px]` incorrect in Tailwind v4
- Solution: Changed to flexbox `lg:flex-row` with `lg:w-80` fixed width panel
- Split-view now works correctly at 1024px+ viewport width

---

## Session 34 - Semantic Tokens & Ganesha Events (19 december 2025)

### 🎯 Design System Enhancement
**Goal:** Eliminate slash notation, add semantic tokens, expand Ganesha events

### ✅ Wat is Bereikt

#### **Slash → Hyphen Notation Fix**
Fixed all theme utility class slash variants to use hyphen notation:
- `bg-theme-primary/15` → `bg-theme-primary-15`
- `border-theme-primary/20` → `border-theme-primary-20`  
- `hover:bg-theme-primary/10` → `hover:bg-theme-primary-10`

Files updated:
- `src/app/events/page.tsx` (6 instances)
- `src/components/calendar/EventDetailModal.tsx` (1 instance)

#### **Semantic Tokens System**
Added comprehensive semantic tokens to `generate-theme-css.ts`:

**Backgrounds:**
- `--theme-bg`, `--theme-bg-subtle`
- `--theme-surface`, `--theme-surface-raised`, `--theme-surface-overlay`

**Text Colors:**
- `--theme-fg`, `--theme-fg-secondary`, `--theme-fg-muted`, `--theme-fg-subtle`

**Borders & Dividers:**
- `--theme-border`, `--theme-border-subtle`, `--theme-border-strong`
- `--theme-divider`

**Interactive States:**
- `--theme-hover`, `--theme-active`, `--theme-disabled`, `--theme-ring`

**Status Colors:**
- `--theme-success`, `--theme-warning`, `--theme-error`, `--theme-info`
- Background variants: `--theme-success-bg`, etc.

**Utility Classes Generated:**
- `.bg-theme-surface`, `.bg-theme-bg-subtle`, etc.
- `.text-theme-fg`, `.text-theme-fg-muted`, etc.
- `.border-theme-border`, `.border-theme-success`, etc.

#### **Ganesha Events Expansion**
Added 6 new Ganesha-related events to seed.ts:

1. **Ganesh Jayanti** - Geboortedag volgens Magha traditie
2. **Sakat Chauth (Sankashti)** - Eerste Sankashti van het jaar met til laddoos
3. **Angaraki Sankashti Chaturthi** - Extra gunstige Sankashti op dinsdag (4 dates)
4. **Vinayaka Chaturthi (Maandelijks)** - 11 Shukla Chaturthi's voor 2025
5. **Sankashti Chaturthi (Maandelijks)** - 25 maandelijkse data voor 2025-2026
6. **Ganesha Visarjan** - Anant Chaturdashi onderdompeling

**Totaal nieuwe occurrences:** 45+

### 📂 Bestanden Gewijzigd

```
src/
├── app/events/page.tsx           ← Slash → hyphen fix (6x)
├── components/calendar/
│   └── EventDetailModal.tsx      ← Slash → hyphen fix (1x)
├── scripts/
│   ├── generate-theme-css.ts     ← Semantic tokens added
│   └── seed.ts                   ← Ganesha events added
```

### ⚠️ Na deze sessie uitvoeren:

```bash
# Regenereer globals.css met semantic tokens
npm run generate:css

# Seed de nieuwe Ganesha events
npm run db:seed
```

---

## Session 33 - Comprehensive Code Quality Audit (19 december 2025)

### 🎯 Full Codebase Audit & Refactor
**Goal:** Complete code quality audit across all layers

### ✅ Wat is Bereikt

#### **Infrastructure Layer**
- Environment validation with Zod (`lib/env.ts`)
- Centralized regex patterns (`lib/patterns.ts`)
- Updated `db.ts` to use validated env
- Fixed lint-staged configuration (removed deprecated `--cache` flag)

#### **Domain Layer**
- Consolidated constants in `lib/constants.ts` (removed duplicate categories.ts)
- Form vs API schema separation in `lib/validations.ts`
- Prisma error handling utilities in `lib/api-response.ts`
- Improved date parsing robustness

#### **Service Layer**
- Barrel exports for services (`services/index.ts`)
- Type-safe moon phase calculations

#### **Presentation Layer**
- **Conditional logging utilities:** `logError`, `logWarn`, `logDebug` in `lib/utils.ts`
- **Theme consistency:** CalendarToolbar now uses `text-theme-primary` instead of hardcoded `orange-*`
- **Toast constants:** `TOAST_DURATION_MS` constant
- **Dead code removal:** Deprecated `ui/DarkModeToggle.tsx` and `ui/ThemeProvider.tsx` removed
- **Barrel exports verified** across all component folders

#### **Documentation**
- ARCHITECTURE.md updated to v3.0 reflecting actual implementation
- Project structure accurately documented
- Theme system architecture documented

### 📂 Bestanden Gewijzigd

```
src/
├── lib/
│   ├── env.ts                  ← NEW: Zod environment validation
│   ├── patterns.ts             ← NEW: Centralized regex patterns
│   ├── utils.ts                ← Added logError/logWarn/logDebug
│   ├── validations.ts          ← Form vs API schema separation
│   ├── api-response.ts         ← Prisma error handling
│   ├── constants.ts            ← Consolidated (absorbed categories)
│   └── db.ts                   ← Uses validated env
├── config/
│   └── categories.ts           ← REMOVED (consolidated into constants)
├── components/
│   ├── calendar/
│   │   └── CalendarToolbar.tsx ← Theme token consistency
│   ├── events/
│   │   └── EventForm.tsx       ← Uses logError
│   ├── ui/
│   │   ├── Toast.tsx           ← TOAST_DURATION_MS constant
│   │   ├── DarkModeToggle.tsx  ← REMOVED (deprecated)
│   │   └── ThemeProvider.tsx   ← REMOVED (deprecated)
│   └── theme/
│       └── (canonical location for theme components)
├── services/
│   └── index.ts                ← Barrel export
└── app/
    └── settings/page.tsx       ← Uses logError

docs/
├── ARCHITECTURE.md             ← Updated to v3.0
└── CHANGELOG.md                ← This file
```

### 🏗️ Architecture Improvements

**Before:**
- Console.error scattered throughout codebase
- Hardcoded colors in some components
- Duplicate theme components in ui/ and theme/
- Categories defined in multiple places

**After:**
- Conditional logging (dev-only) via utility functions
- Theme tokens used consistently
- Single canonical location for theme components
- Single source of truth for categories

---

## Session 32 - Shri Ganesha Special Theme (5 december 2025)

### 🐘 Divine Theme Addition
**Goal:** Premium theme met speciale achtergrond

### ✨ Wat is Bereikt

#### **Shri Ganesha Theme**
- **Primary:** Sindoor Saffron - heilige vermiljoen kleur
- **Secondary:** Divine Gold - welvaart en wijsheid
- **Accent:** Durva Green - het heilige gras
- Speciale achtergrond met radiale gradienten
- Divine shimmer animaties
- "✨ Special" badge in Settings UI

#### **Theme System Uitbreidingen**
- `ThemeBackground` interface voor custom backgrounds
- `isSpecial` flag voor premium themes
- `ThemeSpecialStyles` voor geavanceerde CSS customization

---

## Session 31 - CSS-Driven Theme System (5 december 2025)

### 🎯 Theme Architecture Refactor
**Goal:** CSS-driven theming volgens Tailwind v4 convention

### ✅ Wat is Bereikt

- ThemeProvider zet alleen `data-theme` attribute
- CSS selectors doen alle styling
- `npm run generate:css` genereert globals.css
- Tailwind v4 best practice geïmplementeerd

---

## Session 30 - Theme System Cleanup (3 december 2025)

### 🎯 Final Cleanup
- Verwijderd: `FALLBACK_THEMES` array
- Toegevoegd: `EMERGENCY_FALLBACK_THEME`
- Betere error handling in ThemeProvider

---

## Session 29 - Theme System Refactor: Single Source of Truth (3 december 2025)

### 🎯 Database-Driven Theme Architecture
- ADR-001 gedocumenteerd
- Database-first approach met graceful degradation

---

## Session 28 - Code Audit & Theme System Fix (28 november 2025)

### 🎯 Initial Theme System
- ThemeProvider component met React Context
- localStorage persistence
- Type safety fixes

---

## Session 27 - Phase 6: Deployment (28 november 2025)

### 🐳 Docker Containerization
- Multi-stage Dockerfile
- docker-compose.yml
- Health endpoint

---

## Sessions 19-26 - Phases 0-5 (27-28 november 2025)

### Complete Project Build
- Next.js 16, React 19, Prisma 7, Tailwind 4
- Calendar, Events, Settings pages
- Filter system with URL state
- CRUD operations
- TodayHero, MoonPhase components

---

## 📊 Versie Geschiedenis

| Versie | Datum | Highlights |
|--------|-------|------------|
| **0.15.0** | **21 mrt 2026** | **Repository pattern, strategy registry, code cleanup** |
| 0.14.1 | mrt 2026 | Code review fixes K1-K3 H1-H6 G3 G5 G6 G9-G11, moon phase 45/55% |
| 0.14.0 | mrt 2026 | Datum bereik filter, filterzijbalk herindeling |
| 0.13.0 | mrt 2026 | Purnimanta maas fix (Krishna paksha) |
| 0.12.0 | 26 dec 2025 | Almanac redesign, moonrise/moonset, semantic token migratie |
| 0.11.0 | 19 dec 2025 | Code quality audit, conditional logging, theme consistency |
| 0.10.0 | 10 dec 2025 | Theme System Refactor v2 |
| 0.9.0 | 5 dec 2025 | Shri Ganesha theme, CSS generator |
| 0.8.0 | 3 dec 2025 | ADR-001, theme refactor |
| 0.7.0 | 28 nov 2025 | Code audit |
| 0.6.0 | 28 nov 2025 | Docker deployment |
| 0.5.0 | 28 nov 2025 | TodayHero, MoonPhase |
| 0.4.0 | 28 nov 2025 | Settings, preferences |
| 0.3.0 | 27 nov 2025 | Filters, URL state |
| 0.2.0 | 27 nov 2025 | CRUD, forms |
| 0.1.0 | 27 nov 2025 | Foundation |

---

## Development Principes

- **Single Source of Truth:** Config in TypeScript, niet verspreid
- **Conditional Logging:** `logError/logWarn/logDebug` voor dev-only output
- **Theme Tokens:** `text-theme-primary` niet `text-orange-500`
- **Barrel Exports:** `index.ts` in elke component folder
- **CSS-Driven Theming:** `data-theme` attribute + CSS selectors
- **Targeted Repository Pattern:** Complexe filter-logica in `src/repositories/`, simpele Prisma-queries direct in route
- **Strategy Registry:** Nieuwe recurrence-types toevoegen via map, geen switch aanpassen

---

**Laatst bijgewerkt:** 21 maart 2026
**Status:** Production Ready
