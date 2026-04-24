# 🚀 Dharma Calendar - Deployment Guide

> **Versie:** 1.5<br>
> **Laatst bijgewerkt:** 24 april 2026

Dit document beschrijft hoe je Dharma Calendar deployt op een VPS met Docker.

---

## 📋 Inhoudsopgave

1. [Vereisten](#-vereisten)
2. [Quick Start](#-quick-start)
3. [VPS Setup](#-vps-setup)
4. [Configuratie](#-configuratie)
5. [Deployment](#-deployment)
6. [Reverse Proxy](#-reverse-proxy-nginx)
7. [SSL/HTTPS](#-sslhttps)
8. [Backups](#-backups)
9. [Monitoring](#-monitoring)
10. [Updates](#-updates)
11. [Troubleshooting](#-troubleshooting)

---

## 📦 Vereisten

### VPS Specificaties (Minimum)

| Resource | Minimum | Aanbevolen |
|----------|---------|------------|
| CPU | 1 vCPU | 2 vCPU |
| RAM | 1 GB | 2 GB |
| Storage | 10 GB SSD | 20 GB SSD |
| OS | Ubuntu 22.04+ / Debian 12+ | Ubuntu 24.04 LTS |

### Software

- Docker 24+
- Docker Compose v2+
- Git
- (Optioneel) Nginx voor reverse proxy

---

## ⚡ Quick Start

```bash
# 1. Clone repository
git clone https://github.com/your-repo/dharma-calendar.git
cd dharma-calendar

# 2. Create environment file
cp .env.example .env
nano .env  # Edit with your settings

# 3. Build and start safely (maakt eerst een database-backup)
./scripts/deploy-prod.sh

# 4. Check status
docker compose ps
docker compose logs -f app
```

De applicatie is nu beschikbaar op `http://your-server:${APP_PORT}` (standaard 53100).

---

## 🖥️ VPS Setup

### 1. Basis Server Configuratie

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essentials
sudo apt install -y curl git ufw

# Configure firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Docker Installatie

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker compose version
```

### 3. Project Clone

```bash
# Create app directory
sudo mkdir -p /opt/dharma-calendar
sudo chown $USER:$USER /opt/dharma-calendar

# Clone repository
cd /opt/dharma-calendar
git clone https://github.com/your-repo/dharma-calendar.git .
```

---

## ⚙️ Configuratie

### Environment Variables

Maak een productie environment file. Docker Compose leest `.env` automatisch:

```bash
cp .env.example .env
```

Edit `.env`:

```bash
# =============================================================================
# PRODUCTION ENVIRONMENT
# =============================================================================

# Database
POSTGRES_USER=dharma
POSTGRES_PASSWORD=<STRONG_PASSWORD_HERE>  # Genereer: openssl rand -base64 32
POSTGRES_DB=dharma_calendar

# Application
APP_PORT=53100

# Prod-overrides: sluit DB-poort af, voegt resource limits + log rotation toe
COMPOSE_FILE=docker-compose.yml:docker-compose.prod.yml
```

Als je toch `.env.production` wilt gebruiken, start de deploy dan met `ENV_FILE=.env.production ./scripts/deploy-prod.sh`.

### Secrets Genereren

```bash
# Generate secure password
openssl rand -base64 32
```

---

## 🐳 Deployment

### Eerste Deployment

```bash
cd /opt/dharma-calendar

# Build images en start veilig
./scripts/deploy-prod.sh

# Check status
docker compose ps

# View logs
docker compose logs -f
```

> **Migraties:** De `migrate` service (`dharma-migrate`) draait automatisch vóór de app en past openstaande database-migraties toe.
>
> **Database-veiligheid:** Gebruik op productie `./scripts/deploy-prod.sh` in plaats van direct `docker compose up -d --build`. Dat script maakt eerst een PostgreSQL-backup in `./backups` en stopt de deploy als die backup faalt.

> **Prod-overrides:** `docker-compose.prod.yml` sluit DB-poort 5432 extern af en voegt resource limits + log rotation toe. Zorg dat `.env` de volgende regel bevat zodat beide bestanden automatisch worden geladen:
> ```
> COMPOSE_FILE=docker-compose.yml:docker-compose.prod.yml
> ```
> ⚠️ **Security:** Docker's port binding bypassed UFW standaard via iptables. Zonder de prod-override is poort 5432 bereikbaar van buiten — ook als UFW dat blokkeert.

### Seed Database (Eerste keer)

De runner-container is een minimale standalone-image zonder `npm`. Gebruik de `seeder` service (draait op de builder stage met volledige deps):

```bash
# Stap 1: seed categorieën & voorkeuren
docker compose --env-file .env.production --profile seed run --rm seeder \
  -c "npm run db:seed"

# Stap 2: sync event-catalog naar database
docker compose --env-file .env.production --profile seed run --rm seeder \
  -c "npm run db:events"

# Stap 3: genereer event occurrences voor gewenste periode
docker compose --env-file .env.production --profile seed run --rm seeder \
  -c "npm run db:occurrences -- --start 2026-01-01 --end 2029-12-31 --replace"
```

> **Let op:** De database bevat events van 2026 t/m 2029. Pas `--start` en `--end` aan als je een andere periode wilt.

### Verify Deployment

```bash
# Check health endpoint (vervang 3000 door jouw APP_PORT indien afwijkend)
curl http://localhost:${APP_PORT:-3000}/api/health

# Expected response:
# {"status":"ok"}
```

---

## 🔄 Reverse Proxy (Nginx)

### 1. Install Nginx

```bash
sudo apt install -y nginx
```

### 2. Configure Virtual Host

```bash
sudo nano /etc/nginx/sites-available/dharma-calendar
```

```nginx
server {
    listen 80;
    server_name calendar.yourdomain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy settings
    location / {
        proxy_pass http://127.0.0.1:53100;  # pas aan naar jouw APP_PORT
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Health check (for monitoring)
    location /api/health {
        proxy_pass http://127.0.0.1:53100/api/health;  # pas aan naar jouw APP_PORT
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        access_log off;
    }
}
```

### 3. Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/dharma-calendar /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 SSL/HTTPS

### Let's Encrypt met Certbot

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d calendar.yourdomain.com

# Auto-renewal is configured automatically
# Test renewal:
sudo certbot renew --dry-run
```

---

## 💾 Backups

### Automatische Database Backup

```bash
# Create backup directory
mkdir -p /opt/dharma-calendar/backups

# Run backup manually
docker compose --profile backup run --rm backup

# Setup cron job for daily backups at 2 AM
crontab -e
```

Add to crontab:
```cron
0 2 * * * cd /opt/dharma-calendar && docker compose --profile backup run --rm backup >> backups/backup.log 2>&1
```

Backups worden standaard 30 dagen bewaard. Zet `BACKUP_RETENTION_DAYS=60` in `.env` als je ze langer wilt bewaren.

### Restore from Backup

```bash
# Stop app
docker compose stop app

# Restore database
gunzip -c backups/dharma_calendar_20251128_020000.sql.gz | \
  docker compose exec -T db psql -U dharma -d dharma_calendar

# Start app
docker compose start app
```

### Productie-data Lokaal Halen

Om de live database naar je lokale omgeving te kopiëren (bijv. voor debuggen):

```bash
# Trek een dump van de VPS (standaard: gerald@10.0.0.30 poort 53001)
npm run db:pull-prod

# Importeer de dump lokaal (vraagt om bevestiging voordat het overschrijft)
npm run db:import-dump
```

Omgevingsvariabelen zijn al correct als standaard ingesteld voor deze VPS:
- `VPS_HOST` — moet je zelf instellen (bv. `export VPS_HOST=10.0.0.30`)
- `VPS_SSH_PORT` — standaard `22`; voor deze VPS `53001`
- `VPS_PATH` — standaard `/opt/dharma-calendar` ✓
- `DB_USER` — standaard `dharma` ✓

Snelste aanroep:
```bash
VPS_HOST=10.0.0.30 VPS_SSH_PORT=53001 npm run db:pull-prod
```

### Backup Offsite

```bash
# Sync backups to remote storage (example with rsync)
rsync -avz /opt/dharma-calendar/backups/ user@backup-server:/backups/dharma-calendar/

# Or use rclone for cloud storage
rclone sync /opt/dharma-calendar/backups/ remote:dharma-backups/
```

---

## 📊 Monitoring

### Health Check Script

```bash
#!/bin/bash
# /opt/dharma-calendar/scripts/health-check.sh

HEALTH_URL="http://localhost:${APP_PORT:-3000}/api/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ "$RESPONSE" != "200" ]; then
    echo "❌ Health check failed! Status: $RESPONSE"
    # Send alert (email, Slack, etc.)
    # docker compose restart app
    exit 1
fi

echo "✅ Health check passed"
```

### Cron Health Check

```cron
*/5 * * * * /opt/dharma-calendar/scripts/health-check.sh >> /var/log/dharma-health.log 2>&1
```

### Docker Logs

```bash
# View all logs
docker compose logs -f

# View app logs only
docker compose logs -f app

# View last 100 lines
docker compose logs --tail=100 app
```

---

## 🔄 Updates

### Update Procedure

```bash
cd /opt/dharma-calendar

# 1. Pull latest code
git pull origin main

# 2. Backup + rebuild + restart (migraties draaien automatisch)
./scripts/deploy-prod.sh

# Bij een volledige no-cache rebuild:
# ./scripts/deploy-prod.sh --no-cache

# 3. Sync event-catalog als event-naming.ts gewijzigd is (zie hieronder)

# 4. Verify
docker compose ps
curl http://localhost:${APP_PORT:-3000}/api/health
```

### Event-catalog Syncen na Update

Als `src/config/event-naming.ts` gewijzigd is (nieuwe events, bijgewerkte beschrijvingen of tags), sync dan de catalog naar de database via de `migrate`-service (builder stage met volledige devDependencies):

```bash
docker compose run --rm migrate node_modules/.bin/tsx \
  --tsconfig tsconfig.json \
  src/scripts/generate-events-from-naming.ts
```

> **Waarom niet `docker compose exec app`?** De productie-image installeert geen devDependencies, dus `tsx` is niet beschikbaar in de `app`-container. De `migrate`-service draait op de builder stage en heeft wel alle tools.

Alleen nodig bij occurrences-wijzigingen (nieuwe events of aangepaste rekenregels):

```bash
docker compose run --rm migrate node_modules/.bin/tsx \
  --tsconfig tsconfig.json \
  src/scripts/generate-occurrences.ts \
  --start 2026-01-01 --end 2029-12-31 --replace
```

### Rollback

```bash
# Rollback to previous version
git checkout <previous-commit-hash>
./scripts/deploy-prod.sh
```

---

## 🔧 Troubleshooting

### Migrate Service Faalt

```bash
# Bekijk de foutmelding
docker logs dharma-migrate
```

**Fout `42710 type already exists` of `42P07 table already exists`:** De schema is eerder aangemaakt via `db push`. Markeer de migratie als toegepast zonder haar opnieuw te draaien:

```bash
docker compose run --rm migrate npx prisma migrate resolve --applied <migration_name>
docker compose up -d
```

### Container Start Issues

```bash
# Check container status
docker compose ps

# View logs
docker compose logs app
docker compose logs db

# Restart specific service
docker compose restart app
```

### Database Connection Failed

```bash
# Check if DB container is running
docker compose ps db

# Check DB logs
docker compose logs db

# Test DB bereikbaarheid via de migrate container (heeft wel psql)
docker compose run --rm migrate sh -c \
  "psql \$DATABASE_URL -c 'SELECT 1' && echo OK || echo FAIL"
```

### Port Already in Use

```bash
# Find process using port
sudo lsof -i :3000
sudo lsof -i :5432

# Kill process
sudo kill -9 <PID>
```

### Reset Everything

```bash
# ⚠️ WAARSCHUWING: Dit verwijdert ALLE database-data — events, sadhana, alles.
# Maak eerst een handmatige backup:
docker compose --profile backup run --rm backup

# Dan pas resetten:
docker compose down -v
./scripts/deploy-prod.sh
```

> `deploy-prod.sh` blokkeert `-v` en `down` als argumenten om ongelukken te voorkomen.
> `docker compose down -v` mag je alleen direct uitvoeren na een expliciete backup.

### View Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df
```

---

## 📁 File Structure (Production)

```
/opt/dharma-calendar/
├── .env.production         # Production environment
├── docker-compose.yml      # Docker configuration
├── Dockerfile              # App image definition
├── backups/                # Database backups
│   └── dharma_calendar_*.sql.gz
├── scripts/
│   ├── docker-entrypoint.sh
│   ├── backup-db.sh
│   ├── deploy-prod.sh
│   └── health-check.sh
└── ... (source code)
```

---

## 🔐 Security Checklist

- [ ] Strong database password (32+ characters)
- [ ] Firewall configured (UFW)
- [ ] SSL/HTTPS enabled
- [ ] DB port not exposed externally
- [ ] Regular backups configured
- [ ] Health monitoring active
- [ ] Container runs as non-root user
- [ ] Docker images updated regularly

---

## 📞 Support

Bij problemen:
1. Check de logs: `docker compose logs -f`
2. Controleer de health endpoint: `curl localhost:${APP_PORT:-3000}/api/health`
3. Bekijk TROUBLESHOOTING sectie hierboven
4. Check ARCHITECTURE.md voor technische details

---

**Veel succes met je deployment! 🕉️**
