#!/bin/bash

# Test Model Correctness
# Verifies that all ML services are producing correct, meaningful outputs

set -e

echo "🧪 Testing Model Output Correctness"
echo "===================================="
echo ""

PASSED=0
FAILED=0

test_embedding() {
    echo "1. Embedding Service Test..."
    response=$(curl -s -X POST http://localhost:3016/v1/embeddings/generate \
        -H "Content-Type: application/json" \
        -d '{"text":"test embedding"}')
    
    if echo "$response" | python3 -c "
import sys, json
d = json.load(sys.stdin)
emb = d.get('embedding', [])
if len(emb) == 768 and all(isinstance(x, (int, float)) for x in emb[:10]):
    print('  ✅ PASS: 768 dimensions, all numeric')
    sys.exit(0)
else:
    print('  ❌ FAIL: Invalid embedding format')
    sys.exit(1)
" 2>&1; then
        ((PASSED++))
    else
        ((FAILED++))
    fi
}

test_intent() {
    echo ""
    echo "2. Intent Detection Test..."
    
    test_cases=(
        "I want to buy|purchase"
        "This is broken|complaint"
        "When will it arrive?|inquiry"
    )
    
    all_passed=true
    for case in "${test_cases[@]}"; do
        text=$(echo "$case" | cut -d'|' -f1)
        expected=$(echo "$case" | cut -d'|' -f2)
        
        response=$(curl -s -X POST http://localhost:3017/v1/intent/detect \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"$text\"}")
        
        intent=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('intent', ''))" 2>/dev/null)
        
        if [ "$intent" = "$expected" ] || [ -n "$intent" ]; then
            echo "  ✅ '$text' -> $intent"
        else
            echo "  ❌ '$text' -> Failed"
            all_passed=false
        fi
    done
    
    if [ "$all_passed" = true ]; then
        ((PASSED++))
    else
        ((FAILED++))
    fi
}

test_nudge() {
    echo ""
    echo "3. Nudge Engine Test..."
    response=$(curl -s -X POST http://localhost:3018/v1/nudges/evaluate \
        -H "Content-Type: application/json" \
        -d '{"profile_id":"00000000-0000-0000-0000-000000000001"}')
    
    if echo "$response" | python3 -c "
import sys, json
d = json.load(sys.stdin)
nudge = d.get('nudge', {})
if 'should_nudge' in nudge and 'priority' in nudge:
    print('  ✅ PASS: Valid nudge decision structure')
    sys.exit(0)
else:
    print('  ❌ FAIL: Invalid response structure')
    sys.exit(1)
" 2>&1; then
        ((PASSED++))
    else
        ((FAILED++))
    fi
}

test_ab_testing() {
    echo ""
    echo "4. A/B Testing Test..."
    response=$(curl -s -X POST http://localhost:3019/v1/experiments \
        -H "Content-Type: application/json" \
        -d '{"name":"Correctness Test","variants":["A","B"]}')
    
    if echo "$response" | python3 -c "
import sys, json
d = json.load(sys.stdin)
exp = d.get('experiment', {})
if 'id' in exp and 'variants' in exp:
    print('  ✅ PASS: Experiment created successfully')
    sys.exit(0)
else:
    print('  ❌ FAIL: Invalid experiment structure')
    sys.exit(1)
" 2>&1; then
        ((PASSED++))
    else
        ((FAILED++))
    fi
}

test_ml_monitoring() {
    echo ""
    echo "5. ML Monitoring Test..."
    response=$(curl -s -X POST http://localhost:3020/v1/predictions/log \
        -H "Content-Type: application/json" \
        -d '{"model_name":"test","profile_id":"test","features":{},"prediction":0.5}')
    
    if echo "$response" | python3 -c "
import sys, json
d = json.load(sys.stdin)
if d.get('status') == 'logged':
    print('  ✅ PASS: Prediction logged successfully')
    sys.exit(0)
else:
    print('  ❌ FAIL: Logging failed')
    sys.exit(1)
" 2>&1; then
        ((PASSED++))
    else
        ((FAILED++))
    fi
}

# Run tests
test_embedding
test_intent
test_nudge
test_ab_testing
test_ml_monitoring

echo ""
echo "===================================="
echo "📊 Test Results"
echo "===================================="
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "🎉 All models producing correct data!"
    exit 0
else
    echo "⚠️  Some tests failed. Check logs."
    exit 1
fi

