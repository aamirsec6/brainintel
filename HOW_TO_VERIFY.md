# How to Verify Everything is Working

This guide shows you how to check if all ML services are working properly.

---

## 🚀 Quick Verification

### Option 1: Automated Test Script (Recommended)
```bash
./scripts/test-all-services.sh
```

This will:
- ✅ Check all service health endpoints
- ✅ Test functional capabilities
- ✅ Verify data quality
- ✅ Give you a comprehensive report

---

## 🧪 Manual Verification

### 1. Check Service Health

```bash
# All services should return {"status": "healthy"} or similar
curl http://localhost:3016/health  # Embedding
curl http://localhost:3017/health  # Intent
curl http://localhost:3015/health  # ML Scorer
curl http://localhost:3018/health  # Nudge Engine
curl http://localhost:3019/health  # A/B Testing
curl http://localhost:3020/health  # ML Monitoring
```

**Expected:** All should return HTTP 200 with healthy status

---

### 2. Test Embedding Service

```bash
curl -X POST http://localhost:3016/v1/embeddings/generate \
  -H "Content-Type: application/json" \
  -d '{"text": "Customer interested in electronics"}'
```

**Expected Response:**
```json
{
  "embedding": [0.041, 0.009, ...],  // 768 numbers
  "dimensions": 768,
  "model": "all-mpnet-base-v2"
}
```

**What to Check:**
- ✅ Returns 768-dimensional array
- ✅ All values are numbers (floats)
- ✅ Model name is correct

---

### 3. Test Intent Detection

```bash
curl -X POST http://localhost:3017/v1/intent/detect \
  -H "Content-Type: application/json" \
  -d '{"text": "I want to buy a product"}'
```

**Expected Response:**
```json
{
  "text": "I want to buy a product",
  "intent": "purchase",
  "confidence": 0.5,
  "method": "rule-based"
}
```

**What to Check:**
- ✅ Returns valid intent (purchase, complaint, inquiry, support, feedback)
- ✅ Confidence score between 0 and 1
- ✅ Method shows "rule-based" or "ml"

**Test Cases:**
```bash
# Purchase intent
curl -X POST http://localhost:3017/v1/intent/detect \
  -H "Content-Type: application/json" \
  -d '{"text": "I want to buy"}'
# Expected: "purchase"

# Complaint intent
curl -X POST http://localhost:3017/v1/intent/detect \
  -H "Content-Type: application/json" \
  -d '{"text": "This product is broken"}'
# Expected: "complaint"

# Inquiry intent
curl -X POST http://localhost:3017/v1/intent/detect \
  -H "Content-Type: application/json" \
  -d '{"text": "When will my order arrive?"}'
# Expected: "inquiry"
```

---

### 4. Test Nudge Engine

```bash
curl -X POST http://localhost:3018/v1/nudges/evaluate \
  -H "Content-Type: application/json" \
  -d '{"profile_id": "00000000-0000-0000-0000-000000000001"}'
```

**Expected Response:**
```json
{
  "profile_id": "...",
  "nudge": {
    "should_nudge": false,
    "priority": 0,
    "reason": "..."
  }
}
```

**What to Check:**
- ✅ Returns valid response structure
- ✅ `should_nudge` is boolean
- ✅ `priority` is number (0-1)
- ✅ `reason` is a string

---

### 5. Test A/B Testing

```bash
# Create experiment
curl -X POST http://localhost:3019/v1/experiments \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Experiment",
    "variants": ["control", "variant_a"],
    "traffic_split": {"control": 50, "variant_a": 50}
  }'
```

**Expected Response:**
```json
{
  "experiment": {
    "id": "uuid-here",
    "name": "Test Experiment",
    "variants": ["control", "variant_a"],
    "status": "draft"
  }
}
```

**What to Check:**
- ✅ Returns experiment with ID
- ✅ Variants are correct
- ✅ Status is "draft"

**Then test variant assignment:**
```bash
# Get the experiment ID from above, then:
curl -X POST http://localhost:3019/v1/experiments/{EXPERIMENT_ID}/assign \
  -H "Content-Type: application/json" \
  -d '{"profile_id": "test-profile-123"}'
```

**Expected:** Returns assigned variant (control or variant_a)

---

### 6. Test ML Monitoring

```bash
curl -X POST http://localhost:3020/v1/predictions/log \
  -H "Content-Type: application/json" \
  -d '{
    "model_name": "test-model",
    "profile_id": "test-123",
    "features": {"feature1": 1.0, "feature2": 2.0},
    "prediction": 0.75,
    "actual": 0.80
  }'
```

**Expected Response:**
```json
{
  "status": "logged"
}
```

