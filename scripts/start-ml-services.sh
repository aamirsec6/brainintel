#!/bin/bash

# Start All ML Services
# Starts all ML-related services for testing

set -e

echo "🚀 Starting ML Services"
echo "========================"
echo ""

# Check if services are already running
check_port() {
    local port=$1
    if lsof -ti:$port > /dev/null 2>&1; then
        echo "  ⚠️  Port $port is already in use"
        return 1
    fi
    return 0
}

# Start services in background
start_service() {
    local name=$1
    local dir=$2
    local port=$3
    local command=$4
    
    if check_port $port; then
        echo "Starting $name on port $port..."
        cd "$dir"
        eval "$command" > /tmp/${name}.log 2>&1 &
        echo $! > /tmp/${name}.pid
        echo "  ✅ Started $name (PID: $(cat /tmp/${name}.pid))"
        cd - > /dev/null
    else
        echo "  ⏭️  Skipping $name (port $port in use)"
    fi
}

# Wait for service to be ready
wait_for_service() {
    local name=$1
    local url=$2
    local max_attempts=30
    local attempt=0
    
    echo -n "  Waiting for $name to be ready..."
    while [ $attempt -lt $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo " ✅"
            return 0
        fi
        sleep 1
        attempt=$((attempt + 1))
        echo -n "."
    done
    echo " ❌ (timeout)"
    return 1
}

echo "1. Starting Embedding Service (Port 3016)..."
if [ -d "services/embedding-service" ]; then
    start_service "embedding-service" "services/embedding-service" 3016 \
        "python3 -m uvicorn src.main:app --host 0.0.0.0 --port 3016"
    wait_for_service "Embedding Service" "http://localhost:3016/health"
else
    echo "  ⚠️  Embedding service directory not found"
fi

echo ""
echo "2. Starting Intent Service (Port 3017)..."
if [ -d "services/intent-service" ]; then
    start_service "intent-service" "services/intent-service" 3017 \
        "python3 -m uvicorn src.main:app --host 0.0.0.0 --port 3017"
    wait_for_service "Intent Service" "http://localhost:3017/health"
else
    echo "  ⚠️  Intent service directory not found"
fi

echo ""
echo "3. Starting ML Scorer Service (Port 3015)..."
if [ -d "services/ml-scorer-service" ]; then
    start_service "ml-scorer-service" "services/ml-scorer-service" 3015 \
        "python3 -m uvicorn src.main:app --host 0.0.0.0 --port 3015"
    wait_for_service "ML Scorer Service" "http://localhost:3015/health"
else
    echo "  ⚠️  ML scorer service directory not found"
fi

echo ""
echo "4. Starting Nudge Engine (Port 3018)..."
if [ -d "services/nudge-engine" ]; then
    start_service "nudge-engine" "services/nudge-engine" 3018 \
        "pnpm --filter @retail-brain/nudge-engine dev"
    sleep 3  # Give TypeScript service time to start
else
    echo "  ⚠️  Nudge engine directory not found"
fi

echo ""
echo "5. Starting A/B Testing Service (Port 3019)..."
if [ -d "services/ab-testing-service" ]; then
    start_service "ab-testing-service" "services/ab-testing-service" 3019 \
        "pnpm --filter @retail-brain/ab-testing-service dev"
    sleep 3
else
    echo "  ⚠️  A/B testing service directory not found"
fi

echo ""
echo "6. Starting ML Monitoring Service (Port 3020)..."
if [ -d "services/ml-monitoring-service" ]; then
    start_service "ml-monitoring-service" "services/ml-monitoring-service" 3020 \
        "python3 -m uvicorn src.main:app --host 0.0.0.0 --port 3020"
    wait_for_service "ML Monitoring Service" "http://localhost:3020/health"
else
    echo "  ⚠️  ML monitoring service directory not found"
fi

echo ""
echo "7. Checking Feature Store Service (Port 3014)..."
if curl -s "http://localhost:3014/health" > /dev/null 2>&1; then
    echo "  ✅ Feature Store Service is running"
else
    echo "  ⚠️  Feature Store Service not running (start separately)"
fi

echo ""
echo "8. Checking MLflow Server (Port 5001)..."
if curl -s "http://localhost:5001" > /dev/null 2>&1; then
    echo "  ✅ MLflow Server is running"
else
    echo "  ⚠️  MLflow Server not running (start with: docker-compose up -d mlflow-server)"
fi

echo ""
echo "================================"
echo "✅ ML Services Startup Complete"
echo "================================"
echo ""
echo "Service Logs:"
echo "  - Embedding: tail -f /tmp/embedding-service.log"
echo "  - Intent: tail -f /tmp/intent-service.log"
echo "  - ML Scorer: tail -f /tmp/ml-scorer-service.log"
echo "  - ML Monitoring: tail -f /tmp/ml-monitoring-service.log"
echo ""
echo "To stop all services:"
echo "  ./scripts/stop-ml-services.sh"

