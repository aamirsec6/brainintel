# 🚂 Railway.app Quick Start Guide

Deploy your Retail Brain platform on Railway in 5 minutes!

## ✅ Prerequisites

- GitHub account
- Railway account (sign up at https://railway.app - free tier available)

## 🚀 Step-by-Step Deployment

### Step 1: Sign Up for Railway

1. Go to **https://railway.app**
2. Click **"Start a New Project"**
3. Sign up with **GitHub** (recommended)
4. Authorize Railway to access your repositories

### Step 2: Deploy from GitHub

1. In Railway dashboard, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Find and select **`aamirsec6/brainintel`**
4. Railway will automatically detect `docker-compose.yml`!

### Step 3: Configure Services

Railway will create services from your `docker-compose.yml`. You'll see:
- ✅ PostgreSQL (from docker-compose)
- ✅ Redis (from docker-compose)
- ✅ API Gateway
- ✅ Event Collector
- ✅ MLflow Server

### Step 4: Add Environment Variables

#### For API Gateway Service:

1. Click on **`api-gateway`** service
2. Go to **Variables** tab
3. Add these variables:

```
NODE_ENV=production
API_GATEWAY_API_KEYS=<generate with: openssl rand -hex 32>
EVENT_COLLECTOR_URL=https://event-collector-production.up.railway.app
```

**Generate API key:**
```bash
openssl rand -hex 32
```

#### For Event Collector Service:

1. Click on **`event-collector`** service
2. Go to **Variables** tab
3. Add:

```
NODE_ENV=production
LOG_LEVEL=info
```

#### For MLflow Service:

1. Click on **`mlflow-server`** service
2. Go to **Variables** tab
3. The `MLFLOW_BACKEND_STORE_URI` will use PostgreSQL from docker-compose automatically

### Step 5: Generate Public URLs

1. For **API Gateway** service:
   - Click **Settings** tab
   - Click **Generate Domain**
   - Copy the URL (e.g., `https://api-gateway-production.up.railway.app`)

2. For **Event Collector**:
   - Same process - generate domain
   - Update API Gateway's `EVENT_COLLECTOR_URL` with this new URL

3. For **MLflow**:
   - Generate domain if you want public access
   - Or keep it internal

### Step 6: Run Database Migrations

1. Click on **API Gateway** service
2. Go to **Deployments** tab
3. Click on the latest deployment
4. Click **"View Logs"** or use **"Shell"** tab
5. Run:

```bash
pnpm install
pnpm db:migrate
```

### Step 7: Test Your Deployment

```bash
curl https://api-gateway-production.up.railway.app/health
```

Should return:
```json
{"status":"ok","service":"api-gateway"}
```

## 🎯 Your Live URLs

After deployment, you'll have:

- **API Gateway**: `https://api-gateway-production.up.railway.app`
- **Event Collector**: `https://event-collector-production.up.railway.app`
- **MLflow**: `https://mlflow-server-production.up.railway.app` (if you generated domain)

## 🔄 Auto-Deploy from GitHub

Railway automatically:
- ✅ Detects pushes to `main` branch
- ✅ Rebuilds and redeploys services
- ✅ Keeps your environment variables
- ✅ Shows deployment status

## 💰 Railway Pricing

- **Free Tier**: $5 credit/month (perfect for testing!)
- **Hobby Plan**: $5/month (more resources)
- **Pro Plan**: $20/month (production-ready)

## 📝 Important Notes

1. **First Deploy**: Takes 5-10 minutes (building Docker images)
2. **Environment Variables**: Set them before first deploy for best results
3. **Database**: PostgreSQL from docker-compose is persistent
4. **Redis**: Data persists in docker-compose volume
5. **Logs**: Available in Railway dashboard for each service

## 🆘 Troubleshooting

### Service Won't Start?

1. Check **Logs** tab for errors
2. Verify environment variables are set
3. Ensure PostgreSQL is running (check docker-compose services)

### Database Connection Errors?

1. Verify `POSTGRES_HOST=postgres` (docker-compose service name)
2. Check `POSTGRES_PASSWORD` is set
3. Wait for PostgreSQL to be fully ready (check logs)

### Can't Access Service?

1. Make sure you **Generated Domain** in Settings
2. Check service is **Deployed** (green status)
3. Verify the service is listening on `$PORT` (Railway provides this automatically)

## ✅ Success Checklist

- [ ] All services deployed successfully
- [ ] API Gateway health check returns OK
- [ ] Database migrations completed
- [ ] Public URLs generated
- [ ] Environment variables set
- [ ] Can access API Gateway from browser

## 🎉 You're Live!

Your Retail Brain platform is now deployed on Railway! 

**Next Steps:**
- Test your API endpoints
- Access MLflow UI
- Start sending events to Event Collector
- Monitor logs in Railway dashboard

---

**Need Help?**
- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway

