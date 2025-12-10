# Railway Fresh Start - Complete Setup Guide

## Step 1: Delete Existing Services

1. Go to Railway Dashboard: https://railway.app
2. Select your project: `dependable-encouragement`
3. For each service (`retail-brain-api-gateway`, `retail-brain-event-collector`, `retail-brain-mlflow`):
   - Click on the service
   - Go to **Settings** tab
   - Scroll to bottom → **Danger Zone**
   - Click **Delete Service**
   - Confirm deletion

## Step 2: Create PostgreSQL Database

1. In Railway Dashboard → Your Project
2. Click **+ New** → **Database** → **Add PostgreSQL**
3. Wait for it to provision
4. Go to **Variables** tab
5. Copy these values (you'll need them):
   - `PGHOST`
   - `PGPORT`
   - `PGDATABASE`
   - `PGUSER`
   - `PGPASSWORD`

## Step 3: Create Redis (Optional but Recommended)

1. Click **+ New** → **Database** → **Add Redis**
2. Wait for it to provision
3. Go to **Variables** tab
4. Copy these values:
   - `REDIS_URL` or `REDIS_HOST` and `REDIS_PORT`
   - `REDIS_PASSWORD` (if set)

## Step 4: Create API Gateway Service

1. Click **+ New** → **GitHub Repo**
2. Select your repo: `aamirsec6/brainintel`
3. Railway will create a service
4. **Rename it** to: `retail-brain-api-gateway`
5. Go to **Settings** → **Build**:
   - **Builder**: `Dockerfile`
   - **Dockerfile Path**: `Dockerfile.api-gateway`
   - **Root Directory**: `.` (repository root)
6. Go to **Variables** tab, add:
   ```
   NODE_ENV=production
   PORT=3000
   POSTGRES_HOST=<from PostgreSQL service>
   POSTGRES_PORT=<from PostgreSQL service>
   POSTGRES_DB=<from PostgreSQL service>
   POSTGRES_USER=<from PostgreSQL service>
   POSTGRES_PASSWORD=<from PostgreSQL service>
   REDIS_HOST=<from Redis service>
   REDIS_PORT=<from Redis service>
   REDIS_PASSWORD=<from Redis service>
   API_GATEWAY_API_KEYS=dev_key_123,prod_key_456
   EVENT_COLLECTOR_URL=http://retail-brain-event-collector:3001
   LOG_LEVEL=info
   ```
7. Go to **Networking** → **Generate Domain** (or use Railway's auto-generated domain)

## Step 5: Create Event Collector Service

1. Click **+ New** → **GitHub Repo**
2. Select the same repo: `aamirsec6/brainintel`
3. **Rename it** to: `retail-brain-event-collector`
4. Go to **Settings** → **Build**:
   - **Builder**: `Dockerfile`
   - **Dockerfile Path**: `Dockerfile.event-collector`
   - **Root Directory**: `.` (repository root)
5. Go to **Variables** tab, add:
   ```
   NODE_ENV=production
   PORT=3001
   POSTGRES_HOST=<from PostgreSQL service>
   POSTGRES_PORT=<from PostgreSQL service>
   POSTGRES_DB=<from PostgreSQL service>
   POSTGRES_USER=<from PostgreSQL service>
   POSTGRES_PASSWORD=<from PostgreSQL service>
   LOG_LEVEL=info
   ```

## Step 6: Create MLflow Service

1. Click **+ New** → **GitHub Repo**
2. Select the same repo: `aamirsec6/brainintel`
3. **Rename it** to: `retail-brain-mlflow`
4. Go to **Settings** → **Build**:
   - **Builder**: `Docker Image`
   - **Docker Image**: `ghcr.io/mlflow/mlflow:v2.8.1`
5. Go to **Variables** tab, add:
   ```
   MLFLOW_BACKEND_STORE_URI=postgresql://<PGUSER>:<PGPASSWORD>@<PGHOST>:<PGPORT>/<PGDATABASE>
   MLFLOW_DEFAULT_ARTIFACT_ROOT=file:/mlflow/artifacts
   PORT=5000
   ```
6. Go to **Settings** → **Deploy**:
   - **Start Command**: `mlflow server --backend-store-uri $MLFLOW_BACKEND_STORE_URI --default-artifact-root $MLFLOW_DEFAULT_ARTIFACT_ROOT --host 0.0.0.0 --port $PORT`

## Step 7: Link Services (Internal Networking)

Railway automatically creates internal networking. Services can reach each other via:
- `retail-brain-api-gateway` (hostname)
- `retail-brain-event-collector` (hostname)

Update `EVENT_COLLECTOR_URL` in API Gateway to use the internal hostname.

## Step 8: Run Database Migrations

1. Go to API Gateway service → **Deployments** tab
2. Click on the latest deployment → **View Logs**
3. Once API Gateway is running, go to **Settings** → **Connect** → **Shell**
4. Run:
   ```bash
   cd /app/services/api-gateway
   pnpm db:migrate
   ```

## Step 9: Verify Services

Check each service's logs:
```bash
railway logs --service retail-brain-api-gateway
railway logs --service retail-brain-event-collector
railway logs --service retail-brain-mlflow
```

## Step 10: Test Health Endpoints

1. Get API Gateway domain from Railway Dashboard
2. Test: `https://<your-domain>.railway.app/health`
3. Should return: `{"status":"ok"}`

## Troubleshooting

### Build Fails: "pnpm-workspace.yaml not found"
- Ensure **Root Directory** is set to `.` (not empty, not `services/api-gateway`)
- Ensure **Dockerfile Path** is `Dockerfile.api-gateway` (not `services/api-gateway/Dockerfile`)

### Service Crashes: "Cannot find module"
- Check that build completed successfully
- Verify `dist/index.js` exists in build logs
- Check that `WORKDIR` is set correctly in Dockerfile

### Database Connection Fails
- Verify PostgreSQL variables are correct
- Check that PostgreSQL service is running
- Ensure internal networking is working (Railway handles this automatically)

### Port Issues
- Railway sets `PORT` environment variable automatically
- Your services should use `process.env.PORT` (not hardcoded ports)

## Next Steps

After all services are running:
1. ✅ Create Dashboard service (if needed)
2. ✅ Set up custom domains
3. ✅ Configure monitoring/alerts
4. ✅ Set up CI/CD for auto-deployments

