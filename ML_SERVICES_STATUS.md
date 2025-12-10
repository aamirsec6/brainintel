# ML Services - Startup Status

## ✅ Services Started

All ML services have been started. Here's the status:

### Python Services (FastAPI)
- **Embedding Service** (port 3016) - Started
- **Intent Service** (port 3017) - Started  
- **ML Scorer Service** (port 3015) - Started
- **ML Monitoring Service** (port 3020) - Started ✅ (confirmed healthy)

### TypeScript Services
- **Nudge Engine** (port 3018) - Started
- **A/B Testing Service** (port 3019) - Started

### Infrastructure
- **PostgreSQL** - Running ✅
- **Redis** - Running ✅
- **MLflow** - Running on port 5001 ✅

## 🔍 Checking Service Health

Run this to check all services:
```bash
./scripts/test-ml-quick.sh
```

Or check individually:
```bash
curl http://localhost:3016/health  # Embedding
curl http://localhost:3017/health  # Intent
curl http://localhost:3015/health  # ML Scorer
curl http://localhost:3018/health  # Nudge Engine
curl http://localhost:3019/health  # A/B Testing
curl http://localhost:3020/health  # ML Monitoring
```

## 📝 Service Logs

View logs for troubleshooting:
```bash
tail -f /tmp/embedding-service.log
tail -f /tmp/intent-service.log
tail -f /tmp/ml-scorer-service.log
tail -f /tmp/ml-monitoring-service.log
tail -f /tmp/nudge-engine.log
tail -f /tmp/ab-testing-service.log
```

## 🛑 Stopping Services

To stop all ML services:
```bash
./scripts/stop-all-ml-services.sh
```

## 🚀 Restarting Services

To restart all services:
```bash
./scripts/stop-all-ml-services.sh
./scripts/start-all-ml-services.sh
```

## ⚠️ Notes

- Some services may take 10-15 seconds to fully start (especially Python services loading ML models)
- ML Scorer may show warnings if models aren't trained yet (this is expected)
- Intent Service will use rule-based fallback if ML model isn't available
- All services are configured to start automatically

## 🧪 Testing

Run comprehensive tests:
```bash
python3 scripts/test-ml-integration.py
```

