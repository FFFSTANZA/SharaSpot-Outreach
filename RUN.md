# SharaSpot — How to Run

## Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Redis 7+

### 1. Start PostgreSQL & Redis

```bash
# PostgreSQL (Ubuntu/Debian)
sudo systemctl start postgresql

# Redis
sudo systemctl start redis-server
```

### 2. Set Up the Database

```bash
sudo -u postgres psql <<EOF
CREATE ROLE sharaspot WITH LOGIN PASSWORD 'devpassword';
CREATE DATABASE sharaspot OWNER sharaspot;
EOF
```

### 3. Configure Environment Variables

**Server** (`server/.env`):
```bash
cp server/.env.example server/.env
```

Edit `server/.env`:
```
PORT=8000
NODE_ENV=development
DATABASE_URL=postgresql://sharaspot:devpassword@localhost:5432/sharaspot
REDIS_URL=redis://localhost:6379
ENCRYPTION_KEY=$(openssl rand -hex 32)
JWT_ACCESS_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
GOOGLE_CLIENT_ID=354664818470-veljl4900p28hf0i81u0r959ra11ihjt.apps.googleusercontent.com
SUPABASE_URL=https://pbmklbvktpbzbvzpamlu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your service role key>
SUPABASE_BUCKET_NAME=sharaspot-attachments
TRACKING_BASE_URL=http://localhost:8000
```

**Client** (`client/.env`):
```bash
cp client/.env.example client/.env
```

Edit `client/.env`:
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=354664818470-veljl4900p28hf0i81u0r959ra11ihjt.apps.googleusercontent.com
```

### 4. Install Dependencies & Run

Open **3 terminal tabs**:

**Tab 1 — Server (API):**
```bash
cd server
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

**Tab 2 — Worker (email processing):**
```bash
cd server
npm run worker
```

**Tab 3 — Client (frontend):**
```bash
cd client
npm install
npm run dev
```

### 5. Open the App

- Frontend: http://localhost:3000
- API: http://localhost:8000

---

## Production (VPS / Hostinger)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full guide.

**TL;DR:**
```bash
sudo bash deploy/setup-vps.sh    # install everything
bash deploy/deploy.sh            # build + deploy
sudo certbot --nginx -d yourdomain.com  # SSL
```

---

## Production (Docker)

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
# Edit both .env files

docker compose up -d --build
```

---

## Architecture

```
Frontend (Next.js :3000)
  ↓
API Server (Express :8000)
  ├── PostgreSQL (local :5432)
  ├── Redis (local :6379)
  ├── Supabase Storage (attachments only)
  └── Worker (email sending + reply detection)
```

**Cost breakdown:**
| Service | Purpose | Cost |
|---------|---------|------|
| VPS (Hostinger) | Runs everything | ~$6/mo |
| PostgreSQL (local) | Database | $0 |
| Redis (local) | Queues + cache | $0 |
| Supabase Storage | File attachments | $0 (free 1 GB) |
| Google OAuth | Sign-in | $0 |

**Total: ~$6/month**

---

## Common Issues

### Prisma migration fails
```bash
cd server
npx prisma migrate reset  # WARNING: deletes all data
npx prisma migrate dev
```

### Redis connection refused
```bash
sudo systemctl start redis-server
redis-cli ping  # should return PONG
```

### PostgreSQL connection refused
```bash
sudo systemctl start postgresql
sudo -u postgres psql -c "\l"  # should list databases
```

### Port already in use
```bash
# Find what's using the port
sudo lsof -i :8000
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>
```
