#!/usr/bin/env python3
"""
Import marketplace orders as events into the Retail Brain platform
This will make orders visible in customer activity timelines
"""

import csv
import requests
import json
from datetime import datetime, timedelta
import time
from typing import Dict, Optional

# Configuration
# Option 1: Use API Gateway (requires API key)
API_GATEWAY_URL = "http://localhost:3000/v1/events"
# Option 2: Use Event Collector directly (no auth required)
EVENT_COLLECTOR_URL = "http://localhost:3001/events"

# Use Event Collector directly (no auth needed) or API Gateway (requires key)
USE_EVENT_COLLECTOR_DIRECTLY = True  # Set to False to use API Gateway

API_KEY = "test_api_key"  # API key for API Gateway (if using)
BATCH_SIZE = 50  # Send events in batches
DELAY_BETWEEN_BATCHES = 0.5  # Seconds

def load_customers(csv_path: str) -> Dict[str, Dict]:
    """Load customers and create lookup by customer_id"""
    customers = {}
    print(f"📖 Loading customers from {csv_path}...")
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            customer_id = row['customer_id']
            customers[customer_id] = {
                'email': row.get('email', '').strip(),
                'phone': row.get('phone', '').strip(),
                'platform': row.get('platform', '').strip(),
            }
    
    print(f"   ✅ Loaded {len(customers)} customers")
    return customers

def convert_order_to_event(order: Dict, customer: Dict) -> Optional[Dict]:
    """Convert order CSV row to event format"""
    # Get customer identifiers
    identifiers = {}
    if customer.get('email'):
        identifiers['email'] = customer['email']
    if customer.get('phone'):
        identifiers['phone'] = customer['phone']
    
    # Must have at least one identifier
    if not identifiers:
        return None
    
    # Convert order_date to ISO 8601 format
    # Adjust dates to be within the last year (to pass validation)
    try:
        order_date = datetime.strptime(order['order_date'], '%Y-%m-%d %H:%M:%S')
        now = datetime.utcnow()
        
        # If order is more than 1 year old, adjust it to be within the last year
        # but preserve the relative time differences between orders
        one_year_ago = now - timedelta(days=365)
        if order_date < one_year_ago:
            # Calculate how old the order is
            age_days = (one_year_ago - order_date).days
            # Adjust to be within the last year, but keep relative spacing
            # Use a scaling factor to compress old dates into the last year
            max_age_in_data = 730  # 2 years max in the generated data
            if max_age_in_data > 0:
                scale_factor = 365 / max_age_in_data  # Compress 2 years into 1 year
                adjusted_days_ago = int(age_days * scale_factor)
                order_date = now - timedelta(days=min(adjusted_days_ago, 364))
        
        # If order is in the future, set it to now
        if order_date > now:
            order_date = now
        
        event_ts = order_date.isoformat() + 'Z'
    except:
        # Fallback to current time if parsing fails
        event_ts = datetime.utcnow().isoformat() + 'Z'
    
    # Build event payload
    payload = {
        'order_id': order['order_id'],
        'product_name': order['product_name'],
        'product_sku': order['product_sku'],
        'category': order['category'],
        'quantity': int(order['quantity']),
        'unit_price': float(order['unit_price']),
        'subtotal': float(order['subtotal']),
        'discount': float(order['discount']),
        'tax': float(order['tax']),
        'shipping': float(order['shipping']),
        'total': float(order['total']),
        'currency': order['currency'],
        'status': order['status'],
        'payment_method': order['payment_method'],
    }
    
    # Create event
    event = {
        'source': order['platform'],
        'event_type': 'order_placed',  # Standard event type
        'event_ts': event_ts,
        'identifiers': identifiers,
        'payload': payload,
    }
    
    return event

def send_event(event: Dict) -> bool:
    """Send a single event to the API"""
    try:
        # Choose URL based on configuration
        url = EVENT_COLLECTOR_URL if USE_EVENT_COLLECTOR_DIRECTLY else API_GATEWAY_URL
        
        # Build headers
        headers = {'Content-Type': 'application/json'}
        if not USE_EVENT_COLLECTOR_DIRECTLY:
            headers['Authorization'] = f'Bearer {API_KEY}'
        
        response = requests.post(
            url,
            headers=headers,
            json=event,
            timeout=10,
        )
        
        if response.status_code in [200, 202]:
            return True
        else:
            print(f"   ⚠️  Error {response.status_code}: {response.text[:100]}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Request failed: {str(e)[:100]}")
        return False

def main():
    print("🛍️  Importing Marketplace Orders as Events")
    print("=" * 60)
    
    customers_csv = 'marketplace-customers.csv'
    orders_csv = 'marketplace-orders.csv'
    
    # Load customers
    customers = load_customers(customers_csv)
    
    # Process orders
    print(f"\n📦 Processing orders from {orders_csv}...")
    
    total_orders = 0
    successful = 0
    failed = 0
    skipped = 0
    batch = []
    
    with open(orders_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for i, order in enumerate(reader):
            total_orders += 1
            
            # Get customer info
            customer_id = order['customer_id']
            customer = customers.get(customer_id)
            
            if not customer:
                skipped += 1
                if skipped <= 5:
                    print(f"   ⚠️  Customer {customer_id} not found, skipping order {order['order_id']}")
                continue
            
            # Convert to event
            event = convert_order_to_event(order, customer)
            
            if not event:
                skipped += 1
                continue
            
            batch.append(event)
            
            # Send batch when full
            if len(batch) >= BATCH_SIZE:
                print(f"   📤 Sending batch of {len(batch)} events... (Total: {total_orders})")
                
                batch_success = 0
                for event in batch:
                    if send_event(event):
                        batch_success += 1
                        successful += 1
                    else:
                        failed += 1
                
                print(f"      ✅ {batch_success}/{len(batch)} successful in this batch")
                batch = []
                
                # Small delay between batches
                time.sleep(DELAY_BETWEEN_BATCHES)
    
    # Send remaining events
    if batch:
        print(f"   📤 Sending final batch of {len(batch)} events...")
        batch_success = 0
        for event in batch:
            if send_event(event):
                batch_success += 1
                successful += 1
            else:
                failed += 1
        print(f"      ✅ {batch_success}/{len(batch)} successful in final batch")
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Import Summary:")
    print(f"   Total orders processed: {total_orders}")
    print(f"   ✅ Successfully imported: {successful}")
    print(f"   ❌ Failed: {failed}")
    print(f"   ⏭️  Skipped: {skipped}")
    print(f"   Success rate: {(successful/total_orders*100):.1f}%")
    print("\n💡 Orders are now visible in customer activity timelines!")
    print("   Check customer profiles to see order history.")

if __name__ == '__main__':
    main()

