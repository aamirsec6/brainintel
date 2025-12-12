#!/bin/bash

# Practical A/B Testing Example: Testing Nudge Discounts
# This shows how to test different discount amounts in churn prevention nudges

API_URL="${API_URL:-http://localhost:3000}"

echo "🧪 A/B Testing with Nudge Engine - Practical Example"
echo "====================================================="
echo ""
echo "Scenario: Testing which discount amount works better for churn prevention"
echo "  Variant A: 10% discount"
echo "  Variant B: 20% discount"
echo ""

# Step 1: Create experiment
echo "1️⃣ Creating experiment: 'Churn Prevention Discount Test'"
CREATE_RESP=$(curl -s -X POST "$API_URL/v1/ab-testing/experiments" \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Churn Prevention Discount Test",
    "description": "Testing 10% vs 20% discount for churn prevention nudges",
    "variants": ["A", "B"],
    "traffic_split": {"A": 50, "B": 50}
  }')

EXPERIMENT_ID=$(echo $CREATE_RESP | jq -r '.experiment.id // empty')

if [ -z "$EXPERIMENT_ID" ] || [ "$EXPERIMENT_ID" = "null" ]; then
  echo "❌ Failed to create experiment"
  exit 1
fi

echo "✅ Experiment created: $EXPERIMENT_ID"
echo "   Setting status to 'running'..."
docker compose exec -T postgres psql -U retail_brain_user -d retail_brain -c "UPDATE ab_experiment SET status = 'running' WHERE id = '$EXPERIMENT_ID';" > /dev/null 2>&1
echo ""

# Step 2: Get some customer profiles
echo "2️⃣ Getting customer profiles to test..."
PROFILES=$(docker compose exec -T postgres psql -U retail_brain_user -d retail_brain -t -c "SELECT id FROM customer_profile LIMIT 10;")
PROFILE_IDS=($(echo "$PROFILES" | grep -oE '[a-f0-9-]{36}'))

