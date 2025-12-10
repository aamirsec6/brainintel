# Railway.app Deployment (Alternative - Easier!)

Railway supports docker-compose directly, making deployment much simpler!

## 🚀 Quick Deploy on Railway

### Step 1: Sign Up
1. Go to https://railway.app
2. Sign up with GitHub
3. Authorize Railway to access your repos

### Step 2: Deploy from GitHub
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose `aamirsec6/brainintel`
4. Railway will detect `docker-compose.yml` automatically!

### Step 3: Add Environment Variables
Railway will create services from docker-compose.yml. Add env vars:

**For API Gateway:**
- `API_GATEWAY_API_KEYS` (generate: `openssl rand -hex 32`)

**For MLflow:**
- `MLFLOW_BACKEND_STORE_URI` (Railway provides PostgreSQL connection string)

### Step 4: Generate Domain
1. Each service gets a public URL automatically
2. Click on service → **Settings** → **Generate Domain**

### Step 5: Run Migrations
1. Go to API Gateway service
2. Open **Shell** tab
3. Run: `pnpm install && pnpm db:migrate`

## ✅ Advantages of Railway

- ✅ **docker-compose.yml works directly** (no YAML parsing issues!)
- ✅ **Automatic PostgreSQL & Redis** from compose
- ✅ **Free tier available** ($5 credit/month)
- ✅ **Auto-deploy from GitHub**
- ✅ **Simple setup**

## 💰 Pricing

- **Free tier**: $5 credit/month
- **Hobby plan**: $5/month (more resources)
- **Pro plan**: $20/month (production-ready)

## 🔄 Auto-Deploy

Railway automatically deploys when you push to `main` branch!

