# Retail Brain - Quick Reference

Cheat sheet for common commands and operations.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment template
cp env.example .env

# 3. Edit .env (set POSTGRES_PASSWORD and API_GATEWAY_API_KEYS)

# 4. Run automated setup
bash scripts/setup.sh

# 5. Start API Gateway
docker-compose up api-gateway

# 6. Test API
curl http://localhost:3000/health
```

---

## 📦 Common Commands

### Development

```bash
# Start infrastructure only (Postgres + Redis)
docker-compose up -d postgres redis

# Start all services
docker-compose up

# Start API Gateway in dev mode (hot reload)
cd services/api-gateway && pnpm dev

# Run dev helper script
bash scripts/dev.sh
```

### Build

```bash
# Build all shared modules
pnpm -r --filter "@retail-brain/*" build

# Build everything
pnpm build

# Type check
pnpm typecheck
```

### Database

```bash
# Run migrations
pnpm db:migrate

# Connect to Postgres
docker exec -it retail-brain-postgres psql -U retail_brain_user -d retail_brain

# Backup database
docker exec retail-brain-postgres pg_dump -U retail_brain_user retail_brain > backup.sql

# Restore database
docker exec -i retail-brain-postgres psql -U retail_brain_user retail_brain < backup.sql

# Reset database (⚠️ DESTRUCTIVE)
docker-compose down -v
docker-compose up -d postgres
pnpm db:migrate
```

### Docker

```bash
# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f api-gateway
docker-compose logs -f postgres

# Restart service
docker-compose restart api-gateway

# Rebuild and restart
docker-compose build api-gateway
docker-compose up api-gateway

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Check service health
docker-compose ps
```

### Redis

```bash
# Connect to Redis
docker exec -it retail-brain-redis redis-cli

# Inside Redis CLI:
KEYS *              # List all keys
GET key_name        # Get value
SET key value       # Set value
FLUSHALL            # Clear all data (⚠️ DESTRUCTIVE)
```

### Code Quality

```bash
# Lint
pnpm lint

# Format
pnpm format

# Run tests (Phase 9)
pnpm test

# Test coverage
pnpm test -- --coverage
```

---

## 🧪 Testing API

### Health Check (No Auth)

```bash
curl http://localhost:3000/health
```

### Health Check (With Auth)

```bash
curl -H "Authorization: Bearer your_api_key" \
  http://localhost:3000/v1/health
```

### Event Ingestion ✅ **WORKING NOW**

```bash
curl -X POST http://localhost:3000/v1/events \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "app",
    "event_type": "purchase",
    "event_ts": "2025-12-09T10:00:00Z",
    "identifiers": {
      "phone": "+919876543210",
      "email": "user@example.com"
    },
    "payload": {
      "sku": "TSHIRT-123",
      "product_name": "Cool T-Shirt",
      "price": 999,
      "quantity": 1
    }
  }'
```

**Run comprehensive event tests:**
```bash
bash scripts/test-events.sh
```

**Check stored events in database:**
```bash
docker exec -it retail-brain-postgres psql -U retail_brain_user -d retail_brain
# Inside psql:
SELECT COUNT(*) FROM customer_raw_event;
SELECT source, event_type, status FROM customer_raw_event ORDER BY received_at DESC LIMIT 10;
```

### Customer Search (Phase 4+)

```bash
curl "http://localhost:3000/v1/customer/search?phone=+919876543210" \
  -H "Authorization: Bearer your_api_key"
```

### Run Test Script

```bash
bash scripts/test-api.sh
```

---

## 📁 File Locations

| What | Where |
|------|-------|
| Environment config | `.env` |
| Database migrations | `migrations/*.sql` |
| API Gateway code | `services/api-gateway/src/` |
| Shared modules | `shared/*/src/` |
| Docker config | `docker-compose.yml` |
| TypeScript config | `tsconfig.json` |
| Docs | `README.md`, `SETUP.md`, `ARCHITECTURE.md` |

---

## 🔧 Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
lsof -i :3000

# Change port in .env
API_GATEWAY_PORT=3001
```

