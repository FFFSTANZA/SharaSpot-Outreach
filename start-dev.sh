#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

cd /home/fffstanza/Folonite/SharaSpot-Outreach/client
nohup npm run dev > /tmp/sharaspot-client.log 2>&1 &
echo "Client started with PID $!"
