# 🕉️ Dharma Calendar

> Persoonlijke spirituele kalender voor het bijhouden van Sanatana Dharma events, festivals en maanfasen.

## 📋 Beschrijving

Dharma Calendar is een Next.js applicatie voor het beheren van Hindu festivals, puja's, ekadashi's en andere spirituele gebeurtenissen. De app biedt:

- 📅 Kalenderweergave (maand/week/dag/agenda)
- 🌙 Maanfase tracking en zon/maan tijden
- 🏷️ Categorisatie per godheid (Ganesha, Shiva, Krishna, etc.)
- 🔍 Geavanceerd filteren en zoeken
- 🎨 Meerdere thema's met dark mode support
- 📍 Locatie-gebaseerde astronomische berekeningen

## 🚀 Installatie

### Optie 1: Docker (Aanbevolen)

```bash
# Clone repository
git clone <repo-url>
cd dharma-calendar

# Kopieer en configureer environment
cp .env.example .env.production
nano .env.production  # Pas wachtwoorden aan

# Start met Docker Compose
docker-compose --env-file .env.production up -d --build

# Check status
docker-compose ps
docker-compose logs -f app
```

De applicatie is nu beschikbaar op `http://localhost:3000`

### Optie 2: Lokale Development

#### Vereisten

- Node.js 24.x of hoger (LTS vanaf oktober 2025)
- PostgreSQL 17+
- npm

#### Stappen

```bash
# Clone repository
git clone <repo-url>
cd dharma-calendar

# Installeer dependencies
npm install

# Kopieer environment file en configureer
cp .env.example .env
# Edit .env met je DATABASE_URL

# Database setup
npm run db:generate    # Genereer Prisma client
npm run db:push        # Push schema naar database
npm run db:seed        # Seed met testdata

# Start development server
npm run dev
```

## ⚙️ Configuratie

### Environment Variables

| Variabele | Verplicht | Beschrijving |
|-----------|-----------|--------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NODE_ENV` | ❌ | `development` / `production` |
| `POSTGRES_USER` | Docker | Database gebruiker |
| `POSTGRES_PASSWORD` | Docker | Database wachtwoord |
| `POSTGRES_DB` | Docker | Database naam |

### Database

De applicatie gebruikt PostgreSQL met Prisma ORM. Connection string format:

```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
```

## 🏃 Uitvoeren

### Docker

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Logs bekijken
docker-compose logs -f app

# Database backup
docker-compose --profile backup run --rm backup
```

### Development

```bash
npm run dev
```

Opent op `http://localhost:3000`

### Production Build

```bash
npm run build
npm run start
```

### Database Commands

```bash
npm run db:generate  # Regenereer Prisma client
npm run db:push      # Push schema changes
npm run db:seed      # Seed database
npm run db:reset     # Reset en reseed database
npm run db:studio    # Open Prisma Studio GUI
```

## 🔧 Health Check

De applicatie heeft een health endpoint voor monitoring:

```
GET /api/health
```

Response (200 OK):
```json
{
  "status": "healthy",
  "timestamp": "2025-11-28T12:00:00.000Z",
  "version": "0.10.0",
  "checks": {
    "database": { "status": "up", "latencyMs": 5 }
  }
}
```

## 📁 Project Structuur

```
dharma-calendar/
├── docs/                    # Documentatie
│   ├── ARCHITECTURE.md      # Technische architectuur
│   ├── CHANGELOG.md         # Ontwikkelingslog
│   ├── DEPLOYMENT.md        # VPS deployment guide
│   └── TODO.md              # Roadmap
├── prisma/
│   └── schema.prisma        # Database schema
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/             # API endpoints
│   │   ├── events/          # Event pages
│   │   └── settings/        # Settings page
│   ├── components/          # React components
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # Utilities
│   ├── services/            # Business logic
│   └── types/               # TypeScript types
├── scripts/                 # Helper scripts
├── Dockerfile               # Container build
└── docker-compose.yml       # Container orchestration
```

## 🐛 Troubleshooting

### Database Connection Failed

1. Controleer of PostgreSQL draait
2. Verifieer `DATABASE_URL` in `.env`
3. Test connectie: `npx prisma db pull`

### Prisma Client Errors

```bash
npm run db:generate
```

### Port Already in Use

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>
```

### Docker Issues

```bash
# Rebuild containers
docker-compose build --no-cache

# Reset everything (⚠️ deletes data)
docker-compose down -v
docker-compose up -d --build

# Check container logs
docker-compose logs db
docker-compose logs app
```

## 📊 Tech Stack

| Technologie | Versie | Doel |
|-------------|--------|------|
| Next.js | 16.x | Framework |
| React | 19.x | UI Library |
| TypeScript | 5.x | Type Safety |
| Tailwind CSS | 4.x | Styling |
| Prisma | 7.x | ORM |
| PostgreSQL | 17+ | Database |
| Zod | 4.x | Validation |
| react-big-calendar | 1.x | Calendar |
| suncalc | 1.9 | Astronomy |
| Docker | 24+ | Containerization |

## 📚 Documentatie

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Technische architectuur
- [DEPLOYMENT.md](docs/DEPLOYMENT.md) - VPS deployment guide
- [CHANGELOG.md](docs/CHANGELOG.md) - Ontwikkelingsgeschiedenis
- [TODO.md](docs/TODO.md) - Roadmap en features

## 📄 Licentie

Private project - Alle rechten voorbehouden.

---

**Versie:** 0.10.0
**Status:** Production Ready 🚀
**Laatst bijgewerkt:** 24 december 2025
