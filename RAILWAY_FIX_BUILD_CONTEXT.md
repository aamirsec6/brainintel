# Railway Build Context Fix

## Problem
Railway is building services with the service directory as context, but our Dockerfiles need the repository root to access `pnpm-workspace.yaml` and shared modules.

## Solution: Set Root Directory in Railway UI

For each service (API Gateway, Event Collector), you need to set the **Root Directory** to `.` (repository root).

### Steps:

1. **Go to Railway Dashboard** → Your Project → Service (e.g., `retail-brain-api-gateway`)

2. **Settings Tab** → **Build Section**

3. **Look for "Root Directory" or "Build Context"** field
   - If you see "Root Directory", set it to: `.` (just a dot)
   - If you see "Docker Context", set it to: `.`

4. **If those fields don't exist**, Railway might be auto-detecting. Try:
   - **Builder**: Keep as "Dockerfile"
   - **Dockerfile Path**: `services/api-gateway/Dockerfile` (already set)
   - **Watch Paths**: Add `/services/api-gateway/**` to trigger rebuilds on changes

5. **Save** and Railway will automatically redeploy

### Alternative: Use Nixpacks Builder

If Dockerfile context issues persist, switch to Nixpacks:

1. **Settings** → **Build** → **Builder**: Change to "Nixpacks"
2. **Root Directory**: `services/api-gateway` (service directory)
3. Nixpacks will auto-detect Node.js and pnpm, but you'll need to ensure it installs from root

### Services to Configure:

- ✅ `retail-brain-api-gateway` → Root: `.` or Dockerfile: `services/api-gateway/Dockerfile`
- ✅ `retail-brain-event-collector` → Root: `.` or Dockerfile: `services/event-collector/Dockerfile`
- ✅ `retail-brain-mlflow` → Already using Docker image, no changes needed

## Verification

After setting the root directory, check the build logs:
```bash
railway logs --service retail-brain-api-gateway
```

You should see:
- ✅ `pnpm-workspace.yaml` found
- ✅ `package.json` found
- ✅ Build completes successfully
- ✅ `dist/index.js` created

## If Still Failing

If Railway doesn't support root directory setting, we can:
1. Create service-specific Dockerfiles that copy from parent directories
2. Use a build script approach
3. Switch to Nixpacks with custom buildpacks

