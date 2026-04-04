#!/bin/bash
# ─── SharaSpot VPS Initial Setup ───
#
# Run this ONCE on a fresh Hostinger VPS (Ubuntu 22.04/24.04).
# Usage: sudo bash deploy/setup-vps.sh
#
# Installs: Node.js 22, PostgreSQL 16, Redis 7, Nginx
# Creates:  sharaspot user + local database
# Cost:     $0 — everything runs locally on your VPS.
#           Supabase is used ONLY for file storage (free tier: 1 GB).

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[SETUP]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

# ─── 1. System update ───
log "Updating system packages..."
apt update && apt upgrade -y

# ─── 2. Install core dependencies ───
log "Installing core dependencies..."
apt install -y \
  curl \
  git \
  build-essential \
  ufw \
  fail2ban \
  unzip

# ─── 3. Install Node.js 22 (LTS) ───
log "Installing Node.js 22 LTS..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
node -v
npm -v

# ─── 4. Install PostgreSQL 16 (local — free, no cloud costs) ───
log "Installing PostgreSQL 16..."
apt install -y postgresql postgresql-contrib
systemctl enable postgresql
systemctl start postgresql

# ─── 5. Install Redis ───
log "Installing Redis..."
apt install -y redis-server
systemctl enable redis-server
systemctl start redis-server

# ─── 6. Install Nginx ───
log "Installing Nginx..."
apt install -y nginx
systemctl enable nginx
systemctl start nginx

# ─── 7. Create sharaspot user ───
log "Creating sharaspot user..."
if ! id -u sharaspot &>/dev/null; then
  useradd -m -s /bin/bash sharaspot
  log "User 'sharaspot' created. Set a password with: passwd sharaspot"
else
  log "User 'sharaspot' already exists."
fi

# ─── 8. Setup local PostgreSQL database ───
log "Setting up local PostgreSQL database..."
DB_PASSWORD=$(openssl rand -hex 16)

su - postgres -c "psql <<EOF
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'sharaspot') THEN
    CREATE ROLE sharaspot WITH LOGIN PASSWORD '${DB_PASSWORD}';
  END IF;
END
\$\$;
EOF"

su - postgres -c "psql -c \"SELECT 1 FROM pg_database WHERE datname='sharaspot'\" | grep -q 1 || createdb -O sharaspot sharaspot"

log "Database password generated: ${DB_PASSWORD}"
warn "Save this password! You'll need it for DATABASE_URL in server/.env"

# ─── 9. Configure Redis ───
log "Configuring Redis..."
REDIS_PASSWORD=$(openssl rand -hex 16)
echo "requirepass ${REDIS_PASSWORD}" >> /etc/redis/redis.conf
systemctl restart redis-server
log "Redis password generated: ${REDIS_PASSWORD}"
warn "Save this password! You'll need it for REDIS_URL in server/.env"

# ─── 10. Configure Firewall ───
log "Configuring UFW firewall..."
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
log "Firewall configured (SSH, HTTP, HTTPS open)"

# ─── 11. Setup project directory ───
log "Setting up project directory..."
mkdir -p /home/sharaspot/SharaSpot
chown -R sharaspot:sharaspot /home/sharaspot/SharaSpot

# ─── 12. Generate encryption key ───
ENCRYPTION_KEY=$(openssl rand -hex 32)
log "Encryption key generated: ${ENCRYPTION_KEY}"
warn "Save this key! You'll need it for ENCRYPTION_KEY in server/.env"

# ─── 13. Generate JWT secrets ───
JWT_ACCESS=$(openssl rand -hex 32)
JWT_REFRESH=$(openssl rand -hex 32)

log ""
log "============================================"
log "  VPS setup complete!"
log "============================================"
log ""
log "  Next steps:"
log "  1. Clone your repo: su - sharaspot && git clone <repo-url> SharaSpot"
log "  2. Copy .env files and fill in the generated secrets below"
log "  3. Run: bash deploy/deploy.sh"
log "  4. Configure Nginx: sudo cp deploy/nginx.conf /etc/nginx/sites-available/sharaspot"
log "  5. Set up SSL: certbot --nginx -d YOUR_DOMAIN"
log ""
log "  ─── Saved Secrets ───"
warn "  DB Password:         ${DB_PASSWORD}"
warn "  Redis Password:      ${REDIS_PASSWORD}"
warn "  Encryption Key:      ${ENCRYPTION_KEY}"
warn "  JWT Access Secret:   ${JWT_ACCESS}"
warn "  JWT Refresh Secret:  ${JWT_REFRESH}"
log ""
log "  ─── server/.env DATABASE_URL ───"
warn "  postgresql://sharaspot:${DB_PASSWORD}@localhost:5432/sharaspot"
log ""
log "  ─── server/.env REDIS_URL ───"
warn "  redis://:${REDIS_PASSWORD}@localhost:6379"
log ""
