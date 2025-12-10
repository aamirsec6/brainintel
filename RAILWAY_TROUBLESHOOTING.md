# Railway Deployment Troubleshooting

## Current Issue: pnpm-lock.yaml Error

If you're seeing: `ERR_PNPM_NO_LOCKFILE Cannot install with "frozen-lockfile"`

### Solution 1: Manual Service Configuration

Instead of using docker-compose, deploy services individually:

1. **For each service** (API Gateway, Event Collector, Dashboard):
   - Click **"New"** → **"GitHub Repo"**
   - Select `aamirsec6/brainintel`
   - **Root Directory**: Leave empty
   - **Build Command**: Leave empty (Dockerfile handles it)
   - **Start Command**: Leave empty (Dockerfile handles it)

2. **Set Environment Variables** manually for each service

### Solution 2: Use Railway's Native Build

1. Go to service → **Settings** → **Build**
2. Change **Builder** from "Dockerfile" to "Nixpacks"
3. Railway will auto-detect Node.js and pnpm
4. This bypasses Dockerfile issues

### Solution 3: Fix Lockfile Issue

The lockfile exists but Railway might not be copying it. Try:

1. **Verify lockfile is committed:**
   ```bash
   git add pnpm-lock.yaml
   git commit -m "Ensure lockfile is tracked"
   git push
   ```

2. **Or remove lockfile requirement:**
   - The Dockerfiles now use `--no-frozen-lockfile`
   - But Railway might still add it automatically

### Solution 4: Use Railway's PostgreSQL/Redis (Recommended)

Instead of docker-compose services:

1. **Create PostgreSQL:**
   - Railway Dashboard → **New** → **Database** → **PostgreSQL**
   - Railway provides connection string automatically

2. **Create Redis:**
   - Railway Dashboard → **New** → **Database** → **Redis**

3. **Update environment variables** to use Railway's connection strings

4. **Deploy only web services** (not postgres/redis from docker-compose)

## Quick Fix Right Now

1. In Railway, for each failing service:
   - Go to **Settings** → **Build**
   - Change **Builder** to **"Nixpacks"** (not Dockerfile)
   - Railway will auto-detect and build correctly

2. This will:
   - ✅ Auto-detect Node.js/pnpm
   - ✅ Install dependencies correctly
   - ✅ Build your services
   - ✅ Start them properly

## Alternative: Deploy Without Docker

If Docker continues to cause issues:

1. Use Railway's **"Deploy from GitHub"** with **Nixpacks**
2. Set **Root Directory** to service folder (e.g., `services/api-gateway`)
3. Railway will auto-detect and build

