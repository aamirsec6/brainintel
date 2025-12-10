# ✅ How to Verify Everything is Working

## 🚀 Quick Methods

### Method 1: Automated Test (Easiest)
```bash
./scripts/quick-verify.sh
```

**What it does:**
- Checks if all 6 services are running
- Tests basic functionality
- Gives you a quick pass/fail report

### Method 2: Comprehensive Test
```bash
./scripts/test-all-services.sh
```

**What it does:**
- Full health checks
- Functional tests
- Data quality verification
- Detailed report

---

## 🧪 Manual Verification

### Step 1: Check All Services Are Running

```bash
# Quick check - all should return {"status": "healthy"}
curl http://localhost:3016/health  # Embedding
curl http://localhost:3017/health  # Intent
curl http://localhost:3015/health  # ML Scorer
curl http://localhost:3018/health  # Nudge Engine
curl http://localhost:3019/health  # A/B Testing
curl http://localhost:3020/health  # ML Monitoring
```

**✅ Success:** All return HTTP 200 with healthy status

---

### Step 2: Test Each Service Functionality

#### Embedding Service
```bash
curl -X POST http://localhost:3016/v1/embeddings/generate \
  -H "Content-Type: application/json" \
  -d '{"text": "Customer profile"}'
```

**✅ Success:** Returns JSON with `embedding` array of 768 numbers

#### Intent Detection
```bash
curl -X POST http://localhost:3017/v1/intent/detect \
  -H "Content-Type: application/json" \
  -d '{"text": "I want to buy a product"}'
```

**✅ Success:** Returns `{"intent": "purchase", "confidence": 0.5, ...}`

#### A/B Testing
```bash
curl -X POST http://localhost:3019/v1/experiments \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "variants": ["A", "B"]}'
```

**✅ Success:** Returns experiment with `id` field

#### ML Monitoring
```bash
curl -X POST http://localhost:3020/v1/predictions/log \
  -H "Content-Type: application/json" \
  -d '{"model_name": "test", "profile_id": "test", "prediction": 0.5}'
```

**✅ Success:** Returns `{"status": "logged"}`

---

### Step 3: Verify Data Quality

Run this Python script to test embedding quality:

```python
import requests
import numpy as np

def cosine_sim(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# Same text = same embedding
r1 = requests.post("http://localhost:3016/v1/embeddings/generate", json={"text": "test"})
r2 = requests.post("http://localhost:3016/v1/embeddings/generate", json={"text": "test"})
emb1 = r1.json()['embedding']
emb2 = r2.json()['embedding']
sim = cosine_sim(emb1, emb2)
print(f"Same text similarity: {sim:.4f} (should be ~1.0)")

# Different text = different embedding
r3 = requests.post("http://localhost:3016/v1/embeddings/generate", json={"text": "different"})
emb3 = r3.json()['embedding']
sim_diff = cosine_sim(emb1, emb3)
print(f"Different text similarity: {sim_diff:.4f} (should be < 0.5)")
```

**✅ Success:**
- Same text similarity: ~1.0000
- Different text similarity: < 0.5

---

## 📋 Quick Checklist

Run through this checklist:

- [ ] All 6 services respond to `/health` (HTTP 200)
- [ ] Embedding service returns 768 dimensions
- [ ] Intent service classifies text correctly
- [ ] A/B Testing creates experiments
- [ ] ML Monitoring logs predictions
- [ ] No errors in logs (`tail -f /tmp/*-service.log`)

---

## 🎯 Expected Results

| Test | Expected Result |
|------|----------------|
| Health checks | All return 200 OK |
| Embedding | 768-dimensional array |
| Intent | Valid intent (purchase/complaint/etc.) |
| A/B Testing | Experiment ID returned |
| ML Monitoring | "logged" status |

---

## 🚨 If Something Fails

1. **Check service logs:**
   ```bash
   tail -20 /tmp/embedding-service.log
   tail -20 /tmp/intent-service.log
   # etc.
   ```

2. **Restart services:**
   ```bash
   ./scripts/stop-all-ml-services.sh
   ./scripts/start-all-ml-services.sh
   ```

3. **Check database:**
   ```bash
   docker exec retail-brain-postgres psql -U retail_brain_user -d retail_brain -c "SELECT NOW();"
   ```

---

## ✅ Success Indicators

You'll know everything works when:

1. ✅ All health checks pass
2. ✅ Embeddings are 768 dimensions
3. ✅ Intent detection returns valid classifications
4. ✅ A/B Testing creates experiments
5. ✅ No errors in logs

---

## 🎉 Quick Command

**One command to verify everything:**
```bash
./scripts/quick-verify.sh
```

This gives you a complete status report in seconds!

