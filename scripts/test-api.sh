#!/bin/bash

# API Testing Script
# Tests all available endpoints

set -e

BASE_URL="http://localhost:3000"
API_KEY="${API_KEY:-test_api_key}"

echo "🧪 Testing Retail Brain API"
echo "============================"
echo ""
echo "Base URL: $BASE_URL"
echo "API Key: $API_KEY"
echo ""

# Test 1: Health Check (No Auth)
echo "1️⃣  Testing Health Check (no auth required)..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE_URL/health")
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ PASS - Status: $HTTP_CODE"
    echo "   Response: $BODY"
else
    echo "   ❌ FAIL - Status: $HTTP_CODE"
    echo "   Response: $BODY"
fi
echo ""

# Test 2: API Health (With Auth)
echo "2️⃣  Testing /v1/health (requires auth)..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
    -H "Authorization: Bearer $API_KEY" \
    "$BASE_URL/v1/health")
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ PASS - Status: $HTTP_CODE"
    echo "   Response: $BODY"
else
    echo "   ❌ FAIL - Status: $HTTP_CODE"
    echo "   Response: $BODY"
fi
echo ""

# Test 3: Unauthorized Access
echo "3️⃣  Testing unauthorized access (should fail)..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE_URL/v1/health")
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "401" ]; then
    echo "   ✅ PASS - Correctly rejected with 401"
    echo "   Response: $BODY"
else
    echo "   ❌ FAIL - Expected 401, got $HTTP_CODE"
    echo "   Response: $BODY"
fi
echo ""

# Test 4: Not Implemented Endpoints
echo "4️⃣  Testing not-yet-implemented endpoint..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -X POST \
    -d '{"source":"test","event_type":"view","event_ts":"2025-12-09T10:00:00Z","identifiers":{"phone":"+919876543210"},"payload":{}}' \
    "$BASE_URL/v1/events")
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "501" ]; then
    echo "   ✅ PASS - Correctly returns 501 (Not Implemented)"
    echo "   Response: $BODY"
else
    echo "   ⚠️  Unexpected status: $HTTP_CODE"
    echo "   Response: $BODY"
fi
echo ""

# Summary
echo "✨ API Tests Complete"
echo ""
echo "Next: Implement Phase 2 to make POST /v1/events functional!"

