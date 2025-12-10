# Railway Fix: Dockerfile Not Found Error

## The Problem

Railway is looking for a root-level `Dockerfile`, but our Dockerfiles are in subdirectories:
- `services/api-gateway/Dockerfile`
- `services/event-collector/Dockerfile`
- `apps/dashboard/Dockerfile`

## Solution: Configure Railway to Use docker-compose.yml

### Option 1: Use Railway's docker-compose.yml Support (Recommended)

Railway should automatically detect `docker-compose.yml`. If it's not working:

1. **In Railway Dashboard:**
   - Go to your project
   - Click **Settings** → **Service**
   - Make sure **"Use docker-compose.yml"** is enabled
   - Or delete existing services and redeploy from GitHub (Railway will auto-detect docker-compose.yml)

### Option 2: Configure Each Service Manually

For each service (API Gateway, Event Collector, Dashboard):

1. **Go to Service** → **Settings** → **Build**
2. **Set these values:**
   - **Builder**: Dockerfile
   - **Dockerfile Path**: `services/api-gateway/Dockerfile` (or appropriate path)
   - **Docker Context**: `.` (root directory)
3. **Save**

### Option 3: Use Nixpacks (Easiest - No Dockerfile Needed!)

**This is the simplest solution:**

1. **For each service:**
   - Go to **Settings** → **Build**
   - Change **Builder** from "Dockerfile" to **"Nixpacks"**
   - **Root Directory**: 
     - API Gateway: `services/api-gateway`
     - Event Collector: `services/event-collector`
     - Dashboard: `apps/dashboard`
2. **Save** - Railway will auto-detect and build!

### Option 4: Deploy Services Individually (Not from docker-compose)

1. **Delete current services** in Railway
2. **Create new services** one by one:
   - **New** → **GitHub Repo** → Select `aamirsec6/brainintel`
   - **Root Directory**: Set to service folder (e.g., `services/api-gateway`)
   - **Builder**: Nixpacks (auto-detects)
3. **Add PostgreSQL and Redis** from Railway's database options (not docker-compose)

## Quick Fix Right Now

**Fastest solution:**

1. Go to each service → **Settings** → **Build**
2. Change **Builder** to **"Nixpacks"**
3. Set **Root Directory**:
   - API Gateway: `services/api-gateway`
   - Event Collector: `services/event-collector`  
   - Dashboard: `apps/dashboard`
4. **Save** and redeploy

Nixpacks will automatically:
- ✅ Detect Node.js/pnpm
- ✅ Install dependencies
- ✅ Build TypeScript
- ✅ Start services

No Dockerfile needed!

