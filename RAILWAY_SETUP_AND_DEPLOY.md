# 🚂 Railway Setup & Deployment Guide

## Step 1: Install Railway CLI

```bash
npm i -g @railway/cli
```

## Step 2: Login to Railway

```bash
railway login
```

This will open your browser to authenticate.

## Step 3: Create/Link Project

```bash
cd /Users/aamirhabibsaudagar/braintel

# Create new Railway project
railway init

# Or link to existing project
railway link
```

## Step 4: Deploy Services

I can help you deploy each service. Here's the process:

### Deploy API Gateway

```bash
# Set service name
railway service create api-gateway

# Set environment variables
railway variables set \
  NODE_ENV=production \
  PORT=3000 \
  DATABASE_URL="postgresql://postgres:w%2Av%21k4%409fyM%40bgt@db.opemkjouudqqqvpchltl.supabase.co:5432/postgres" \
  PROFILE_SERVICE_URL=http://profile-service:3003 \
  AI_ASSISTANT_SERVICE_URL=http://ai-assistant-service:3006 \
  API_GATEWAY_API_KEYS=prod_key_123

# Deploy
railway up --service api-gateway
```

### Deploy Other Services

Similar process for:
- `profile-service` (port 3003)
- `onboarding-service` (port 3005)
- `ai-assistant-service` (port 3006)
- `intent-service` (port 3017)

## Step 5: View Logs & Debug

```bash
# View logs for a service
railway logs --service api-gateway --tail

# Check deployment status
railway status

# Open service dashboard
railway open --service api-gateway
```

## Step 6: Deploy Dashboard

For the dashboard, we can either:
1. Deploy to Railway (same platform)
2. Deploy to Vercel (better for Next.js, but I can't access logs as easily)

**Recommendation:** Start with Railway for everything, then move dashboard to Vercel later if needed.

---

## What I Can Do Once Railway is Set Up

✅ **Deploy services** - Run `railway up` commands  
✅ **View logs** - See errors in real-time  
✅ **Fix issues** - Update code, redeploy  
✅ **Update config** - Change environment variables  
✅ **Monitor** - Check service health  
✅ **Debug** - Identify and fix problems  

---

## Quick Commands Reference

```bash
# List all services
railway service list

# View logs
railway logs --service <service-name> --tail

# Deploy
railway up --service <service-name>

# Set variables
railway variables set KEY=value --service <service-name>

# Check status
railway status

# Open dashboard
railway open
```

---

**Once Railway CLI is installed, I can help you deploy everything!** 🚀

