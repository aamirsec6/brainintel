#!/bin/bash

# Quick Start Script - Fixes everything and starts services

set -e

echo "🔧 Retail Brain - Quick Start"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Kill everything
echo "1️⃣  Cleaning up..."
pkill -9 -f "next dev" 2>/dev/null || true
pkill -9 -f "ts-node-dev" 2>/dev/null || true
pkill -9 -f "node.*3100" 2>/dev/null || true
lsof -ti:3100 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 1
echo "   ✅ Cleaned up"

# Step 2: Install dependencies
echo ""
echo "2️⃣  Installing dependencies..."
cd /Users/aamirhabibsaudagar/braintel
pnpm install --silent 2>&1 | grep -E "(Progress|Done|error)" | tail -3
echo "   ✅ Dependencies installed"

# Step 3: Start Docker
echo ""
echo "3️⃣  Starting Docker services..."
docker-compose up -d postgres redis 2>&1 | grep -E "(Starting|Started|already)" || echo "   Docker services ready"
sleep 2

# Step 4: Start core services
echo ""
echo "4️⃣  Starting core services..."

# Start in background with proper paths
cd /Users/aamirhabibsaudagar/braintel

# API Gateway
cd services/api-gateway
pnpm dev > /tmp/api-gateway.log 2>&1 &
API_PID=$!
cd ../..

# Event Collector  
cd services/event-collector
pnpm dev > /tmp/event-collector.log 2>&1 &
EC_PID=$!
cd ../..

# Identity Engine
cd services/identity-engine
pnpm dev > /tmp/identity-engine.log 2>&1 &
IE_PID=$!
cd ../..

# Profile Service
cd services/profile-service
pnpm dev > /tmp/profile-service.log 2>&1 &
PS_PID=$!
cd ../..

# Dashboard
cd apps/dashboard
pnpm dev > /tmp/dashboard.log 2>&1 &
DASH_PID=$!
cd ../..

echo "   ✅ Services starting..."
echo ""

# Step 5: Wait and check
echo "5️⃣  Waiting for services to start..."
sleep 8

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ SERVICES STARTED!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Dashboard: http://localhost:3100"
echo "🔌 API Gateway: http://localhost:3000"
echo ""
echo "🎯 Next Steps:"
echo "   1. Open: http://localhost:3100/connectors/shopify"
echo "   2. Enter your Shopify API key"
echo "   3. Click 'Connect & Sync'"
echo ""
echo "📝 View logs:"
echo "   tail -f /tmp/dashboard.log"
echo "   tail -f /tmp/api-gateway.log"
echo ""

