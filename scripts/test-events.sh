#!/bin/bash

# Test Event Ingestion
# Sends various test events to the API

set -e

BASE_URL="http://localhost:3000"
API_KEY="${API_KEY:-test_api_key}"

echo "🧪 Testing Event Ingestion Pipeline"
echo "===================================="
echo ""
echo "Base URL: $BASE_URL"
echo "API Key: $API_KEY"
echo ""

# Test 1: Valid Purchase Event
echo "1️⃣  Testing valid purchase event..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST "$BASE_URL/v1/events" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "app",
    "event_type": "purchase",
    "event_ts": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
    "identifiers": {
      "phone": "+919876543210",
      "email": "customer@example.com"
    },
    "payload": {
      "sku": "TSHIRT-123",
      "product_name": "Cool T-Shirt",
      "category": "Apparel",
      "price": 999,
      "quantity": 1,
      "revenue": 999
    }
  }')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "202" ]; then
    echo "   ✅ PASS - Event accepted (202)"
    echo "   Response: $BODY"
else
    echo "   ❌ FAIL - Status: $HTTP_CODE"
    echo "   Response: $BODY"
fi
echo ""

# Test 2: View Event (Device ID)
echo "2️⃣  Testing view event with device ID..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST "$BASE_URL/v1/events" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "web",
    "event_type": "view",
    "event_ts": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
    "identifiers": {
      "device": "device_abc123",
      "cookie": "cookie_xyz789"
    },
    "payload": {
      "sku": "SHOES-456",
      "category": "Footwear",
      "session_id": "sess_123456",
      "utm_source": "google",
      "utm_medium": "cpc"
    }
  }')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "202" ]; then
    echo "   ✅ PASS - Event accepted (202)"
    echo "   Response: $BODY"
else
    echo "   ❌ FAIL - Status: $HTTP_CODE"
    echo "   Response: $BODY"
fi
echo ""

# Test 3: Add to Cart Event
echo "3️⃣  Testing add_to_cart event..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST "$BASE_URL/v1/events" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "app",
    "event_type": "add_to_cart",
    "event_ts": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
    "identifiers": {
      "email": "shopper@test.com",
      "loyalty_id": "LOYAL123"
    },
    "payload": {
      "sku": "JEANS-789",
      "product_name": "Blue Jeans",
      "price": 1499,
      "quantity": 1
    }
  }')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "202" ]; then
    echo "   ✅ PASS - Event accepted (202)"
    echo "   Response: $BODY"
else
    echo "   ❌ FAIL - Status: $HTTP_CODE"
    echo "   Response: $BODY"
fi
echo ""

# Test 4: Invalid Event (Missing Identifiers)
echo "4️⃣  Testing invalid event (no identifiers)..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST "$BASE_URL/v1/events" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "app",
    "event_type": "view",
    "event_ts": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
    "identifiers": {},
    "payload": {}
  }')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "400" ]; then
    echo "   ✅ PASS - Correctly rejected with 400"
    echo "   Response: $BODY"
else
    echo "   ❌ FAIL - Expected 400, got $HTTP_CODE"
    echo "   Response: $BODY"
fi
echo ""

# Test 5: Invalid Event (Bad Email)
echo "5️⃣  Testing invalid event (bad email format)..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST "$BASE_URL/v1/events" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "app",
    "event_type": "login",
    "event_ts": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
    "identifiers": {
      "email": "not-an-email"
    },
    "payload": {}
  }')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "400" ]; then
    echo "   ✅ PASS - Correctly rejected with 400"
    echo "   Response: $BODY"
else
    echo "   ❌ FAIL - Expected 400, got $HTTP_CODE"
    echo "   Response: $BODY"
fi
echo ""

# Test 6: Invalid Event (Future Timestamp)
echo "6️⃣  Testing invalid event (future timestamp)..."
FUTURE_DATE=$(date -u -v+10M +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -d "+10 minutes" +"%Y-%m-%dT%H:%M:%SZ")
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST "$BASE_URL/v1/events" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "app",
    "event_type": "purchase",
    "event_ts": "'$FUTURE_DATE'",
    "identifiers": {
      "phone": "+919876543210"
    },
    "payload": {}
  }')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "400" ]; then
    echo "   ✅ PASS - Correctly rejected with 400"
    echo "   Response: $BODY"
else
    echo "   ❌ FAIL - Expected 400, got $HTTP_CODE"
    echo "   Response: $BODY"
fi
echo ""

# Summary
echo "✨ Event Ingestion Tests Complete"
echo ""
echo "Next: Check database for stored events"
echo "  docker exec -it retail-brain-postgres psql -U retail_brain_user -d retail_brain"
echo "  SELECT COUNT(*) FROM customer_raw_event;"
echo "  SELECT source, event_type, status FROM customer_raw_event ORDER BY received_at DESC LIMIT 5;"

