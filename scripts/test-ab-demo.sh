#!/bin/bash

# A/B Testing Demo Script
# This demonstrates how A/B testing works with real customer data

API_URL="${API_URL:-http://localhost:3000}"

echo "🧪 A/B Testing Demo"
echo "==================="
echo ""

# Step 1: Create an experiment
echo "1️⃣ Creating an experiment: 'Email Subject Line Test'"
echo "   Testing: '50% Off Today!' vs 'Your Exclusive Deal'"
echo ""

CREATE_RESP=$(curl -s -X POST "$API_URL/v1/ab-testing/experiments" \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Email Subject Line Test",
    "description": "Testing which email subject line gets more purchases",
    "variants": ["A", "B"],
    "traffic_split": {"A": 50, "B": 50}
  }')

EXPERIMENT_ID=$(echo $CREATE_RESP | jq -r '.experiment.id // empty')

if [ -z "$EXPERIMENT_ID" ] || [ "$EXPERIMENT_ID" = "null" ]; then
  echo "❌ Failed to create experiment"
  echo "Response: $CREATE_RESP"
  exit 1
fi

echo "✅ Experiment created: $EXPERIMENT_ID"
echo "   Setting status to 'running'..."
docker compose exec -T postgres psql -U retail_brain_user -d retail_brain -c "UPDATE ab_experiment SET status = 'running' WHERE id = '$EXPERIMENT_ID';" > /dev/null 2>&1
echo "✅ Experiment is now running"
echo ""

# Step 2: Assign variants to customers
echo "2️⃣ Assigning variants to 5 customers..."
echo ""

PROFILE_IDS=(
  "f6787e46-3dac-46f3-89c0-07a7c96bbce3"
  "b635c994-ab6d-4ff4-80df-301e3a6d58bc"
  "1cfe1157-fb6a-4624-8c7b-2871447c45f7"
  "09aba405-e85b-4c7b-9d03-937852cd1c59"
  "dc94a9f6-de3e-4603-b314-4f4d3bf8d402"
)

ASSIGNMENTS=()

for PROFILE_ID in "${PROFILE_IDS[@]}"; do
  ASSIGN_RESP=$(curl -s -X POST "$API_URL/v1/ab-testing/experiments/$EXPERIMENT_ID/assign" \
    -H 'Content-Type: application/json' \
    -d "{\"profile_id\": \"$PROFILE_ID\"}")
  
  VARIANT=$(echo $ASSIGN_RESP | jq -r '.variant // empty')
  if [ -z "$VARIANT" ] || [ "$VARIANT" = "null" ]; then
    echo "   ⚠️  Failed to assign variant for $PROFILE_ID"
    continue
  fi
  ASSIGNMENTS+=("$PROFILE_ID:$VARIANT")
  echo "   Customer $PROFILE_ID → Variant $VARIANT"
done

echo ""
echo "✅ All customers assigned"
echo ""

# Step 3: Simulate conversions (some customers purchase)
echo "3️⃣ Simulating conversions..."
echo "   (Some customers make purchases, some don't)"
echo ""

# Variant A customers: 2 out of 3 convert
# Variant B customers: 3 out of 2 convert (better!)

CONVERSION_COUNT=0

for ASSIGNMENT in "${ASSIGNMENTS[@]}"; do
  PROFILE_ID=$(echo $ASSIGNMENT | cut -d':' -f1)
  VARIANT=$(echo $ASSIGNMENT | cut -d':' -f2)
  
  # Simulate: Variant A = 40% conversion, Variant B = 60% conversion
  if [ "$VARIANT" = "A" ]; then
    # 40% chance for Variant A
    if [ $((RANDOM % 10)) -lt 4 ]; then
      VALUE=$((500 + RANDOM % 1000))
      curl -s -X POST "$API_URL/v1/ab-testing/experiments/$EXPERIMENT_ID/conversion" \
        -H 'Content-Type: application/json' \
        -d "{\"profile_id\": \"$PROFILE_ID\", \"conversion_type\": \"purchase\", \"value\": $VALUE}" > /dev/null
      echo "   ✅ Customer $PROFILE_ID (Variant $VARIANT) purchased ₹$VALUE"
      CONVERSION_COUNT=$((CONVERSION_COUNT + 1))
    else
      echo "   ⏭️  Customer $PROFILE_ID (Variant $VARIANT) did not purchase"
    fi
  else
    # 60% chance for Variant B
    if [ $((RANDOM % 10)) -lt 6 ]; then
      VALUE=$((500 + RANDOM % 1000))
      curl -s -X POST "$API_URL/v1/ab-testing/experiments/$EXPERIMENT_ID/conversion" \
        -H 'Content-Type: application/json' \
        -d "{\"profile_id\": \"$PROFILE_ID\", \"conversion_type\": \"purchase\", \"value\": $VALUE}" > /dev/null
      echo "   ✅ Customer $PROFILE_ID (Variant $VARIANT) purchased ₹$VALUE"
      CONVERSION_COUNT=$((CONVERSION_COUNT + 1))
    else
      echo "   ⏭️  Customer $PROFILE_ID (Variant $VARIANT) did not purchase"
    fi
  fi
done

echo ""
echo "✅ Recorded $CONVERSION_COUNT conversions"
echo ""

# Step 4: Get results
echo "4️⃣ Fetching results..."
echo ""

sleep 1  # Give DB a moment

RESULTS=$(curl -s "$API_URL/v1/ab-testing/experiments/$EXPERIMENT_ID/results")

echo "📊 Experiment Results:"
echo "======================"
echo ""

# Parse and display results
echo "$RESULTS" | python3 -c "
import json
import sys

data = json.load(sys.stdin)
results = data.get('results', {}).get('results', [])
summary = data.get('results', {}).get('summary', {})

print(f\"Total Assigned: {summary.get('total_assigned', 0)}\")
print(f\"Total Converted: {summary.get('total_converted', 0)}\")
print(f\"Overall Conversion Rate: {summary.get('overall_conversion_rate', 0):.2f}%\")
print()
print('Per Variant:')
print('-' * 80)

for variant in results:
    print(f\"Variant {variant['variant']}:\")
    print(f\"  Assigned: {variant['assigned_count']}\")
    print(f\"  Converted: {variant['converted_count']}\")
    print(f\"  Conversion Rate: {variant['conversion_rate']:.2f}%\")
    print(f\"  Avg Value: ₹{variant['avg_value']:.2f}\")
    if variant.get('uplift', 0) != 0:
        uplift = variant['uplift']
        color = '🟢' if uplift > 0 else '🔴'
        print(f\"  Uplift vs Control: {color} {uplift:.2f}%\")
    print()
" 2>/dev/null || echo "$RESULTS"

echo ""
echo "🎯 Key Takeaway:"
echo "   This shows which variant (A or B) performs better!"
echo "   Use this data to decide which email subject line to use going forward."
echo ""
echo "💡 Next Steps:"
echo "   1. View in dashboard: http://localhost:3100/ab-testing"
echo "   2. Run with more customers for statistical significance"
echo "   3. Test different things: discounts, timing, channels, etc."
echo ""

