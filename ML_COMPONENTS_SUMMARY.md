# ML Components - Build Summary & Testing Guide

## ✅ All Components Built Successfully!

All remaining ML components have been implemented. Here's what was built:

### 1. **Embedding Pipeline** ✅
- **Location:** `ml/embedding-pipeline/` & `services/embedding-service/`
- **Service Port:** 3016
- **Features:**
  - SentenceTransformers integration (`all-mpnet-base-v2`)
  - Batch embedding generation
  - Incremental updates
  - FastAPI service for real-time generation

### 2. **Intent Detection Model** ✅
- **Location:** `ml/training/intent-model/` & `services/intent-service/`
- **Service Port:** 3017
- **Features:**
  - LightGBM classifier with embeddings
  - Training pipeline with MLflow
  - Real-time WhatsApp message classification
  - Rule-based fallback

### 3. **Recommendation ML (LightFM)** ✅
- **Location:** `ml/training/recommendation-model/` & `services/ml-scorer-service/`
- **Service Port:** 3015 (ML Scorer)
- **Features:**
  - Collaborative filtering model
  - Integration with recommender service
  - Hybrid ML + rule-based recommendations

### 4. **Churn & LTV Models** ✅
- **Location:** `ml/training/churn-ltv-models/`
- **Features:**
  - LightGBM churn prediction
  - LTV estimation model
  - Training pipelines with evaluation

### 5. **Nudge Engine** ✅
- **Location:** `services/nudge-engine/`
- **Service Port:** 3018
- **Features:**
  - Autonomous decision logic
  - Churn prevention, upsell, cross-sell, re-engagement
  - Action execution framework

### 6. **A/B Testing Framework** ✅
- **Location:** `services/ab-testing-service/`
- **Service Port:** 3019
- **Features:**
  - Experiment management
  - Deterministic variant assignment
  - Conversion tracking
  - Statistical analysis

### 7. **ML Monitoring Service** ✅
- **Location:** `services/ml-monitoring-service/`
- **Service Port:** 3020
- **Features:**
  - Data drift detection (KS test, Chi-square)
  - Performance metrics collection
  - Alerting system
  - Drift history tracking

### 8. **Retraining Pipeline** ✅
- **Location:** `ml/retraining-pipeline/`
- **Features:**
  - Scheduled retraining
  - Drift-based automatic retraining
  - MLflow integration

### 9. **ML Dashboard** ✅
- **Location:** `apps/dashboard/app/ml-models/page.tsx`
- **Features:**
  - Model performance metrics
  - Drift alerts display
  - Real-time monitoring

## 🚀 Quick Start Testing

### Step 1: Start Infrastructure
```bash
docker-compose up -d postgres redis mlflow-server
```

### Step 2: Install Python Dependencies
```bash
# Install for each Python service
cd services/embedding-service && pip install -r requirements.txt && cd ../..
cd services/intent-service && pip install -r requirements.txt && cd ../..
cd services/ml-scorer-service && pip install -r requirements.txt && cd ../..
cd services/ml-monitoring-service && pip install -r requirements.txt && cd ../..
```

### Step 3: Start ML Services
```bash
# Option A: Automated (recommended)
./scripts/start-ml-services.sh

# Option B: Manual (see TEST_ML_COMPONENTS.md)
```

### Step 4: Run Tests
```bash
# Quick test
./scripts/test-ml-quick.sh

# Comprehensive test
python3 scripts/test-ml-integration.py

# Full bash test
./scripts/test-all-ml-components.sh
```

## 📊 Current Status

- ✅ **MLflow Server:** Running on port 5001
- ❌ **Embedding Service:** Not started (port 3016)
- ❌ **Intent Service:** Not started (port 3017)
- ❌ **ML Scorer:** Not started (port 3015)
- ❌ **Nudge Engine:** Not started (port 3018)
- ❌ **A/B Testing:** Not started (port 3019)
- ❌ **ML Monitoring:** Not started (port 3020)
- ❌ **Feature Store:** Not started (port 3014)

## 🧪 Testing Individual Components

### Test Embedding Service
```bash
# Start service
cd services/embedding-service
python3 -m uvicorn src.main:app --host 0.0.0.0 --port 3016

# In another terminal, test
curl -X POST http://localhost:3016/v1/embeddings/generate \
  -H "Content-Type: application/json" \
  -d '{"text": "Customer profile"}'
```

### Test Intent Service
```bash
# Start service
cd services/intent-service
python3 -m uvicorn src.main:app --host 0.0.0.0 --port 3017

# Test
curl -X POST http://localhost:3017/v1/intent/detect \
  -H "Content-Type: application/json" \
  -d '{"text": "I want to buy a product"}'
```

### Test Nudge Engine
```bash
# Start service
cd services/nudge-engine
pnpm dev

# Test
curl -X POST http://localhost:3018/v1/nudges/evaluate \
  -H "Content-Type: application/json" \
  -d '{"profile_id": "00000000-0000-0000-0000-000000000001"}'
```

## 📝 Database Migrations

Run migrations for new tables:
```bash
pnpm db:migrate
```

This will create:
- `nudge_log` table
- `ab_experiment`, `ab_assignment`, `ab_conversion` tables
- `ml_prediction_log`, `ml_drift_check`, `ml_alert` tables

## 🎯 Next Steps

1. **Start all services** using the start script
2. **Run tests** to verify everything works
3. **Train models** using the training pipelines:
   - Identity model: `ml/training/identity-model/train.py`
   - Intent model: `ml/training/intent-model/train.py`
   - Recommendation model: `ml/training/recommendation-model/train.py`
   - Churn/LTV models: `ml/training/churn-ltv-models/train.py`
4. **Generate embeddings** for profiles:
   ```bash
   cd ml/embedding-pipeline
   python src/generate_embeddings.py --profiles
   ```
5. **Set up monitoring** and configure alerts
6. **Configure retraining** schedules

## 📚 Documentation

- **Full Testing Guide:** `TEST_ML_COMPONENTS.md`
- **Component Details:** See individual README files in each service directory

## 🐛 Troubleshooting

If services fail to start:

1. **Check ports:** `lsof -i :PORT`
2. **Check logs:** `tail -f /tmp/SERVICE_NAME.log`
3. **Check dependencies:** `pip list | grep PACKAGE`
4. **Check database:** `docker-compose ps postgres`

For detailed troubleshooting, see `TEST_ML_COMPONENTS.md`.

