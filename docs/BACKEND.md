# Dharma Calendar — Backend Architecture

> Onderdeel van de technische documentatie. Zie [ARCHITECTURE.md](ARCHITECTURE.md) voor het overzicht.

---

## 1. Layer Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                     API Routes / Pages                          │
│  - HTTP request/response handling                               │
│  - Input validatie (Zod)                                        │
│  - Orchestratie van Services of Repositories                    │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Service Layer                              │
│  - Business logica (streaks, stats, berekeningen)               │
│  - Orchestratie over meerdere Repositories                      │
│  - Swiss Ephemeris integratie                                   │
│  - SSR data aggregatie voor complexe pagina's                   │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Repository Layer                             │
│  - Directe Prisma queries (enige plek in de app)                │
│  - Encapsulatie van complexe WHERE-clausules                    │
│  - Database-level integriteit (transactions)                    │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
                          Prisma ORM → PostgreSQL
```

**Regel**: geen `prisma.xxx` buiten repositories. Geen business logica in API routes.

### Decision Framework

1. **Repositories**: verplicht voor **alle** database queries.
2. **Services**: verplicht voor berekeningen (stats, streaks) of coördinatie van meerdere repositories.
3. **API Routes / Server Components**: dun — alleen Zod validatie, orchestratie aanroepen, response opbouwen.
4. **Transformers (`lib/api-transformers.ts`)**: zetten interne domeinmodellen om naar HTTP response shapes. Worden gedeeld door API routes én SSR services — nooit inline kopiëren.

**Code Review Checklist**
```
□ Alle DB queries via een Repository? (geen prisma.xxx in route/page)
□ Business logica geëxtraheerd naar een Service?
□ Transformer uit api-transformers.ts gebruikt, geen inline kopie?
```

---

## 2. API Endpoints

Alle routes gebruiken response helpers uit `src/lib/api-response.ts` (`serverError`, `validationError`, `notFoundError`) en Zod schemas uit `src/lib/validations/`.

| Endpoint | Methoden | Verantwoordelijkheid |
|----------|----------|----------------------|
| `/api/health` | GET | Health check + DB latency |
| `/api/events` | GET | Occurrences gefilterd op datum, categorie, type, tithi |
| `/api/events/[id]` | GET / PUT / DELETE | Individueel event |
| `/api/events/generate-occurrences` | POST | Genereer/vervang EventOccurrence records |
| `/api/events/[id]/occurrences/[occurrenceId]` | PUT / DELETE | Individuele occurrence bijwerken of verwijderen |
| `/api/categories` | GET | Alle categorieën |
| `/api/daily-info` | GET | Dagelijkse panchanga data (tithi, nakshatra, etc.) |
| `/api/preferences` | GET / PUT | Single-user voorkeuren (upsert) |
| `/api/themes` | GET | Theme catalog voor externe callers |
| `/api/kundali` | POST | Jyotisha geboortehoroscoop (9 navagrahas + lagna, Lahiri ayanamsa) |
| `/api/ical/export` | GET | iCal export (.ics) van alle events |
| `/api/weer` | GET | Weerdashboard (huidig, uurlijks, dagelijks, lucht, alarmen, astronomie) |
| `/api/weer/map/[layer]/[z]/[x]/[y]` | GET | Proxy voor OpenWeatherMap kaarttegels |
| `/api/sadhana/sessions` | GET / POST | Sessies lijst + aanmaken |
| `/api/sadhana/sessions/[id]` | GET / PATCH / DELETE | Individuele sessie |
| `/api/sadhana/practices` | GET / POST | Praktijken (mantra, parayana, overig) |
| `/api/sadhana/practices/[id]` | GET / PATCH / DELETE | Individuele praktijk |
| `/api/sadhana/goals` | GET / POST | Doelen (dagelijks, wekelijks, lifetime) |
| `/api/sadhana/goals/[id]` | GET / PATCH / DELETE | Individueel doel |
| `/api/sadhana/routines` | GET / POST | Routines met geordende items |
| `/api/sadhana/routines/[id]` | GET / PATCH / DELETE | Routine (atomair update via transactie) |
| `/api/sadhana/stats/today` | GET | Statistieken voor vandaag |
| `/api/sadhana/stats/streak` | GET | Huidige + langste streak |
| `/api/sadhana/stats/overview` | GET | Totale aggregaten (malas, minuten, sessies) |
| `/api/sadhana/stats/calendar` | GET | Dagelijkse heatmap data |

---

## 3. Service Layer

| Service | Bestand | Verantwoordelijkheden |
|---------|---------|----------------------|
| `categoryService` | `category.service.ts` | Dunne wrapper voor categorie-queries (server-only) |
| `panchangaService` | `panchanga.service.ts` | LRU-cached wrapper voor Swiss Ephemeris berekeningen |
| `recurrenceService` | `recurrence/` | Event recurrence generation, strategy registry per RuleType; gesplitst in domein-modules (tithi, nakshatra, solar, special) |
| `preferenceService` | `preference.service.ts` | Single-user voorkeuren ophalen en upserten |
| `eventService` | `event.service.ts` | Event mutations, occurrence ownership, category validatie en conflictregels |
| `sadhanaService` | `sadhana.service.ts` | Streaks, goals progress, aggregatie van sessiedata naar statistieken |
| `sadhanaFormatters` | `lib/sadhana-formatters.ts` | DTO-formatting: `formatSession`, `formatGoal`, `formatPractice`, `computePracticeStats` |
| `weatherService` | `weather.service.ts` | OpenWeather orchestratie, foutnormalisatie, dashboard-response mapping; luchtkwaliteit en alerts degraderen optioneel |
| `getHomePageData` | `home.service.ts` | SSR aggregatie home page: upcomingEvents, categories, panchanga en weather parallel; timezone-aware todayEvents |
| `getSadhanaDashboardInit` | `sadhana-dashboard.service.ts` | SSR aggregatie sadhana pagina: DB queries parallel, daarna panchanga gescheiden om connection pool timeouts te voorkomen |

`weatherService` gebruikt geen One Call API. Het dashboard combineert OpenWeather Current Weather, 5 Day Forecast, Air Pollution, kaarttegels en optioneel OpenWeather Alerts. Alerts worden via de aparte Alerts API opgehaald met een GeoJSON `Point` locatie (`coordinates: [lon, lat]`), zodat ontbrekende Alerts-toegang geen harde fout voor `/api/weer` wordt.

---

## 4. Repository Layer

| Repository | Verantwoordelijkheden |
|------------|-----------------------|
| `EventRepository` | Occurrences ophalen met complexe datum-filters en event details |
| `SadhanaRepository` | CRUD voor sessies, doelen, praktijken en routines (inclusief transactions) |
| `CategoryRepository` | Ophalen en beheren van categorieën |
| `DailyInfoRepository` | Batch queries voor tithi/nakshatra/sankranti data (gebruikt door recurrence engine) |
| `PreferenceRepository` | Single-user voorkeuren (upsert op id `"default"`) |

---

## 5. Validation System

Alle Zod schemas zijn gecentraliseerd in `src/lib/validations/` (gesplitst per domein: `event.ts`, `sadhana.ts`, `preferences.ts`, `shared.ts`). Barrel via `index.ts`. Nooit inline `z.object({...})` in routes.

### 5.1 Schema Overzicht

| Schema | Gebruik |
|--------|---------|
| `eventFormSchema` | Client-side formulier (leeg string toegestaan) |
| `createEventSchema` / `updateEventSchema` | Server-side API validatie (strikt) |
| `eventQuerySchema` | GET /api/events query parameters |
| `generateOccurrencesSchema` | POST /api/events/generate-occurrences |
| `updatePreferencesSchema` | PUT /api/preferences |
| `updateOccurrenceSchema` | PUT /api/events/[id]/occurrences/[occurrenceId] |
| `createSadhanaSessionSchema` / `patchSadhanaSessionSchema` | Sadhana sessies |
| `createSadhanaPracticeSchema` / `patchSadhanaPracticeSchema` | Sadhana praktijken |
| `createSadhanaGoalSchema` / `patchSadhanaGoalSchema` | Sadhana doelen |
| `createSadhanaRoutineSchema` / `patchSadhanaRoutineSchema` | Sadhana routines |
| `sadhanaCalendarQuerySchema` | GET /api/sadhana/stats/calendar query parameters |

### 5.2 Enum Schemas

Enum schemas worden dynamisch gegenereerd vanuit `src/lib/domain.ts` via `createEnumFromConstants()` — validatie en UI-opties zijn zo altijd synchroon.

### 5.3 Cross-Field Validatie

`withEventRecurrenceValidation()` is een `superRefine` wrapper:
- `YEARLY_LUNAR` / `MONTHLY_LUNAR` → tithi verplicht
- `YEARLY_SOLAR` → sankranti verplicht

### 5.4 Form → API Transform

`transformFormToApi(data: EventFormData)`:
- Leeg strings → `null`
- Tags string → `string[]` (split, trim, lowercase)
