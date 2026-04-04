#!/bin/bash
# ─── SharaSpot VPS Deployment Script ───
#
# Run this on your Hostinger VPS after cloning the repo.
# Usage: bash deploy/deploy.sh
#
# Prerequisites (run deploy/setup-vps.sh first):
#   - Node.js 20+
#   - PostgreSQL 15+
#   - Redis 7+
#   - Nginx
#   - Git

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

PROJECT_DIR="/home/sharaspot/SharaSpot"

# ─── 1. Check prerequisites ───
log "Checking prerequisites..."
command -v node &>/dev/null || err "Node.js not installed. Run deploy/setup-vps.sh first."
command -v psql &>/dev/null || err "PostgreSQL not installed. Run deploy/setup-vps.sh first."
command -v redis-cli &>/dev/null || err "Redis not installed. Run deploy/setup-vps.sh first."
command -v nginx &>/dev/null || err "Nginx not installed. Run deploy/setup-vps.sh first."

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
[ "$NODE_VERSION" -ge 20 ] || err "Node.js 20+ required (found $(node -v))"

# ─── 2. Verify .env files exist ───
log "Checking environment files..."
[ -f "$PROJECT_DIR/server/.env" ] || err "server/.env not found. Copy from server/.env.example and fill in values."
[ -f "$PROJECT_DIR/client/.env" ] || err "client/.env not found. Copy from client/.env.example and fill in values."

# ─── 3. Install dependencies & build server ───
log "Installing server dependencies..."
cd "$PROJECT_DIR/server"
npm ci 2>/dev/null || npm install

log "Building server..."
npx prisma generate
npx prisma migrate deploy
npm run build

# ─── 4. Install dependencies & build client ───
log "Installing client dependencies..."
cd "$PROJECT_DIR/client"
npm ci 2>/dev/null || npm install

log "Building client (Next.js)..."
npm run build

# ─── 5. Setup systemd services ───
log "Setting up systemd services..."
sudo cp "$PROJECT_DIR/deploy/sharaspot-api.service" /etc/systemd/system/
sudo cp "$PROJECT_DIR/deploy/sharaspot-worker.service" /etc/systemd/system/
sudo cp "$PROJECT_DIR/deploy/sharaspot-frontend.service" /etc/systemd/system/

sudo systemctl daemon-reload
sudo systemctl enable sharaspot-api
sudo systemctl enable sharaspot-worker
sudo systemctl enable sharaspot-frontend

# ─── 6. Start services ───
log "Starting services..."
sudo systemctl restart sharaspot-api
sudo systemctl restart sharaspot-worker
sudo systemctl restart sharaspot-frontend

# ─── 7. Verify ───
sleep 3
log "Checking service status..."
sudo systemctl is-active sharaspot-api &>/dev/null && log "API server: RUNNING" || warn "API server: NOT RUNNING"
sudo systemctl is-active sharaspot-worker &>/dev/null && log "Email worker: RUNNING" || warn "Email worker: NOT RUNNING"
sudo systemctl is-active sharaspot-frontend &>/dev/null && log "Frontend: RUNNING" || warn "Frontend: NOT RUNNING"

log ""
log "============================================"
log "  SharaSpot deployed successfully!"
log "============================================"
log ""
log "  Frontend:  http://localhost:3000"
log "  API:       http://localhost:8000"
log "  Logs:      journalctl -u sharaspot-api -f"
log "             journalctl -u sharaspot-worker -f"
log "             journalctl -u sharaspot-frontend -f"
log ""
warn "  Don't forget to configure Nginx (see deploy/nginx.conf)"
warn "  and set up SSL with Certbot!"
log ""
