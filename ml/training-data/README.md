# Training Data Generation

Pipeline to generate labeled training datasets for identity resolution ML models.

## Usage

### Generate from Real Data

```bash
cd ml/training-data
python src/generate_identity_pairs.py \
  --output training_data.parquet \
  --positive-count 1000 \
  --negative-ratio 1.0 \
  --dataset-id dataset_20241209
```

### Generate Synthetic Data (for testing)

```bash
python src/synthetic_generator.py \
  --output synthetic_data.parquet \
  --positive 100 \
  --negative 100
```

## Output Format

The generated dataset contains:
- Feature columns (phone_exact, email_exact, name_sim, etc.)
- `profile_a_id`: First profile ID
- `profile_b_id`: Second profile ID
- `label`: 1 for positive (match), 0 for negative (no match)
- `dataset_id`: Dataset version identifier
- `created_at`: Timestamp

## Positive Pairs

Extracted from `identity_merge_log` where:
- `merge_type IN ('auto', 'manual')`
- `rolled_back = false`
- `confidence_score >= 0.80`

## Negative Pairs

Two types:
1. **Random negatives**: Randomly selected non-matching profiles
2. **Time-based negatives**: Profiles created far apart in time (>365 days)

