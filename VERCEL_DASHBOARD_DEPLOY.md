# ▲ Vercel Dashboard Deployment

## Quick Steps

### 1. Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with **GitHub**
3. Click **"Add New Project"**
4. Select your `braintel` repository

### 2. Configure Project

**Project Settings:**
- **Framework Preset:** Next.js
- **Root Directory:** `apps/dashboard`
- **Build Command:** `cd ../.. && pnpm install && pnpm --filter @retail-brain/dashboard build`
- **Output Directory:** `.next` (default)
- **Install Command:** `cd ../.. && pnpm install`

### 3. Environment Variables

Go to **Settings** → **Environment Variables** and add:

```bash
NEXT_PUBLIC_API_URL=https://your-api-gateway.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://opemkjouudqqqvpchltl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZW1ram91dWRxcXF2cGNobHRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MzAzMTQsImV4cCI6MjA4MTEwNjMxNH0.XF9CdfwvJxSd1jvrT_Ql0u036y2Jf-R0XDOo4QJsJsA
```

**Important:** Replace `your-api-gateway.railway.app` with your actual Railway API Gateway URL!

### 4. Deploy

Click **"Deploy"** - Vercel will:
1. Install dependencies
2. Build the Next.js app
3. Deploy to a public URL

### 5. Get Your URL

After deployment, you'll get a URL like:
- `your-dashboard.vercel.app`

### 6. Test

1. Visit your Vercel URL
2. Try signing up/login
3. Check if dashboard loads

## Auto-Deployments

Vercel automatically deploys when you push to:
- `main` branch → Production
- Other branches → Preview deployments

## Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS instructions

---

**Your dashboard is now live!** 🎉