**What to Check:**
- ✅ Returns "logged" status
- ✅ No errors

---

## 📊 Data Quality Verification

### Test Embedding Quality

Run this Python script to verify embeddings are semantically meaningful:

```python
import requests
import numpy as np

def cosine_sim(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# Same text should produce identical embeddings
r1 = requests.post("http://localhost:3016/v1/embeddings/generate", 
                   json={"text": "electronics"})
r2 = requests.post("http://localhost:3016/v1/embeddings/generate", 
                   json={"text": "electronics"})
emb1 = r1.json()['embedding']
emb2 = r2.json()['embedding']
sim = cosine_sim(emb1, emb2)
print(f"Same text similarity: {sim:.4f} (should be ~1.0)")

# Different text should produce different embeddings
r3 = requests.post("http://localhost:3016/v1/embeddings/generate", 
                   json={"text": "completely different topic"})
emb3 = r3.json()['embedding']
sim_diff = cosine_sim(emb1, emb3)
print(f"Different text similarity: {sim_diff:.4f} (should be < 0.5)")

# Similar text should have high similarity
r4 = requests.post("http://localhost:3016/v1/embeddings/generate", 
                   json={"text": "electronic devices"})
emb4 = r4.json()['embedding']
sim_similar = cosine_sim(emb1, emb4)
print(f"Similar text similarity: {sim_similar:.4f} (should be > 0.7)")
```

**Expected Results:**
- Same text: ~1.0000 similarity
- Different text: < 0.5 similarity
- Similar text: > 0.7 similarity

---

## 🔍 Check Service Logs

If something isn't working, check the logs:

```bash
# View all service logs
tail -f /tmp/embedding-service.log
tail -f /tmp/intent-service.log
tail -f /tmp/ml-scorer-service.log
tail -f /tmp/ml-monitoring-service.log
tail -f /tmp/nudge-engine.log
tail -f /tmp/ab-testing-service.log

# Or check for errors
grep -i error /tmp/*-service.log
```

---

## 📋 Quick Checklist

Run through this checklist:

- [ ] All 6 services respond to `/health` endpoint
- [ ] Embedding service generates 768-dimensional vectors
- [ ] Intent service classifies messages correctly
- [ ] Nudge engine returns valid response structure
- [ ] A/B Testing creates experiments successfully
- [ ] ML Monitoring logs predictions
- [ ] Embeddings are deterministic (same text = same embedding)
- [ ] Embeddings differentiate text (different text = different embedding)
- [ ] No errors in service logs

---

## 🎯 Expected Results Summary

| Service | Health Check | Functional Test | Data Quality |
|---------|-------------|-----------------|--------------|
| Embedding | ✅ 200 OK | ✅ 768 dims | ⭐⭐⭐⭐⭐ |
| Intent | ✅ 200 OK | ✅ Valid intent | ⭐⭐⭐⭐ |
| ML Scorer | ✅ 200 OK | ✅ Service ready | ⭐⭐⭐ |
| Nudge Engine | ✅ 200 OK | ✅ Valid response | ⭐⭐⭐⭐ |
| A/B Testing | ✅ 200 OK | ✅ Creates experiments | ⭐⭐⭐⭐ |
| ML Monitoring | ✅ 200 OK | ✅ Logs predictions | ⭐⭐⭐⭐ |

---

## 🚨 Troubleshooting

### Service Not Responding
```bash
# Check if process is running
ps aux | grep uvicorn  # Python services
ps aux | grep ts-node-dev  # TypeScript services

# Check ports
lsof -i :3016  # Embedding
lsof -i :3017  # Intent
# etc.
```

### Database Errors
```bash
# Check database connection
docker exec retail-brain-postgres psql -U retail_brain_user -d retail_brain -c "SELECT NOW();"

# Check tables exist
docker exec retail-brain-postgres psql -U retail_brain_user -d retail_brain -c "\dt ab_*"
```

### Restart Services
```bash
# Stop all
./scripts/stop-all-ml-services.sh

# Start all
./scripts/start-all-ml-services.sh
```

---

## ✅ Success Indicators

You'll know everything is working when:

1. ✅ All health checks return 200 OK
2. ✅ Embeddings are 768 dimensions and semantically meaningful
3. ✅ Intent detection returns valid classifications
4. ✅ A/B Testing creates experiments with IDs
5. ✅ ML Monitoring logs predictions successfully
6. ✅ No errors in service logs
7. ✅ All services respond within 1-2 seconds

---

## 🎉 Quick Test Command

Run this one command to test everything:

```bash
./scripts/test-all-services.sh
```

This will give you a comprehensive report of what's working and what needs attention.

