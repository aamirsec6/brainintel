#!/bin/bash

# Quick Verification Script
# Simple checks to verify services are working

echo "🔍 Quick Verification"
echo "===================="
echo ""

# Check if services are running
echo "1. Checking if services are running..."
services=(
    "3016:Embedding Service"
    "3017:Intent Service"
    "3015:ML Scorer"
    "3018:Nudge Engine"
    "3019:A/B Testing"
    "3020:ML Monitoring"
)

all_running=true
for service in "${services[@]}"; do
    port=$(echo $service | cut -d: -f1)
    name=$(echo $service | cut -d: -f2)
    
    if curl -s "http://localhost:$port/health" > /dev/null 2>&1; then
        echo "  ✅ $name (port $port)"
    else
        echo "  ❌ $name (port $port) - NOT RUNNING"
        all_running=false
    fi
done

echo ""

if [ "$all_running" = false ]; then
    echo "⚠️  Some services are not running!"
    echo "Start them with: ./scripts/start-all-ml-services.sh"
    exit 1
fi

# Test functionality
echo "2. Testing functionality..."
echo ""

# Test Embedding
echo -n "  Embedding Service: "
if response=$(curl -s -X POST http://localhost:3016/v1/embeddings/generate \
    -H "Content-Type: application/json" \
    -d '{"text":"test"}' 2>/dev/null); then
    dims=$(echo "$response" | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('embedding', [])))" 2>/dev/null)
    if [ "$dims" = "768" ]; then
        echo "✅ Working (768 dimensions)"
    else
        echo "⚠️  Unexpected dimensions: $dims"
    fi
else
    echo "❌ Failed"
fi

# Test Intent
echo -n "  Intent Detection: "
if response=$(curl -s -X POST http://localhost:3017/v1/intent/detect \
    -H "Content-Type: application/json" \
    -d '{"text":"I want to buy"}' 2>/dev/null); then
    intent=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('intent', 'unknown'))" 2>/dev/null)
    if [ "$intent" != "unknown" ] && [ -n "$intent" ]; then
        echo "✅ Working (detected: $intent)"
    else
        echo "⚠️  No intent detected"
    fi
else
    echo "❌ Failed"
fi

# Test A/B Testing
echo -n "  A/B Testing: "
if response=$(curl -s -X POST http://localhost:3019/v1/experiments \
    -H "Content-Type: application/json" \
    -d '{"name":"Quick Test","variants":["A","B"]}' 2>/dev/null); then
    exp_id=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('experiment', {}).get('id', ''))" 2>/dev/null)
    if [ -n "$exp_id" ] && [ "$exp_id" != "None" ]; then
        echo "✅ Working (created experiment)"
    else
        echo "⚠️  Could not create experiment"
    fi
else
    echo "❌ Failed"
fi

echo ""
echo "✅ Quick verification complete!"
echo ""
echo "For detailed tests, run: ./scripts/test-all-services.sh"