if [ ${#PROFILE_IDS[@]} -eq 0 ]; then
  echo "❌ No customer profiles found"
  exit 1
fi

echo "✅ Found ${#PROFILE_IDS[@]} customers"
echo ""

# Step 3: Simulate nudge evaluation and A/B assignment
echo "3️⃣ Simulating nudge evaluation and A/B variant assignment..."
echo "   (In real usage, this happens when nudge engine evaluates a customer)"
echo ""

ASSIGNED_COUNT=0
for PROFILE_ID in "${PROFILE_IDS[@]}"; do
  # Assign variant (this would happen in nudge engine)
  ASSIGN_RESP=$(curl -s -X POST "$API_URL/v1/ab-testing/experiments/$EXPERIMENT_ID/assign" \
    -H 'Content-Type: application/json' \
    -d "{\"profile_id\": \"$PROFILE_ID\"}")
  
  VARIANT=$(echo $ASSIGN_RESP | jq -r '.variant // empty')
  
  if [ -n "$VARIANT" ] && [ "$VARIANT" != "null" ]; then
    ASSIGNED_COUNT=$((ASSIGNED_COUNT + 1))
    echo "   Customer $PROFILE_ID → Variant $VARIANT (would send ${VARIANT}% discount nudge)"
  fi
done

echo ""
echo "✅ Assigned variants to $ASSIGNED_COUNT customers"
echo ""

# Step 4: Simulate conversions (customers who respond to nudges)
echo "4️⃣ Simulating customer responses to nudges..."
echo "   (In real usage, track when customers make purchases after receiving nudges)"
echo ""

CONVERSION_COUNT=0

# Simulate: Variant A (10% discount) converts at 30%, Variant B (20% discount) converts at 50%
for PROFILE_ID in "${PROFILE_IDS[@]}"; do
  ASSIGN_RESP=$(curl -s -X POST "$API_URL/v1/ab-testing/experiments/$EXPERIMENT_ID/assign" \
    -H 'Content-Type: application/json' \
    -d "{\"profile_id\": \"$PROFILE_ID\"}" 2>/dev/null)
  
  VARIANT=$(echo $ASSIGN_RESP | jq -r '.variant // empty')
  
  if [ -z "$VARIANT" ] || [ "$VARIANT" = "null" ]; then
    continue
  fi
  
  # Simulate conversion probability based on variant
  if [ "$VARIANT" = "A" ]; then
    # 30% conversion for 10% discount
    if [ $((RANDOM % 100)) -lt 30 ]; then
      VALUE=$((500 + RANDOM % 1500))
      curl -s -X POST "$API_URL/v1/ab-testing/experiments/$EXPERIMENT_ID/conversion" \
        -H 'Content-Type: application/json' \
        -d "{\"profile_id\": \"$PROFILE_ID\", \"conversion_type\": \"purchase\", \"value\": $VALUE}" > /dev/null
      echo "   ✅ Customer $PROFILE_ID (Variant A - 10% discount) purchased ₹$VALUE"
      CONVERSION_COUNT=$((CONVERSION_COUNT + 1))
    fi
  else
    # 50% conversion for 20% discount
    if [ $((RANDOM % 100)) -lt 50 ]; then
      VALUE=$((500 + RANDOM % 1500))
      curl -s -X POST "$API_URL/v1/ab-testing/experiments/$EXPERIMENT_ID/conversion" \
        -H 'Content-Type: application/json' \
        -d "{\"profile_id\": \"$PROFILE_ID\", \"conversion_type\": \"purchase\", \"value\": $VALUE}" > /dev/null
      echo "   ✅ Customer $PROFILE_ID (Variant B - 20% discount) purchased ₹$VALUE"
      CONVERSION_COUNT=$((CONVERSION_COUNT + 1))
    fi
  fi
done

echo ""
echo "✅ Recorded $CONVERSION_COUNT conversions"
echo ""

# Step 5: Get results
echo "5️⃣ Analyzing results..."
echo ""

sleep 1

RESULTS=$(curl -s "$API_URL/v1/ab-testing/experiments/$EXPERIMENT_ID/results")

echo "📊 A/B Test Results:"
echo "===================="
echo ""

echo "$RESULTS" | python3 -c "
import json
import sys

try:
    data = json.load(sys.stdin)
    results = data.get('results', {}).get('results', [])
    summary = data.get('results', {}).get('summary', {})
    
    print(f\"Total Customers: {summary.get('total_assigned', 0)}\")
    print(f\"Total Conversions: {summary.get('total_converted', 0)}\")
    print(f\"Overall Conversion Rate: {summary.get('overall_conversion_rate', 0):.2f}%\")
    print()
    print('Per Variant:')
    print('-' * 60)
    
    for variant in results:
        variant_name = variant['variant']
        discount = '10%' if variant_name == 'A' else '20%'
        print(f\"Variant {variant_name} ({discount} discount):\")
        print(f\"  Customers: {variant['assigned_count']}\")
        print(f\"  Conversions: {variant['converted_count']}\")
        print(f\"  Conversion Rate: {variant['conversion_rate']:.2f}%\")
        print(f\"  Avg Purchase Value: ₹{variant['avg_value']:.2f}\")
        if variant.get('uplift', 0) != 0:
            uplift = variant['uplift']
            symbol = '🟢' if uplift > 0 else '🔴'
            print(f\"  Uplift vs Control: {symbol} {uplift:.2f}%\")
        print()
    
    # Determine winner
    if len(results) >= 2:
        a_rate = results[0]['conversion_rate'] if results[0]['variant'] == 'A' else results[1]['conversion_rate']
        b_rate = results[1]['conversion_rate'] if results[1]['variant'] == 'B' else results[0]['conversion_rate']
        
        if b_rate > a_rate:
            print('🎯 Winner: Variant B (20% discount) - Higher conversion rate!')
        elif a_rate > b_rate:
            print('🎯 Winner: Variant A (10% discount) - Higher conversion rate!')
        else:
            print('🎯 Tie - Need more data')
        print()
        print('💡 Business Insight:')
        if b_rate > a_rate:
            print('   Higher discount (20%) drives more conversions.')
            print('   Consider: Is the extra 10% discount worth the higher conversion?')
        else:
            print('   Lower discount (10%) is sufficient to drive conversions.')
            print('   Consider: Save margin by using 10% discount.')
except Exception as e:
    print('Error parsing results:', e)
    print(json.dumps(json.load(sys.stdin), indent=2))
" 2>/dev/null || echo "$RESULTS"

echo ""
echo "📝 How to Use This in Production:"
echo "   1. When nudge engine evaluates a customer, check for active A/B tests"
echo "   2. Assign customer to variant (deterministic - same customer = same variant)"
echo "   3. Apply variant-specific discount/messaging to the nudge"
echo "   4. Send nudge via email/WhatsApp"
echo "   5. When customer makes purchase, record conversion"
echo "   6. View results in dashboard to see which variant wins"
echo ""
echo "🔗 View in Dashboard: http://localhost:3100/ab-testing"
echo ""

