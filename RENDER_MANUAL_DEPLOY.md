# Render.com Manual Deployment Guide

Since Blueprint YAML is causing issues, we'll deploy services individually. This gives you more control and avoids parsing errors.

## 🚀 Step-by-Step Deployment

### Step 1: Create PostgreSQL Database

1. Go to Render Dashboard → **New +** → **PostgreSQL**
2. Settings:
   - **Name**: `retail-brain-postgres`
   - **Database**: `retail_brain`
   - **User**: `retail_brain_user`
   - **Plan**: Free (or Starter for production)
3. Click **Create Database**
4. **Save the connection details** - you'll need them!

### Step 2: Create Redis

1. Go to Render Dashboard → **New +** → **Redis**
2. Settings:
   - **Name**: `retail-brain-redis`
   - **Plan**: Free (25MB)
3. Click **Create Redis**
4. **Save the connection details**

### Step 3: Deploy API Gateway

1. Go to Render Dashboard → **New +** → **Web Service**
2. Connect your GitHub repo: `aamirsec6/brainintel`
3. Settings:
   - **Name**: `retail-brain-api-gateway`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Environment**: Docker
   - **Dockerfile Path**: `services/api-gateway/Dockerfile`
   - **Docker Context**: `.` (root)
   - **Plan**: Free
4. **Environment Variables** (add these):
   ```
   NODE_ENV=production
   PORT=3000
   POSTGRES_HOST=<from PostgreSQL dashboard>
   POSTGRES_PORT=5432
   POSTGRES_DB=retail_brain
   POSTGRES_USER=retail_brain_user
   POSTGRES_PASSWORD=<from PostgreSQL dashboard>
   REDIS_HOST=<from Redis dashboard>
   REDIS_PORT=6379
   REDIS_PASSWORD=<from Redis dashboard>
   API_GATEWAY_API_KEYS=<generate with: openssl rand -hex 32>
   EVENT_COLLECTOR_URL=https://retail-brain-event-collector.onrender.com
   LOG_LEVEL=info
   ```
5. Click **Create Web Service**

### Step 4: Deploy Event Collector

1. Go to Render Dashboard → **New +** → **Web Service**
2. Connect your GitHub repo: `aamirsec6/brainintel`
3. Settings:
   - **Name**: `retail-brain-event-collector`
   - **Region**: Same as API Gateway
   - **Branch**: `main`
   - **Environment**: Docker
   - **Dockerfile Path**: `services/event-collector/Dockerfile`
   - **Docker Context**: `.`
   - **Plan**: Free
4. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=3001
   POSTGRES_HOST=<same as API Gateway>
   POSTGRES_PORT=5432
   POSTGRES_DB=retail_brain
   POSTGRES_USER=retail_brain_user
   POSTGRES_PASSWORD=<same as API Gateway>
   LOG_LEVEL=info
   ```
5. Click **Create Web Service**

### Step 5: Deploy MLflow Server

1. Go to Render Dashboard → **New +** → **Web Service**
2. Connect your GitHub repo: `aamirsec6/brainintel`
3. Settings:
   - **Name**: `retail-brain-mlflow`
   - **Region**: Same as others
   - **Branch**: `main`
   - **Environment**: Docker
   - **Docker Image**: `ghcr.io/mlflow/mlflow:v2.8.1`
   - **Plan**: Free
4. **Start Command**:
   ```
   mlflow server --backend-store-uri $MLFLOW_BACKEND_STORE_URI --default-artifact-root file:/mlflow/artifacts --host 0.0.0.0 --port $PORT
   ```
5. **Environment Variables**:
   ```
   MLFLOW_BACKEND_STORE_URI=postgresql://retail_brain_user:PASSWORD@HOST:5432/retail_brain
   MLFLOW_DEFAULT_ARTIFACT_ROOT=file:/mlflow/artifacts
   PORT=10000
   ```
   (Replace PASSWORD and HOST with your PostgreSQL details)
6. Click **Create Web Service**

### Step 6: Update Service URLs

After all services are deployed, update the URLs:

1. **API Gateway** → Environment → Update:
   ```
   EVENT_COLLECTOR_URL=https://retail-brain-event-collector.onrender.com
   ```
   (Use the actual URL from Event Collector service)

### Step 7: Run Database Migrations

1. Go to **API Gateway** service → **Shell** tab
2. Run:
   ```bash
   pnpm install
   pnpm db:migrate
   ```

### Step 8: Test Your Deployment

```bash
curl https://retail-brain-api-gateway.onrender.com/health
```

Should return:
```json
{"status":"ok","service":"api-gateway"}
```

## ✅ Success Checklist

- [ ] PostgreSQL created and running
- [ ] Redis created and running
- [ ] API Gateway deployed and healthy
- [ ] Event Collector deployed and healthy
- [ ] MLflow deployed and accessible
- [ ] Database migrations completed
- [ ] Health check returns OK

## 🔄 Auto-Deploy from GitHub

Once set up, any push to `main` branch will automatically:
- Rebuild the service
- Redeploy with new code
- Keep your environment variables

## 📝 Notes

- **Free tier services** spin down after 15min inactivity
- **First request** after spin-down takes 30-60 seconds
- **PostgreSQL** is free for 90 days, then $7/month
- All services get **automatic HTTPS**

## 🆘 Troubleshooting

**Service won't start?**
- Check **Logs** tab for errors
- Verify environment variables are set
- Ensure PostgreSQL is "Ready" before starting services

**Database connection errors?**
- Double-check POSTGRES_HOST, POSTGRES_PASSWORD
- Verify PostgreSQL is running
- Check firewall/network settings

**Slow first request?**
- Normal for free tier (spin-down)
- Consider paid plan for always-on

