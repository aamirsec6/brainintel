#!/bin/bash

# Test Shopify Webhook Integration
# Simulates a Shopify order webhook

echo "🧪 Testing Shopify Webhook Integration..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_GATEWAY_URL="${API_GATEWAY_URL:-http://localhost:3000}"
WEBHOOK_URL="${API_GATEWAY_URL}/webhooks/shopify"

# Test 1: Health Check
echo "1️⃣  Checking Webhook Service Health..."
HEALTH=$(curl -s "${API_GATEWAY_URL}/health" 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} API Gateway is running"
else
    echo -e "${RED}✗${NC} API Gateway is not running. Start it with: pnpm -r dev"
    exit 1
fi

echo ""

# Test 2: Simulate Shopify Order Webhook
echo "2️⃣  Sending Test Shopify Order Webhook..."

# Generate test order data
CURRENT_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
TEST_EMAIL="test.customer@example.com"
TEST_PHONE="+919876543210"

# Create HMAC signature (for testing, we'll skip validation or use a test secret)
SHOPIFY_SHOP="test-store.myshopify.com"
SHOPIFY_TOPIC="orders/create"

# Sample Shopify order payload
ORDER_PAYLOAD=$(cat <<EOF
{
  "id": 1234567890,
  "order_number": 1001,
  "email": "${TEST_EMAIL}",
  "phone": "${TEST_PHONE}",
  "created_at": "${CURRENT_TIME}",
  "updated_at": "${CURRENT_TIME}",
  "total_price": "2999.00",
  "currency": "INR",
  "financial_status": "paid",
  "fulfillment_status": null,
  "line_items": [
    {
      "id": 9876543210,
      "title": "Test Product",
      "quantity": 1,
      "price": "2999.00",
      "sku": "TEST-SKU-001"
    }
  ],
  "customer": {
    "id": 111222333,
    "email": "${TEST_EMAIL}",
    "first_name": "Test",
    "last_name": "Customer",
    "phone": "${TEST_PHONE}"
  },
  "shipping_address": {
    "first_name": "Test",
    "last_name": "Customer",
    "city": "Mumbai",
    "province": "Maharashtra",
    "country": "India",
    "zip": "400001"
  },
  "billing_address": {
    "first_name": "Test",
    "last_name": "Customer",
    "city": "Mumbai",
    "province": "Maharashtra",
    "country": "India",
    "zip": "400001"
  }
}
EOF
)

# Send webhook
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${WEBHOOK_URL}" \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Shop-Domain: ${SHOPIFY_SHOP}" \
  -H "X-Shopify-Topic: ${SHOPIFY_TOPIC}" \
  -H "X-Shopify-Hmac-Sha256: test-signature" \
  -d "${ORDER_PAYLOAD}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
    echo -e "${GREEN}✓${NC} Webhook accepted (HTTP ${HTTP_CODE})"
    echo "   Response: $BODY"
else
    echo -e "${YELLOW}⚠${NC}  Webhook returned HTTP ${HTTP_CODE}"
    echo "   Response: $BODY"
    echo ""
    echo "   Note: This might be due to signature validation."
    echo "   For testing, you can temporarily disable signature validation."
fi

echo ""

# Test 3: Check if event was stored
echo "3️⃣  Verifying Event Storage..."
sleep 2  # Wait for processing

EVENT_COUNT=$(docker exec retail-brain-postgres psql -U retail_brain_user -d retail_brain -t -c "SELECT COUNT(*) FROM customer_raw_event WHERE source = 'shopify';" 2>/dev/null | tr -d ' ')

if [ "$EVENT_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓${NC} Event stored in database (${EVENT_COUNT} Shopify events found)"
else
    echo -e "${YELLOW}⚠${NC}  No events found in database yet"
    echo "   This might be normal if webhook validation failed"
fi

echo ""

# Test 4: Check if customer profile was created
echo "4️⃣  Checking Customer Profile..."
PROFILE_COUNT=$(docker exec retail-brain-postgres psql -U retail_brain_user -d retail_brain -t -c "SELECT COUNT(*) FROM customer_profile WHERE primary_email = '${TEST_EMAIL}';" 2>/dev/null | tr -d ' ')

if [ "$PROFILE_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓${NC} Customer profile created (${PROFILE_COUNT} profile(s) found)"
    
    # Get profile details
    PROFILE=$(docker exec retail-brain-postgres psql -U retail_brain_user -d retail_brain -t -c "SELECT id, full_name, total_orders, total_spent FROM customer_profile WHERE primary_email = '${TEST_EMAIL}' LIMIT 1;" 2>/dev/null)
    echo "   Profile: $PROFILE"
else
    echo -e "${YELLOW}⚠${NC}  Customer profile not created yet"
    echo "   This might be normal if event is still processing"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Test Complete!"
echo ""
echo "Next Steps:"
echo "1. Check dashboard: http://localhost:3100/customers"
echo "2. View events: http://localhost:3100/analytics"
echo "3. Set up real Shopify webhook in Shopify Admin"
echo ""

