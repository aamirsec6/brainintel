#!/bin/bash

# Start required services for CSV import and customer viewing

echo "🚀 Starting Required Services..."
echo ""

cd "$(dirname "$0")/.."

# Function to start a service
start_service() {
    local service_name=$1
    local port=$2
    local service_path=$3
    
    echo "📦 Checking $service_name (port $port)..."
    
    # Check if already running
    if curl -s http://localhost:$port/health > /dev/null 2>&1; then
        echo "   ✅ Already running"
        return 0
    fi
    
    # Kill existing process on port
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "   🔄 Killing existing process on port $port..."
        lsof -ti :$port | xargs kill -9 2>/dev/null
        sleep 1
    fi
    
    # Start service
    echo "   🚀 Starting $service_name..."
    cd "$service_path"
    pnpm dev > /tmp/${service_name}.log 2>&1 &
    SERVICE_PID=$!
    cd - > /dev/null
    
    # Wait for service to start
    for i in {1..10}; do
        sleep 1
        if curl -s http://localhost:$port/health > /dev/null 2>&1; then
            echo "   ✅ $service_name is running (PID: $SERVICE_PID)"
            return 0
        fi
    done
    
    echo "   ❌ $service_name failed to start"
    echo "      Check logs: tail -f /tmp/${service_name}.log"
    return 1
}

# Start services
start_service "onboarding-service" 3005 "services/onboarding-service"
start_service "profile-service" 3003 "services/profile-service"

echo ""
echo "✅ Service Status:"
echo "   Onboarding Service: $(curl -s http://localhost:3005/health > /dev/null 2>&1 && echo '✅ Running' || echo '❌ Not running')"
echo "   Profile Service: $(curl -s http://localhost:3003/health > /dev/null 2>&1 && echo '✅ Running' || echo '❌ Not running')"
echo ""
echo "🎯 You can now:"
echo "   - Upload CSV: http://localhost:3100/import"
echo "   - View Customers: http://localhost:3100/customers"

