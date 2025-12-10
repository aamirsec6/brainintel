#!/bin/bash

# Start all services with environment loaded
set -a
source /Users/aamirhabibsaudagar/braintel/.env
set +a

cd /Users/aamirhabibsaudagar/braintel

echo "🚀 Starting Retail Brain Services..."
echo ""

# Stop any existing processes
pkill -f "ts-node-dev" 2>/dev/null || true
sleep 2

# Start Event Collector
echo "Starting Event Collector (port 3001)..."
cd services/event-collector
pnpm dev > /tmp/event-collector.log 2>&1 &
EVENT_COLLECTOR_PID=$!

# Start Identity Engine
echo "Starting Identity Engine (port 3002)..."
cd ../identity-engine
pnpm dev > /tmp/identity-engine.log 2>&1 &
IDENTITY_ENGINE_PID=$!

# Start API Gateway
echo "Starting API Gateway (port 3000)..."
cd ../api-gateway
pnpm dev > /tmp/api-gateway.log 2>&1 &
API_GATEWAY_PID=$!

cd /Users/aamirhabibsaudagar/braintel

echo ""
echo "⏳ Waiting for services to start..."
sleep 8

echo ""
echo "=== Service Status ==="
curl -s http://localhost:3000/health | jq -r '"\(.service): \(.status)"' 2>/dev/null || echo "API Gateway: ❌"
curl -s http://localhost:3001/health | jq -r '"\(.service): \(.status)"' 2>/dev/null || echo "Event Collector: ❌"
curl -s http://localhost:3002/health | jq -r '"\(.service): \(.status)"' 2>/dev/null || echo "Identity Engine: ❌"

echo ""
echo "✅ All services started!"
echo ""
echo "Logs:"
echo "  API Gateway: tail -f /tmp/api-gateway.log"
echo "  Event Collector: tail -f /tmp/event-collector.log"
echo "  Identity Engine: tail -f /tmp/identity-engine.log"
echo ""
echo "API Key: test_api_key"

