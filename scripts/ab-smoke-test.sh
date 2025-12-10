#!/bin/bash
set -euo pipefail

API=${API_GATEWAY_URL:-http://localhost:3000}
EXP_NAME="Smoke Test $(date +%s)"

echo "🚀 Running A/B smoke test against $API"

create_resp=$(curl -s -X POST "$API/v1/ab-testing/experiments" \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"$EXP_NAME\",\"variants\":[\"A\",\"B\"],\"traffic_split\":{\"A\":50,\"B\":50}}")
exp_id=$(echo "$create_resp" | jq -r '.experiment.id // .experiment_id // .id')

if [ -z "$exp_id" ] || [ "$exp_id" = "null" ]; then
  echo "❌ Failed to create experiment"; echo "$create_resp"; exit 1;
fi
echo "✅ Experiment created: $exp_id"

# Assign two users
for user in test-user-1 test-user-2; do
  assign_resp=$(curl -s -X POST "$API/v1/ab-testing/experiments/$exp_id/assign" \
    -H 'Content-Type: application/json' \
    -d "{\"profile_id\":\"$user\"}")
  variant=$(echo "$assign_resp" | jq -r '.variant // .assignment')
  echo "Assigned $user -> $variant"
done

# Record conversions
curl -s -X POST "$API/v1/ab-testing/experiments/$exp_id/conversion" \
  -H 'Content-Type: application/json' \
  -d "{\"profile_id\":\"test-user-1\",\"conversion_type\":\"purchase\",\"value\":1500}" >/dev/null
curl -s -X POST "$API/v1/ab-testing/experiments/$exp_id/conversion" \
  -H 'Content-Type: application/json' \
  -d "{\"profile_id\":\"test-user-2\",\"conversion_type\":\"purchase\",\"value\":900}" >/dev/null
echo "✅ Conversions logged"

# Fetch results
results=$(curl -s "$API/v1/ab-testing/experiments/$exp_id/results")
echo "📊 Results:"
echo "$results" | jq .

echo "✅ Smoke test complete"

