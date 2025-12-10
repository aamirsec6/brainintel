# Railway Service Configuration Guide

## Current Issue

Railway is using the wrong Dockerfile. Each service needs to be configured to use its specific Dockerfile path.

## Quick Fix: Configure Each Service

### For API Gateway Service:

1. Go to Railway Dashboard → **retail-brain-api-gateway** service
2. Click **Settings** → **Build**
3. Set:
   - **Builder**: Dockerfile
   - **Dockerfile Path**: `services/api-gateway/Dockerfile`
   - **Docker Context**: `.` (root directory)
4. **Save**

### For Event Collector Service:

1. Go to Railway Dashboard → **retail-brain-event-collector** service
2. Click **Settings** → **Build**
3. Set:
   - **Builder**: Dockerfile
   - **Dockerfile Path**: `services/event-collector/Dockerfile`
   - **Docker Context**: `.` (root directory)
4. **Save**

### For Dashboard Service:

1. Go to Railway Dashboard → **retail-brain-dashboard** service (if it exists)
2. Click **Settings** → **Build**
3. Set:
   - **Builder**: Dockerfile
   - **Dockerfile Path**: `apps/dashboard/Dockerfile`
   - **Docker Context**: `.` (root directory)
4. **Save**

### For MLflow Service:

1. Go to Railway Dashboard → **retail-brain-mlflow** service
2. Click **Settings** → **Build**
3. Set:
   - **Builder**: Docker Image
   - **Docker Image**: `ghcr.io/mlflow/mlflow:v2.8.1`
   - **Start Command**: `mlflow server --backend-store-uri $MLFLOW_BACKEND_STORE_URI --default-artifact-root file:/mlflow/artifacts --host 0.0.0.0 --port $PORT`
4. **Save**

## Alternative: Use Nixpacks (Easier!)

Instead of Dockerfiles, use Nixpacks for Node.js services:

### For API Gateway:

1. **Settings** → **Build**
2. **Builder**: Nixpacks
3. **Root Directory**: `services/api-gateway`
4. **Save**

### For Event Collector:

1. **Settings** → **Build**
2. **Builder**: Nixpacks
3. **Root Directory**: `services/event-collector`
4. **Save**

### For Dashboard:

1. **Settings** → **Build**
2. **Builder**: Nixpacks
3. **Root Directory**: `apps/dashboard`
4. **Save**

Nixpacks will automatically:
- ✅ Detect Node.js/pnpm
- ✅ Install dependencies
- ✅ Build TypeScript
- ✅ Start services

## After Configuration

1. **Redeploy** each service (Railway will auto-redeploy after config change)
2. **Check logs** to verify services start correctly
3. **Generate public domains** for each service

## Database Setup

Railway should create PostgreSQL and Redis from docker-compose.yml automatically. If not:

1. **Create PostgreSQL**: Railway Dashboard → **New** → **Database** → **PostgreSQL**
2. **Create Redis**: Railway Dashboard → **New** → **Database** → **Redis**
3. **Update environment variables** in each service to use Railway's connection strings

