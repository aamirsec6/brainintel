# ▲ Deploy Dashboard to Vercel

## Quick Steps

### 1. Go to Vercel

1. Visit: https://vercel.com
2. Sign up/Login with **GitHub**
3. Click **"Add New Project"**

### 2. Connect Your Repository

1. Select your `braintel` repository
2. Click **"Import"**

### 3. Configure Project

**Important Settings:**
- **Framework Preset:** Next.js
- **Root Directory:** `apps/dashboard` ⚠️ **Change this!**
- **Build Command:** `cd ../.. && pnpm install && pnpm --filter @retail-brain/dashboard build`
- **Output Directory:** `.next` (default)
- **Install Command:** `cd ../.. && pnpm install`

### 4. Environment Variables

Click **"Environment Variables"** and add:

```bash
NEXT_PUBLIC_API_URL=https://api-gateway-production.up.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://opemkjouudqqqvpchltl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZW1ram91dWRxcXF2cGNobHRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MzAzMTQsImV4cCI6MjA4MTEwNjMxNH0.XF9CdfwvJxSd1jvrT_Ql0u036y2Jf-R0XDOo4QJsJsA
```

**⚠️ Replace `api-gateway-production.up.railway.app` with your actual Railway API Gateway URL!**

To get your API Gateway URL:
```bash
railway domain --service api-gateway
```

### 5. Deploy

Click **"Deploy"** - Vercel will:
1. Build your Next.js app
2. Deploy to a public URL
3. Give you: `your-dashboard.vercel.app`

### 6. Access Your Sites

- **Dashboard:** `https://your-dashboard.vercel.app`
- **Marketing Page:** `https://your-dashboard.vercel.app/marketing`
- **Login:** `https://your-dashboard.vercel.app/login`

---

## Auto-Deployments

Vercel automatically deploys when you push to GitHub!

---

**Your dashboard and marketing site will be live on Vercel!** 🎉

