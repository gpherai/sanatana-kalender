# Dharma Calendar — Operations

> Onderdeel van de technische documentatie. Zie [ARCHITECTURE.md](ARCHITECTURE.md) voor het overzicht.
> Deployment-specifieke instructies: [DEPLOYMENT.md](DEPLOYMENT.md)
> **Laatst bijgewerkt:** 7 juni 2026

---

## 1. Database Design

### 1.1 Models

| Model | Beschrijving |
|-------|--------------|
| `Category` | Godheden/categorieën met kleur, icoon en sortOrder. Definitie-bron: `src/config/categories.ts`. |
| `Event` | Master event definitie. Bevat recurrenceType, tithi, nakshatra, maas, sankranti, ruleType/ruleConfig voor automatische generatie, en unieke `namingKey` (overleeft hernoeming). |
| `EventCategory` | Many-to-many join Event ↔ Category. `sortOrder=0` is de primaire categorie (kleur/icoon op kalender). |
| `EventSeriesEntry` | Junction voor parent-child series (Navratri-dagen, etc.). Een event kan child zijn van meerdere parent series. |
| `EventOccurrence` | Concrete occurrence op een datum. `(eventId, date)` is uniek. |
| `DailyInfo` | Astronomische/lunaire data per dag: tithi, nakshatra, yoga, karana, maas, sankranti, samvat-jaren, zon/maan tijden. Bron voor de recurrence engine. |
| `UserPreference` | Single-user instellingen (thema, default kalenderweergave). Geüpsert op id `"default"`. |
| `SadhanaPractice` | Beoefening definitie (naam, type, mantra tekst, teller-grootte). |
| `SadhanaSession` | Sessie per dag met totaal-minuten en optionele notities. |
| `SadhanaSessionItem` | Lijn in een sessie: practice + quantity + unit (malas/count). |
| `SadhanaGoal` | Doel (dagelijks/wekelijks/lifetime) met target in malas en/of minuten. |
| `SadhanaRoutine` | Herbruikbare sessie-template: geordende lijst van practices met hoeveelheden. |
| `SadhanaRoutineItem` | Regel in een routine: practice + quantity + unit + sortOrder. |

### 1.2 Belangrijke Indexen

| Model | Index | Reden |
|-------|-------|-------|
| `Event` | `eventType`, `recurrenceType`, `tags` (GIN) | Filtering op kalender, array-zoekopdrachten |
| `EventOccurrence` | `date`, `endDate` | Primaire query-as voor de kalender |
| `DailyInfo` | `tithi`, `sankranti`, `(sankranti, date)` | Recurrence engine batch queries |
| `SadhanaSession` | `date` | Heatmap en streak berekeningen |

### 1.3 Enums

Vedische enums (`Tithi`, `Nakshatra`, `Maas`, `Sankranti`, `Paksha`) zijn volledig uitgeschreven in het schema en gespiegeld in `src/lib/domain.ts` voor runtime gebruik.

Functionele enums: `EventType`, `RecurrenceType`, `RuleType`, `TimingType`, `SadhanaPracticeType`, `SadhanaGoalType`.

### 1.4 Migrate Troubleshooting

Fout `42710 type already exists` of `42P07 table already exists`: schema bestaat al via `db push`.

Fix:
```bash
docker compose run --rm migrate npx prisma migrate resolve --applied <migration_name>
docker compose up -d
```

---

## 2. Code Quality

### 2.1 Pre-commit Hooks (Husky + lint-staged)

Bij elke commit automatisch:
- **Prettier**: formatteert `.ts`, `.tsx`, `.json`, `.md`, `.yml`, `.css`
- **ESLint** (`eslint-config-next`): lint + auto-fix `.ts`, `.tsx`

Commits falen als ESLint fouten niet auto-fixable zijn.

### 2.2 TypeScript

- Strict mode actief
- ES2022 target
- `npm run type-check` (`tsc --noEmit`) voor snelle lokale check

### 2.3 Testing

