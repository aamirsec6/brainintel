# 🔧 Fix Vercel Deployment - Step by Step

## Step 1: Check Your Error

Go to Vercel Dashboard → Your Project → Deployments → Click the failed deployment → Check the error log.

**What error are you seeing?** Common ones:

### Error 1: "Cannot find module" or "Module not found"
**Fix:** Root Directory not set correctly

### Error 2: "pnpm: command not found"
**Fix:** Install command issue

### Error 3: "Build failed" or TypeScript errors
**Fix:** Build configuration issue

### Error 4: "Missing environment variable"
**Fix:** Need to add env vars

---

## Step 2: Update Vercel Settings

### In Vercel Dashboard:

1. **Go to:** Settings → General

2. **Set these values:**
   - **Root Directory:** `apps/dashboard`
   - **Build Command:** `cd ../.. && pnpm install && pnpm --filter @retail-brain/dashboard build`
   - **Output Directory:** `.next`
   - **Install Command:** `cd ../.. && pnpm install`

3. **Framework Preset:** Next.js

---

## Step 3: Add Environment Variables

Go to **Settings → Environment Variables** and add:

```bash
NEXT_PUBLIC_API_URL=https://api-gateway-production-6d2f.up.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://opemkjouudqqqvpchltl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZW1ram91dWRxcXF2cGNobHRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MzAzMTQsImV4cCI6MjA4MTEwNjMxNH0.XF9CdfwvJxSd1jvrT_Ql0u036y2Jf-R0XDOo4QJsJsA
```

**Make sure to select:** Production, Preview, and Development for all variables!

---

## Step 4: Alternative Build Command

If the build command doesn't work, try this simpler one:

**Build Command:**
```bash
cd ../.. && pnpm install && cd apps/dashboard && pnpm build
```

---

## Step 5: Redeploy

1. Go to **Deployments** tab
2. Click **"Redeploy"** on the latest deployment
3. Or push a new commit to trigger auto-deploy

---

## I've Created `vercel.json`

I've added a `vercel.json` file to your project root. This should help Vercel understand your monorepo structure.

**After updating settings, redeploy!**

---

## Tell Me the Exact Error

**Copy and paste the error message from Vercel logs**, and I'll give you the exact fix!

