# 🚀 Quick Start: Deploy Retail Brain Online

## Overview

Deploy your entire platform in 3 steps:
1. **Backend Services** → Railway (15 minutes)
2. **Dashboard** → Vercel (5 minutes)
3. **Test** → Verify everything works (5 minutes)

---

## Step 1: Deploy Backend to Railway (15 min)

### 1.1 Create Railway Project

1. Go to [railway.app](https://railway.app) → Sign up with GitHub
2. **New Project** → **Deploy from GitHub repo**
3. Select your `braintel` repository

### 1.2 Deploy API Gateway

1. **New Service** → **GitHub Repo**
2. **Settings:**
   - Name: `api-gateway`
   - Dockerfile Path: `Dockerfile.api-gateway`
   - Port: `3000`
3. **Variables** (Settings → Variables):
   ```bash
   DATABASE_URL=postgresql://postgres:w%2Av%21k4%409fyM%40bgt@db.opemkjouudqqqvpchltl.supabase.co:5432/postgres
   PROFILE_SERVICE_URL=http://profile-service:3003
   AI_ASSISTANT_SERVICE_URL=http://ai-assistant-service:3006
   API_GATEWAY_API_KEYS=prod_key_123
   ```
4. **Generate Domain** → Copy URL (e.g., `api-gateway-production.up.railway.app`)

### 1.3 Deploy Other Services

Repeat for each service:

| Service | Dockerfile Path | Port |
|---------|----------------|------|
| `profile-service` | `services/profile-service/Dockerfile` | 3003 |
| `onboarding-service` | `services/onboarding-service/Dockerfile` | 3005 |
| `ai-assistant-service` | `services/ai-assistant-service/Dockerfile` | 3006 |
| `intent-service` | `services/intent-service/Dockerfile` | 3017 |

**For each service, add:**
```bash
DATABASE_URL=postgresql://postgres:w%2Av%21k4%409fyM%40bgt@db.opemkjouudqqqvpchltl.supabase.co:5432/postgres
```

---

## Step 2: Deploy Dashboard to Vercel (5 min)

### 2.1 Connect Vercel

1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub
2. **Add New Project** → Select `braintel` repo

### 2.2 Configure

- **Root Directory:** `apps/dashboard`
- **Build Command:** `cd ../.. && pnpm install && pnpm --filter @retail-brain/dashboard build`

### 2.3 Environment Variables

Add these in Vercel → Settings → Environment Variables:

```bash
NEXT_PUBLIC_API_URL=https://your-api-gateway.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://opemkjouudqqqvpchltl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZW1ram91dWRxcXF2cGNobHRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MzAzMTQsImV4cCI6MjA4MTEwNjMxNH0.XF9CdfwvJxSd1jvrT_Ql0u036y2Jf-R0XDOo4QJsJsA
```

**Replace `your-api-gateway.railway.app` with your Railway URL!**

### 2.4 Deploy

Click **"Deploy"** → Wait 2-3 minutes → Get your URL!

---

## Step 3: Test (5 min)

### 3.1 Test API Gateway

```bash
curl https://your-api-gateway.railway.app/health
```

Should return: `{"status":"ok",...}`

### 3.2 Test Dashboard

1. Visit your Vercel URL
2. Click **"Sign Up"**
3. Create an account
4. Check if dashboard loads

### 3.3 Test Features

- [ ] Sign up/login works
- [ ] Dashboard shows stats
- [ ] Can import CSV
- [ ] Customer search works

---

## 🎉 Done!

Your platform is now live:
- **Dashboard:** `https://your-dashboard.vercel.app`
- **API:** `https://your-api-gateway.railway.app`

---

## 📚 Detailed Guides

- **Full Deployment Guide:** `DEPLOYMENT_GUIDE.md`
- **Railway Specific:** `RAILWAY_QUICK_DEPLOY.md`
- **Vercel Specific:** `VERCEL_DASHBOARD_DEPLOY.md`
- **Checklist:** `DEPLOYMENT_CHECKLIST.md`

---

## 💡 Tips

1. **Monitor Logs:** Check Railway/Vercel logs if something breaks
2. **Auto-Deploy:** Both platforms auto-deploy on git push
3. **Custom Domain:** Add your domain in Vercel/Railway settings
4. **Cost:** Free tiers are generous, but monitor usage

---

**Need help?** Check the detailed guides or Railway/Vercel documentation.

