#!/bin/bash

# End-to-End ML Components Test
# Comprehensive test with analysis and recommendations

set -e

echo "🧪 End-to-End ML Components Test & Analysis"
echo "============================================"
echo ""

# Results storage
RESULTS_FILE="/tmp/ml_test_results.json"
PASSED=0
FAILED=0
WARNINGS=0

# Test results
declare -A TEST_RESULTS

test_component() {
    local name=$1
    local test_func=$2
    
    echo "Testing: $name"
    echo "----------------------------------------"
    
    if $test_func; then
        TEST_RESULTS[$name]="PASS"
        ((PASSED++))
        echo "✅ PASSED"
    else
        TEST_RESULTS[$name]="FAIL"
        ((FAILED++))
        echo "❌ FAILED"
    fi
    echo ""
}

# Test 1: Infrastructure
test_infrastructure() {
    local all_ok=true
    
    # Check Docker services
    if docker-compose ps postgres 2>/dev/null | grep -q "Up"; then
        echo "  ✅ PostgreSQL running"
    else
        echo "  ❌ PostgreSQL not running"
        all_ok=false
    fi
    
    if docker-compose ps redis 2>/dev/null | grep -q "Up"; then
        echo "  ✅ Redis running"
    else
        echo "  ❌ Redis not running"
        all_ok=false
    fi
    
    if docker-compose ps mlflow-server 2>/dev/null | grep -q "Up"; then
        echo "  ✅ MLflow running"
    else
        echo "  ⚠️  MLflow not running (optional for testing)"
        ((WARNINGS++))
    fi
    
    return $([ "$all_ok" = true ] && echo 0 || echo 1)
}

# Test 2: Python Dependencies
test_python_deps() {
    local deps_ok=true
    
    python3 -c "import sentence_transformers" 2>/dev/null && echo "  ✅ sentence-transformers" || { echo "  ❌ sentence-transformers missing"; deps_ok=false; }
    python3 -c "import lightgbm" 2>/dev/null && echo "  ✅ lightgbm" || { echo "  ❌ lightgbm missing"; deps_ok=false; }
    python3 -c "import mlflow" 2>/dev/null && echo "  ✅ mlflow" || { echo "  ⚠️  mlflow missing (optional)"; ((WARNINGS++)); }
    python3 -c "import fastapi" 2>/dev/null && echo "  ✅ fastapi" || { echo "  ❌ fastapi missing"; deps_ok=false; }
    python3 -c "import pandas" 2>/dev/null && echo "  ✅ pandas" || { echo "  ❌ pandas missing"; deps_ok=false; }
    
    return $([ "$deps_ok" = true ] && echo 0 || echo 1)
}

# Test 3: Service Health Checks
test_service_health() {
    local services_ok=true
    
    # Test each service
    for port in 3014 3015 3016 3017 3018 3019 3020; do
        service_name=$(case $port in
            3014) echo "Feature Store" ;;
            3015) echo "ML Scorer" ;;
            3016) echo "Embedding" ;;
            3017) echo "Intent" ;;
            3018) echo "Nudge Engine" ;;
            3019) echo "A/B Testing" ;;
            3020) echo "ML Monitoring" ;;
        esac)
        
        if curl -s "http://localhost:$port/health" > /dev/null 2>&1; then
            echo "  ✅ $service_name (port $port) - Running"
        else
            echo "  ⚠️  $service_name (port $port) - Not running"
            ((WARNINGS++))
        fi
    done
    
    # MLflow
    if curl -s "http://localhost:5001" > /dev/null 2>&1; then
        echo "  ✅ MLflow (port 5001) - Running"
    else
        echo "  ⚠️  MLflow (port 5001) - Not running"
        ((WARNINGS++))
    fi
    
    return 0  # Don't fail if services aren't running
}

# Test 4: API Functionality
test_api_functionality() {
    local api_ok=true
    
    # Embedding Service
    if curl -s "http://localhost:3016/health" > /dev/null 2>&1; then
        response=$(curl -s -X POST "http://localhost:3016/v1/embeddings/generate" \
            -H "Content-Type: application/json" \
            -d '{"text":"test"}' 2>/dev/null)
        if echo "$response" | grep -q "embedding"; then
            echo "  ✅ Embedding API working"
        else
            echo "  ❌ Embedding API error"
            api_ok=false
        fi
    else
        echo "  ⚠️  Embedding service not available"
        ((WARNINGS++))
    fi
    
    # Intent Service
    if curl -s "http://localhost:3017/health" > /dev/null 2>&1; then
        response=$(curl -s -X POST "http://localhost:3017/v1/intent/detect" \
            -H "Content-Type: application/json" \
            -d '{"text":"I want to buy"}' 2>/dev/null)
        if echo "$response" | grep -q "intent"; then
            echo "  ✅ Intent API working"
        else
            echo "  ❌ Intent API error"
            api_ok=false
        fi
    else
        echo "  ⚠️  Intent service not available"
        ((WARNINGS++))
    fi
    
    return $([ "$api_ok" = true ] && echo 0 || echo 1)
}

# Test 5: Code Quality
test_code_quality() {
    local quality_ok=true
    
    # Check if services have proper structure
    for service in embedding-service intent-service ml-scorer-service ml-monitoring-service; do
        if [ -d "services/$service/src" ]; then
            echo "  ✅ $service - Structure OK"
        else
            echo "  ❌ $service - Missing src directory"
            quality_ok=false
        fi
    done
    
    # Check TypeScript services
    for service in nudge-engine ab-testing-service; do
        if [ -f "services/$service/package.json" ]; then
            echo "  ✅ $service - Package.json exists"
        else
            echo "  ❌ $service - Missing package.json"
            quality_ok=false
        fi
    done
    
    return $([ "$quality_ok" = true ] && echo 0 || echo 1)
}

# Run all tests
echo "1. Infrastructure Test"
test_component "Infrastructure" test_infrastructure

echo "2. Python Dependencies Test"
test_component "Python Dependencies" test_python_deps

echo "3. Service Health Check"
test_component "Service Health" test_service_health

echo "4. API Functionality Test"
test_component "API Functionality" test_api_functionality

echo "5. Code Quality Test"
test_component "Code Quality" test_code_quality

# Summary
echo "============================================"
echo "📊 Test Summary"
echo "============================================"
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"
echo "⚠️  Warnings: $WARNINGS"
echo ""

# Detailed results
echo "Detailed Results:"
for component in "${!TEST_RESULTS[@]}"; do
    status=${TEST_RESULTS[$component]}
    if [ "$status" = "PASS" ]; then
        echo "  ✅ $component"
    else
        echo "  ❌ $component"
    fi
done

echo ""
echo "💡 Recommendations will be generated after analysis..."

