#!/usr/bin/env bash
set -euo pipefail

API_BASE="${API_BASE:-http://localhost:3017}"

function pretty_print() {
  echo
  echo "=== $1 ==="
  echo "$2"
  echo "==========="
}

function call_endpoint() {
  local method="$1"
  local path="$2"
  local payload="$3"
  local url="${API_BASE}${path}"

  if [[ "$method" == "GET" ]]; then
    response="$(curl -sSf "$url")"
  else
    response="$(curl -sSf -X "$method" "$url" \
      -H "Content-Type: application/json" \
      -d "$payload")"
  fi

  pretty_print "$path" "$response"
}

echo "Running intent smoke test against ${API_BASE}..."

call_endpoint "POST" "/v1/intent/whatsapp" '{
  "message_id": "wamid.GBgMsmoke123",
  "body": "Hello, I want to buy the outfit you shared last week.",
  "from_number": "+918123456789",
  "customer_id": "smoke-profile-1",
  "metadata": {
    "channel": "WhatsApp",
    "campaign": "smoke-test"
  }
}'

call_endpoint "POST" "/v1/intent/email" '{
  "subject": "Need help with billing",
  "body": "Your invoice is incorrect. Please help fix my subscription charges.",
  "from_email": "customer@sample.com",
  "thread_id": "thread-smoke",
  "customer_id": "smoke-profile-2"
}'

call_endpoint "POST" "/v1/intent/chat" '{
  "conversation_id": "conv-smoke-789",
  "user_input": "My order arrived damaged, can you replace it?",
  "user_id": "user-smoke-3",
  "customer_id": "smoke-profile-3"
}'

call_endpoint "GET" "/v1/intent/stats" ""

echo
echo "Intent smoke test succeeded."

