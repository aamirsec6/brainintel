# Testing ML Components

This guide explains how to test all the ML components we've built.

## Prerequisites

1. **Docker services running:**
   ```bash
   docker-compose up -d postgres redis mlflow-server
   ```

2. **Python dependencies installed:**
   ```bash
   # Install dependencies for each Python service
   cd services/embedding-service && pip install -r requirements.txt
   cd ../intent-service && pip install -r requirements.txt
   cd ../ml-scorer-service && pip install -r requirements.txt
   cd ../ml-monitoring-service && pip install -r requirements.txt
   ```

3. **TypeScript services dependencies:**
   ```bash
   pnpm install
   ```

## Starting All ML Services

### Option 1: Automated Script (Recommended)
```bash
./scripts/start-ml-services.sh
```

### Option 2: Manual Start

#### Python Services (FastAPI)
```bash
# Terminal 1: Embedding Service
cd services/embedding-service
python3 -m uvicorn src.main:app --host 0.0.0.0 --port 3016

# Terminal 2: Intent Service
cd services/intent-service
python3 -m uvicorn src.main:app --host 0.0.0.0 --port 3017

# Terminal 3: ML Scorer Service
cd services/ml-scorer-service
python3 -m uvicorn src.main:app --host 0.0.0.0 --port 3015

# Terminal 4: ML Monitoring Service
cd services/ml-monitoring-service
python3 -m uvicorn src.main:app --host 0.0.0.0 --port 3020
```

#### TypeScript Services
```bash
# Terminal 5: Nudge Engine
cd services/nudge-engine
pnpm dev

# Terminal 6: A/B Testing Service
cd services/ab-testing-service
pnpm dev
```

## Running Tests

### Quick Test (Bash)
```bash
./scripts/test-all-ml-components.sh
```

### Comprehensive Test (Python)
```bash
python3 scripts/test-ml-integration.py
```

## Individual Component Tests

### 1. Embedding Service
```bash
# Health check
curl http://localhost:3016/health

# Generate embedding
curl -X POST http://localhost:3016/v1/embeddings/generate \
  -H "Content-Type: application/json" \
  -d '{"text": "Customer interested in electronics"}'
```

### 2. Intent Detection Service
```bash
# Health check
curl http://localhost:3017/health

# Detect intent
curl -X POST http://localhost:3017/v1/intent/detect \
  -H "Content-Type: application/json" \
  -d '{"text": "I want to buy a product"}'
```

### 3. ML Scorer Service
```bash
# Health check
curl http://localhost:3015/health

# Get recommendations
curl -X POST http://localhost:3015/v1/recommendations/predict \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test-123", "n_recommendations": 5}'
```

### 4. Nudge Engine
```bash
# Health check
curl http://localhost:3018/health

# Evaluate nudge
curl -X POST http://localhost:3018/v1/nudges/evaluate \
  -H "Content-Type: application/json" \
  -d '{"profile_id": "00000000-0000-0000-0000-000000000001"}'
```

### 5. A/B Testing Service
```bash
# Health check
curl http://localhost:3019/health

# Create experiment
curl -X POST http://localhost:3019/v1/experiments \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Experiment",
    "variants": ["A", "B"],
    "traffic_split": {"A": 50, "B": 50}
  }'
```

### 6. ML Monitoring Service
```bash
# Health check
curl http://localhost:3020/health

# Log prediction
curl -X POST http://localhost:3020/v1/predictions/log \
  -H "Content-Type: application/json" \
  -d '{
    "model_name": "test-model",
    "profile_id": "test-123",
    "features": {"feature1": 1.0},
    "prediction": 0.75
  }'

# Check drift
curl -X POST http://localhost:3020/v1/drift/check \
  -H "Content-Type: application/json" \
  -d '{
    "model_name": "test-model",
    "current_data": [{"feature1": 1.0}]
  }'
```

## Expected Results

### ✅ Success Indicators

1. **Embedding Service:**
   - Returns 768-dimensional embeddings
   - Response time < 1 second

2. **Intent Service:**
   - Correctly classifies intents (purchase, complaint, inquiry, etc.)
   - Confidence scores > 0.5

3. **ML Scorer:**
   - Returns recommendations (may be empty if model not trained)
   - Health endpoint shows model status

4. **Nudge Engine:**
   - Evaluates nudge decisions
   - Returns priority and action recommendations

5. **A/B Testing:**
   - Creates experiments successfully
   - Assigns variants deterministically

6. **ML Monitoring:**
   - Logs predictions
   - Detects drift (may show no drift if no reference data)

## Troubleshooting

### Services Not Starting

1. **Check ports:**
   ```bash
   lsof -i :3016  # Embedding
   lsof -i :3017  # Intent
   lsof -i :3015  # ML Scorer
   lsof -i :3018  # Nudge
   lsof -i :3019  # A/B Testing
   lsof -i :3020  # ML Monitoring
   ```

2. **Check logs:**
   ```bash
   tail -f /tmp/embedding-service.log
   tail -f /tmp/intent-service.log
   # etc.
   ```

3. **Check Python dependencies:**
   ```bash
   pip list | grep sentence-transformers
   pip list | grep lightgbm
   pip list | grep mlflow
   ```

### Model Not Loaded Errors

Some services require trained models. This is expected if you haven't trained models yet:
- Intent Service: Will use rule-based fallback
- ML Scorer: Recommendation endpoint may return empty results
- Churn/LTV: Predictions will fail until models are trained

### Database Connection Errors

Ensure PostgreSQL is running:
```bash
docker-compose ps postgres
docker-compose logs postgres
```

## Next Steps

After testing, you can:
1. Train models using the training pipelines in `ml/training/`
2. Generate embeddings for profiles using `ml/embedding-pipeline/`
3. Set up monitoring alerts
4. Configure retraining schedules

