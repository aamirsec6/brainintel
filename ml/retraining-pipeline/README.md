# Retraining Pipeline

Automated model retraining with scheduled and drift-based triggers.

## Features

- Scheduled retraining (configurable intervals)
- Drift-based retraining (automatic when drift detected)
- Integration with ML monitoring service
- MLflow model versioning

## Usage

```bash
# Run scheduler
python src/retrain_scheduler.py
```

## Configuration

Edit `src/retrain_scheduler.py` to configure:
- Retrain intervals per model
- Drift thresholds
- Training script paths

