#!/usr/bin/env python3
"""
Comprehensive Real Data Ingestion Script
Populates the database with realistic data to demonstrate end-to-end functionality
"""

import os
import random
import psycopg2
from datetime import datetime, timedelta
from typing import List

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432'),
    'database': os.getenv('DB_NAME', 'retail_brain'),
    'user': os.getenv('DB_USER', 'retail_brain_user'),
    'password': os.getenv('DB_PASS', 'retail_brain_pass'),
}

def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)

def main():
    print("🚀 Starting Real Data Ingestion")
    print("=" * 50)
    print()
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Step 1: Get existing customer profiles
        print("📊 Step 1: Getting existing customer profiles...")
        cur.execute("SELECT id FROM customer_profile WHERE is_merged = false LIMIT 50;")
        customer_ids = [row[0] for row in cur.fetchall()]
        
        if not customer_ids:
            print("❌ No customer profiles found. Please import customers first.")
            return
        
        print(f"✅ Found {len(customer_ids)} customers")
        print()
        
        # Step 2: Generate realistic events for the last 30 days
        print("📈 Step 2: Generating events for the last 30 days...")
        event_count = 0
        
        for day in range(30):
            days_ago = 30 - day
            event_date = datetime.now() - timedelta(days=days_ago)
            
            # Generate 2-5 events per day
            events_per_day = random.randint(2, 5)
            
            for _ in range(events_per_day):
                customer_id = random.choice(customer_ids)
                revenue = random.randint(100, 5000)
                quantity = random.randint(1, 3)
                price = revenue // quantity
                
                hour = random.randint(0, 23)
                minute = random.randint(0, 59)
                event_ts = event_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
                
                cur.execute("""
                    INSERT INTO events (
                        profile_id, source, event_type, event_ts, payload,
                        sku, product_name, category, price, quantity, revenue, channel, created_at
                    ) VALUES (
                        %s, 'web', 'order_placed', %s, %s,
                        %s, %s, %s, %s, %s, %s, 'online', NOW()
                    )
                """, (
                    customer_id,
                    event_ts,
                    f'{{"order_id": "ORD-{int(datetime.now().timestamp())}{random.randint(1000, 9999)}", "payment_method": "card", "shipping_address": "Mumbai"}}',
                    f'SKU-{random.randint(1000, 9999)}',
                    f'Product {random.randint(100, 999)}',
                    'Electronics',
                    price,
                    quantity,
                    revenue,
                ))
                event_count += 1
        
        conn.commit()
        print(f"✅ Created {event_count} order events")
        print()
        
        # Step 3: Update customer profiles with aggregated stats
        print("💰 Step 3: Updating customer profiles with aggregated stats...")
        cur.execute("""
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
        """)
        conn.commit()
        print("✅ Updated customer profiles with aggregated stats")
        print()
        
        # Step 4: Generate ML model predictions
        print("🤖 Step 4: Generating ML model predictions...")
        
        models = ["churn-prediction", "ltv-prediction", "identity_resolution_model", "recommendation-model", "intent-detection"]
        
        for model in models:
            print(f"  Generating predictions for {model}...")
            
            for customer_id in customer_ids[:20]:  # Limit to 20 customers per model
                days_ago = random.randint(0, 7)
                predicted_at = datetime.now() - timedelta(days=days_ago)
                
                # Generate realistic prediction values
                if model == "churn-prediction":
                    prediction = random.randint(0, 100)
                    actual = random.choice([None, random.randint(0, 1)]) if random.random() < 0.7 else None
                elif model == "ltv-prediction":
                    prediction = random.randint(5000, 55000)
                    actual = random.choice([None, random.randint(5000, 55000)]) if random.random() < 0.7 else None
                elif model == "identity_resolution_model":
                    prediction = random.randint(0, 100)
                    actual = random.choice([None, random.randint(0, 100)]) if random.random() < 0.7 else None
                elif model == "recommendation-model":
                    prediction = random.randint(1, 10)
                    actual = random.choice([None, random.randint(1, 10)]) if random.random() < 0.7 else None
                else:
                    prediction = random.randint(0, 100)
                    actual = random.choice([None, random.randint(0, 100)]) if random.random() < 0.7 else None
                
                cur.execute("""
                    INSERT INTO ml_prediction_log (
                        model_name, profile_id, prediction, actual, predicted_at, metadata
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s
                    )
                """, (
                    model,
                    customer_id,
                    prediction,
                    actual,
                    predicted_at,
                    '{"version": "v1.0", "features": {}}'
                ))
            
            print(f"    ✅ Generated predictions for {model}")
        
        conn.commit()
        print("✅ ML model predictions generated")
        print()
        
        # Step 5: Generate merges
        print("🔗 Step 5: Generating identity merges...")
        
        merge_count = 0
        for i in range(0, len(customer_ids) - 1, 2):
            source_id = customer_ids[i]
            target_id = customer_ids[i + 1]
            confidence = random.randint(80, 99) / 100.0
            days_ago = random.randint(0, 30)
            merged_at = datetime.now() - timedelta(days=days_ago)
            
            cur.execute("""
                INSERT INTO identity_merge_log (
                    source_profile_id, target_profile_id, merge_type, confidence_score, merged_at
                ) VALUES (%s, %s, 'auto', %s, %s)
            """, (source_id, target_id, confidence, merged_at))
            
            merge_count += 1
        
        conn.commit()
        print(f"✅ Created {merge_count} identity merges")
        print()
        
        # Step 6: Generate nudges
        print("📧 Step 6: Generating nudge executions...")
        
        nudge_types = ["welcome", "abandoned_cart", "churn_prevention", "upsell", "re_engagement"]
        channels = ["email", "whatsapp"]
        
        for _ in range(25):
            customer_id = random.choice(customer_ids)
            nudge_type = random.choice(nudge_types)
            channel = random.choice(channels)
            days_ago = random.randint(0, 7)
            executed_at = datetime.now() - timedelta(days=days_ago)
            
            cur.execute("""
                INSERT INTO nudge_log (
                    profile_id, nudge_type, channel, template, executed_at, success
                ) VALUES (%s, %s, %s, %s, %s, true)
            """, (customer_id, nudge_type, channel, nudge_type, executed_at))
        
        conn.commit()
        print("✅ Generated 25 nudge executions")
        print()
        
        # Step 7: Generate intent detections
        print("💬 Step 7: Generating intent detections...")
        
        intents = ["purchase", "inquiry", "complaint", "support", "feedback"]
        channels = ["whatsapp", "email", "chat"]
        
        for _ in range(30):
            intent = random.choice(intents)
            channel = random.choice(channels)
            confidence = random.randint(70, 100) / 100.0
            days_ago = random.randint(0, 7)
            created_at = datetime.now() - timedelta(days=days_ago)
            
            cur.execute("""
                INSERT INTO intent_message_log (
                    channel, sender, text, intent, confidence, raw_payload, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                channel,
                f'customer{random.randint(1000, 9999)}@example.com',
                f'Sample message for {intent} intent',
                intent,
                confidence,
                '{"message": "test"}',
                created_at
            ))
        
        conn.commit()
        print("✅ Generated 30 intent detections")
        print()
        
        # Step 8: Generate raw events for activity chart
        print("📊 Step 8: Generating raw events for activity chart...")
        
        raw_event_count = 0
        for day in range(30):
            days_ago = 30 - day
            event_date = datetime.now() - timedelta(days=days_ago)
            
            events_per_day = random.randint(5, 15)
            
            for _ in range(events_per_day):
                customer_id = random.choice(customer_ids)
                hour = random.randint(0, 23)
                minute = random.randint(0, 59)
                event_ts = event_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
                
                cur.execute("""
                    INSERT INTO customer_raw_event (
                        source, event_type, event_ts, received_at, identifiers, payload, status
                    ) VALUES (%s, %s, %s, %s, %s, %s, 'accepted')
                """, (
                    'web',
                    'page_view',
                    event_ts,
                    event_ts,
                    f'{{"email": "customer{random.randint(1000, 9999)}@example.com"}}',
                    f'{{"page": "/products", "session_id": "sess{random.randint(10000, 99999)}"}}'
                ))
                
                raw_event_count += 1
        
        conn.commit()
        print(f"✅ Generated {raw_event_count} raw events")
        print()
        
        # Step 9: Generate ML alerts
        print("🚨 Step 9: Generating ML model alerts...")
        
        alert_types = ["drift", "performance", "error"]
        severities = ["low", "medium", "high", "critical"]
        
        for model in models:
            alert_count = random.randint(1, 3)
            
            for _ in range(alert_count):
                alert_type = random.choice(alert_types)
                severity = random.choice(severities)
                days_ago = random.randint(0, 7)
                created_at = datetime.now() - timedelta(days=days_ago)
                
                cur.execute("""
                    INSERT INTO ml_alert (
                        type, model_name, severity, message, details, created_at
                    ) VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    alert_type,
                    model,
                    severity,
                    f'{alert_type} alert for {model}',
                    f'{{"metric": "accuracy", "value": {random.randint(70, 100) / 100.0}}}',
                    created_at
                ))
        
        conn.commit()
        print("✅ Generated ML model alerts")
        print()
        
        # Step 10: Summary
        print("📊 Final Summary")
        print("=" * 50)
        
        cur.execute("SELECT COUNT(*) FROM customer_profile WHERE is_merged = false;")
        total_profiles = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM events;")
        total_events = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM identity_merge_log;")
        total_merges = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM nudge_log;")
        total_nudges = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM intent_message_log;")
        total_intents = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM ml_prediction_log;")
        total_predictions = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM ml_alert;")
        total_alerts = cur.fetchone()[0]
        
        print(f"✅ Customer Profiles: {total_profiles}")
        print(f"✅ Events: {total_events}")
        print(f"✅ Merges: {total_merges}")
        print(f"✅ Nudges: {total_nudges}")
        print(f"✅ Intent Detections: {total_intents}")
        print(f"✅ ML Predictions: {total_predictions}")
        print(f"✅ ML Alerts: {total_alerts}")
        print()
        print("🎉 Data ingestion complete! Refresh your dashboard to see the data.")
        print()
        print("📈 Check these dashboards:")
        print("   - Main Dashboard: http://localhost:3200")
        print("   - Analytics: http://localhost:3200/analytics")
        print("   - ML Models: http://localhost:3200/ml-models")
        print("   - Intent Detection: http://localhost:3200/intent")
        print()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    main()

