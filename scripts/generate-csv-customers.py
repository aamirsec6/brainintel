#!/usr/bin/env python3
"""
Generate a CSV file with 5,000 customer records
Includes duplicates to test merge functionality
"""

import csv
import random
import uuid
from faker import Faker

# Initialize Faker with Indian locale for realistic data
fake = Faker('en_IN')
Faker.seed(42)  # For reproducibility
random.seed(42)

# Indian cities and states
cities_states = [
    ("Mumbai", "Maharashtra"),
    ("Delhi", "Delhi"),
    ("Bangalore", "Karnataka"),
    ("Hyderabad", "Telangana"),
    ("Chennai", "Tamil Nadu"),
    ("Kolkata", "West Bengal"),
    ("Pune", "Maharashtra"),
    ("Ahmedabad", "Gujarat"),
    ("Jaipur", "Rajasthan"),
    ("Surat", "Gujarat"),
    ("Lucknow", "Uttar Pradesh"),
    ("Kanpur", "Uttar Pradesh"),
    ("Nagpur", "Maharashtra"),
    ("Indore", "Madhya Pradesh"),
    ("Thane", "Maharashtra"),
    ("Bhopal", "Madhya Pradesh"),
    ("Visakhapatnam", "Andhra Pradesh"),
    ("Patna", "Bihar"),
    ("Vadodara", "Gujarat"),
    ("Ghaziabad", "Uttar Pradesh"),
]

# Generate base customers (4000 unique)
base_customers = []
used_phones = set()
used_emails = set()

print("Generating 4,000 unique customers...")

for i in range(4000):
    # Generate unique identifiers
    while True:
        phone = f"+91{random.randint(7000000000, 9999999999)}"
        if phone not in used_phones:
            used_phones.add(phone)
            break
    
    while True:
        email = fake.email()
        if email not in used_emails:
            used_emails.add(email)
            break
    
    first_name = fake.first_name()
    last_name = fake.last_name()
    full_name = f"{first_name} {last_name}"
    city, state = random.choice(cities_states)
    
    base_customers.append({
        'phone': phone,
        'email': email,
        'name': full_name,
        'first_name': first_name,
        'last_name': last_name,
        'city': city,
        'state': state,
    })

print(f"Generated {len(base_customers)} unique customers")

# Generate duplicate customers (1000 records that should merge)
# Strategy:
# 1. Same phone, different email (300 records)
# 2. Same email, different phone (300 records)
# 3. Same phone and email but different name/spelling (200 records)
# 4. Similar phones (typos/variations) (200 records)

duplicate_customers = []
print("Generating 1,000 duplicate customers for merge testing...")

# Type 1: Same phone, different email (300)
for i in range(300):
    base = random.choice(base_customers)
    new_email = fake.email()
    duplicate_customers.append({
        'phone': base['phone'],  # Same phone
        'email': new_email,  # Different email
        'name': fake.name(),
        'first_name': fake.first_name(),
        'last_name': fake.last_name(),
        'city': random.choice(cities_states)[0],
        'state': random.choice(cities_states)[1],
    })

# Type 2: Same email, different phone (300)
for i in range(300):
    base = random.choice(base_customers)
    new_phone = f"+91{random.randint(7000000000, 9999999999)}"
    duplicate_customers.append({
        'phone': new_phone,  # Different phone
        'email': base['email'],  # Same email
        'name': fake.name(),
        'first_name': fake.first_name(),
        'last_name': fake.last_name(),
        'city': random.choice(cities_states)[0],
        'state': random.choice(cities_states)[1],
    })

# Type 3: Same phone and email, different name/spelling (200)
for i in range(200):
    base = random.choice(base_customers)
    # Variant name (nickname, middle name, etc.)
    name_variants = [
        f"{base['first_name']} {base['last_name']}",  # Original
        f"{base['first_name'][0]}. {base['last_name']}",  # Initial
        f"{base['first_name']} {base['last_name']} Jr.",  # With suffix
        f"{base['first_name']} {fake.last_name()}",  # Different last name
    ]
    duplicate_customers.append({
        'phone': base['phone'],
        'email': base['email'],
        'name': random.choice(name_variants),
        'first_name': base['first_name'],
        'last_name': base['last_name'],
        'city': base['city'],
        'state': base['state'],
    })

# Type 4: Phone variations (typos, different formats) (200)
for i in range(200):
    base = random.choice(base_customers)
    # Create phone variations
    phone_base = base['phone'].replace('+91', '')
    phone_variants = [
        base['phone'],  # Original
        f"91{phone_base}",  # Without +
        f"0{phone_base}",  # With leading 0
        phone_base,  # Without country code
    ]
    duplicate_customers.append({
        'phone': random.choice(phone_variants),
        'email': base['email'],
        'name': base['name'],
        'first_name': base['first_name'],
        'last_name': base['last_name'],
        'city': base['city'],
        'state': base['state'],
    })

print(f"Generated {len(duplicate_customers)} duplicate customers")

# Combine all customers
all_customers = base_customers + duplicate_customers
random.shuffle(all_customers)  # Shuffle to mix duplicates

print(f"Total customers: {len(all_customers)}")
print(f"Expected unique customers after merge: ~{len(base_customers)}")

# Write to CSV
output_file = 'customers-5000.csv'
print(f"\nWriting to {output_file}...")

with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
    fieldnames = ['phone', 'email', 'name', 'first_name', 'last_name', 'city', 'state']
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
    
    writer.writeheader()
    for customer in all_customers:
        writer.writerow(customer)

print(f"✅ Successfully created {output_file} with {len(all_customers)} customer records")
print(f"\n📊 Merge Test Summary:")
print(f"   - Unique base customers: {len(base_customers)}")
print(f"   - Duplicate records: {len(duplicate_customers)}")
print(f"   - Type 1 (same phone, diff email): 300")
print(f"   - Type 2 (same email, diff phone): 300")
print(f"   - Type 3 (same phone+email, diff name): 200")
print(f"   - Type 4 (phone variations): 200")
print(f"\n🎯 After import, you should see ~{len(base_customers)} unique profiles")
print(f"   (duplicates will be merged automatically)")

