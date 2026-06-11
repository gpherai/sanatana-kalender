# API Contracten (Read-Only)

Deze kalenderapplicatie stelt specifieke read-only API-endpoints beschikbaar voor externe integraties (bijvoorbeeld een persoonlijk home-dashboard). Mutaties zijn strikt voorbehouden aan de kalender zelf.

## 1. Events API
**Endpoint:** `GET /api/events`

**Query Parameters:**
- `start` (string, optioneel): Startdatum. **Verwacht formaat: `YYYY-MM-DD`** (lokale kalenderdatum). ISO-datetimes (zoals `2025-01-01T12:00:00Z`) worden afgewezen met een 400 Bad Request.
- `end` (string, optioneel): Einddatum. **Verwacht formaat: `YYYY-MM-DD`**. Moet tegelijk met `start` worden opgegeven.
- `limit` (number, optioneel): Maximaal aantal resultaten (default: 5000, max: 5000).
- `skip` (number, optioneel): Aantal over te slaan resultaten (default: 0).

**Response Shape:**
Array van CalendarEvent objecten.

## 2. Daily Info API
**Endpoint:** `GET /api/daily-info?date=YYYY-MM-DD`

**Response Shape:**
Bevat astrologische panchanga-data zoals tithi, nakshatra, zon/maan opkomst en ondergang in lokale tijdzone (Europe/Amsterdam).

## 3. Weer API
**Endpoint:** `GET /api/weer?lat=...&lon=...`

**Response Shape:**
Weer-informatie passend bij de locatie voor de komende dagen.

## 4. Sadhana API (Today)
**Endpoint:** `GET /api/sadhana/stats/today?date=YYYY-MM-DD`

**Response Shape:**
Informatie over behaalde doelen van vandaag.

## 5. Sadhana API (Streak)
**Endpoint:** `GET /api/sadhana/stats/streak`

**Response Shape:**
Huidige streak count en langste streak count.
