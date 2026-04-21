#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# Start API
cd /home/fffstanza/Folonite/SharaSpot-Outreach/server
nohup npm run dev > /tmp/sharaspot-api.log 2>&1 &
echo "API PID: $!"

# Start Worker
nohup npm run worker > /tmp/sharaspot-worker.log 2>&1 &
echo "Worker PID: $!"

# Start Client
cd /home/fffstanza/Folonite/SharaSpot-Outreach/client
nohup npm run dev > /tmp/sharaspot-client.log 2>&1 &
echo "Client PID: $!"

# Start Admin Dashboard
cd /home/fffstanza/Folonite/SharaSpot-Outreach/admin-dashboard
nohup npm run dev -- -p 3001 > /tmp/sharaspot-admin.log 2>&1 &
echo "Admin PID: $!"
