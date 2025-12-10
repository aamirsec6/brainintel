"""
Intent Detection Model Training
Trains classifier for WhatsApp message intent detection
Uses embeddings + LightGBM classifier
"""
import os
import sys
import yaml
import pandas as pd
import numpy as np
import lightgbm as lgb
from sentence_transformers import SentenceTransformer
from sklearn.model_selection import train_test_split
from sklearn.metrics import f1_score, precision_score, recall_score, confusion_matrix, classification_report
from sklearn.preprocessing import LabelEncoder
import mlflow
import mlflow.lightgbm
import hashlib
from datetime import datetime
from dotenv import load_dotenv
from pathlib import Path
from typing import Optional

load_dotenv()

# Set random seeds
np.random.seed(42)
import random
random.seed(42)


class IntentModelTrainer:
    """Train intent detection model"""
    
    def __init__(self, config_path: str = 'config.yaml'):
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)
        
        mlflow.set_tracking_uri(self.config['mlflow']['tracking_uri'])
        mlflow.set_experiment(self.config['mlflow']['experiment_name'])
        
        self.embedding_model = None
        self.label_encoder = LabelEncoder()
    
    def load_data(self, data_path: str) -> pd.DataFrame:
        """Load training data (CSV with 'text' and 'intent' columns)"""
        print(f"Loading data from {data_path}...")
        
        if data_path.endswith('.csv'):
            df = pd.read_csv(data_path)
        elif data_path.endswith('.parquet'):
            df = pd.read_parquet(data_path)
        else:
            raise ValueError(f"Unsupported format: {data_path}")
        
        # Validate columns
        if 'text' not in df.columns or 'intent' not in df.columns:
            raise ValueError("Data must have 'text' and 'intent' columns")
        
        print(f"Loaded {len(df)} samples")
        print(f"\nIntent distribution:")
        print(df['intent'].value_counts())
        
        return df

    def split_indices(self, df: pd.DataFrame):
        """Stratified split of dataset indices into train/val/test"""
        train_split = self.config['training']['train_split']
        val_split = self.config['training']['val_split']
        test_split = self.config['training']['test_split']
        seed = self.config['training']['random_seed']

        initial_indices = df.index.to_numpy()
        train_idx, temp_idx = train_test_split(
            initial_indices,
            test_size=(1 - train_split),
            stratify=df['intent'],
            random_state=seed
        )

        val_fraction = val_split / (val_split + test_split)
        val_idx, test_idx = train_test_split(
            temp_idx,
            test_size=(1 - val_fraction),
            stratify=df.loc[temp_idx, 'intent'],
            random_state=seed
        )

        return list(train_idx), list(val_idx), list(test_idx)
    
    def generate_embeddings(self, texts: list) -> np.ndarray:
        """Generate embeddings using SentenceTransformers"""
        if self.embedding_model is None:
            model_name = self.config['embedding']['model']
            print(f"Loading embedding model: {model_name}...")
            self.embedding_model = SentenceTransformer(model_name)
            print(f"✅ Embedding model loaded")
        
        print("Generating embeddings...")
        embeddings = self.embedding_model.encode(
            texts,
            batch_size=32,
            show_progress_bar=True,
            normalize_embeddings=True
        )
        
        return embeddings
    
    def train_model(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: np.ndarray,
        y_val: np.ndarray
    ) -> lgb.Booster:
        """Train LightGBM classifier"""
        print("Training LightGBM classifier...")
        
        train_data = lgb.Dataset(X_train, label=y_train)
        val_data = lgb.Dataset(X_val, label=y_val, reference=train_data)
        
        params = {
            'objective': 'multiclass',
            'num_class': len(self.label_encoder.classes_),
            'metric': 'multi_logloss',
            'boosting_type': 'gbdt',
            'num_leaves': self.config['hyperparameters']['num_leaves'],
            'learning_rate': self.config['hyperparameters']['learning_rate'],
            'n_estimators': self.config['hyperparameters']['n_estimators'],
            'verbose': -1,
            'seed': self.config['training']['random_seed']
        }
        
        model = lgb.train(
            params,
            train_data,
            num_boost_round=self.config['hyperparameters']['n_estimators'],
            valid_sets=[val_data],
            callbacks=[
                lgb.early_stopping(stopping_rounds=self.config['hyperparameters']['early_stopping_rounds']),
                lgb.log_evaluation(period=10)
            ]
        )
        
        return model
    
    def evaluate_model(
        self,
        model: lgb.Booster,
        X: np.ndarray,
        y: np.ndarray,
        channels: Optional[np.ndarray] = None
    ) -> dict:
        """Evaluate model"""
        print("Evaluating model...")
        
        y_pred_proba = model.predict(X, num_iteration=model.best_iteration)
        y_pred = np.argmax(y_pred_proba, axis=1)
        
        metrics = {
            'f1_score': f1_score(y, y_pred, average='weighted'),
            'precision': precision_score(y, y_pred, average='weighted', zero_division=0),
            'recall': recall_score(y, y_pred, average='weighted', zero_division=0),
        }
        
        # Per-class metrics
        report = classification_report(y, y_pred, target_names=self.label_encoder.classes_, output_dict=True)
        
        # Confusion matrix
        cm = confusion_matrix(y, y_pred)
        metrics['confusion_matrix'] = cm.tolist()
        
        print(f"\n  F1-Score: {metrics['f1_score']:.4f}")
        print(f"  Precision: {metrics['precision']:.4f}")
        print(f"  Recall: {metrics['recall']:.4f}")
        
        print("\n  Per-class F1:")
        for intent, class_metrics in report.items():
            if isinstance(class_metrics, dict) and 'f1-score' in class_metrics:
                print(f"    {intent}: {class_metrics['f1-score']:.4f}")
        
        if channels is not None:
            channel_metrics = {}
            for channel in np.unique(channels):
                mask = channels == channel
                if not np.any(mask):
                    continue
                y_channel = y[mask]
                y_pred_channel = y_pred[mask]
                channel_metrics[channel] = {
                    'accuracy': float(np.mean(y_channel == y_pred_channel)),
                    'f1_score': float(f1_score(y_channel, y_pred_channel, average='weighted', zero_division=0)),
                }
            metrics['per_channel'] = channel_metrics

        return metrics
    
    def train(self, data_path: Optional[str] = None, dataset_id: Optional[str] = None) -> str:
        """Complete training pipeline"""
        with mlflow.start_run() as run:
            print(f"MLflow Run ID: {run.info.run_id}")
            
            data_path = data_path or self.config.get('data', {}).get('path')
            if not data_path:
                raise ValueError("Training data path is not configured")

            # Load data
            df = self.load_data(data_path)
            
            # Generate embeddings
            embeddings = self.generate_embeddings(df['text'].tolist())
            
            # Encode labels
            y = self.label_encoder.fit_transform(df['intent'])

            # Stratified splits
            train_idx, val_idx, test_idx = self.split_indices(df)
            embeddings_array = np.array(embeddings)

            X_train = embeddings_array[np.array(train_idx, dtype=int)]
            X_val = embeddings_array[np.array(val_idx, dtype=int)]
            X_test = embeddings_array[np.array(test_idx, dtype=int)]

            y_train = y[train_idx]
            y_val = y[val_idx]
            y_test = y[test_idx]

            channels_val = df.loc[val_idx, 'channel'].to_numpy()
            channels_test = df.loc[test_idx, 'channel'].to_numpy()
            
            print(f"\nData splits:")
            print(f"  Train: {len(X_train)}")
            print(f"  Val: {len(X_val)}")
            print(f"  Test: {len(X_test)}")
            
            # Train model
            model = self.train_model(X_train, y_train, X_val, y_val)
            
            # Evaluate
            print("\nValidation Set Metrics:")
            val_metrics = self.evaluate_model(model, X_val, y_val)
            
            print("\nTest Set Metrics:")
            test_metrics = self.evaluate_model(model, X_test, y_test)
            
            # Log to MLflow
            print("\nLogging to MLflow...")
            
            mlflow.log_params(self.config['hyperparameters'])
            mlflow.log_param('embedding_model', self.config['embedding']['model'])
            mlflow.log_param('embedding_dim', self.config['embedding']['dimension'])
            mlflow.log_param('intent_classes', list(self.label_encoder.classes_))
            mlflow.log_param('train_samples', len(X_train))
            mlflow.log_param('dataset_path', data_path)
            mlflow.log_param('dataset_id', dataset_id or Path(data_path).stem)
            mlflow.log_metric('best_iteration', model.best_iteration)
            
            for metric_name, metric_value in test_metrics.items():
                if metric_name == 'per_channel':
                    continue
                if isinstance(metric_value, (int, float)):
                    mlflow.log_metric(f'test_{metric_name}', metric_value)
            if 'per_channel' in test_metrics:
                for channel, channel_metrics in test_metrics['per_channel'].items():
                    for metric_name, metric_value in channel_metrics.items():
                        mlflow.log_metric(f"test_{channel}_{metric_name}", metric_value)

            channel_counts = df['channel'].value_counts()
            for channel, count in channel_counts.items():
                mlflow.log_metric(f"channel_{channel}_samples", int(count))
            
            # Log model
            mlflow.lightgbm.log_model(
                model,
                artifact_path='models',
                registered_model_name=self.config['model']['name']
            )
            
            # Save label encoder
            import pickle
            with open('label_encoder.pkl', 'wb') as f:
                pickle.dump(self.label_encoder, f)
            mlflow.log_artifact('label_encoder.pkl', 'models')
            
            print(f"\n✅ Model registered: {self.config['model']['name']}")
            print(f"Run ID: {run.info.run_id}")
            
            return run.info.run_id


def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Train intent detection model')
    parser.add_argument('--data', type=str, required=True, help='Training data path (CSV with text, intent columns)')
    parser.add_argument('--config', type=str, default='config.yaml', help='Config file')
    parser.add_argument('--dataset-id', type=str, default=None, help='Dataset ID')
    
    args = parser.parse_args()
    
    trainer = IntentModelTrainer(config_path=args.config)
    run_id = trainer.train(args.data, dataset_id=args.dataset_id)
    
    print(f"\n✅ Training complete!")
    print(f"Run ID: {run_id}")


if __name__ == '__main__':
    from typing import Optional
    main()

