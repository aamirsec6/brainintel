# Identity Resolution Model Training

LightGBM training pipeline for identity resolution with MLflow integration, SHAP explainability, and comprehensive evaluation.

## Usage

### Train Model

```bash
cd ml/training/identity-model

# Train with real data
python train.py \
  --data ../../training-data/training_data.parquet \
  --config config.yaml \
  --dataset-id dataset_20241209
```

### Train with Synthetic Data (for testing)

```bash
# First generate synthetic data
cd ../../training-data
python src/synthetic_generator.py --output synthetic_data.parquet --positive 200 --negative 200

# Then train
cd ../identity-model
python train.py --data ../../training-data/synthetic_data.parquet
```

## Configuration

Edit `config.yaml` to adjust:
- Hyperparameters (learning rate, num_leaves, etc.)
- Training splits (train/val/test)
- Evaluation thresholds
- MLflow settings

## Output

- Model artifact registered in MLflow
- SHAP explainer for feature importance
- Evaluation metrics (ROC-AUC, PR-AUC, Precision@0.8, etc.)
- Feature importance rankings

## Metrics

Target metrics:
- **ROC-AUC**: ≥ 0.95
- **Precision@0.8**: > 0.90
- **Rollback rate**: < 2%

## Docker

```bash
docker build -t identity-model-trainer .
docker run -v $(pwd)/data:/app/data identity-model-trainer \
  python train.py --data /app/data/training_data.parquet
```

