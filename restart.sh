#!/bin/bash
echo "Restarting SharaSpot services..."

# Start Redis if not running
if ! pgrep -x redis-server > /dev/null; then
    echo "Starting Redis..."
    redis-server --daemonize yes 2>/dev/null || sudo redis-server --daemonize yes 2>/dev/null
fi

pkill -f "node" || true
pkill -f "next" || true
sleep 2

# Start Client
cd /home/fffstanza/SharaSpot/SharaSpot-Outreach/client
nohup npm run dev > /tmp/sharaspot-client.log 2>&1 &
echo "Client started in background (logs at /tmp/sharaspot-client.log)"

# Start API in FOREGROUND for debugging
echo "Starting API in FOREGROUND... Watch for [SERVER-DEBUG] logs below."
cd /home/fffstanza/SharaSpot/SharaSpot-Outreach/server
npm run dev
