#!/usr/bin/env bash
# ─── SharaSpot Local Dev Rebuilder & Restarter ───
#
# Run this script whenever you make changes to the code to rebuild 
# the docker containers and bring everything back up cleanly.
#
# Usage: ./rebuild-dev.sh

set -euo pipefail

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${GREEN}[SHARASPOT-DEV]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Determine active docker-compose file (prefer local development compose)
COMPOSE_FILE="docker-compose.local.yml"
if [ ! -f "$COMPOSE_FILE" ]; then
    if [ -f "docker-compose.yml" ]; then
        COMPOSE_FILE="docker-compose.yml"
        warn "docker-compose.local.yml not found, falling back to docker-compose.yml"
    else
        err "No docker-compose file found in the current directory."
    fi
fi

log "Targeting environment configuration: ${CYAN}${COMPOSE_FILE}${NC}"

# Check for Docker and Docker Compose
command -v docker &>/dev/null || err "Docker is not installed."
if docker compose version &>/dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &>/dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    err "Docker Compose is not installed (neither 'docker compose' nor 'docker-compose' could be found)."
fi

# Ensure environment files exist or default them
if [ ! -f "server/.env" ]; then
    warn "server/.env not found, creating from server/.env.example..."
    cp server/.env.example server/.env
fi
if [ ! -f "client/.env" ]; then
    warn "client/.env not found, creating from client/.env.example..."
    cp client/.env.example client/.env
fi

log "Stopping existing containers..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" down --remove-orphans

log "Rebuilding code layers and starting containers..."
# Rebuild only modified layers and start in detached mode
$DOCKER_COMPOSE -f "$COMPOSE_FILE" up -d --build

log "Waiting for services to initialize and run health checks..."
# Give Postgres/Redis and services a few seconds to boot and resolve migrations
for i in {1..12}; do
    echo -n "."
    sleep 1
done
echo ""

log "Checking running services..."
SERVICES=$($DOCKER_COMPOSE -f "$COMPOSE_FILE" ps --format "table {{.Name}}\t{{.Status}}")

echo -e "\n============================================="
echo -e "          SHARASPOT LOCAL STATUS"
echo -e "============================================="
echo "$SERVICES"
echo -e "============================================="

# Detect healthiness
if echo "$SERVICES" | grep -qi "unhealthy"; then
    warn "One or more containers reported as UNHEALTHY. Check logs using: docker compose -f $COMPOSE_FILE logs -f"
else
    log "All services running smoothly! 🚀"
    echo -e "  ➜  Frontend:  ${CYAN}http://localhost${NC} (or http://localhost:3000)"
    echo -e "  ➜  API URL:   ${CYAN}http://localhost:8000${NC}"
    echo -e "  ➜  View Logs: ${CYAN}docker compose -f $COMPOSE_FILE logs -f${NC}\n"
fi
