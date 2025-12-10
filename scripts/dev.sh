#!/bin/bash

# Development startup script
# Starts all services in development mode

set -e

echo "🔧 Starting Retail Brain in Development Mode"
echo "============================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Run scripts/setup.sh first."
    exit 1
fi

# Start infrastructure
echo "🐳 Starting infrastructure (Postgres + Redis)..."
docker-compose up -d postgres redis

# Wait for services
echo "⏳ Waiting for services..."
sleep 3

# Check health
until docker exec retail-brain-postgres pg_isready -U retail_brain_user > /dev/null 2>&1; do
    echo "   Waiting for Postgres..."
    sleep 2
done

until docker exec retail-brain-redis redis-cli ping > /dev/null 2>&1; do
    echo "   Waiting for Redis..."
    sleep 2
done

echo "✅ Infrastructure ready"
echo ""

# Start API Gateway in dev mode
echo "🚀 Starting API Gateway..."
echo ""

cd services/api-gateway && pnpm dev

