#!/usr/bin/env python3
"""
Generate realistic marketplace/e-commerce customer data
Supports: Shopify, WooCommerce, Magento, Amazon, Myntra, Flipkart
Includes order history (10-12 orders per customer on average)
"""

import csv
import random
import uuid
from datetime import datetime, timedelta
from faker import Faker
import json

fake = Faker('en_IN')
Faker.seed(42)
random.seed(42)

# Platforms
PLATFORMS = ['shopify', 'woocommerce', 'magento', 'amazon', 'myntra', 'flipkart']

# Product categories with realistic Indian products
CATEGORIES = {
    'Electronics': ['Smartphone', 'Laptop', 'Headphones', 'Smartwatch', 'Tablet', 'Camera', 'Speaker', 'Charger'],
    'Fashion': ['T-Shirt', 'Jeans', 'Dress', 'Shoes', 'Sunglasses', 'Watch', 'Bag', 'Jewellery'],
    'Home & Kitchen': ['Cookware', 'Blender', 'Microwave', 'Bedding', 'Furniture', 'Lamp', 'Curtains'],
    'Beauty': ['Face Cream', 'Shampoo', 'Perfume', 'Makeup Kit', 'Hair Oil', 'Serum', 'Lipstick'],
    'Sports': ['Cricket Bat', 'Football', 'Yoga Mat', 'Dumbbells', 'Running Shoes', 'Gym Bag'],
    'Books': ['Novel', 'Textbook', 'Cookbook', 'Biography', 'Self-Help', 'Comic'],
    'Toys': ['Action Figure', 'Board Game', 'Puzzle', 'Remote Car', 'Doll', 'Building Blocks'],
}

# Price ranges by category (in INR)
PRICE_RANGES = {
    'Electronics': (500, 150000),
    'Fashion': (200, 15000),
    'Home & Kitchen': (300, 50000),
    'Beauty': (100, 5000),
    'Sports': (500, 20000),
    'Books': (100, 2000),
    'Toys': (200, 5000),
}

# Indian cities
CITIES = [
    ('Mumbai', 'Maharashtra', '400001'),
    ('Delhi', 'Delhi', '110001'),
    ('Bangalore', 'Karnataka', '560001'),
    ('Hyderabad', 'Telangana', '500001'),
    ('Chennai', 'Tamil Nadu', '600001'),
    ('Kolkata', 'West Bengal', '700001'),
    ('Pune', 'Maharashtra', '411001'),
    ('Ahmedabad', 'Gujarat', '380001'),
    ('Jaipur', 'Rajasthan', '302001'),
    ('Surat', 'Gujarat', '395001'),
    ('Lucknow', 'Uttar Pradesh', '226001'),
    ('Kanpur', 'Uttar Pradesh', '208001'),
    ('Nagpur', 'Maharashtra', '440001'),
    ('Indore', 'Madhya Pradesh', '452001'),
    ('Thane', 'Maharashtra', '400601'),
]

# Order statuses
ORDER_STATUSES = ['completed', 'pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']

# Payment methods
PAYMENT_METHODS = ['credit_card', 'debit_card', 'upi', 'netbanking', 'cod', 'wallet', 'emi']

def generate_phone():
    """Generate realistic Indian phone number"""
    return f"+91{random.randint(7000000000, 9999999999)}"

def generate_order_id(platform):
    """Generate platform-specific order ID"""
    prefixes = {
        'shopify': 'SH',
        'woocommerce': 'WC',
        'magento': 'MG',
        'amazon': 'AMZ',
        'myntra': 'MYN',
        'flipkart': 'FLP',
    }
    prefix = prefixes.get(platform, 'ORD')
    return f"{prefix}{random.randint(100000, 999999)}"

def generate_product(category):
    """Generate realistic product"""
    products = CATEGORIES[category]
    product_name = random.choice(products)
    brand = fake.company().split()[0] if random.random() > 0.3 else ''
    full_name = f"{brand} {product_name}" if brand else product_name
    
    min_price, max_price = PRICE_RANGES[category]
    price = random.randint(min_price, max_price)
    
    return {
        'name': full_name,
        'category': category,
        'price': price,
        'sku': f"{category[:3].upper()}{random.randint(1000, 9999)}",
    }

