#!/bin/bash
# ─── SharaSpot One-Click Deploy — Pre-configured for sharaspot.in ───
#
# Just paste this into your VPS terminal and watch it work.
# No questions asked. Everything is pre-filled.

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()   { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
err()   { echo -e "${RED}[✗]${NC} $1"; exit 1; }

DOMAIN="sharaspot.in"
REPO_URL="https://github.com/FFFSTANZA/SharaSpot-Outreach.git"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBibWtsYnZrdHBiemJ2enBhbWx1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTMxNzUzOCwiZXhwIjoyMDkwODkzNTM4fQ.-GEXB4uMBop6zVsiXsrlTfOCscVpewedZxAULhYs5p4"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     SharaSpot — Deploying to sharaspot.in    ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""

# ─── 1. System Setup ───
log "Updating system packages..."
export DEBIAN_FRONTEND=noninteractive
apt update -qq && apt upgrade -y -qq

log "Installing dependencies..."
apt install -y -qq curl git build-essential ufw fail2ban unzip postgresql postgresql-contrib redis-server nginx cron

log "Starting services..."
systemctl enable postgresql redis-server nginx
systemctl start postgresql redis-server nginx

# ─── 2. Generate Secrets ───
DB_PASSWORD=$(openssl rand -hex 16)
REDIS_PASSWORD=$(openssl rand -hex 16)
ENCRYPTION_KEY=$(openssl rand -hex 32)
JWT_ACCESS=$(openssl rand -hex 32)
JWT_REFRESH=$(openssl rand -hex 32)

# ─── 3. Database Setup ───
log "Creating database..."
su - postgres -c "psql -c \"SELECT 1 FROM pg_roles WHERE rolname='sharaspot'\" | grep -q 1 || createuser sharaspot"
su - postgres -c "psql -c \"ALTER USER sharaspot WITH PASSWORD '${DB_PASSWORD}';\""
su - postgres -c "psql -c \"SELECT 1 FROM pg_database WHERE datname='sharaspot'\" | grep -q 1 || createdb -O sharaspot sharaspot"

# Redis password
grep -q "^requirepass" /etc/redis/redis.conf 2>/dev/null && sed -i "s/^requirepass.*/requirepass ${REDIS_PASSWORD}/" /etc/redis/redis.conf || echo "requirepass ${REDIS_PASSWORD}" >> /etc/redis/redis.conf
systemctl restart redis-server

# ─── 4. Create User ───
if ! id -u sharaspot &>/dev/null; then
  useradd -m -s /bin/bash sharaspot
  log "Created user 'sharaspot'"
fi

mkdir -p /home/sharaspot/SharaSpot
chown -R sharaspot:sharaspot /home/sharaspot/SharaSpot

# ─── 5. Clone Repo ───
log "Cloning repository..."
if [ -d "/home/sharaspot/SharaSpot/.git" ]; then
  log "Repo already exists, pulling latest..."
  su - sharaspot -c "cd /home/sharaspot/SharaSpot && git pull"
else
  su - sharaspot -c "git clone ${REPO_URL} /home/sharaspot/SharaSpot"
fi

# ─── 6. Write .env Files ───
log "Writing server .env..."
cat > /home/sharaspot/SharaSpot/server/.env <<ENVEOF
PORT=8000
NODE_ENV=production
DATABASE_URL=postgresql://sharaspot:${DB_PASSWORD}@localhost:5432/sharaspot
REDIS_URL=redis://:${REDIS_PASSWORD}@localhost:6379
ENCRYPTION_KEY=${ENCRYPTION_KEY}
JWT_ACCESS_SECRET=${JWT_ACCESS}
JWT_REFRESH_SECRET=${JWT_REFRESH}
GOOGLE_CLIENT_ID=354664818470-veljl4900p28hf0i81u0r959ra11ihjt.apps.googleusercontent.com
SUPABASE_URL=https://pbmklbvktpbzbvzpamlu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_KEY}
SUPABASE_BUCKET_NAME=sharaspot-attachments
TRACKING_BASE_URL=https://${DOMAIN}
WORKER_CONCURRENCY=5
MIN_DELAY_MS=2000
REPLY_CHECK_INTERVAL_MS=300000
REPLY_LOOKBACK_HOURS=24
ADAPTIVE_POLL_WINDOW_HOURS=48
IMAP_POOL_REUSE_MS=45000
IMAP_IDLE_TIMEOUT_MS=1740000
TRACKING_BATCH_SIZE=100
TRACKING_FLUSH_INTERVAL_MS=5000
TRACKING_PRUNE_AFTER_DAYS=30
TRACKING_PRUNE_BATCH_SIZE=5000
STALE_SENDING_THRESHOLD_MS=300000
STALE_SWEEP_INTERVAL_MS=120000
SEQUENCE_SCHEDULER_INTERVAL_MS=900000
AUTO_RESUME_INTERVAL_MS=3600000
ENVEOF

log "Writing client .env..."
cat > /home/sharaspot/SharaSpot/client/.env <<ENVEOF
NEXT_PUBLIC_BACKEND_URL=https://${DOMAIN}
NEXT_PUBLIC_GOOGLE_CLIENT_ID=354664818470-veljl4900p28hf0i81u0r959ra11ihjt.apps.googleusercontent.com
ENVEOF

chown -R sharaspot:sharaspot /home/sharaspot/SharaSpot

# ─── 7. Install Node.js 22 ───
if ! command -v node &>/dev/null; then
  log "Installing Node.js 22..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt install -y -qq nodejs
else
  log "Node.js already installed: $(node -v)"
fi

# ─── 8. Build & Deploy ───
log "Building server..."
cd /home/sharaspot/SharaSpot/server
npm ci --ignore-scripts 2>/dev/null || npm install --ignore-scripts
npx prisma generate
npx prisma migrate deploy
npm run build

log "Building client..."
cd /home/sharaspot/SharaSpot/client
npm ci 2>/dev/null || npm install
npm run build

# ─── 9. Systemd Services ───
log "Setting up systemd services..."

cat > /etc/systemd/system/sharaspot-api.service <<SVCEOF
[Unit]
Description=SharaSpot API Server
After=network.target postgresql.service redis.service
Wants=postgresql.service redis.service

[Service]
Type=simple
User=sharaspot
Group=sharaspot
WorkingDirectory=/home/sharaspot/SharaSpot/server
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=/home/sharaspot/SharaSpot/server/.env
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
SVCEOF

cat > /etc/systemd/system/sharaspot-worker.service <<SVCEOF
[Unit]
Description=SharaSpot Email Worker
After=network.target postgresql.service redis.service sharaspot-api.service
Wants=postgresql.service redis.service

[Service]
Type=simple
User=sharaspot
Group=sharaspot
WorkingDirectory=/home/sharaspot/SharaSpot/server
ExecStart=/usr/bin/node dist/worker/index.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=/home/sharaspot/SharaSpot/server/.env
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
SVCEOF

cat > /etc/systemd/system/sharaspot-frontend.service <<SVCEOF
[Unit]
Description=SharaSpot Next.js Frontend
After=network.target sharaspot-api.service

[Service]
Type=simple
User=sharaspot
Group=sharaspot
WorkingDirectory=/home/sharaspot/SharaSpot/client
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=/home/sharaspot/SharaSpot/client/.env
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
SVCEOF

systemctl daemon-reload
systemctl enable sharaspot-api sharaspot-worker sharaspot-frontend
systemctl restart sharaspot-api sharaspot-worker sharaspot-frontend

# ─── 10. Nginx ───
log "Configuring Nginx..."

cat > /etc/nginx/sites-available/sharaspot <<NGINXEOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    client_max_body_size 30m;

    access_log /var/log/nginx/sharaspot-access.log;
    error_log /var/log/nginx/sharaspot-error.log;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location /track/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
    }

    location /auth/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /users/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /senders/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /campaigns/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
    }

    location /emails/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /attachments/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
        client_max_body_size 30m;
    }

    location /templates/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location ~ /\. {
        deny all;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/sharaspot /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# ─── 11. Firewall ───
log "Configuring firewall..."
ufw allow OpenSSH 2>/dev/null || true
ufw allow 80/tcp 2>/dev/null || true
ufw allow 443/tcp 2>/dev/null || true
ufw --force enable 2>/dev/null || true

# ─── Done ───
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     SharaSpot Deployed to sharaspot.in!              ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${CYAN}Your site:${NC}  https://${DOMAIN}"
echo ""
echo -e "  ${YELLOW}⚠  SAVE THESE SECRETS NOW:${NC}"
echo -e "  ${CYAN}DB Password:${NC}         ${DB_PASSWORD}"
echo -e "  ${CYAN}Redis Password:${NC}      ${REDIS_PASSWORD}"
echo -e "  ${CYAN}Encryption Key:${NC}      ${ENCRYPTION_KEY}"
echo -e "  ${CYAN}JWT Access Secret:${NC}   ${JWT_ACCESS}"
echo -e "  ${CYAN}JWT Refresh Secret:${NC}  ${JWT_REFRESH}"
echo ""
echo -e "  ${YELLOW}⚠  NEXT — Set up SSL (required for Google OAuth):${NC}"
echo -e "  sudo apt install -y certbot python3-certbot-nginx"
echo -e "  sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
echo ""
echo -e "  ${CYAN}View logs:${NC}"
echo -e "  journalctl -u sharaspot-api -f"
echo -e "  journalctl -u sharaspot-worker -f"
echo -e "  journalctl -u sharaspot-frontend -f"
echo ""
echo -e "  ${CYAN}Update later:${NC}"
echo -e "  cd /home/sharaspot/SharaSpot && git pull && bash deploy/update.sh"
echo ""
