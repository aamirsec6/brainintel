#!/bin/bash
# Restart services to use Supabase database

echo "🔄 Restarting services to use Supabase..."

# Kill existing services
echo "Stopping existing services..."
pkill -f "api-gateway" || true
pkill -f "profile-service" || true
pkill -f "onboarding-service" || true
pkill -f "dashboard" || true

sleep 2

# Start API Gateway
echo "Starting API Gateway (port 3000)..."
cd services/api-gateway
pnpm dev > /tmp/api-gateway.log 2>&1 &
API_GATEWAY_PID=$!
echo "API Gateway started (PID: $API_GATEWAY_PID)"

sleep 2

# Start Profile Service
echo "Starting Profile Service (port 3003)..."
cd ../profile-service
pnpm dev > /tmp/profile-service.log 2>&1 &
PROFILE_SERVICE_PID=$!
echo "Profile Service started (PID: $PROFILE_SERVICE_PID)"

sleep 2

# Start Onboarding Service
echo "Starting Onboarding Service (port 3005)..."
cd ../onboarding-service
pnpm dev > /tmp/onboarding-service.log 2>&1 &
ONBOARDING_SERVICE_PID=$!
echo "Onboarding Service started (PID: $ONBOARDING_SERVICE_PID)"

sleep 2

# Start Dashboard
echo "Starting Dashboard (port 3100)..."
cd ../../apps/dashboard
PORT=3100 pnpm dev > /tmp/dashboard.log 2>&1 &
DASHBOARD_PID=$!
echo "Dashboard started (PID: $DASHBOARD_PID)"

echo ""
echo "✅ All services restarted!"
echo ""
echo "Check logs:"
echo "  API Gateway: tail -f /tmp/api-gateway.log"
echo "  Profile Service: tail -f /tmp/profile-service.log"
echo "  Onboarding Service: tail -f /tmp/onboarding-service.log"
echo "  Dashboard: tail -f /tmp/dashboard.log"
echo ""
echo "Test connections:"
echo "  API Gateway: http://localhost:3000/health"
echo "  Dashboard: http://localhost:3100"

