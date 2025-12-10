#!/bin/bash

# Start Onboarding Service for CSV uploads

echo "🚀 Starting Onboarding Service..."
echo ""

cd "$(dirname "$0")/../services/onboarding-service"

# Check if already running
if curl -s http://localhost:3005/health > /dev/null 2>&1; then
    echo "✅ Onboarding Service is already running on port 3005"
    exit 0
fi

# Check if port is in use
if lsof -Pi :3005 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Port 3005 is already in use"
    echo "   Killing existing process..."
    lsof -ti :3005 | xargs kill -9 2>/dev/null
    sleep 2
fi

# Start the service
echo "📦 Starting service..."
pnpm dev > /tmp/onboarding-service.log 2>&1 &
SERVICE_PID=$!

# Wait for service to start
echo "⏳ Waiting for service to start..."
for i in {1..10}; do
    sleep 1
    if curl -s http://localhost:3005/health > /dev/null 2>&1; then
        echo "✅ Onboarding Service is running!"
        echo "   PID: $SERVICE_PID"
        echo "   URL: http://localhost:3005"
        echo "   Logs: tail -f /tmp/onboarding-service.log"
        echo ""
        echo "🎯 You can now upload CSV files at: http://localhost:3100/import"
        exit 0
    fi
done

echo "❌ Service failed to start"
echo "   Check logs: tail -f /tmp/onboarding-service.log"
exit 1

