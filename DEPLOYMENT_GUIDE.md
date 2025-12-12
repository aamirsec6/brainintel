# 🚀 Complete Deployment Guide - Retail Brain

Host your entire Retail Brain platform online!

## 📋 Deployment Strategy

### Recommended Setup:
1. **Dashboard (Next.js)** → **Vercel** (Free, automatic deployments)
2. **Backend Services** → **Railway** (Easy monorepo support, Docker)
3. **Database & Auth** → **Supabase** (Already configured ✅)
4. **Redis** → **Upstash** (Free tier, serverless Redis)

---

## 🎯 Step 1: Prepare Your Repository

### 1.1 Push to GitHub

```bash
# Make sure all changes are committed
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 1.2 Create `.env.production` Template

Create a file `.env.production.example` with all required variables (we'll set these in hosting platforms).

---

## 🎯 Step 2: Deploy Dashboard to Vercel

### 2.1 Connect Vercel to GitHub

1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click **"Add New Project"**
4. Select your `braintel` repository
5. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/dashboard`
   - **Build Command:** `cd ../.. && pnpm install && pnpm --filter @retail-brain/dashboard build`
   - **Output Directory:** `.next`
   - **Install Command:** `cd ../.. && pnpm install`

### 2.2 Environment Variables in Vercel

Add these in Vercel Dashboard → Settings → Environment Variables:

```bash
NEXT_PUBLIC_API_URL=https://your-api-gateway.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://opemkjouudqqqvpchltl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.3 Deploy

Click **"Deploy"** - Vercel will automatically build and deploy!

---

## 🎯 Step 3: Deploy Backend Services to Railway

### 3.1 Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select your `braintel` repository

### 3.2 Deploy API Gateway

1. Click **"New Service"** → **"GitHub Repo"**
2. Select your repo
3. Configure:
   - **Name:** `api-gateway`
   - **Root Directory:** `.` (root)
   - **Dockerfile Path:** `Dockerfile.api-gateway`
   - **Port:** `3000`

4. **Environment Variables:**
   ```bash
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=postgresql://postgres:w%2Av%21k4%409fyM%40bgt@db.opemkjouudqqqvpchltl.supabase.co:5432/postgres
   PROFILE_SERVICE_URL=http://profile-service:3003
   EVENT_COLLECTOR_URL=http://event-collector:3001
   INTENT_SERVICE_URL=http://intent-service:3017
   ML_SCORER_SERVICE_URL=http://ml-scorer-service:3015
   AI_ASSISTANT_SERVICE_URL=http://ai-assistant-service:3006
   API_GATEWAY_API_KEYS=your_production_api_key
   REDIS_HOST=your-redis-host.upstash.io
   REDIS_PORT=6379
   REDIS_PASSWORD=your-redis-password
   ```

5. **Generate Public URL:**
   - Click **"Settings"** → **"Generate Domain"**
   - Copy the URL (e.g., `api-gateway-production.up.railway.app`)

### 3.3 Deploy Profile Service

1. **New Service** → **GitHub Repo**
2. Configure:
   - **Name:** `profile-service`
   - **Root Directory:** `.`
   - **Dockerfile Path:** `services/profile-service/Dockerfile` (create if needed)
   - **Port:** `3003`

3. **Environment Variables:**
   ```bash
   NODE_ENV=production
   PORT=3003
   DATABASE_URL=postgresql://postgres:w%2Av%21k4%409fyM%40bgt@db.opemkjouudqqqvpchltl.supabase.co:5432/postgres
   ```

### 3.4 Deploy Onboarding Service

1. **New Service** → **GitHub Repo**
2. Configure:
   - **Name:** `onboarding-service`
   - **Root Directory:** `.`
   - **Dockerfile Path:** `services/onboarding-service/Dockerfile` (create if needed)
   - **Port:** `3005`

3. **Environment Variables:**
   ```bash
   NODE_ENV=production
   PORT=3005
   DATABASE_URL=postgresql://postgres:w%2Av%21k4%409fyM%40bgt@db.opemkjouudqqqvpchltl.supabase.co:5432/postgres
   ```

### 3.5 Deploy Python Services

For **Intent Service** (Python/FastAPI):

1. **New Service** → **GitHub Repo**
2. Configure:
   - **Name:** `intent-service`
   - **Root Directory:** `services/intent-service`
   - **Dockerfile Path:** `Dockerfile`
   - **Port:** `3017`

3. **Environment Variables:**
   ```bash
   DATABASE_URL=postgresql://postgres:w%2Av%21k4%409fyM%40bgt@db.opemkjouudqqqvpchltl.supabase.co:5432/postgres
   REDIS_HOST=your-redis-host.upstash.io
   REDIS_PORT=6379
   REDIS_PASSWORD=your-redis-password
   ```

Repeat for:
- `embedding-service` (port 3016)
- `ml-scorer-service` (port 3015)
- `ml-monitoring-service` (port 3020)

### 3.6 Update Service URLs

After deploying all services, update environment variables to use Railway internal URLs:

- In **API Gateway**, update:
  ```bash
  PROFILE_SERVICE_URL=http://profile-service:3003
  INTENT_SERVICE_URL=http://intent-service:3017
  # etc.
  ```

---

## 🎯 Step 4: Set Up Redis (Upstash)

### 4.1 Create Upstash Account

1. Go to [upstash.com](https://upstash.com)
2. Sign up (free tier available)
3. Click **"Create Database"**
4. Choose **"Regional"** (closest to your Railway region)
5. Copy connection details:
   - **Endpoint:** `your-redis.upstash.io`
   - **Port:** `6379`
   - **Password:** (shown once, save it!)

### 4.2 Add to Railway Services

Add Redis credentials to all services that need it (API Gateway, Intent Service, etc.)

---

## 🎯 Step 5: Update Vercel with Production URLs

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update `NEXT_PUBLIC_API_URL` to your Railway API Gateway URL:
   ```bash
   NEXT_PUBLIC_API_URL=https://api-gateway-production.up.railway.app
   ```
3. Redeploy (automatic or manual)

---

## 🎯 Step 6: Test Deployment

### 6.1 Test API Gateway

```bash
curl https://your-api-gateway.railway.app/health
```

### 6.2 Test Dashboard

Visit your Vercel URL (e.g., `your-dashboard.vercel.app`)

### 6.3 Test Authentication

1. Go to your dashboard URL
2. Try signing up
3. Check Supabase Dashboard → Authentication → Users

---

## 📝 Required Dockerfiles

### Create Missing Dockerfiles

If any services don't have Dockerfiles, create them:

**Example: `services/profile-service/Dockerfile`**
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/profile-service/package.json ./services/profile-service/
COPY shared/*/package.json ./shared/*/

# Install pnpm and dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build
WORKDIR /app/services/profile-service
RUN pnpm build

# Run
CMD ["node", "dist/index.js"]
```

