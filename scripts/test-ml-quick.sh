#!/bin/bash

# Quick ML Components Test
# Tests services that are running, skips those that aren't

echo "🧪 Quick ML Components Test"
echo "============================"
echo ""

# Test function with graceful failure
test_service_graceful() {
    local name=$1
    local url=$2
    local method=${3:-GET}
    local data=${4:-""}
    
    echo -n "Testing $name... "
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$url" \
            -H "Content-Type: application/json" \
            -d "$data" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null)
    fi
    
    if [ $? -eq 0 ]; then
        http_code=$(echo "$response" | tail -n1)
        if [ "$http_code" -eq "200" ] || [ "$http_code" -eq "201" ]; then
            echo "✅"
            return 0
        else
            echo "⚠️  (HTTP $http_code)"
            return 1
        fi
    else
        echo "❌ (Not running)"
        return 1
    fi
}

# Test each service
echo "1. Embedding Service (3016)"
test_service_graceful "Health" "http://localhost:3016/health"
test_service_graceful "Generate" "http://localhost:3016/v1/embeddings/generate" "POST" '{"text":"test"}'

echo ""
echo "2. Intent Service (3017)"
test_service_graceful "Health" "http://localhost:3017/health"
test_service_graceful "Detect" "http://localhost:3017/v1/intent/detect" "POST" '{"text":"I want to buy"}'

echo ""
echo "3. ML Scorer (3015)"
test_service_graceful "Health" "http://localhost:3015/health"

echo ""
echo "4. Nudge Engine (3018)"
test_service_graceful "Health" "http://localhost:3018/health"

echo ""
echo "5. A/B Testing (3019)"
test_service_graceful "Health" "http://localhost:3019/health"

echo ""
echo "6. ML Monitoring (3020)"
test_service_graceful "Health" "http://localhost:3020/health"

echo ""
echo "7. Feature Store (3014)"
test_service_graceful "Health" "http://localhost:3014/health"

echo ""
echo "8. MLflow (5001)"
test_service_graceful "UI" "http://localhost:5001"

echo ""
echo "============================"
echo "✅ Quick test complete!"
echo ""
echo "To start services: ./scripts/start-ml-services.sh"
echo "For full tests: python3 scripts/test-ml-integration.py"

