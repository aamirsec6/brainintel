# 🔧 Fix Vercel Deployment Errors

## Common Issues & Solutions

### Issue 1: Build Fails - "Cannot find module"

**Solution:** Make sure Root Directory is set correctly:
- **Root Directory:** `apps/dashboard`

### Issue 2: pnpm workspace not found

**Solution:** Update Build Command:
```bash
cd ../.. && pnpm install --filter @retail-brain/dashboard... && pnpm --filter @retail-brain/dashboard build
```

Or use:
```bash
cd ../.. && pnpm install && cd apps/dashboard && pnpm build
```

### Issue 3: Missing environment variables

**Required Variables:**
```bash
NEXT_PUBLIC_API_URL=https://api-gateway-production-6d2f.up.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://opemkjouudqqqvpchltl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZW1ram91dWRxcXF2cGNobHRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MzAzMTQsImV4cCI6MjA4MTEwNjMxNH0.XF9CdfwvJxSd1jvrT_Ql0u036y2Jf-R0XDOo4QJsJsA
```

### Issue 4: TypeScript errors

**Solution:** Check if `tsconfig.json` is correct in `apps/dashboard`

---

## Quick Fix Steps

1. **Check Vercel Build Logs:**
   - Go to Vercel Dashboard → Your Project → Deployments
   - Click on the failed deployment
   - Check the error message

2. **Update Vercel Settings:**
   - Settings → General
   - **Root Directory:** `apps/dashboard`
   - **Build Command:** `cd ../.. && pnpm install && pnpm --filter @retail-brain/dashboard build`
   - **Output Directory:** `.next`

3. **Redeploy:**
   - Go to Deployments tab
   - Click "Redeploy" on latest deployment

---

## Tell Me the Error

**What error message are you seeing?** Share it and I'll help fix it specifically!

Common errors:
- "Cannot find module"
- "pnpm: command not found"
- "Build failed"
- "TypeScript errors"
- "Missing environment variable"

