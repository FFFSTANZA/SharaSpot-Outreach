#!/bin/bash
# ─── SharaSpot — Final Deploy (Fix All Issues) ───
# Paste this ENTIRE block into your VPS terminal.
# It fixes: old Node.js, missing builds, Prisma sync, and starts the app.

set -e

echo "=== Step 1: Fix Node.js ==="
sudo apt-get remove -y nodejs npm libnode-dev 2>/dev/null || true
sudo apt-get autoremove -y 2>/dev/null || true
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
sudo apt-get install -y nodejs
node -v

echo "=== Step 2: Fix Server Code (googleId bug) ==="
cd ~/SharaSpot-Outreach/server
sed -i 's/where: { googleId }/where: { email }/g' src/controllers/authControllers.ts
sed -i '/googleId,$/d' src/controllers/authControllers.ts

echo "=== Step 3: Write .env files ==="
cat > ~/SharaSpot-Outreach/server/.env <<'ENVEOF'
PORT=8000
NODE_ENV=production
DATABASE_URL=postgresql://sharaspot:SharaSpot_db_2026_xK9mP3vL@localhost:5432/sharaspot
REDIS_URL=redis://:SharaSpot_redis_2026_qR7nW5jT@localhost:6379
ENCRYPTION_KEY=a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1
JWT_ACCESS_SECRET=7c4e9a2b5f8d1c3e6a9b2d5f8c1e4a7b0d3f6c9e2a5b8d1f4c7e0a3b6d9f2c5
JWT_REFRESH_SECRET=2b5d8f1e4a7c0d3f6b9e2c5a8d1f4e7b0c3a6d9f2e5b8c1d4f7a0e3b6c9d2f5
GOOGLE_CLIENT_ID=354664818470-veljl4900p28hf0i81u0r959ra11ihjt.apps.googleusercontent.com
SUPABASE_URL=https://pbmklbvktpbzbvzpamlu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBibWtsYnZrdHBiemJ2enBhbWx1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTMxNzUzOCwiZXhwIjoyMDkwODkzNTM4fQ.-GEXB4uMBop6zVsiXsrlTfOCscVpewedZxAULhYs5p4
SUPABASE_BUCKET_NAME=sharaspot-attachments
TRACKING_BASE_URL=https://sharaspot.in
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

cat > ~/SharaSpot-Outreach/client/.env <<'ENVEOF'
NEXT_PUBLIC_BACKEND_URL=https://sharaspot.in
NEXT_PUBLIC_GOOGLE_CLIENT_ID=354664818470-veljl4900p28hf0i81u0r959ra11ihjt.apps.googleusercontent.com
ENVEOF

echo "=== Step 4: Build Server ==="
cd ~/SharaSpot-Outreach/server
npm install
npx prisma generate
npx prisma migrate deploy
npm run build

echo "=== Step 5: Build Client ==="
cd ~/SharaSpot-Outreach/client
npm install
npm run build

echo "=== Step 6: Start App ==="
cd ~/SharaSpot-Outreach
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

echo ""
echo "=== DONE ==="
echo "Visit: https://sharaspot.in"
echo "Check logs: pm2 logs"
echo "Check status: pm2 status"
