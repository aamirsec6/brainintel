# 🚂 Railway Quick Deploy Guide

## Prerequisites

1. ✅ GitHub repository pushed
2. ✅ Railway account created (railway.app)
3. ✅ Supabase database configured

## Step-by-Step Deployment

### 1. Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `braintel` repository

### 2. Deploy API Gateway (First Service)

1. Click **"New Service"** → **"GitHub Repo"**
2. Select your repo again
3. **Settings:**
   - **Name:** `api-gateway`
   - **Root Directory:** `.` (leave empty)
   - **Dockerfile Path:** `Dockerfile.api-gateway`
   - **Port:** `3000`

4. **Environment Variables** (Settings → Variables):
   ```bash
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=postgresql://postgres:w%2Av%21k4%409fyM%40bgt@db.opemkjouudqqqvpchltl.supabase.co:5432/postgres
   PROFILE_SERVICE_URL=http://profile-service:3003
   EVENT_COLLECTOR_URL=http://event-collector:3001
   INTENT_SERVICE_URL=http://intent-service:3017
   ML_SCORER_SERVICE_URL=http://ml-scorer-service:3015
   AI_ASSISTANT_SERVICE_URL=http://ai-assistant-service:3006
   API_GATEWAY_API_KEYS=prod_key_12345
   ```

5. **Generate Public URL:**
   - Settings → **"Generate Domain"**
   - Copy the URL (e.g., `api-gateway-production.up.railway.app`)

### 3. Deploy Profile Service

1. **New Service** → **GitHub Repo**
2. **Settings:**
   - **Name:** `profile-service`
   - **Root Directory:** `.`
   - **Dockerfile Path:** `services/profile-service/Dockerfile`
   - **Port:** `3003`

3. **Environment Variables:**
   ```bash
   NODE_ENV=production
   PORT=3003
   DATABASE_URL=postgresql://postgres:w%2Av%21k4%409fyM%40bgt@db.opemkjouudqqqvpchltl.supabase.co:5432/postgres
   ```

### 4. Deploy Onboarding Service

1. **New Service** → **GitHub Repo**
2. **Settings:**
   - **Name:** `onboarding-service`
   - **Root Directory:** `.`
   - **Dockerfile Path:** `services/onboarding-service/Dockerfile`
   - **Port:** `3005`

3. **Environment Variables:**
   ```bash
   NODE_ENV=production
   PORT=3005
   DATABASE_URL=postgresql://postgres:w%2Av%21k4%409fyM%40bgt@db.opemkjouudqqqvpchltl.supabase.co:5432/postgres
   ```

### 5. Deploy AI Assistant Service

1. **New Service** → **GitHub Repo**
2. **Settings:**
   - **Name:** `ai-assistant-service`
   - **Root Directory:** `.`
   - **Dockerfile Path:** `services/ai-assistant-service/Dockerfile`
   - **Port:** `3006`

3. **Environment Variables:**
   ```bash
   NODE_ENV=production
   PORT=3006
   DATABASE_URL=postgresql://postgres:w%2Av%21k4%409fyM%40bgt@db.opemkjouudqqqvpchltl.supabase.co:5432/postgres
   ```

### 6. Deploy Python Services

#### Intent Service

1. **New Service** → **GitHub Repo**
2. **Settings:**
   - **Name:** `intent-service`
   - **Root Directory:** `services/intent-service`
   - **Dockerfile Path:** `Dockerfile`
   - **Port:** `3017`

3. **Environment Variables:**
   ```bash
   DATABASE_URL=postgresql://postgres:w%2Av%21k4%409fyM%40bgt@db.opemkjouudqqqvpchltl.supabase.co:5432/postgres
   ```

#### Embedding Service

1. **New Service** → **GitHub Repo**
2. **Settings:**
   - **Name:** `embedding-service`
   - **Root Directory:** `services/embedding-service`
   - **Dockerfile Path:** `Dockerfile`
   - **Port:** `3016`

3. **Environment Variables:**
   ```bash
   DATABASE_URL=postgresql://postgres:w%2Av%21k4%409fyM%40bgt@db.opemkjouudqqqvpchltl.supabase.co:5432/postgres
   ```

## Update Service URLs

After all services are deployed, update API Gateway environment variables with Railway internal service names:

```bash
PROFILE_SERVICE_URL=http://profile-service:3003
INTENT_SERVICE_URL=http://intent-service:3017
AI_ASSISTANT_SERVICE_URL=http://ai-assistant-service:3006
```

Railway automatically creates internal DNS for services in the same project!

## Test Deployment

```bash
# Test API Gateway
curl https://your-api-gateway.railway.app/health

# Test Profile Service (internal)
curl http://profile-service:3003/health
```

## Monitor Logs

In Railway Dashboard:
- Click any service
- View **"Logs"** tab
- Watch for errors or connection issues

---

**Your backend is now live on Railway!** 🚂

