# Railway Quick Fix - Update Dockerfile Paths

## The Problem
Railway is building from the service directory, but our Dockerfiles need the repository root to access `pnpm-workspace.yaml`.

## The Solution
I've created root-level Dockerfiles that Railway can use. You just need to update the Dockerfile paths in Railway.

## Steps (2 minutes):

### For `retail-brain-api-gateway`:
1. Go to Railway Dashboard → `retail-brain-api-gateway` → **Settings** → **Build**
2. **Dockerfile Path**: Change from `services/api-gateway/Dockerfile` to: **`Dockerfile.api-gateway`**
3. **Save** (Railway will auto-redeploy)

### For `retail-brain-event-collector`:
1. Go to Railway Dashboard → `retail-brain-event-collector` → **Settings** → **Build**
2. **Dockerfile Path**: Change from `services/event-collector/Dockerfile` to: **`Dockerfile.event-collector`**
3. **Save** (Railway will auto-redeploy)

## Why This Works
These Dockerfiles are at the repository root, so Railway will automatically use the root as the build context. This ensures `pnpm-workspace.yaml` and all shared modules are available during the build.

## Verify It Works
After saving, check the build logs:
```bash
railway logs --service retail-brain-api-gateway
```

You should see:
- ✅ `pnpm-workspace.yaml` found
- ✅ Dependencies installed
- ✅ Build successful
- ✅ Service starts without crashes

## If You Still See Errors
If Railway still can't find the files, try:
1. **Builder**: Make sure it's set to "Dockerfile" (not Nixpacks)
2. **Watch Paths**: Add `/services/api-gateway/**` to trigger rebuilds
3. Check that the Dockerfile path is exactly `Dockerfile.api-gateway` (no leading slash)

