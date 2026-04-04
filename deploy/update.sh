#!/bin/bash
# ─── SharaSpot Quick Update Script ───
#
# Pull latest changes and redeploy without full rebuild.
# Usage: bash deploy/update.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

log() { echo -e "${GREEN}[UPDATE]${NC} $1"; }

PROJECT_DIR="/home/sharaspot/SharaSpot"

log "Pulling latest changes..."
cd "$PROJECT_DIR"
git pull

log "Rebuilding server..."
cd "$PROJECT_DIR/server"
npm ci --production 2>/dev/null || npm install --production
npx prisma migrate deploy
npm run build

log "Rebuilding client..."
cd "$PROJECT_DIR/client"
npm ci 2>/dev/null || npm install
npm run build

log "Restarting services..."
sudo systemctl restart sharaspot-api
sudo systemctl restart sharaspot-worker
sudo systemctl restart sharaspot-frontend

log "Update complete!"
sudo systemctl status sharaspot-api sharaspot-worker sharaspot-frontend --no-pager
