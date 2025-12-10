#!/bin/bash

# Start All ML Services
# Starts all ML components (Python and TypeScript services)

set -e

echo "🚀 Starting All ML Services"
echo "============================"
echo ""

# Kill existing processes on ML service ports
echo "🧹 Cleaning up ports..."
for port in 3014 3015 3016 3017 3018 3019 3020; do
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
done
sleep 1

# Start Python services
echo ""
echo "🐍 Starting Python Services..."

# 1. Embedding Service (3016)
echo "  Starting Embedding Service (port 3016)..."
cd services/embedding-service
nohup python3 -m uvicorn src.main:app --host 0.0.0.0 --port 3016 > /tmp/embedding-service.log 2>&1 &
EMBEDDING_PID=$!
echo $EMBEDDING_PID > /tmp/embedding-service.pid
echo "    ✅ Started (PID: $EMBEDDING_PID)"
cd ../..

# 2. Intent Service (3017)
echo "  Starting Intent Service (port 3017)..."
cd services/intent-service
nohup python3 -m uvicorn src.main:app --host 0.0.0.0 --port 3017 > /tmp/intent-service.log 2>&1 &
INTENT_PID=$!
echo $INTENT_PID > /tmp/intent-service.pid
echo "    ✅ Started (PID: $INTENT_PID)"
cd ../..

# 3. ML Scorer Service (3015)
echo "  Starting ML Scorer Service (port 3015)..."
cd services/ml-scorer-service
nohup python3 -m uvicorn src.main:app --host 0.0.0.0 --port 3015 > /tmp/ml-scorer-service.log 2>&1 &
ML_SCORER_PID=$!
echo $ML_SCORER_PID > /tmp/ml-scorer-service.pid
echo "    ✅ Started (PID: $ML_SCORER_PID)"
cd ../..

# 4. ML Monitoring Service (3020)
echo "  Starting ML Monitoring Service (port 3020)..."
cd services/ml-monitoring-service
nohup python3 -m uvicorn src.main:app --host 0.0.0.0 --port 3020 > /tmp/ml-monitoring-service.log 2>&1 &
ML_MONITORING_PID=$!
echo $ML_MONITORING_PID > /tmp/ml-monitoring-service.pid
echo "    ✅ Started (PID: $ML_MONITORING_PID)"
cd ../..

# Start TypeScript services
echo ""
echo "📘 Starting TypeScript Services..."

# 5. Nudge Engine (3018)
echo "  Starting Nudge Engine (port 3018)..."
cd services/nudge-engine
nohup pnpm dev > /tmp/nudge-engine.log 2>&1 &
NUDGE_PID=$!
echo $NUDGE_PID > /tmp/nudge-engine.pid
echo "    ✅ Started (PID: $NUDGE_PID)"
cd ../..

# 6. A/B Testing Service (3019)
echo "  Starting A/B Testing Service (port 3019)..."
cd services/ab-testing-service
nohup pnpm dev > /tmp/ab-testing-service.log 2>&1 &
AB_TESTING_PID=$!
echo $AB_TESTING_PID > /tmp/ab-testing-service.pid
echo "    ✅ Started (PID: $AB_TESTING_PID)"
cd ../..

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to start..."
sleep 5

# Check service health
echo ""
echo "🏥 Health Checks:"
echo "----------------"

check_health() {
    local name=$1
    local url=$2
    local max_attempts=10
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo "  ✅ $name - Healthy"
            return 0
        fi
        sleep 1
        attempt=$((attempt + 1))
    done
    echo "  ⚠️  $name - Not responding (check logs)"
    return 1
}

check_health "Embedding Service" "http://localhost:3016/health"
check_health "Intent Service" "http://localhost:3017/health"
check_health "ML Scorer Service" "http://localhost:3015/health"
check_health "ML Monitoring Service" "http://localhost:3020/health"
check_health "Nudge Engine" "http://localhost:3018/health"
check_health "A/B Testing Service" "http://localhost:3019/health"

# Check Feature Store (if running)
if curl -s "http://localhost:3014/health" > /dev/null 2>&1; then
    echo "  ✅ Feature Store - Healthy"
else
    echo "  ⚠️  Feature Store - Not running (start separately)"
fi

# Check MLflow
if curl -s "http://localhost:5001" > /dev/null 2>&1; then
    echo "  ✅ MLflow - Healthy"
else
    echo "  ⚠️  MLflow - Not running (start with: docker-compose up -d mlflow-server)"
fi

echo ""
echo "============================"
echo "✅ All ML Services Started!"
echo "============================"
echo ""
echo "Service Logs:"
echo "  tail -f /tmp/embedding-service.log"
echo "  tail -f /tmp/intent-service.log"
echo "  tail -f /tmp/ml-scorer-service.log"
echo "  tail -f /tmp/ml-monitoring-service.log"
echo "  tail -f /tmp/nudge-engine.log"
echo "  tail -f /tmp/ab-testing-service.log"
echo ""
echo "To stop all services:"
echo "  ./scripts/stop-all-ml-services.sh"

