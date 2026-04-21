#!/bin/bash
# ─── SharaSpot — Production Deploy (Template) ───
# This script builds and launches the SharaSpot platform using PM2.
# 
# Usage:
# 1. Fill in your production .env variables.
# 2. Run: bash deploy/production-deploy.sh

set -e

echo "=== Step 1: Build Server ==="
cd server
npm install
npx prisma generate
npx prisma migrate deploy
npm run build

echo "=== Step 2: Build Client ==="
cd ../client
npm install
npm run build

echo "=== Step 3: PM2 Orchestration ==="
cd ..
# Check if ecosystem.config.js exists
if [ ! -f ecosystem.config.js ]; then
  echo "Error: ecosystem.config.js not found in root!"
  exit 1
fi

# Ensure PM2 is installed globally
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
fi

pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

echo ""
echo "===================================================="
echo "   SHARASPOT PRODUCTION DEPLOYMENT COMPLETE         "
echo "===================================================="
echo "Services active: sharaspot-api, sharaspot-worker, sharaspot-frontend"
echo "Monitor with: pm2 status"
echo "Logs: pm2 logs"
echo "===================================================="
