#!/bin/bash

# Start All Services Script
# Handles port conflicts and missing dependencies

set -e

echo "🚀 Starting Retail Brain Services..."
echo ""

# Kill any processes on required ports
echo "🧹 Cleaning up ports..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:3002 | xargs kill -9 2>/dev/null || true
lsof -ti:3003 | xargs kill -9 2>/dev/null || true
lsof -ti:3006 | xargs kill -9 2>/dev/null || true
lsof -ti:3007 | xargs kill -9 2>/dev/null || true
lsof -ti:3008 | xargs kill -9 2>/dev/null || true
lsof -ti:3009 | xargs kill -9 2>/dev/null || true
lsof -ti:3010 | xargs kill -9 2>/dev/null || true
lsof -ti:3011 | xargs kill -9 2>/dev/null || true
lsof -ti:3012 | xargs kill -9 2>/dev/null || true
lsof -ti:3100 | xargs kill -9 2>/dev/null || true
sleep 1

# Check if dependencies are installed
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    pnpm install
fi

# Start Docker services first
echo "🐳 Starting Docker services..."
docker-compose up -d postgres redis 2>/dev/null || echo "Docker services already running"

# Wait for database
echo "⏳ Waiting for database..."
sleep 3

# Start all services
echo "🎯 Starting all services..."
echo ""

# Start services in background
cd services/api-gateway && pnpm dev > /tmp/api-gateway.log 2>&1 &
cd ../event-collector && pnpm dev > /tmp/event-collector.log 2>&1 &
cd ../identity-engine && pnpm dev > /tmp/identity-engine.log 2>&1 &
cd ../profile-service && pnpm dev > /tmp/profile-service.log 2>&1 &
cd ../recommender-service && pnpm dev > /tmp/recommender-service.log 2>&1 &
cd ../onboarding-service && pnpm dev > /tmp/onboarding-service.log 2>&1 &
cd ../ai-assistant-service && pnpm dev > /tmp/ai-assistant-service.log 2>&1 &
cd ../webhook-service && pnpm dev > /tmp/webhook-service.log 2>&1 &
cd ../connector-service && pnpm dev > /tmp/connector-service.log 2>&1 &
cd ../inventory-service && pnpm dev > /tmp/inventory-service.log 2>&1 &
cd ../pricing-service && pnpm dev > /tmp/pricing-service.log 2>&1 &
cd ../journey-service && pnpm dev > /tmp/journey-service.log 2>&1 &
cd ../attribution-service && pnpm dev > /tmp/attribution-service.log 2>&1 &
cd ../../apps/dashboard && pnpm dev > /tmp/dashboard.log 2>&1 &

echo "✅ Services starting..."
echo ""
echo "📊 Service Status:"
echo "  - API Gateway: http://localhost:3000"
echo "  - Dashboard: http://localhost:3100"
echo ""
echo "⏳ Waiting for services to start..."
sleep 5

# Check service health
echo ""
echo "🏥 Health Checks:"
curl -s http://localhost:3000/health > /dev/null && echo "  ✅ API Gateway" || echo "  ⚠️  API Gateway (starting...)"
curl -s http://localhost:3100 > /dev/null && echo "  ✅ Dashboard" || echo "  ⚠️  Dashboard (starting...)"

echo ""
echo "✨ Services are starting!"
echo "📝 View logs: tail -f /tmp/*.log"
echo ""
echo "🎯 Open Dashboard: http://localhost:3100"

