"""
Synthetic Data Generator for Testing
Generates synthetic profile pairs for local testing
"""
import pandas as pd
import numpy as np
from typing import List, Tuple, Dict
import random
from datetime import datetime, timedelta
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '../../feature-engineering/src'))
from identity_features import extract_pairwise_features


def generate_synthetic_profile(
    profile_id: str,
    base_name: str = None,
    base_phone: str = None,
    base_email: str = None
) -> Tuple[Dict, List[Dict]]:
    """
    Generate synthetic profile data
    
    Returns:
        Tuple of (profile_dict, identifiers_list)
    """
    if base_name is None:
        first_names = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Emily']
        last_names = ['Doe', 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones']
        first_name = random.choice(first_names)
        last_name = random.choice(last_names)
        full_name = f"{first_name} {last_name}"
    else:
        full_name = base_name
    
    if base_phone is None:
        phone = f"+91{random.randint(9000000000, 9999999999)}"
    else:
        phone = base_phone
    
    if base_email is None:
        email = f"{full_name.lower().replace(' ', '.')}@example.com"
    else:
        email = base_email
    
    # Generate profile
    profile = {
        'id': profile_id,
        'full_name': full_name,
        'first_name': full_name.split()[0] if ' ' in full_name else full_name,
        'last_name': full_name.split()[-1] if ' ' in full_name else '',
        'city': random.choice(['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata']),
        'state': random.choice(['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'West Bengal']),
        'first_seen_at': (datetime.now() - timedelta(days=random.randint(0, 365))).isoformat() + 'Z'
    }
    
    # Generate identifiers
    identifiers = [
        {'type': 'phone', 'value': phone, 'value_hash': f'hash_{phone}'},
        {'type': 'email', 'value': email, 'value_hash': f'hash_{email}'},
    ]
    
    # Sometimes add device
    if random.random() > 0.3:
        device_id = f"device_{random.randint(100000, 999999)}"
        identifiers.append({
            'type': 'device',
            'value': device_id,
            'value_hash': f'hash_{device_id}'
        })
    
    return profile, identifiers


def generate_synthetic_pairs(
    num_positive: int = 100,
    num_negative: int = 100
) -> pd.DataFrame:
    """
    Generate synthetic training pairs
    
    Args:
        num_positive: Number of positive pairs (matching profiles)
        num_negative: Number of negative pairs (non-matching)
    
    Returns:
        DataFrame with features and labels
    """
    feature_rows = []
    
    # Generate positive pairs (same person, different identifiers)
    print(f"Generating {num_positive} positive pairs...")
    for i in range(num_positive):
        profile_id_a = f"profile_a_{i}"
        profile_id_b = f"profile_b_{i}"
        
        # Same person, slight variations
        base_name = f"{random.choice(['John', 'Jane', 'Mike'])} {random.choice(['Doe', 'Smith'])}"
        base_phone = f"+91{random.randint(9000000000, 9999999999)}"
        base_email = f"{base_name.lower().replace(' ', '.')}@example.com"
        
        profile_a, identifiers_a = generate_synthetic_profile(
            profile_id_a, base_name, base_phone, base_email
        )
        
        # Profile B: same person, slight name variation or different email
        if random.random() > 0.5:
            # Same name, different email
            profile_b, identifiers_b = generate_synthetic_profile(
                profile_id_b, base_name, base_phone, f"{base_name.lower().replace(' ', '')}@gmail.com"
            )
        else:
            # Slight name variation, same email
            name_variation = base_name.replace('John', 'J.').replace('Jane', 'J.').replace('Mike', 'M.')
            profile_b, identifiers_b = generate_synthetic_profile(
                profile_id_b, name_variation, base_phone, base_email
            )
        
        # Extract features
        features = extract_pairwise_features(
            profile_a, profile_b, identifiers_a, identifiers_b
        )
        
        features['profile_a_id'] = profile_id_a
        features['profile_b_id'] = profile_id_b
        features['label'] = 1
        features['dataset_id'] = 'synthetic'
        features['created_at'] = datetime.now().isoformat()
        
        feature_rows.append(features)
    
    # Generate negative pairs (different people)
    print(f"Generating {num_negative} negative pairs...")
    for i in range(num_negative):
        profile_id_a = f"profile_neg_a_{i}"
        profile_id_b = f"profile_neg_b_{i}"
        
        profile_a, identifiers_a = generate_synthetic_profile(profile_id_a)
        profile_b, identifiers_b = generate_synthetic_profile(profile_id_b)
        
        # Extract features
        features = extract_pairwise_features(
            profile_a, profile_b, identifiers_a, identifiers_b
        )
        
        features['profile_a_id'] = profile_id_a
        features['profile_b_id'] = profile_id_b
        features['label'] = 0
        features['dataset_id'] = 'synthetic'
        features['created_at'] = datetime.now().isoformat()
        
        feature_rows.append(features)
    
    # Create DataFrame
    df = pd.DataFrame(feature_rows)
    
    print(f"\nGenerated {len(df)} synthetic pairs")
    print(f"  Positive: {len(df[df['label'] == 1])}")
    print(f"  Negative: {len(df[df['label'] == 0])}")
    
    return df


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Generate synthetic training data')
    parser.add_argument('--output', type=str, default='synthetic_training_data.parquet', help='Output file')
    parser.add_argument('--positive', type=int, default=100, help='Number of positive pairs')
    parser.add_argument('--negative', type=int, default=100, help='Number of negative pairs')
    parser.add_argument('--format', type=str, default='parquet', choices=['parquet', 'csv'], help='Output format')
    
    args = parser.parse_args()
    
    df = generate_synthetic_pairs(num_positive=args.positive, num_negative=args.negative)
    
    if args.format == 'parquet':
        df.to_parquet(args.output, index=False)
    else:
        df.to_csv(args.output, index=False)
    
    print(f"\nSaved to {args.output}")