def generate_order(customer_id, platform, order_date):
    """Generate a single order"""
    category = random.choice(list(CATEGORIES.keys()))
    product = generate_product(category)
    
    quantity = random.randint(1, 3)
    subtotal = product['price'] * quantity
    discount = random.randint(0, int(subtotal * 0.3))  # 0-30% discount
    tax = int(subtotal * 0.18)  # 18% GST
    shipping = random.choice([0, 50, 100, 150, 200]) if subtotal < 1000 else 0
    total = subtotal - discount + tax + shipping
    
    order_id = generate_order_id(platform)
    
    return {
        'order_id': order_id,
        'customer_id': customer_id,
        'platform': platform,
        'order_date': order_date.strftime('%Y-%m-%d %H:%M:%S'),
        'product_name': product['name'],
        'product_sku': product['sku'],
        'category': category,
        'quantity': quantity,
        'unit_price': product['price'],
        'subtotal': subtotal,
        'discount': discount,
        'tax': tax,
        'shipping': shipping,
        'total': total,
        'currency': 'INR',
        'status': random.choice(ORDER_STATUSES),
        'payment_method': random.choice(PAYMENT_METHODS),
    }

def generate_customer_with_orders(customer_index):
    """Generate a customer with order history"""
    platform = random.choice(PLATFORMS)
    customer_id = f"{platform.upper()}{random.randint(100000, 999999)}"
    
    # Customer details
    first_name = fake.first_name()
    last_name = fake.last_name()
    email = fake.email()
    phone = generate_phone()
    city, state, postal = random.choice(CITIES)
    
    # Generate order history (10-12 orders on average)
    num_orders = random.randint(8, 15)  # Some variation
    orders = []
    
    # First order date (random date in last 2 years)
    first_order_date = datetime.now() - timedelta(days=random.randint(30, 730))
    
    for i in range(num_orders):
        # Orders spread over time (more recent = more frequent)
        days_ago = random.randint(0, (datetime.now() - first_order_date).days)
        order_date = first_order_date + timedelta(days=days_ago)
        order_date = order_date.replace(
            hour=random.randint(9, 22),
            minute=random.randint(0, 59),
            second=random.randint(0, 59)
        )
        
        order = generate_order(customer_id, platform, order_date)
        orders.append(order)
    
    # Sort orders by date
    orders.sort(key=lambda x: x['order_date'])
    
    return {
        'customer': {
            'customer_id': customer_id,
            'platform': platform,
            'first_name': first_name,
            'last_name': last_name,
            'email': email,
            'phone': phone,
            'city': city,
            'state': state,
            'postal_code': postal,
            'country': 'India',
            'total_orders': num_orders,
            'total_spent': sum(o['total'] for o in orders),
            'first_order_date': orders[0]['order_date'],
            'last_order_date': orders[-1]['order_date'],
        },
        'orders': orders,
    }

def main():
    print("🛍️  Generating Marketplace Customer Data...")
    print("=" * 60)
    
    num_customers = 5000
    all_customers = []
    all_orders = []
    
    print(f"Generating {num_customers} customers with order history...")
    
    for i in range(num_customers):
        if (i + 1) % 500 == 0:
            print(f"  Progress: {i + 1}/{num_customers} customers...")
        
        customer_data = generate_customer_with_orders(i)
        all_customers.append(customer_data['customer'])
        all_orders.extend(customer_data['orders'])
    
    print(f"\n✅ Generated:")
    print(f"   - {len(all_customers)} customers")
    print(f"   - {len(all_orders)} orders")
    print(f"   - Average orders per customer: {len(all_orders) / len(all_customers):.1f}")
    
    # Write customers CSV
    print("\n📝 Writing customers.csv...")
    with open('marketplace-customers.csv', 'w', newline='', encoding='utf-8') as f:
        fieldnames = [
            'customer_id', 'platform', 'first_name', 'last_name', 'email', 'phone',
            'city', 'state', 'postal_code', 'country',
            'total_orders', 'total_spent', 'first_order_date', 'last_order_date'
        ]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_customers)
    
    # Write orders CSV
    print("📝 Writing marketplace-orders.csv...")
    with open('marketplace-orders.csv', 'w', newline='', encoding='utf-8') as f:
        fieldnames = [
            'order_id', 'customer_id', 'platform', 'order_date',
            'product_name', 'product_sku', 'category',
            'quantity', 'unit_price', 'subtotal', 'discount', 'tax', 'shipping', 'total',
            'currency', 'status', 'payment_method'
        ]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_orders)
    
    # Platform distribution
    platform_counts = {}
    for customer in all_customers:
        platform = customer['platform']
        platform_counts[platform] = platform_counts.get(platform, 0) + 1
    
    print("\n📊 Platform Distribution:")
    for platform, count in sorted(platform_counts.items(), key=lambda x: -x[1]):
        print(f"   {platform.capitalize()}: {count} customers ({count/len(all_customers)*100:.1f}%)")
    
    print("\n✅ Files created:")
    print(f"   📄 marketplace-customers.csv ({len(all_customers)} rows)")
    print(f"   📄 marketplace-orders.csv ({len(all_orders)} rows)")
    print("\n💡 You can import these into your platform!")

if __name__ == '__main__':
    main()

