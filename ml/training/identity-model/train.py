"""
LightGBM Training Pipeline for Identity Resolution
Trains model with MLflow tracking, SHAP explainability, and evaluation
"""
import os
import sys
import yaml
import pandas as pd
import numpy as np
import lightgbm as lgb
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.metrics import (
    roc_auc_score, average_precision_score, precision_score, recall_score,
    f1_score, confusion_matrix, roc_curve, precision_recall_curve
)
import mlflow
import mlflow.lightgbm
import shap
import hashlib
import json
from datetime import datetime
from pathlib import Path
from typing import List, Tuple, Dict, Optional
from dotenv import load_dotenv
import pickle

load_dotenv()

# Set random seeds for reproducibility
np.random.seed(42)
import random
random.seed(42)


class IdentityModelTrainer:
    """Train LightGBM model for identity resolution"""
    
    def __init__(self, config_path: str = 'config.yaml'):
        """Load configuration"""
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)
        
        # Initialize MLflow
        mlflow.set_tracking_uri(self.config['mlflow']['tracking_uri'])
        mlflow.set_experiment(self.config['mlflow']['experiment_name'])
    
    def load_data(self, data_path: str) -> pd.DataFrame:
        """Load training data"""
        print(f"Loading data from {data_path}...")
        
        if data_path.endswith('.parquet'):
            df = pd.read_parquet(data_path)
        elif data_path.endswith('.csv'):
            df = pd.read_csv(data_path)
        else:
            raise ValueError(f"Unsupported file format: {data_path}")
        
        print(f"Loaded {len(df)} samples")
        print(f"  Positive: {len(df[df['label'] == 1])} ({100 * len(df[df['label'] == 1]) / len(df):.1f}%)")
        print(f"  Negative: {len(df[df['label'] == 0])} ({100 * len(df[df['label'] == 0]) / len(df):.1f}%)")
        
        return df
    
    def prepare_features(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        """Prepare features and labels"""
        # Feature columns (exclude metadata)
        exclude_cols = ['profile_a_id', 'profile_b_id', 'label', 'dataset_id', 'created_at']
        feature_cols = [col for col in df.columns if col not in exclude_cols]
        
        X = df[feature_cols].copy()
        y = df['label'].copy()
        
        # Handle missing values
        X = X.fillna(0)
        
        print(f"Features: {len(feature_cols)}")
        print(f"  {feature_cols}")
        
        return X, y, feature_cols
    
    def train_model(
        self,
        X_train: pd.DataFrame,
        y_train: pd.Series,
        X_val: pd.DataFrame,
        y_val: pd.Series,
        feature_cols: List[str]
    ) -> lgb.Booster:
        """Train LightGBM model"""
        print("Training LightGBM model...")
        
        # Prepare data
        train_data = lgb.Dataset(X_train, label=y_train, feature_name=feature_cols)
        val_data = lgb.Dataset(X_val, label=y_val, feature_name=feature_cols, reference=train_data)
        
        # Hyperparameters
        params = {
            'objective': self.config['model']['objective'],
            'metric': self.config['model']['metric'],
            'boosting_type': 'gbdt',
            'num_leaves': self.config['hyperparameters']['num_leaves'],
            'learning_rate': self.config['hyperparameters']['learning_rate'],
            'feature_fraction': self.config['hyperparameters']['feature_fraction'],
            'bagging_fraction': self.config['hyperparameters']['bagging_fraction'],
            'bagging_freq': self.config['hyperparameters']['bagging_freq'],
            'min_child_samples': self.config['hyperparameters']['min_child_samples'],
            'max_depth': self.config['hyperparameters']['max_depth'],
            'reg_alpha': self.config['hyperparameters']['reg_alpha'],
            'reg_lambda': self.config['hyperparameters']['reg_lambda'],
            'verbose': -1,
            'seed': self.config['training']['random_seed']
        }
        
        # Train
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
        X: pd.DataFrame,
        y: pd.Series,
        feature_cols: List[str]
    ) -> Dict:
        """Evaluate model and compute metrics"""
        print("Evaluating model...")
        
        # Predictions
        y_pred_proba = model.predict(X, num_iteration=model.best_iteration)
        y_pred = (y_pred_proba >= self.config['evaluation']['thresholds']['auto_merge']).astype(int)
        
        # Metrics
        metrics = {
            'roc_auc': roc_auc_score(y, y_pred_proba),
            'pr_auc': average_precision_score(y, y_pred_proba),
            'precision': precision_score(y, y_pred, zero_division=0),
            'recall': recall_score(y, y_pred, zero_division=0),
            'f1_score': f1_score(y, y_pred, zero_division=0),
        }
        
        # Precision at 0.8 threshold
        threshold_80 = self.config['evaluation']['thresholds']['auto_merge']
        y_pred_80 = (y_pred_proba >= threshold_80).astype(int)
        metrics['precision_at_80'] = precision_score(y, y_pred_80, zero_division=0)
        
        # Confusion matrix
        cm = confusion_matrix(y, y_pred)
        metrics['confusion_matrix'] = cm.tolist()
        metrics['true_positives'] = int(cm[1, 1])
        metrics['true_negatives'] = int(cm[0, 0])
        metrics['false_positives'] = int(cm[0, 1])
        metrics['false_negatives'] = int(cm[1, 0])
        
        print(f"  ROC-AUC: {metrics['roc_auc']:.4f}")
        print(f"  PR-AUC: {metrics['pr_auc']:.4f}")
        print(f"  Precision@0.8: {metrics['precision_at_80']:.4f}")
        print(f"  Recall: {metrics['recall']:.4f}")
        print(f"  F1-Score: {metrics['f1_score']:.4f}")
        
        return metrics
    
    def compute_shap_values(
        self,
        model: lgb.Booster,
        X_sample: pd.DataFrame,
        feature_cols: List[str]
    ) -> Dict:
        """Compute SHAP values for explainability"""
        print("Computing SHAP values...")
        
        # Use TreeExplainer for LightGBM
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X_sample)
        
        # Get feature importance
        feature_importance = model.feature_importance(importance_type='gain')
        feature_importance_dict = dict(zip(feature_cols, feature_importance))
        
        # Sort by importance
        sorted_importance = sorted(
            feature_importance_dict.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        print("Top 10 features by importance:")
        for feature, importance in sorted_importance[:10]:
            print(f"  {feature}: {importance:.2f}")
        
        return {
            'shap_values': shap_values.tolist() if isinstance(shap_values, np.ndarray) else shap_values,
            'feature_importance': feature_importance_dict,
            'top_features': [f[0] for f in sorted_importance[:10]]
        }
    
    def compute_dataset_hash(self, df: pd.DataFrame) -> str:
        """Compute hash of dataset for versioning"""
        df_sorted = df.sort_values(['profile_a_id', 'profile_b_id'])
        data_str = df_sorted.to_string()
        return hashlib.sha256(data_str.encode()).hexdigest()[:16]
    
    def train(
        self,
        data_path: str,
        dataset_id: Optional[str] = None
    ) -> str:
        """
        Complete training pipeline
        
        Returns:
            Model version/run_id
        """
        # Start MLflow run
        with mlflow.start_run() as run:
            print(f"MLflow Run ID: {run.info.run_id}")
            
            # Load data
            df = self.load_data(data_path)
            
            # Compute dataset hash
            dataset_hash = self.compute_dataset_hash(df)
            if dataset_id:
                dataset_hash = dataset_id
            
            # Prepare features
            X, y, feature_cols = self.prepare_features(df)
            
            # Split data
            train_split = self.config['training']['train_split']
            val_split = self.config['training']['val_split']
            test_split = self.config['training']['test_split']
            
            X_train, X_temp, y_train, y_temp = train_test_split(
                X, y,
                test_size=(1 - train_split),
                random_state=self.config['training']['random_seed'],
                stratify=y
            )
            
            val_size = val_split / (val_split + test_split)
            X_val, X_test, y_val, y_test = train_test_split(
                X_temp, y_temp,
                test_size=(1 - val_size),
                random_state=self.config['training']['random_seed'],
                stratify=y_temp
            )
            
            print(f"\nData splits:")
            print(f"  Train: {len(X_train)} ({100 * len(X_train) / len(X):.1f}%)")
            print(f"  Val: {len(X_val)} ({100 * len(X_val) / len(X):.1f}%)")
            print(f"  Test: {len(X_test)} ({100 * len(X_test) / len(X):.1f}%)")
            
            # Train model
            model = self.train_model(X_train, y_train, X_val, y_val, feature_cols)
            
            # Evaluate on validation set
            print("\nValidation Set Metrics:")
            val_metrics = self.evaluate_model(model, X_val, y_val, feature_cols)
            
            # Evaluate on test set
            print("\nTest Set Metrics:")
            test_metrics = self.evaluate_model(model, X_test, y_test, feature_cols)
            
            # Compute SHAP values (on sample)
            sample_size = min(100, len(X_test))
            X_sample = X_test.sample(n=sample_size, random_state=42)
            shap_results = self.compute_shap_values(model, X_sample, feature_cols)
            
            # Log to MLflow
            print("\nLogging to MLflow...")
            
            # Log parameters
            mlflow.log_params(self.config['hyperparameters'])
            mlflow.log_param('dataset_hash', dataset_hash)
            mlflow.log_param('dataset_id', dataset_id or 'unknown')
            mlflow.log_param('feature_count', len(feature_cols))
            mlflow.log_param('train_samples', len(X_train))
            mlflow.log_param('val_samples', len(X_val))
            mlflow.log_param('test_samples', len(X_test))
            
            # Log metrics
            for metric_name, metric_value in test_metrics.items():
                if isinstance(metric_value, (int, float)):
                    mlflow.log_metric(f'test_{metric_name}', metric_value)
            
            for metric_name, metric_value in val_metrics.items():
                if isinstance(metric_value, (int, float)):
                    mlflow.log_metric(f'val_{metric_name}', metric_value)
            
            # Log model
            mlflow.lightgbm.log_model(
                model,
                artifact_path=self.config['mlflow']['artifact_path'],
                registered_model_name=self.config['model']['name']
            )
            
            # Log SHAP explainer
            explainer = shap.TreeExplainer(model)
            with open('shap_explainer.pkl', 'wb') as f:
                pickle.dump(explainer, f)
            mlflow.log_artifact('shap_explainer.pkl', 'explainability')
            
            # Log feature importance
            importance_path = 'feature_importance.json'
            with open(importance_path, 'w') as f:
                json.dump(shap_results['feature_importance'], f, indent=2)
            mlflow.log_artifact(importance_path, 'explainability')
            
            # Log config
            mlflow.log_artifact(config_path, 'config')
            
            print(f"\nModel registered: {self.config['model']['name']}")
            print(f"Run ID: {run.info.run_id}")
            
            return run.info.run_id


def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Train identity resolution model')
    parser.add_argument('--data', type=str, required=True, help='Training data path')
    parser.add_argument('--config', type=str, default='config.yaml', help='Config file path')
    parser.add_argument('--dataset-id', type=str, default=None, help='Dataset ID for versioning')
    
    args = parser.parse_args()
    
    # Train
    trainer = IdentityModelTrainer(config_path=args.config)
    run_id = trainer.train(args.data, dataset_id=args.dataset_id)
    
    print(f"\n✅ Training complete!")
    print(f"Run ID: {run_id}")
    print(f"View in MLflow: {trainer.config['mlflow']['tracking_uri']}")


if __name__ == '__main__':
    main()

