# Railway Quick Start - 5 Minute Setup

## 🚀 Fast Track Setup

### 1. Create New Project (Railway Dashboard)
- Go to https://railway.app
- Click **+ New Project** → **Deploy from GitHub repo**
- Select: `aamirsec6/brainintel`

### 2. Add PostgreSQL
- **+ New** → **Database** → **Add PostgreSQL**
- Copy variables: `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`

### 3. Add Redis (Optional)
- **+ New** → **Database** → **Add Redis**
- Copy variables: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`

### 4. Create API Gateway Service
- **+ New** → **GitHub Repo** → Select `aamirsec6/brainintel`
- Rename to: `retail-brain-api-gateway`
- **Settings** → **Build**:
  - Builder: `Dockerfile`
  - Dockerfile Path: `Dockerfile.api-gateway`
  - Root Directory: `.` ⚠️ **IMPORTANT: Just a dot**
- **Variables** → Add:
  ```
  NODE_ENV=production
  PORT=3000
  POSTGRES_HOST=<from PostgreSQL>
  POSTGRES_PORT=<from PostgreSQL>
  POSTGRES_DB=<from PostgreSQL>
  POSTGRES_USER=<from PostgreSQL>
  POSTGRES_PASSWORD=<from PostgreSQL>
  REDIS_HOST=<from Redis>
  REDIS_PORT=<from Redis>
  API_GATEWAY_API_KEYS=dev_key_123
  EVENT_COLLECTOR_URL=http://retail-brain-event-collector:3001
  ```

### 5. Create Event Collector Service
- **+ New** → **GitHub Repo** → Select `aamirsec6/brainintel`
- Rename to: `retail-brain-event-collector`
- **Settings** → **Build**:
  - Builder: `Dockerfile`
  - Dockerfile Path: `Dockerfile.event-collector`
  - Root Directory: `.` ⚠️ **IMPORTANT: Just a dot**
- **Variables** → Add:
  ```
  NODE_ENV=production
  PORT=3001
  POSTGRES_HOST=<from PostgreSQL>
  POSTGRES_PORT=<from PostgreSQL>
  POSTGRES_DB=<from PostgreSQL>
  POSTGRES_USER=<from PostgreSQL>
  POSTGRES_PASSWORD=<from PostgreSQL>
  ```

### 6. Create MLflow Service
- **+ New** → **GitHub Repo** → Select `aamirsec6/brainintel`
- Rename to: `retail-brain-mlflow`
- **Settings** → **Build**:
  - Builder: `Docker Image`
  - Docker Image: `ghcr.io/mlflow/mlflow:v2.8.1`
- **Settings** → **Deploy** → Start Command:
  ```
  mlflow server --backend-store-uri $MLFLOW_BACKEND_STORE_URI --default-artifact-root $MLFLOW_DEFAULT_ARTIFACT_ROOT --host 0.0.0.0 --port $PORT
  ```
- **Variables** → Add:
  ```
  MLFLOW_BACKEND_STORE_URI=postgresql://<PGUSER>:<PGPASSWORD>@<PGHOST>:<PGPORT>/<PGDATABASE>
  MLFLOW_DEFAULT_ARTIFACT_ROOT=file:/mlflow/artifacts
  PORT=5000
  ```

### 7. Run Migrations
- Wait for API Gateway to deploy (green checkmark)
- API Gateway → **Settings** → **Connect** → **Shell**
- Run: `cd /app/services/api-gateway && pnpm db:migrate`

### 8. Test
- Get API Gateway domain from **Settings** → **Networking**
- Visit: `https://<domain>.railway.app/health`
- Should see: `{"status":"ok"}`

## ✅ Critical Settings

**For API Gateway & Event Collector:**
- ✅ Root Directory: `.` (just a dot, not empty, not `services/api-gateway`)
- ✅ Dockerfile Path: `Dockerfile.api-gateway` or `Dockerfile.event-collector`
- ✅ Builder: `Dockerfile` (not Nixpacks)

## 📖 Full Guide
See `RAILWAY_NEW_PROJECT_SETUP.md` for detailed instructions.
