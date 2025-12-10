# Embedding Pipeline

Batch and incremental embedding generation using SentenceTransformers.

## Model

- **Model**: `all-mpnet-base-v2` (default)
- **Dimension**: 768
- **Usage**: Profile and event embeddings for semantic search

## Usage

### Batch Generation

```bash
# Generate embeddings for all profiles
python src/generate_embeddings.py --profiles

# Generate embeddings for events
python src/generate_embeddings.py --events

# Generate all embeddings
python src/generate_embeddings.py --all

# Limit number of records
python src/generate_embeddings.py --profiles --limit 1000
```

### Incremental Updates

```bash
# Update specific profile
python src/update_profile_embeddings.py --profile-id <uuid>

# Update profiles since timestamp
python src/update_profile_embeddings.py --since "2024-12-01T00:00:00Z"
```

## Installation

```bash
pip install -r requirements.txt
```

## Configuration

Set environment variables:
- `EMBEDDING_MODEL`: Model name (default: all-mpnet-base-v2)
- `POSTGRES_HOST`, `POSTGRES_PORT`, etc.: Database connection

