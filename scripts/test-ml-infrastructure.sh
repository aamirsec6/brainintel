#!/bin/bash
# Test ML Infrastructure Components

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Testing ML Infrastructure"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

test_check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}❌ $1${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

# 1. Check MLflow server configuration
echo "1. Checking MLflow server configuration..."
if [ -f "ml/mlflow-server/config.py" ]; then
    test_check "MLflow config exists"
else
    test_check "MLflow config exists" && false
fi

# 2. Check feature store migration
echo "2. Checking feature store migration..."
if [ -f "migrations/010_create_feature_store.sql" ]; then
    test_check "Feature store migration exists"
else
    test_check "Feature store migration exists" && false
fi

# 3. Check feature engineering
echo "3. Checking feature engineering..."
if [ -f "ml/feature-engineering/src/identity_features.py" ]; then
    test_check "Feature engineering module exists"
else
    test_check "Feature engineering module exists" && false
fi

# 4. Check training data generation
echo "4. Checking training data generation..."
if [ -f "ml/training-data/src/generate_identity_pairs.py" ]; then
    test_check "Training data generator exists"
else
    test_check "Training data generator exists" && false
fi

# 5. Check ML training pipeline
echo "5. Checking ML training pipeline..."
if [ -f "ml/training/identity-model/train.py" ]; then
    test_check "Training pipeline exists"
else
    test_check "Training pipeline exists" && false
fi

# 6. Check ML scorer service
echo "6. Checking ML scorer service..."
if [ -f "services/ml-scorer-service/src/main.py" ]; then
    test_check "ML scorer service exists"
else
    test_check "ML scorer service exists" && false
fi

# 7. Check feature store service
echo "7. Checking feature store service..."
if [ -f "services/feature-store-service/src/index.ts" ]; then
    test_check "Feature store service exists"
else
    test_check "Feature store service exists" && false
fi

# 8. Check Identity Engine integration
echo "8. Checking Identity Engine ML integration..."
if grep -q "getMLScore" services/identity-engine/src/services/scoringEngine.ts 2>/dev/null; then
    test_check "Identity Engine ML integration exists"
else
    test_check "Identity Engine ML integration exists" && false
fi

# 9. Check Docker Compose MLflow service
echo "9. Checking Docker Compose MLflow service..."
if grep -q "mlflow-server" docker-compose.yml 2>/dev/null; then
    test_check "MLflow service in docker-compose.yml"
else
    test_check "MLflow service in docker-compose.yml" && false
fi

# 10. Check Python dependencies
echo "10. Checking Python dependencies..."
if [ -f "ml/feature-engineering/requirements.txt" ] && [ -f "ml/training/identity-model/requirements.txt" ]; then
    test_check "Python requirements files exist"
else
    test_check "Python requirements files exist" && false
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test Results"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}Passed: ${TESTS_PASSED}${NC}"
echo -e "${RED}Failed: ${TESTS_FAILED}${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Check the output above.${NC}"
    exit 1
fi

