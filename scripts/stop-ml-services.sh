#!/bin/bash

# Stop All ML Services

echo "🛑 Stopping ML Services..."
echo ""

stop_service() {
    local name=$1
    local pid_file="/tmp/${name}.pid"
    
    if [ -f "$pid_file" ]; then
        pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null
            echo "  ✅ Stopped $name (PID: $pid)"
        else
            echo "  ⚠️  $name was not running"
        fi
        rm -f "$pid_file"
    else
        echo "  ⚠️  No PID file found for $name"
    fi
}

# Stop Python services
for service in embedding-service intent-service ml-scorer-service ml-monitoring-service; do
    stop_service "$service"
done

# Stop TypeScript services (find by port)
for port in 3018 3019; do
    pids=$(lsof -ti:$port 2>/dev/null)
    if [ -n "$pids" ]; then
        echo "$pids" | xargs kill 2>/dev/null
        echo "  ✅ Stopped service on port $port"
    fi
done

echo ""
echo "✅ All ML services stopped"

