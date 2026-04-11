# Dharma Calendar — Claude Context

## Huidige sessie
Bezig met punt-voor-punt review van Codex codebase feedback.
Aanpak: eerst alles analyseren en bespreken, daarna pas wijzigingen.

## Codex feedback review — status
1. **Sadhana migraties ontbreken** — geanalyseerd, bevestigd, oplossing bekend (zie hieronder)
11. **Repo-ruis** — opgelost: pyc/pycache uit git, scratch-bestanden verwijderd, .gitignore uitgebreid
12. **EventForm toont error-code** — nog te doen
2. Nog te bespreken punten van Codex volgen.

## Bekende technische schuld (bevestigd)

### Sadhana base tables hebben geen migraties
De tabellen `sadhana_practices`, `sadhana_sessions`, `sadhana_session_items`, `sadhana_goals`,
de enums `SadhanaPracticeType`/`SadhanaItemUnit`/`SadhanaGoalType`, en de join tabel
`_SadhanaGoalToSadhanaPractice` zijn **aangemaakt via `db push`**, niet via `prisma migrate dev`.
Ze bestaan lokaal in de DB maar hebben geen migration file.

**Risico:** Fresh deploy faalt — `prisma migrate deploy` draait `add_routines` die een FK naar
`sadhana_practices` aanmaakt, maar die tabel bestaat dan niet.

**Fix:** Migratie `20260409000000_add_sadhana_base_tables` aanmaken met SQL voor alle ontbrekende
tabellen, marked as applied lokaal, en ook `add_pradosh_to_ruletype` lokaal toepassen.

## Stack
- Next.js 16, React 19, Prisma 7, Tailwind 4, Zod 4, Luxon
- PostgreSQL via Docker lokaal (ontwikkeling)
- VPS deployment via Docker Compose, app op poort 53100

## Deployment conventions
- VPS app poort: 53100 (app VPN range)
- `docker compose` (v2 syntax, geen koppelteken)
- Migrate service via builder stage vóór app start
