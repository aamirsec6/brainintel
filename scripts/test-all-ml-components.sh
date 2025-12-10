#!/bin/bash

# Test All ML Components
# Tests all newly built ML infrastructure components

set -e

echo "🧪 Testing All ML Components"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

test_service() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "Testing $name... "
    
    if response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null); then
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | sed '$d')
        
        if [ "$http_code" -eq "$expected_status" ]; then
            echo -e "${GREEN}✓ PASSED${NC}"
            ((PASSED++))
            return 0
        else
            echo -e "${RED}✗ FAILED (HTTP $http_code)${NC}"
            ((FAILED++))
            return 1
        fi
    else
        echo -e "${RED}✗ FAILED (Connection error)${NC}"
        ((FAILED++))
        return 1
    fi
}

test_post() {
    local name=$1
    local url=$2
    local data=$3
    local expected_status=${4:-200}
    
    echo -n "Testing $name... "
    
    if response=$(curl -s -w "\n%{http_code}" -X POST "$url" \
        -H "Content-Type: application/json" \
        -d "$data" 2>/dev/null); then
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | sed '$d')
        
        if [ "$http_code" -eq "$expected_status" ]; then
            echo -e "${GREEN}✓ PASSED${NC}"
            echo "  Response: $body" | head -c 100
            echo ""
            ((PASSED++))
            return 0
        else
            echo -e "${RED}✗ FAILED (HTTP $http_code)${NC}"
            echo "  Response: $body"
            ((FAILED++))
            return 1
        fi
    else
        echo -e "${RED}✗ FAILED (Connection error)${NC}"
        ((FAILED++))
        return 1
    fi
}

echo "1. Testing Embedding Service (Port 3016)"
echo "----------------------------------------"
test_service "Embedding Service Health" "http://localhost:3016/health"

test_post "Generate Embedding" "http://localhost:3016/v1/embeddings/generate" \
    '{"text": "Customer interested in electronics"}' 200

echo ""
echo "2. Testing Intent Detection Service (Port 3017)"
echo "----------------------------------------"
test_service "Intent Service Health" "http://localhost:3017/health"

test_post "Detect Intent" "http://localhost:3017/v1/intent/detect" \
    '{"text": "I want to buy a product"}' 200

test_post "Detect Intent (Complaint)" "http://localhost:3017/v1/intent/detect" \
    '{"text": "This product is broken"}' 200

echo ""
echo "3. Testing ML Scorer Service (Port 3015)"
echo "----------------------------------------"
test_service "ML Scorer Health" "http://localhost:3015/health"

# Test recommendation endpoint
test_post "Recommendation Prediction" "http://localhost:3015/v1/recommendations/predict" \
    '{"user_id": "test-user-123", "n_recommendations": 5}' 200

echo ""
echo "4. Testing Nudge Engine (Port 3018)"
echo "----------------------------------------"
test_service "Nudge Engine Health" "http://localhost:3018/health"

# Note: This will fail if no profiles exist, but that's okay for testing
test_post "Evaluate Nudge" "http://localhost:3018/v1/nudges/evaluate" \
    '{"profile_id": "00000000-0000-0000-0000-000000000001"}' 200

echo ""
echo "5. Testing A/B Testing Service (Port 3019)"
echo "----------------------------------------"
test_service "A/B Testing Health" "http://localhost:3019/health"

test_post "Create Experiment" "http://localhost:3019/v1/experiments" \
    '{"name": "Test Experiment", "variants": ["A", "B"], "traffic_split": {"A": 50, "B": 50}}' 200

echo ""
echo "6. Testing ML Monitoring Service (Port 3020)"
echo "----------------------------------------"
test_service "ML Monitoring Health" "http://localhost:3020/health"

test_post "Log Prediction" "http://localhost:3020/v1/predictions/log" \
    '{"model_name": "test-model", "profile_id": "test-123", "features": {"feature1": 1.0}, "prediction": 0.75}' 200

test_post "Check Drift" "http://localhost:3020/v1/drift/check" \
    '{"model_name": "test-model", "current_data": [{"feature1": 1.0, "feature2": 2.0}]}' 200

echo ""
echo "7. Testing MLflow Server (Port 5001)"
echo "----------------------------------------"
test_service "MLflow UI" "http://localhost:5001" 200

echo ""
echo "8. Testing Feature Store Service (Port 3014)"
echo "----------------------------------------"
test_service "Feature Store Health" "http://localhost:3014/health"

echo ""
echo "================================"
echo "Test Summary"
echo "================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Check service logs.${NC}"
    exit 1
fi