| Tool | Gebruik |
|------|---------|
| **Vitest** | Unit + integration tests |
| **@testing-library/react** | React component tests |
| **jsdom** | Browser environment simulatie |
| **@vitest/coverage-v8** | Code coverage (`npm run test:coverage`) |
| **Playwright** | End-to-end browser tests |

Tests staan co-located als `__tests__/` in de module die ze testen.

### 2.4 Overige Tooling

- **Knip** (`npm run knip`): detecteert ongebruikte exports, bestanden en dependencies
- **`npm run validate`**: voert `format:check` + `lint` + `type-check` in één commando uit

---

## 3. Scripts

### 3.1 Development

| Script | Commando |
|--------|----------|
| `dev` | `next dev --turbopack` |
| `build` | `next build` |
| `start` | `next start` |
| `lint` / `lint:fix` | ESLint |
| `type-check` | `tsc --noEmit` |
| `format` / `format:check` | Prettier |
| `validate` | format:check + lint + type-check + knip |
| `ci` | validate + test (volledige CI suite) |

### 3.2 Database

| Script | Beschrijving |
|--------|--------------|
| `db:generate` | Prisma client genereren na schema wijziging |
| `db:push` | Schema naar DB pushen (development, geen migratie) |
| `db:migrate` | Nieuwe migratie aanmaken en uitvoeren |
| `db:migrate:deploy` | Bestaande migraties uitvoeren (productie) |
| `db:migrate:reset` | DB resetten en alle migraties opnieuw uitvoeren |
| `db:seed` | Categorieën en basis data inladen |
| `db:cleanup` | Legacy events opschonen |
| `db:events` | Event catalog synchroniseren naar DB |
| `db:occurrences` | EventOccurrence records genereren (`--start`, `--end`, `--replace` flags) |
| `db:setup` | Volledig opzetten: seed + events + occurrences 2026–2029 |
| `db:reset` | Hard reset: migrate reset --force + db:setup |
| `db:studio` | Prisma Studio (visuele DB browser) |
| `db:pull-prod` | Database dump van VPS ophalen |
| `db:import-dump` | Prod dump importeren in lokale DB |

### 3.3 Deployment & Backup

| Script | Beschrijving |
|--------|--------------|
| `deploy:prod` | Backup + rebuild + restart op VPS |
| `deploy:prod:pull` | Zelfde als deploy:prod maar met --pull (image refresh) |
| `backup` | Broncode backup als tar.gz (excl. node_modules/.next) |
| `backup:db` | Database backup via Docker compose backup profile |

### 3.4 Tests

| Script | Beschrijving |
|--------|--------------|
| `test` | Alle tests eenmalig |
| `test:watch` | Watch mode |
| `test:coverage` | Met coverage rapport |
| `knip` | Ongebruikte code detecteren |

---

## 4. Lessons Learned

1. **Repository pattern is verplicht**: direct Prisma in UI components lijkt handig maar leidt tot duplicatie en technische schuld.
2. **Service layer voor aggregatie**: bij de Sadhana tracker is een service layer cruciaal voor consistente streaks en totalen over API endpoints.
3. **DB queries en CPU werk scheiden**: Swiss Ephemeris berekeningen (~500ms per dag) blokkeren de Prisma connection pool als ze parallel aan DB queries lopen — dit veroorzaakt 5000ms timeouts. Oplossing: DB queries eerst afwachten, dan panchanga berekenen.
4. **Client-only tab navigatie**: `window.history.replaceState` + `useSearchParams` is het correcte patroon. `router.replace` triggert SSR en herberekent alle panchanga data bij elke tab-switch.
5. **Tailwind v4 native CSS**: de overstap naar `@import` structuur heeft de codebase met duizenden regels verminderd en thema-onderhoud drastisch vereenvoudigd.
6. **Wire-format transformers in `lib/`**: `api-transformers.ts` is de enige definitie van het HTTP response format. Zowel API routes als SSR services gebruiken dezelfde transformer — nooit inline kopiëren.
7. **SSR hydration elimineren loading spinner**: voor pagina's met veel data laadt de Server Component alles en geeft het als `initialData` door. De Client Component hydrateert direct, zonder extra fetch roundtrip.