### Database Connection Failed

```bash
# Check if Postgres is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Restart Postgres
docker-compose restart postgres
```

### Can't Connect to Redis

```bash
# Check if Redis is running
docker-compose ps redis

# Test Redis
docker exec retail-brain-redis redis-cli ping
```

### TypeScript Errors

```bash
# Clean build
rm -rf services/*/dist shared/*/dist
pnpm build

# Check types
pnpm typecheck
```

### Docker Issues

```bash
# Clean everything
docker-compose down -v
docker system prune -a

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up
```

---

## 📊 Service Ports

| Service | Port | URL |
|---------|------|-----|
| API Gateway | 3000 | http://localhost:3000 |
| Event Collector | 3001 | http://localhost:3001 ✅ |
| Identity Engine | 3002 | (Phase 3) |
| Profile Service | 3003 | (Phase 4) |
| Recommender | 3004 | (Phase 5) |
| Onboarding | 3005 | (Phase 8) |
| AI Assistant | 3006 | (Phase 7) |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |

---

## 🗄️ Database Quick Reference

### Tables

```sql
-- View all tables
\dt

-- Describe table
\d customer_profile

-- View table size
SELECT pg_size_pretty(pg_total_relation_size('customer_profile'));
```

### Common Queries

```sql
-- Count profiles
SELECT COUNT(*) FROM customer_profile;

-- Count identifiers by type
SELECT type, COUNT(*) FROM profile_identifier GROUP BY type;

-- Recent events
SELECT * FROM customer_raw_event ORDER BY received_at DESC LIMIT 10;

-- Merge log
SELECT * FROM identity_merge_log ORDER BY merged_at DESC LIMIT 10;
```

### Extensions

```sql
-- Check installed extensions
\dx

-- Should have:
-- - uuid-ossp
-- - pgcrypto
-- - vector (pgvector)
```

---

## 🔐 Environment Variables

### Required

```env
POSTGRES_PASSWORD=your_secure_password
API_GATEWAY_API_KEYS=key1,key2,key3
```

### Optional (with defaults)

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=retail_brain
POSTGRES_USER=retail_brain_user

REDIS_HOST=localhost
REDIS_PORT=6379

API_GATEWAY_PORT=3000
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

LOG_LEVEL=info
NODE_ENV=development
```

---

## 📚 Documentation

| Doc | Purpose |
|-----|---------|
| `README.md` | Project overview, quick start |
| `SETUP.md` | Detailed setup instructions |
| `ARCHITECTURE.md` | Technical architecture |
| `CHANGELOG.md` | Version history |
| `PHASE1_SUMMARY.md` | Phase 1 completion report |
| `QUICK_REFERENCE.md` | This file |

---

## 🎯 Phase Status

| Phase | Status | Focus |
|-------|--------|-------|
| Phase 1 | ✅ Done | Foundations |
| Phase 2 | ✅ Done | Event Pipeline |
| Phase 3 | ⏳ Pending | Identity Engine |
| Phase 4 | ⏳ Pending | Profile Service |
| Phase 5 | ⏳ Pending | Recommender |
| Phase 6 | ⏳ Pending | Dashboard |
| Phase 7 | ⏳ Pending | AI Assistant |
| Phase 8 | ⏳ Pending | Onboarding |
| Phase 9 | ⏳ Pending | QA |
| Phase 10 | ⏳ Pending | Production |

---

## 🆘 Getting Help

1. Check logs: `docker-compose logs -f`
2. Read docs: `README.md`, `SETUP.md`, `ARCHITECTURE.md`
3. Review code: All code is in `services/` and `shared/`
4. Test API: `bash scripts/test-api.sh`

---

**Pro Tip:** Keep this file open in a separate tab while developing!

