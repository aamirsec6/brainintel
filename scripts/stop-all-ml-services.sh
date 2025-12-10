#!/bin/bash

# Stop All ML Services

echo "🛑 Stopping All ML Services..."
echo ""

# Stop Python services
for service in embedding-service intent-service ml-scorer-service ml-monitoring-service; do
    pid_file="/tmp/${service}.pid"
    if [ -f "$pid_file" ]; then
        pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null
            echo "  ✅ Stopped $service (PID: $pid)"
        fi
        rm -f "$pid_file"
    fi
done

# Stop TypeScript services
for service in nudge-engine ab-testing-service; do
    pid_file="/tmp/${service}.pid"
    if [ -f "$pid_file" ]; then
        pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null
            echo "  ✅ Stopped $service (PID: $pid)"
        fi
        rm -f "$pid_file"
    fi
done

# Kill any remaining processes on ML ports
for port in 3014 3015 3016 3017 3018 3019 3020; do
    pids=$(lsof -ti:$port 2>/dev/null)
    if [ -n "$pids" ]; then
        echo "$pids" | xargs kill -9 2>/dev/null
        echo "  ✅ Cleaned up port $port"
    fi
done

echo ""
echo "✅ All ML services stopped"

