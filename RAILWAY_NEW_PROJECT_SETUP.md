# Railway New Project Setup - Step by Step

## Step 1: Create New Railway Project

### Option A: Via Railway Dashboard (Recommended)
1. Go to https://railway.app
2. Click **+ New Project**
3. Select **Deploy from GitHub repo**
4. Choose your repository: `aamirsec6/brainintel`
5. Railway will create a new project

### Option B: Via CLI
```bash
railway init
# Follow prompts to create new project
```

## Step 2: Create PostgreSQL Database

1. In Railway Dashboard → Your New Project
2. Click **+ New** → **Database** → **Add PostgreSQL**
3. Wait for provisioning (30-60 seconds)
4. Once created, go to **Variables** tab
5. **Copy these values** (you'll need them for services):
   - `PGHOST`
   - `PGPORT` (usually 5432)
   - `PGDATABASE`
   - `PGUSER`
   - `PGPASSWORD`

## Step 3: Create Redis Database (Optional but Recommended)

1. Click **+ New** → **Database** → **Add Redis**
2. Wait for provisioning
3. Go to **Variables** tab
4. **Copy these values**:
   - `REDIS_HOST` (or `REDIS_URL`)
   - `REDIS_PORT` (usually 6379)
   - `REDIS_PASSWORD` (if set)

## Step 4: Create API Gateway Service

1. Click **+ New** → **GitHub Repo**
2. Select: `aamirsec6/brainintel`
3. Railway will create a service
4. **Rename it**: Click service name → Rename to `retail-brain-api-gateway`

### Configure Build Settings:
1. Go to **Settings** → **Build**
2. Set:
   - **Builder**: `Dockerfile`
   - **Dockerfile Path**: `Dockerfile.api-gateway`
   - **Root Directory**: `.` (just a dot - repository root)
3. Click **Save**

### Configure Environment Variables:
1. Go to **Variables** tab
2. Click **+ New Variable** for each:
   ```
   NODE_ENV=production
   PORT=3000
   POSTGRES_HOST=<paste from PostgreSQL service>
   POSTGRES_PORT=<paste from PostgreSQL service>
   POSTGRES_DB=<paste from PostgreSQL service>
   POSTGRES_USER=<paste from PostgreSQL service>
   POSTGRES_PASSWORD=<paste from PostgreSQL service>
   REDIS_HOST=<paste from Redis service>
   REDIS_PORT=<paste from Redis service>
   REDIS_PASSWORD=<paste from Redis service>
   API_GATEWAY_API_KEYS=dev_key_123,prod_key_456
   EVENT_COLLECTOR_URL=http://retail-brain-event-collector:3001
   LOG_LEVEL=info
   ```

### Generate Public Domain:
1. Go to **Settings** → **Networking**
2. Click **Generate Domain**
3. Copy the domain (e.g., `retail-brain-api-gateway-production.up.railway.app`)

## Step 5: Create Event Collector Service

1. Click **+ New** → **GitHub Repo**
2. Select: `aamirsec6/brainintel` (same repo)
3. **Rename it**: `retail-brain-event-collector`

### Configure Build Settings:
1. Go to **Settings** → **Build**
2. Set:
   - **Builder**: `Dockerfile`
   - **Dockerfile Path**: `Dockerfile.event-collector`
   - **Root Directory**: `.` (just a dot)
3. Click **Save**

### Configure Environment Variables:
1. Go to **Variables** tab
2. Add:
   ```
   NODE_ENV=production
   PORT=3001
   POSTGRES_HOST=<from PostgreSQL>
   POSTGRES_PORT=<from PostgreSQL>
   POSTGRES_DB=<from PostgreSQL>
   POSTGRES_USER=<from PostgreSQL>
   POSTGRES_PASSWORD=<from PostgreSQL>
   LOG_LEVEL=info
   ```

## Step 6: Create MLflow Service

1. Click **+ New** → **GitHub Repo**
2. Select: `aamirsec6/brainintel`
3. **Rename it**: `retail-brain-mlflow`

### Configure Build Settings:
1. Go to **Settings** → **Build**
2. Set:
   - **Builder**: `Docker Image`
   - **Docker Image**: `ghcr.io/mlflow/mlflow:v2.8.1`
3. Click **Save**

### Configure Deploy Settings:
1. Go to **Settings** → **Deploy**
2. Set **Start Command**:
   ```
   mlflow server --backend-store-uri $MLFLOW_BACKEND_STORE_URI --default-artifact-root $MLFLOW_DEFAULT_ARTIFACT_ROOT --host 0.0.0.0 --port $PORT
   ```

### Configure Environment Variables:
1. Go to **Variables** tab
2. Add:
   ```
   MLFLOW_BACKEND_STORE_URI=postgresql://<PGUSER>:<PGPASSWORD>@<PGHOST>:<PGPORT>/<PGDATABASE>
   MLFLOW_DEFAULT_ARTIFACT_ROOT=file:/mlflow/artifacts
   PORT=5000
   ```
   (Replace `<PGUSER>`, `<PGPASSWORD>`, etc. with actual values from PostgreSQL service)

## Step 7: Link Services (Internal Networking)

Railway automatically creates internal networking. Services can reach each other using service names:
- `retail-brain-api-gateway`
- `retail-brain-event-collector`

The `EVENT_COLLECTOR_URL` in API Gateway should use: `http://retail-brain-event-collector:3001`

## Step 8: Run Database Migrations

Once API Gateway is deployed and running:

1. Go to API Gateway service → **Deployments** tab
2. Wait for deployment to complete (green checkmark)
3. Go to **Settings** → **Connect** → **Shell**
4. Run:
   ```bash
   cd /app/services/api-gateway
   pnpm db:migrate
   ```

## Step 9: Verify Everything Works

### Check Service Logs:
```bash
railway logs --service retail-brain-api-gateway
railway logs --service retail-brain-event-collector
railway logs --service retail-brain-mlflow
```

### Test Health Endpoint:
1. Get API Gateway domain from Railway Dashboard
2. Open: `https://<your-domain>.railway.app/health`
3. Should return: `{"status":"ok"}`

### Test API:
```bash
curl https://<your-domain>.railway.app/health \
  -H "X-API-Key: dev_key_123"
```

## Step 10: Create Dashboard Service (Optional)

If you want the Next.js dashboard:

1. Click **+ New** → **GitHub Repo**
2. Select: `aamirsec6/brainintel`
3. **Rename it**: `retail-brain-dashboard`

### Configure Build Settings:
1. Go to **Settings** → **Build**
2. Set:
   - **Builder**: `Dockerfile`
   - **Dockerfile Path**: `apps/dashboard/Dockerfile`
   - **Root Directory**: `.`
3. Click **Save**

### Configure Environment Variables:
1. Go to **Variables** tab
2. Add:
   ```
   NODE_ENV=production
   PORT=3100
   NEXT_PUBLIC_API_URL=https://<api-gateway-domain>
   ```

## Troubleshooting

### Build Fails: "pnpm-workspace.yaml not found"
- ✅ Ensure **Root Directory** is `.` (not empty, not `services/api-gateway`)
- ✅ Ensure **Dockerfile Path** is `Dockerfile.api-gateway` (not `services/api-gateway/Dockerfile`)

### Service Crashes: "Cannot find module '/app/services/api-gateway/dist/index.js'"
- ✅ Check build logs - build should complete successfully
- ✅ Verify `dist/` directory was created in build logs
- ✅ Check that TypeScript compilation succeeded

### Database Connection Fails
- ✅ Verify all PostgreSQL variables are correct
- ✅ Check PostgreSQL service is running (green status)
- ✅ Ensure variables use exact names: `POSTGRES_HOST`, `POSTGRES_PORT`, etc.

### Port Issues
- ✅ Railway sets `PORT` automatically - don't hardcode ports
- ✅ Your code should use: `process.env.PORT || 3000`

## Quick Checklist

- [ ] New Railway project created
- [ ] PostgreSQL database created and variables copied
- [ ] Redis database created (optional)
- [ ] API Gateway service created with correct build settings
- [ ] Event Collector service created with correct build settings
- [ ] MLflow service created with Docker image
- [ ] All environment variables set
- [ ] Database migrations run
- [ ] Health endpoint returns `{"status":"ok"}`
- [ ] All services showing "Online" status

## Next Steps

After everything is running:
1. ✅ Set up custom domains (if needed)
2. ✅ Configure monitoring/alerts
3. ✅ Set up CI/CD for auto-deployments
4. ✅ Add more services as needed