---

## 🔒 Security Checklist

- [ ] Use strong API keys in production
- [ ] Enable HTTPS (automatic on Vercel/Railway)
- [ ] Set up CORS properly
- [ ] Use environment variables (never commit secrets)
- [ ] Enable Supabase Row Level Security (RLS)

---

## 💰 Cost Estimate

### Free Tier:
- **Vercel:** Free (generous limits)
- **Railway:** $5/month credit (enough for small apps)
- **Supabase:** Free tier (500MB database, 50K monthly active users)
- **Upstash:** Free tier (10K commands/day)

### Paid (if needed):
- **Railway:** ~$20/month for multiple services
- **Supabase Pro:** $25/month (if you exceed free tier)

---

## 🐛 Troubleshooting

### Services not connecting?
- Check Railway service logs
- Verify environment variables
- Check service URLs in API Gateway

### Dashboard can't reach API?
- Verify `NEXT_PUBLIC_API_URL` in Vercel
- Check CORS settings in API Gateway
- Test API Gateway health endpoint

### Database connection errors?
- Verify `DATABASE_URL` is correct
- Check Supabase connection limits
- Ensure IP is whitelisted (if required)

---

## 🎉 Next Steps

1. **Custom Domain:**
   - Add custom domain in Vercel
   - Add custom domain in Railway

2. **Monitoring:**
   - Set up Railway monitoring
   - Add error tracking (Sentry)

3. **CI/CD:**
   - Already set up! (GitHub → Vercel/Railway auto-deploy)

---

**Your platform will be live!** 🚀

