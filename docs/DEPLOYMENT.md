# 🚀 Dharma Calendar - Deployment Guide

> **Versie:** 1.0  
> **Laatst bijgewerkt:** 28 november 2025

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
cp .env.example .env.production
nano .env.production  # Edit with your settings

# 3. Build and start
docker-compose --env-file .env.production up -d --build

# 4. Check status
docker-compose ps
docker-compose logs -f app
```

De applicatie is nu beschikbaar op `http://your-server:3000`

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

Maak een productie environment file:

```bash
cp .env.example .env.production
```

Edit `.env.production`:

```bash
# =============================================================================
# PRODUCTION ENVIRONMENT
# =============================================================================

# Database
POSTGRES_USER=dharma
POSTGRES_PASSWORD=<STRONG_PASSWORD_HERE>  # Genereer: openssl rand -base64 32
POSTGRES_DB=dharma_calendar

# Application
NODE_ENV=production
APP_PORT=3000

# Optional: Expose DB port (remove in production)
# DB_PORT=5432
```

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

# Build images
docker-compose --env-file .env.production build

# Start services
docker-compose --env-file .env.production up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Seed Database (Eerste keer)

```bash
# Enter app container
docker-compose exec app sh

# Inside container: seed database
npx prisma db seed

# Exit container
exit
```

### Verify Deployment

```bash
# Check health endpoint
curl http://localhost:3000/api/health

# Expected response:
# {"status":"healthy","timestamp":"...","version":"0.5.0","checks":{"database":{"status":"up","latencyMs":5}}}
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
        proxy_pass http://127.0.0.1:3000;
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
        proxy_pass http://127.0.0.1:3000/api/health;
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
docker-compose --profile backup run backup

# Setup cron job for daily backups at 2 AM
crontab -e
```

Add to crontab:
```cron
0 2 * * * cd /opt/dharma-calendar && docker-compose --env-file .env.production --profile backup run --rm backup
```

### Restore from Backup

```bash
# Stop app
docker-compose stop app

# Restore database
gunzip -c backups/dharma_calendar_20251128_020000.sql.gz | \
  docker-compose exec -T db psql -U dharma -d dharma_calendar

# Start app
docker-compose start app
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

HEALTH_URL="http://localhost:3000/api/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ "$RESPONSE" != "200" ]; then
    echo "❌ Health check failed! Status: $RESPONSE"
    # Send alert (email, Slack, etc.)
    # docker-compose restart app
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
docker-compose logs -f

# View app logs only
docker-compose logs -f app

# View last 100 lines
docker-compose logs --tail=100 app
```

---

## 🔄 Updates

### Update Procedure

```bash
cd /opt/dharma-calendar

# 1. Pull latest code
git pull origin main

# 2. Backup database first!
docker-compose --profile backup run --rm backup

# 3. Rebuild and restart
docker-compose --env-file .env.production build
docker-compose --env-file .env.production up -d

# 4. Verify
docker-compose ps
curl http://localhost:3000/api/health
```

### Rollback

```bash
# Rollback to previous version
git checkout <previous-commit-hash>
docker-compose --env-file .env.production build
docker-compose --env-file .env.production up -d
```

---

## 🔧 Troubleshooting

### Container Start Issues

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs app
docker-compose logs db

# Restart specific service
docker-compose restart app
```

### Database Connection Failed

```bash
# Check if DB container is running
docker-compose ps db

# Check DB logs
docker-compose logs db

# Test connection from app container
docker-compose exec app sh
nc -z db 5432 && echo "OK" || echo "FAIL"
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
# ⚠️ WARNING: This deletes all data!
docker-compose down -v
docker-compose --env-file .env.production up -d --build
```

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
1. Check de logs: `docker-compose logs -f`
2. Controleer de health endpoint: `curl localhost:3000/api/health`
3. Bekijk TROUBLESHOOTING sectie hierboven
4. Check ARCHITECTURE.md voor technische details

---

**Veel succes met je deployment! 🕉️**
