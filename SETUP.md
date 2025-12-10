# Retail Brain - Setup Guide

This guide will walk you through setting up the Retail Brain platform from scratch.

---

## Prerequisites

### Required Software

1. **Node.js 20+**
   ```bash
   node --version  # Should be v20.x.x or higher
   ```

2. **pnpm 8+**
   ```bash
   npm install -g pnpm
   pnpm --version  # Should be 8.x.x or higher
   ```

3. **Docker & Docker Compose**
   ```bash
   docker --version
   docker-compose --version
   ```

---

## Step-by-Step Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd braintel
```

### 2. Install Dependencies

```bash
pnpm install
```

This will install all dependencies for:
- Root workspace
- All services
- All shared modules

### 3. Configure Environment

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# Database
POSTGRES_PASSWORD=change_this_to_secure_password

# API Gateway
API_GATEWAY_API_KEYS=your_api_key_here,another_key_here

# Optional: Adjust ports if needed
API_GATEWAY_PORT=3000
POSTGRES_PORT=5432
REDIS_PORT=6379
```

**⚠️ Important:** Never commit `.env` to version control!

### 4. Start Infrastructure

Start PostgreSQL and Redis using Docker Compose:

```bash
docker-compose up -d postgres redis
```

Wait for services to be healthy:

```bash
docker-compose ps
```

You should see:
```
retail-brain-postgres   healthy
retail-brain-redis      healthy
```

### 5. Run Database Migrations

```bash
pnpm db:migrate
```

This will create all required tables:
- `customer_profile`
- `profile_identifier`
- `customer_raw_event`
- `events`
- `identity_merge_log`

Expected output:
```
✓ Connected to database
Running 5 migrations...
→ Running 001_create_customer_profile.sql...
  ✓ 001_create_customer_profile.sql completed
→ Running 002_create_profile_identifier.sql...
  ✓ 002_create_profile_identifier.sql completed
...
✓ All migrations completed successfully
```

### 6. Build Shared Modules

```bash
pnpm -r --filter "@retail-brain/*" build
```

This compiles all TypeScript in shared modules.

### 7. Start API Gateway

**Option A: Using Docker Compose (Recommended)**

```bash
docker-compose up api-gateway
```

**Option B: Local Development**

```bash
cd services/api-gateway
pnpm dev
```

### 8. Verify Setup

Test the health endpoint:

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "api-gateway",
  "timestamp": "2025-12-09T..."
}
```

Test authentication:

```bash
# Without API key (should fail)
curl http://localhost:3000/v1/health

# With API key (should succeed)
curl -H "Authorization: Bearer your_api_key_here" \
  http://localhost:3000/v1/health
```

---

## Verify Database Setup

Connect to PostgreSQL:

```bash
docker exec -it retail-brain-postgres psql -U retail_brain_user -d retail_brain
```

Check tables:

```sql
\dt

-- Should show:
-- customer_profile
-- profile_identifier
-- customer_raw_event
-- events
-- identity_merge_log
```

Check extensions:

```sql
\dx

-- Should show:
-- pgcrypto
-- pgvector
-- uuid-ossp
```

Exit:
```sql
\q
```

---

## Common Issues & Troubleshooting

### Issue: Port Already in Use

**Error:** `Error starting userland proxy: listen tcp 0.0.0.0:5432: bind: address already in use`

**Solution:** Change port in `.env`:
```env
POSTGRES_PORT=5433
REDIS_PORT=6380
API_GATEWAY_PORT=3001
```

Then restart:
```bash
docker-compose down
docker-compose up
```

### Issue: Database Connection Refused

**Error:** `Failed to connect to database: connect ECONNREFUSED`

**Solution:**
1. Check if Postgres is running:
   ```bash
   docker-compose ps postgres
   ```

2. Wait for health check:
   ```bash
   docker-compose logs postgres | grep "ready to accept connections"
   ```

3. Verify credentials in `.env` match `docker-compose.yml`

### Issue: Migration Failed

**Error:** `Migration failed: relation "xyz" already exists`

**Solution:** Migrations are idempotent. Check if tables already exist:

```bash
docker exec -it retail-brain-postgres psql -U retail_brain_user -d retail_brain -c "\dt"
```

If tables exist, migrations have already run successfully.

### Issue: pnpm Install Fails

**Error:** `ERR_PNPM_PEER_DEP_ISSUES`

**Solution:**
```bash
pnpm install --force
```

---

## Development Workflow

### Running Services Locally

Each service can run independently:

```bash
# API Gateway
cd services/api-gateway
pnpm dev

# Event Collector (Phase 2)
cd services/event-collector
pnpm dev
```

### Running All Services with Docker

```bash
docker-compose up
```

### Watching Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api-gateway
docker-compose logs -f postgres
```

### Rebuilding After Code Changes

```bash
# Rebuild shared modules
pnpm -r --filter "@retail-brain/*" build

# Rebuild Docker containers
docker-compose build api-gateway
docker-compose up api-gateway
```

---

## Database Management

### Backup Database

```bash
docker exec retail-brain-postgres pg_dump -U retail_brain_user retail_brain > backup.sql
```

### Restore Database

```bash
docker exec -i retail-brain-postgres psql -U retail_brain_user retail_brain < backup.sql
```

### Reset Database (⚠️ DESTRUCTIVE)

```bash
docker-compose down -v  # Remove volumes
docker-compose up -d postgres
pnpm db:migrate  # Re-run migrations
```

---

## Redis Management

### Connect to Redis

```bash
docker exec -it retail-brain-redis redis-cli
```

### Check Redis Keys

```redis
KEYS *
```

### Flush Redis (Clear All Cache)

```redis
FLUSHALL
```

---

## Next Steps

✅ **Phase 1 Complete!**

You now have:
- Working API Gateway with auth + rate limiting
- PostgreSQL with all tables
- Redis for caching
- Shared modules ready for services

**Ready for Phase 2?** See `README.md` for the roadmap.

Phase 2 will add:
- Event Collector service
- Event validation & normalization
- Raw event storage
- Event processing pipeline

---

## Need Help?

- Check logs: `docker-compose logs -f`
- Check database: `docker exec -it retail-brain-postgres psql ...`
- Check Redis: `docker exec -it retail-brain-redis redis-cli`
- Review architecture: See `README.md`

---

**Happy Building! 🚀**

