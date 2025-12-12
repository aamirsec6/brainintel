#!/bin/bash

# Comprehensive Real Data Ingestion Script
# This script populates the database with realistic data to demonstrate end-to-end functionality

set -e

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-retail_brain}"
DB_USER="${DB_USER:-retail_brain_user}"
DB_PASS="${DB_PASS:-retail_brain_pass}"

export PGPASSWORD="$DB_PASS"

echo "🚀 Starting Real Data Ingestion"
echo "=================================="
echo ""

# Function to run SQL
run_sql() {
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -A -c "$1" 2>/dev/null
}

# Function to get random element from array (macOS compatible)
random_element() {
  local arr=("$@")
  local len=${#arr[@]}
  local idx=$((RANDOM % len))
  echo "${arr[$idx]}"
}

# Step 1: Get existing customer profiles
echo "📊 Step 1: Getting existing customer profiles..."
CUSTOMER_IDS=$(run_sql "SELECT id FROM customer_profile WHERE is_merged = false LIMIT 50;")

if [ -z "$CUSTOMER_IDS" ]; then
  echo "❌ No customer profiles found. Please import customers first."
  exit 1
fi

# Convert to array
IFS=$'\n' read -rd '' -a CUSTOMER_ARRAY <<< "$CUSTOMER_IDS" || true
CUSTOMER_COUNT=${#CUSTOMER_ARRAY[@]}
echo "✅ Found $CUSTOMER_COUNT customers"
echo ""

# Step 2: Generate realistic events for the last 30 days
echo "📈 Step 2: Generating events for the last 30 days..."

EVENT_COUNT=0
for i in {1..30}; do
  DAYS_AGO=$((30 - i))
  
  # macOS date command
  if date -v-${DAYS_AGO}d +"%Y-%m-%d" > /dev/null 2>&1; then
    EVENT_DATE=$(date -v-${DAYS_AGO}d +"%Y-%m-%d")
  else
    EVENT_DATE=$(date -d "${DAYS_AGO} days ago" +"%Y-%m-%d")
  fi
  
  # Generate 2-5 events per day
  EVENTS_PER_DAY=$((RANDOM % 4 + 2))
  
  for j in $(seq 1 $EVENTS_PER_DAY); do
    # Pick random customer
    CUSTOMER_ID=$(random_element "${CUSTOMER_ARRAY[@]}")
    
    # Generate realistic revenue (₹100 to ₹5000)
    REVENUE=$((RANDOM % 4900 + 100))
    QUANTITY=$((RANDOM % 3 + 1))
    PRICE=$((REVENUE / QUANTITY))
    
    HOUR=$((RANDOM % 24))
    MINUTE=$((RANDOM % 60))
    EVENT_TS="${EVENT_DATE} $HOUR:$MINUTE:00"
    
    run_sql "
      INSERT INTO events (
        profile_id,
        source,
        event_type,
        event_ts,
        payload,
        sku,
        product_name,
        category,
        price,
        quantity,
        revenue,
        channel,
        created_at
      ) VALUES (
        '$CUSTOMER_ID',
        'web',
        'order_placed',
        '$EVENT_TS',
        '{\"order_id\": \"ORD-'$(date +%s)$RANDOM'\", \"payment_method\": \"card\", \"shipping_address\": \"Mumbai\"}'::jsonb,
        'SKU-'$RANDOM',
        'Product '$(echo $RANDOM | cut -c1-3)',
        'Electronics',
        $PRICE,
        $QUANTITY,
        $REVENUE,
        'online',
        NOW()
      );
    " > /dev/null 2>&1
    
    EVENT_COUNT=$((EVENT_COUNT + 1))
  done
done

echo "✅ Created $EVENT_COUNT order events"
echo ""

# Step 3: Update customer profiles with aggregated stats
echo "💰 Step 3: Updating customer profiles with aggregated stats..."
run_sql "
  UPDATE customer_profile cp
  SET 
    total_orders = COALESCE((
      SELECT COUNT(*) 
      FROM events e 
      WHERE e.profile_id = cp.id 
        AND e.event_type = 'order_placed'
    ), 0),
    total_spent = COALESCE((
      SELECT SUM(revenue) 
      FROM events e 
      WHERE e.profile_id = cp.id 
        AND e.event_type = 'order_placed'
    ), 0),
    avg_order_value = COALESCE((
      SELECT AVG(revenue) 
      FROM events e 
      WHERE e.profile_id = cp.id 
        AND e.event_type = 'order_placed'
    ), 0),
    last_seen_at = COALESCE((
      SELECT MAX(event_ts) 
      FROM events e 
      WHERE e.profile_id = cp.id
    ), cp.last_seen_at)
  WHERE cp.is_merged = false;
" > /dev/null 2>&1

echo "✅ Updated customer profiles with aggregated stats"
echo ""

# Step 4: Generate ML model predictions
echo "🤖 Step 4: Generating ML model predictions..."

MODELS=("churn-prediction" "ltv-prediction" "identity_resolution_model" "recommendation-model" "intent-detection")

for MODEL in "${MODELS[@]}"; do
  echo "  Generating predictions for $MODEL..."
  
  # Generate predictions for each customer
  for CUSTOMER_ID in "${CUSTOMER_ARRAY[@]}"; do
    # Generate realistic prediction values
    if [[ "$MODEL" == "churn-prediction" ]]; then
      PREDICTION=$((RANDOM % 100))  # 0-100 churn probability
      ACTUAL=$((RANDOM % 2))  # 0 or 1
    elif [[ "$MODEL" == "ltv-prediction" ]]; then
      PREDICTION=$((RANDOM % 50000 + 5000))  # ₹5K - ₹55K
      ACTUAL=$((RANDOM % 50000 + 5000))
    elif [[ "$MODEL" == "identity_resolution_model" ]]; then
      PREDICTION=$((RANDOM % 100))  # 0-100 confidence
      ACTUAL=$((RANDOM % 100))
    elif [[ "$MODEL" == "recommendation-model" ]]; then
      PREDICTION=$((RANDOM % 10 + 1))  # 1-10 rating
      ACTUAL=$((RANDOM % 10 + 1))
    else
      PREDICTION=$((RANDOM % 100))
      ACTUAL=$((RANDOM % 100))
    fi
    
    # Insert prediction (70% have actuals for metrics calculation)
    HAS_ACTUAL=$((RANDOM % 10))
    if [ $HAS_ACTUAL -lt 7 ]; then
      ACTUAL_VALUE=$ACTUAL
    else
      ACTUAL_VALUE="NULL"
    fi
    
    DAYS_AGO=$((RANDOM % 7))
    
    if [ "$ACTUAL_VALUE" = "NULL" ]; then
      run_sql "
        INSERT INTO ml_prediction_log (
          model_name,
          profile_id,
          prediction,
          actual,
          predicted_at,
          metadata
        ) VALUES (
          '$MODEL',
          '$CUSTOMER_ID',
          $PREDICTION,
          NULL,
          NOW() - INTERVAL '$DAYS_AGO days',
          '{\"version\": \"v1.0\", \"features\": {}}'::jsonb
        );
      " > /dev/null 2>&1
    else
      run_sql "
        INSERT INTO ml_prediction_log (
          model_name,
          profile_id,
          prediction,
          actual,
          predicted_at,
          metadata
        ) VALUES (
          '$MODEL',
          '$CUSTOMER_ID',
          $PREDICTION,
          $ACTUAL_VALUE,
          NOW() - INTERVAL '$DAYS_AGO days',
          '{\"version\": \"v1.0\", \"features\": {}}'::jsonb
        );
      " > /dev/null 2>&1
    fi
  done
  
  echo "    ✅ Generated predictions for $MODEL"
done

echo "✅ ML model predictions generated"
echo ""

# Step 5: Generate some merges
echo "🔗 Step 5: Generating identity merges..."

MERGE_COUNT=0
for i in "${!CUSTOMER_ARRAY[@]}"; do
  if [ $((i % 2)) -eq 0 ] && [ $i -lt $((${#CUSTOMER_ARRAY[@]} - 1)) ]; then
    SOURCE_ID="${CUSTOMER_ARRAY[$i]}"
    TARGET_ID="${CUSTOMER_ARRAY[$((i+1))]}"
    
    CONFIDENCE=$((RANDOM % 20 + 80))
    DAYS_AGO=$((RANDOM % 30))
    
    run_sql "
      INSERT INTO identity_merge_log (
        source_profile_id,
        target_profile_id,
        merge_type,
        confidence_score,
        merged_at
      ) VALUES (
        '$SOURCE_ID',
        '$TARGET_ID',
        'auto',
        0.$CONFIDENCE,
        NOW() - INTERVAL '$DAYS_AGO days'
      );
    " > /dev/null 2>&1
    
    MERGE_COUNT=$((MERGE_COUNT + 1))
  fi
done

echo "✅ Created $MERGE_COUNT identity merges"
echo ""

# Step 6: Generate nudges
echo "📧 Step 6: Generating nudge executions..."

NUDGE_TYPES=("welcome" "abandoned_cart" "churn_prevention" "upsell" "re_engagement")
CHANNELS=("email" "whatsapp")

for i in {1..25}; do
  CUSTOMER_ID=$(random_element "${CUSTOMER_ARRAY[@]}")
  NUDGE_TYPE=$(random_element "${NUDGE_TYPES[@]}")
  CHANNEL=$(random_element "${CHANNELS[@]}")
  DAYS_AGO=$((RANDOM % 7))
  
  run_sql "
    INSERT INTO nudge_log (
      profile_id,
      nudge_type,
      channel,
      template,
      executed_at,
      success
    ) VALUES (
      '$CUSTOMER_ID',
      '$NUDGE_TYPE',
      '$CHANNEL',
      '$NUDGE_TYPE',
      NOW() - INTERVAL '$DAYS_AGO days',
      true
    );
  " > /dev/null 2>&1
done

echo "✅ Generated 25 nudge executions"
echo ""

# Step 7: Generate intent detections
echo "💬 Step 7: Generating intent detections..."

INTENTS=("purchase" "inquiry" "complaint" "support" "feedback")
CHANNELS=("whatsapp" "email" "chat")

for i in {1..30}; do
  INTENT=$(random_element "${INTENTS[@]}")
  CHANNEL=$(random_element "${CHANNELS[@]}")
  CONFIDENCE=$((RANDOM % 30 + 70))  # 70-100%
  DAYS_AGO=$((RANDOM % 7))
  
  run_sql "
    INSERT INTO intent_message_log (
      channel,
      sender,
      text,
      intent,
      confidence,
      raw_payload,
      created_at
    ) VALUES (
      '$CHANNEL',
      'customer' || $RANDOM || '@example.com',
      'Sample message for $INTENT intent',
      '$INTENT',
      0.$CONFIDENCE,
      '{\"message\": \"test\"}'::jsonb,
      NOW() - INTERVAL '$DAYS_AGO days'
    );
  " > /dev/null 2>&1
done

echo "✅ Generated 30 intent detections"
echo ""

# Step 8: Generate raw events for activity chart
echo "📊 Step 8: Generating raw events for activity chart..."

RAW_EVENT_COUNT=0
for i in {1..30}; do
  DAYS_AGO=$((30 - i))
  
  # macOS date command
  if date -v-${DAYS_AGO}d +"%Y-%m-%d" > /dev/null 2>&1; then
    EVENT_DATE=$(date -v-${DAYS_AGO}d +"%Y-%m-%d")
  else
    EVENT_DATE=$(date -d "${DAYS_AGO} days ago" +"%Y-%m-%d")
  fi
  
  EVENTS_PER_DAY=$((RANDOM % 10 + 5))
  
  for j in $(seq 1 $EVENTS_PER_DAY); do
    CUSTOMER_ID=$(random_element "${CUSTOMER_ARRAY[@]}")
    HOUR=$((RANDOM % 24))
    MINUTE=$((RANDOM % 60))
    EVENT_TS="${EVENT_DATE} $HOUR:$MINUTE:00"
    
    run_sql "
      INSERT INTO customer_raw_event (
        source,
        event_type,
        event_ts,
        received_at,
        identifiers,
        payload,
        status
      ) VALUES (
        'web',
        'page_view',
        '$EVENT_TS',
        '$EVENT_TS',
        '{\"email\": \"customer'$RANDOM'@example.com\"}'::jsonb,
        '{\"page\": \"/products\", \"session_id\": \"sess'$RANDOM'\"}'::jsonb,
        'accepted'
      );
    " > /dev/null 2>&1
    
    RAW_EVENT_COUNT=$((RAW_EVENT_COUNT + 1))
  done
done

echo "✅ Generated $RAW_EVENT_COUNT raw events"
echo ""

# Step 9: Generate ML alerts
echo "🚨 Step 9: Generating ML model alerts..."

ALERT_TYPES=("drift" "performance" "error")
SEVERITIES=("low" "medium" "high" "critical")

for MODEL in "${MODELS[@]}"; do
  # Generate 1-3 alerts per model
  ALERT_COUNT=$((RANDOM % 3 + 1))
  
  for i in $(seq 1 $ALERT_COUNT); do
    ALERT_TYPE=$(random_element "${ALERT_TYPES[@]}")
    SEVERITY=$(random_element "${SEVERITIES[@]}")
    DAYS_AGO=$((RANDOM % 7))
    
    run_sql "
      INSERT INTO ml_alert (
        type,
        model_name,
        severity,
        message,
        details,
        created_at
      ) VALUES (
        '$ALERT_TYPE',
        '$MODEL',
        '$SEVERITY',
        '$ALERT_TYPE alert for $MODEL',
        '{\"metric\": \"accuracy\", \"value\": 0.$((RANDOM % 30 + 70))}'::jsonb,
        NOW() - INTERVAL '$DAYS_AGO days'
      );
    " > /dev/null 2>&1
  done
done

echo "✅ Generated ML model alerts"
echo ""

# Step 10: Summary
echo "📊 Final Summary"
echo "=================="
TOTAL_PROFILES=$(run_sql "SELECT COUNT(*) FROM customer_profile WHERE is_merged = false;")
TOTAL_EVENTS=$(run_sql "SELECT COUNT(*) FROM events;")
TOTAL_MERGES=$(run_sql "SELECT COUNT(*) FROM identity_merge_log;")
TOTAL_NUDGES=$(run_sql "SELECT COUNT(*) FROM nudge_log;")
TOTAL_INTENTS=$(run_sql "SELECT COUNT(*) FROM intent_message_log;")
TOTAL_PREDICTIONS=$(run_sql "SELECT COUNT(*) FROM ml_prediction_log;")
TOTAL_ALERTS=$(run_sql "SELECT COUNT(*) FROM ml_alert;")

echo "✅ Customer Profiles: $TOTAL_PROFILES"
echo "✅ Events: $TOTAL_EVENTS"
echo "✅ Merges: $TOTAL_MERGES"
echo "✅ Nudges: $TOTAL_NUDGES"
echo "✅ Intent Detections: $TOTAL_INTENTS"
echo "✅ ML Predictions: $TOTAL_PREDICTIONS"
echo "✅ ML Alerts: $TOTAL_ALERTS"
echo ""
echo "🎉 Data ingestion complete! Refresh your dashboard to see the data."
echo ""
echo "📈 Check these dashboards:"
echo "   - Main Dashboard: http://localhost:3200"
echo "   - Analytics: http://localhost:3200/analytics"
echo "   - ML Models: http://localhost:3200/ml-models"
echo "   - Intent Detection: http://localhost:3200/intent"
echo ""
