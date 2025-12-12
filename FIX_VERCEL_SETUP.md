# 🔧 Fix Vercel Setup Errors

## ✅ Fixed Issues

### 1. ✅ Removed Invalid `rootDirectory` Property
**Fixed:** Removed `rootDirectory` from `vercel.json` (not a valid property in Vercel API)

The `rootDirectory` should be set in the Vercel UI, not in `vercel.json`.

### 2. ⚠️ Project Name Conflict
**Issue:** Project name "brainintel-dashboard-lbks" already exists

**Solution:** Either:
- Use a different project name (e.g., "retail-brain-dashboard")
- Or update the existing project

---

## 📋 Correct Vercel Settings

### In Vercel UI, set these:

1. **Root Directory:** `apps/dashboard` (set in UI, not in vercel.json)
2. **Build Command:** `cd ../.. && pnpm install && pnpm --filter @retail-brain/dashboard build`
3. **Output Directory:** `.next`
4. **Install Command:** `cd ../.. && pnpm install`
5. **Framework Preset:** Next.js

### Project Name Options:
- `retail-brain-dashboard`
- `brainintel-dashboard-v2`
- `retail-brain-app`
- Or any unique name

---

## 🚀 Next Steps

1. **Change Project Name** in Vercel UI to something unique
2. **Make sure Root Directory is set to `apps/dashboard`** in the UI (not in vercel.json)
3. **Click Deploy**

The `vercel.json` file is now fixed and won't cause the error!

---

**Try deploying again with a new project name!** 🚀

