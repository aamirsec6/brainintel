# Feature Engineering

Reproducible feature engineering functions for identity pairwise matching.

## Features Extracted

1. **phone_exact** (boolean): Exact phone number match
2. **email_exact** (boolean): Exact email match
3. **email_username_sim** (float 0-1): Email username similarity
4. **name_sim** (float 0-1): Name similarity (Levenshtein)
5. **device_overlap** (boolean): Device ID match
6. **address_sim** (float 0-1): Address similarity (Jaccard)
7. **common_orders_count** (integer): Number of common purchased products
8. **time_gap_days** (float): Days between first_seen_at
9. **loyalty_id_match** (boolean): Loyalty ID match
10. **city_match** (boolean): City match
11. **state_match** (boolean): State match

## Usage

```python
from src.identity_features import extract_pairwise_features

features = extract_pairwise_features(
    profile_a, profile_b, identifiers_a, identifiers_b, events_a, events_b
)
```

## Testing

```bash
cd ml/feature-engineering
python -m pytest tests/test_features.py
```

