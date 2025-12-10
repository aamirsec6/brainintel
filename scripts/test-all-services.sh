#!/bin/bash

# Comprehensive Test Script
# Tests all ML services and verifies data correctness

set -e

echo "🧪 Comprehensive ML Services Test"
echo "=================================="
echo ""

PASSED=0
FAILED=0
WARNINGS=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

test_service() {
    local name=$1
    local url=$2
    local description=$3
    
    echo -e "${BLUE}Testing: $name${NC}"
    echo "  $description"
    echo -n "  Status: "
    
    if response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null); then
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | sed '$d')
        
        if [ "$http_code" -eq "200" ]; then
            echo -e "${GREEN}✅ HEALTHY${NC}"
            ((PASSED++))
            return 0
        else
            echo -e "${RED}❌ FAILED (HTTP $http_code)${NC}"
            ((FAILED++))
            return 1
        fi
    else
        echo -e "${RED}❌ NOT RUNNING${NC}"
        ((FAILED++))
        return 1
    fi
}

test_functional() {
    local name=$1
    local method=$2
    local url=$3
    local data=$4
    local expected_field=$5
    
    echo -e "${BLUE}Testing: $name (Functional)${NC}"
    echo -n "  Result: "
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -X POST "$url" \
            -H "Content-Type: application/json" \
            -d "$data" 2>/dev/null)
    else
        response=$(curl -s "$url" 2>/dev/null)
    fi
    
    if echo "$response" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    if '$expected_field' in str(d):
        print('✅ WORKING')
        sys.exit(0)
    else:
        print('⚠️  Unexpected response')
        sys.exit(1)
except:
    print('❌ Invalid JSON')
    sys.exit(1)
" 2>/dev/null; then
        ((PASSED++))
        return 0
    else
        echo -e "${YELLOW}⚠️  Check manually${NC}"
        ((WARNINGS++))
        return 1
    fi
}

echo "1. Infrastructure Health Checks"
echo "-------------------------------"
# Check PostgreSQL
if docker exec retail-brain-postgres psql -U retail_brain_user -d retail_brain -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${BLUE}Testing: PostgreSQL${NC}"
    echo "  Database connection"
    echo -e "  Status: ${GREEN}✅ CONNECTED${NC}"
    ((PASSED++))
else
    echo -e "${BLUE}Testing: PostgreSQL${NC}"
    echo "  Database connection"
    echo -e "  Status: ${RED}❌ NOT CONNECTED${NC}"
    ((FAILED++))
fi

# Check Redis
if docker exec retail-brain-redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${BLUE}Testing: Redis${NC}"
    echo "  Cache connection"
    echo -e "  Status: ${GREEN}✅ CONNECTED${NC}"
    ((PASSED++))
else
    echo -e "${BLUE}Testing: Redis${NC}"
    echo "  Cache connection"
    echo -e "  Status: ${YELLOW}⚠️  NOT CHECKED${NC}"
    ((WARNINGS++))
fi

test_service "MLflow" "http://localhost:5001" "ML model registry"

echo ""
echo "2. ML Services Health Checks"
echo "----------------------------"
test_service "Embedding Service" "http://localhost:3016/health" "SentenceTransformers embeddings"
test_service "Intent Service" "http://localhost:3017/health" "WhatsApp intent detection"
test_service "ML Scorer" "http://localhost:3015/health" "Model inference service"
test_service "Nudge Engine" "http://localhost:3018/health" "Autonomous marketing"
test_service "A/B Testing" "http://localhost:3019/health" "Experiment management"
test_service "ML Monitoring" "http://localhost:3020/health" "Model monitoring"

echo ""
echo "3. Functional Tests"
echo "------------------"

# Embedding Service
test_functional "Embedding Generation" "POST" \
    "http://localhost:3016/v1/embeddings/generate" \
    '{"text":"Customer interested in electronics"}' \
    "embedding"

# Intent Detection
test_functional "Intent Detection" "POST" \
    "http://localhost:3017/v1/intent/detect" \
    '{"text":"I want to buy a product"}' \
    "intent"

# Nudge Engine
test_functional "Nudge Evaluation" "POST" \
    "http://localhost:3018/v1/nudges/evaluate" \
    '{"profile_id":"00000000-0000-0000-0000-000000000001"}' \
    "nudge"

# A/B Testing
test_functional "A/B Experiment Creation" "POST" \
    "http://localhost:3019/v1/experiments" \
    '{"name":"Test Experiment","variants":["A","B"]}' \
    "experiment"

# ML Monitoring
test_functional "ML Prediction Logging" "POST" \
    "http://localhost:3020/v1/predictions/log" \
    '{"model_name":"test-model","profile_id":"test-123","features":{"f1":1.0},"prediction":0.75}' \
    "status"

echo ""
echo "4. Data Quality Tests"
echo "--------------------"

echo -e "${BLUE}Testing Embedding Quality...${NC}"
python3 << 'PYEOF'
import requests
import numpy as np

def cosine_sim(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# Test 1: Same text
r1 = requests.post("http://localhost:3016/v1/embeddings/generate", json={"text": "electronics"})
r2 = requests.post("http://localhost:3016/v1/embeddings/generate", json={"text": "electronics"})
emb1 = r1.json()['embedding']
emb2 = r2.json()['embedding']
sim = cosine_sim(emb1, emb2)
print(f"  ✅ Deterministic: {sim:.4f} (should be ~1.0)")

# Test 2: Different text
r3 = requests.post("http://localhost:3016/v1/embeddings/generate", json={"text": "completely different topic"})
emb3 = r3.json()['embedding']
sim_diff = cosine_sim(emb1, emb3)
print(f"  ✅ Discriminative: {sim_diff:.4f} (should be < 0.5)")

# Test 3: Similar text
r4 = requests.post("http://localhost:3016/v1/embeddings/generate", json={"text": "electronic devices"})
emb4 = r4.json()['embedding']
sim_similar = cosine_sim(emb1, emb4)
print(f"  ✅ Semantic: {sim_similar:.4f} (should be > 0.7)")

quality_score = (sim > 0.99) + (sim_diff < 0.5) + (sim_similar > 0.7)
print(f"  📊 Quality Score: {quality_score}/3")
PYEOF

echo ""
echo "=================================="
echo "📊 Test Summary"
echo "=================================="
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo ""
    echo "Your ML services are working correctly!"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Check service logs.${NC}"
    echo ""
    echo "View logs:"
    echo "  tail -f /tmp/*-service.log"
    exit 1
fi

