"""
MLflow Configuration
"""
import os

# MLflow Backend Store (PostgreSQL)
MLFLOW_BACKEND_STORE_URI = os.getenv(
    'MLFLOW_BACKEND_STORE_URI',
    'postgresql://retail_brain_user:retail_brain_pass@localhost:5432/retail_brain'
)

# MLflow Artifact Root
# For MVP: use local filesystem
# For production: use S3/GCS
MLFLOW_DEFAULT_ARTIFACT_ROOT = os.getenv(
    'MLFLOW_DEFAULT_ARTIFACT_ROOT',
    'file:/mlflow/artifacts'
)

# MLflow Tracking URI (for clients)
MLFLOW_TRACKING_URI = os.getenv(
    'MLFLOW_TRACKING_URI',
    'http://localhost:5000'
)

# Experiment names
EXPERIMENT_NAMES = {
    'identity': 'identity-resolution',
    'intent': 'intent-detection',
    'recommendation': 'recommendation-engine',
    'churn': 'churn-prediction',
    'ltv': 'ltv-prediction',
}

