"""
Identity Pairwise Feature Engineering
Extracts features for ML model training from profile pairs
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
from Levenshtein import distance as levenshtein_distance
import hashlib
import json


def normalize_phone(phone: Optional[str]) -> Optional[str]:
    """Normalize phone number (remove spaces, dashes, etc.)"""
    if not phone:
        return None
    return ''.join(filter(str.isdigit, phone))


def normalize_email(email: Optional[str]) -> Optional[str]:
    """Normalize email (lowercase, strip whitespace)"""
    if not email:
        return None
    return email.lower().strip()


def extract_email_username(email: Optional[str]) -> Optional[str]:
    """Extract username part from email"""
    if not email:
        return None
    parts = email.split('@')
    return parts[0] if len(parts) > 0 else None


def compute_name_similarity(name_a: Optional[str], name_b: Optional[str]) -> float:
    """Compute normalized Levenshtein similarity between names"""
    if not name_a or not name_b:
        return 0.0
    
    name_a = name_a.lower().strip()
    name_b = name_b.lower().strip()
    
    if name_a == name_b:
        return 1.0
    
    max_len = max(len(name_a), len(name_b))
    if max_len == 0:
        return 0.0
    
    distance = levenshtein_distance(name_a, name_b)
    similarity = 1.0 - (distance / max_len)
    return max(0.0, similarity)


def compute_email_username_similarity(
    email_a: Optional[str], 
    email_b: Optional[str]
) -> float:
    """Compute similarity between email usernames"""
    username_a = extract_email_username(email_a)
    username_b = extract_email_username(email_b)
    
    if not username_a or not username_b:
        return 0.0
    
    return compute_name_similarity(username_a, username_b)


def compute_address_similarity(
    address_a: Optional[Dict], 
    address_b: Optional[Dict]
) -> float:
    """Compute Jaccard similarity on normalized address components"""
    if not address_a or not address_b:
        return 0.0
    
    # Extract address components
    components_a = set()
    components_b = set()
    
    for key in ['street', 'city', 'state', 'postal_code', 'country']:
        if key in address_a and address_a[key]:
            components_a.add(str(address_a[key]).lower().strip())
        if key in address_b and address_b[key]:
            components_b.add(str(address_b[key]).lower().strip())
    
    if not components_a or not components_b:
        return 0.0
    
    intersection = len(components_a & components_b)
    union = len(components_a | components_b)
    
    if union == 0:
        return 0.0
    
    return intersection / union


def hash_identifier(value: Optional[str]) -> Optional[str]:
    """SHA256 hash of identifier (for exact matching)"""
    if not value:
        return None
    return hashlib.sha256(value.encode('utf-8')).hexdigest()


def extract_pairwise_features(
    profile_a: Dict,
    profile_b: Dict,
    identifiers_a: List[Dict],
    identifiers_b: List[Dict],
    events_a: Optional[List[Dict]] = None,
    events_b: Optional[List[Dict]] = None
) -> Dict[str, float]:
    """
    Extract pairwise features for identity matching
    
    Args:
        profile_a: Profile A data (name, etc.)
        profile_b: Profile B data
        identifiers_a: List of identifiers for profile A
        identifiers_b: List of identifiers for profile B
        events_a: Optional events for profile A
        events_b: Optional events for profile B
    
    Returns:
        Dictionary of feature names and values
    """
    features = {}
    
    # Extract identifier hashes
    phone_hash_a = None
    email_hash_a = None
    device_hash_a = None
    loyalty_hash_a = None
    
    phone_hash_b = None
    email_hash_b = None
    device_hash_b = None
    loyalty_hash_b = None
    
    phone_a = None
    email_a = None
    device_a = None
    
    phone_b = None
    email_b = None
    device_b = None
    
    for ident in identifiers_a:
        ident_type = ident.get('type')
        ident_value = ident.get('value')
        
        if ident_type == 'phone':
            phone_hash_a = ident.get('value_hash')
            phone_a = ident_value
        elif ident_type == 'email':
            email_hash_a = ident.get('value_hash')
            email_a = ident_value
        elif ident_type == 'device':
            device_hash_a = ident.get('value_hash')
            device_a = ident_value
        elif ident_type == 'loyalty_id':
            loyalty_hash_a = ident.get('value_hash')
    
    for ident in identifiers_b:
        ident_type = ident.get('type')
        ident_value = ident.get('value')
        
        if ident_type == 'phone':
            phone_hash_b = ident.get('value_hash')
            phone_b = ident_value
        elif ident_type == 'email':
            email_hash_b = ident.get('value_hash')
            email_b = ident_value
        elif ident_type == 'device':
            device_hash_b = ident.get('value_hash')
            device_b = ident_value
        elif ident_type == 'loyalty_id':
            loyalty_hash_b = ident.get('value_hash')
    
    # Feature 1: Phone exact match
    features['phone_exact'] = 1.0 if phone_hash_a and phone_hash_b and phone_hash_a == phone_hash_b else 0.0
    
    # Feature 2: Email exact match
    features['email_exact'] = 1.0 if email_hash_a and email_hash_b and email_hash_a == email_hash_b else 0.0
    
    # Feature 3: Email username similarity
    features['email_username_sim'] = compute_email_username_similarity(email_a, email_b)
    
    # Feature 4: Name similarity
    name_a = profile_a.get('full_name') or f"{profile_a.get('first_name', '')} {profile_a.get('last_name', '')}".strip()
    name_b = profile_b.get('full_name') or f"{profile_b.get('first_name', '')} {profile_b.get('last_name', '')}".strip()
    features['name_sim'] = compute_name_similarity(name_a, name_b)
    
    # Feature 5: Device overlap
    features['device_overlap'] = 1.0 if device_hash_a and device_hash_b and device_hash_a == device_hash_b else 0.0
    
    # Feature 6: Loyalty ID match
    features['loyalty_id_match'] = 1.0 if loyalty_hash_a and loyalty_hash_b and loyalty_hash_a == loyalty_hash_b else 0.0
    
    # Feature 7: Address similarity (if available)
    address_a = profile_a.get('address')  # Assuming address is stored as JSON
    address_b = profile_b.get('address')
    features['address_sim'] = compute_address_similarity(address_a, address_b)
    
    # Feature 8: Common orders count
    common_orders = 0
    if events_a and events_b:
        skus_a = set()
        skus_b = set()
        
        for event in events_a:
            if event.get('event_type') == 'purchase' and event.get('sku'):
                skus_a.add(event['sku'])
        
        for event in events_b:
            if event.get('event_type') == 'purchase' and event.get('sku'):
                skus_b.add(event['sku'])
        
        common_orders = len(skus_a & skus_b)
    
    features['common_orders_count'] = float(common_orders)
    
    # Feature 9: Time gap (days between first_seen_at)
    time_gap_days = 0.0
    first_seen_a = profile_a.get('first_seen_at')
    first_seen_b = profile_b.get('first_seen_at')
    
    if first_seen_a and first_seen_b:
        try:
            from datetime import datetime
            if isinstance(first_seen_a, str):
                first_seen_a = datetime.fromisoformat(first_seen_a.replace('Z', '+00:00'))
            if isinstance(first_seen_b, str):
                first_seen_b = datetime.fromisoformat(first_seen_b.replace('Z', '+00:00'))
            
            time_diff = abs((first_seen_a - first_seen_b).total_seconds())
            time_gap_days = time_diff / (24 * 3600)
        except Exception:
            time_gap_days = 0.0
    
    features['time_gap_days'] = time_gap_days
    
    # Feature 10: City match
    city_a = profile_a.get('city', '').lower().strip() if profile_a.get('city') else ''
    city_b = profile_b.get('city', '').lower().strip() if profile_b.get('city') else ''
    features['city_match'] = 1.0 if city_a and city_b and city_a == city_b else 0.0
    
    # Feature 11: State match
    state_a = profile_a.get('state', '').lower().strip() if profile_a.get('state') else ''
    state_b = profile_b.get('state', '').lower().strip() if profile_b.get('state') else ''
    features['state_match'] = 1.0 if state_a and state_b and state_a == state_b else 0.0
    
    return features


def extract_features_batch(
    profile_pairs: List[Tuple[Dict, Dict, List[Dict], List[Dict], Optional[List[Dict]], Optional[List[Dict]]]]
) -> pd.DataFrame:
    """
    Extract features for a batch of profile pairs
    
    Args:
        profile_pairs: List of tuples (profile_a, profile_b, identifiers_a, identifiers_b, events_a, events_b)
    
    Returns:
        DataFrame with features for each pair
    """
    feature_rows = []
    
    for pair in profile_pairs:
        profile_a, profile_b, identifiers_a, identifiers_b, events_a, events_b = pair
        features = extract_pairwise_features(
            profile_a, profile_b, identifiers_a, identifiers_b, events_a, events_b
        )
        feature_rows.append(features)
    
    return pd.DataFrame(feature_rows)


if __name__ == '__main__':
    # Example usage
    profile_a = {
        'id': 'profile-a',
        'full_name': 'John Doe',
        'first_name': 'John',
        'last_name': 'Doe',
        'city': 'Mumbai',
        'state': 'Maharashtra',
        'first_seen_at': '2024-01-01T00:00:00Z'
    }
    
    profile_b = {
        'id': 'profile-b',
        'full_name': 'John D.',
        'first_name': 'John',
        'last_name': 'D.',
        'city': 'Mumbai',
        'state': 'Maharashtra',
        'first_seen_at': '2024-01-05T00:00:00Z'
    }
    
    identifiers_a = [
        {'type': 'phone', 'value': '+919876543210', 'value_hash': hash_identifier('+919876543210')},
        {'type': 'email', 'value': 'john@example.com', 'value_hash': hash_identifier('john@example.com')}
    ]
    
    identifiers_b = [
        {'type': 'phone', 'value': '+919876543210', 'value_hash': hash_identifier('+919876543210')},
        {'type': 'email', 'value': 'john.doe@example.com', 'value_hash': hash_identifier('john.doe@example.com')}
    ]
    
    features = extract_pairwise_features(profile_a, profile_b, identifiers_a, identifiers_b)
    print("Extracted features:")
    for key, value in features.items():
        print(f"  {key}: {value}")

