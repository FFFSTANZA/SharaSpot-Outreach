# SharaSpot — VPS Deployment Guide

Production deployment guide for Hostinger VPS (Ubuntu 22.04/24.04).

## Architecture — Zero Cloud Costs

```
Internet
  └── Nginx (80/443) — reverse proxy + SSL
        ├── Frontend  → localhost:3000 (Next.js)
        └── API       → localhost:8000 (Express)
              ├── PostgreSQL (local :5432) — $0
              ├── Redis (local :6379)      — $0
              └── Worker process            — email sending + reply detection
```

**Total infrastructure cost: ~$6/month** (just the VPS)

## Prerequisites

- Hostinger VPS with Ubuntu 22.04 or 24.04
- Domain name pointed to your VPS IP
- Google OAuth Client ID (already configured)

---

## Step 1: Initial VPS Setup

SSH into your VPS:

```bash
# Clone the repo
git clone <your-repo-url> ~/SharaSpot
cd ~/SharaSpot

# Run the setup script
# Installs: Node.js 22, PostgreSQL 16, Redis 7, Nginx
# Creates:  sharaspot user + local database
sudo bash deploy/setup-vps.sh
```

**Save the output!** The script generates and displays:
- Database password
- Redis password
- Encryption key
- JWT secrets

---

## Step 2: Configure Environment Variables

```bash
cp server/.env.example server/.env
nano server/.env
```

**server/.env:**
```
DATABASE_URL=postgresql://sharaspot:<DB_PASSWORD>@localhost:5432/sharaspot
REDIS_URL=redis://:<REDIS_PASSWORD>@localhost:6379
ENCRYPTION_KEY=<from setup script>
JWT_ACCESS_SECRET=<from setup script>
JWT_REFRESH_SECRET=<from setup script>
GOOGLE_CLIENT_ID=<your-google-client-id>.apps.googleusercontent.com
TRACKING_BASE_URL=https://yourdomain.com
```

```bash
cp client/.env.example client/.env
nano client/.env
```

**client/.env:**
```
NEXT_PUBLIC_BACKEND_URL=https://yourdomain.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-google-client-id>.apps.googleusercontent.com
```

---

## Step 3: Unified Production Deployment

The quickest way to deploy is using the unified production script, which handles dependencies, database migrations, building, and process management via PM2.

```bash
bash deploy/production-deploy.sh
```

This script:
1.  Installs/Updates dependencies (`npm install`).
2.  Applies database migrations (`prisma migrate deploy`).
3.  Builds the API and Worker (`tsc`).
4.  Builds the Frontend (`next build`).
5.  Orchestrates all services using PM2 (`ecosystem.config.js`).

To view status:
```bash
pm2 status
pm2 monit
```

---

## Step 4: Configure Nginx

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/sharaspot
sudo nano /etc/nginx/sites-available/sharaspot
# Replace YOUR_DOMAIN with your actual domain

sudo ln -s /etc/nginx/sites-available/sharaspot /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

---

## Step 5: Set up SSL

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## Step 6: Verify

```bash
# Check all services
sudo systemctl status sharaspot-api sharaspot-worker sharaspot-frontend

# View logs
journalctl -u sharaspot-api -f
journalctl -u sharaspot-worker -f

# Test
curl https://yourdomain.com                    # Frontend
curl https://yourdomain.com/track/open/test    # Tracking pixel
```

---

## Alternative: PM2

```bash
npm install -g pm2
cd server && npm ci --production && npx prisma migrate deploy && npm run build
cd ../client && npm ci && npm run build
cd /home/sharaspot/SharaSpot
pm2 start ecosystem.config.js
pm2 save && pm2 startup
```

## Alternative: Docker

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
# Edit both .env files
docker compose up -d --build
```

---

## Database Migrations — Rollback Strategy

Always test migrations in a staging environment before applying to production.

### Prisma migrate status
```bash
cd server && npx prisma migrate status
```

### Rollback a failed migration
Prisma does not have a built-in `migrate rollback`. To revert:

1. Identify the last migration name from `server/prisma/migrations/`
2. Revert the database schema manually:
   ```bash
   # Connect to PostgreSQL and run the DOWN SQL for the migration
   psql -U sharaspot -d sharaspot -h localhost -c "DROP TABLE IF EXISTS <migration_table> CASCADE;"
   ```
3. Delete the migration folder:
   ```bash
   rm -rf server/prisma/migrations/<bad_migration_name>
   ```
4. Re-apply all remaining migrations:
   ```bash
   cd server && npx prisma migrate deploy
   ```

For safety, always back up the database before deploying migrations:
```bash
pg_dump -U sharaspot -h localhost sharaspot > /tmp/sharaspot-backup-$(date +%Y%m%d).sql
```

---

## Updating

```bash
bash deploy/update.sh
```

---

## Production Notes

### Redis High Availability
The current setup runs a single Redis instance (no Sentinel/Cluster). If Redis goes down, BullMQ queued jobs may be lost, and rate limiter state resets. For production:

- **Option 1 (Recommended):** Use a managed Redis service (e.g., Upstash, Redis Cloud) — eliminates the SPOF and provides persistence, backups, and automatic failover.
- **Option 2:** Run Redis with Sentinel for automatic failover. Configure 3 Sentinel nodes and a Redis replica.

Redis AOF persistence is enabled via `appendonly yes` in the container config to minimize data loss.

---

## Useful Commands

```bash
# Logs
journalctl -u sharaspot-api -f
journalctl -u sharaspot-worker -f
journalctl -u sharaspot-frontend -f

# Restart
sudo systemctl restart sharaspot-api

# Database
cd server && npx prisma migrate deploy
cd server && npx prisma studio

# PostgreSQL CLI
psql -U sharaspot -d sharaspot -h localhost

# Redis CLI
redis-cli -a <password>
```

---

## Troubleshooting

### API won't start
```bash
journalctl -u sharaspot-api --no-pager -n 100
# Verify .env has correct DATABASE_URL
```

### Database connection failed
```bash
# Test connection
PGPASSWORD=<password> psql -U sharaspot -d sharaspot -h localhost -c "SELECT 1"
```

### Redis connection refused
```bash
redis-cli -a <password> ping
# Should return PONG
```

### Tracking not working
```bash
# TRACKING_BASE_URL must be your public domain
curl -I https://yourdomain.com/track/open/test
# Should return Content-Type: image/gif
```

### Tracking pruning not working
```bash
# Check TRACKING_PRUNE_AFTER_DAYS and TRACKING_PRUNE_BATCH_SIZE in .env
# Verify the worker process is running
```
