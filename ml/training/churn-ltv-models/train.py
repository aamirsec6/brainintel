"""
Churn and LTV Prediction Models Training
Trains LightGBM models for churn prediction and LTV estimation
"""
import os
import sys
import yaml
import pandas as pd
import numpy as np
import lightgbm as lgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    roc_auc_score, precision_score, recall_score, f1_score,
    mean_squared_error, mean_absolute_error, r2_score
)
import mlflow
import mlflow.lightgbm
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

np.random.seed(42)


class ChurnLTVTrainer:
    """Train churn and LTV prediction models"""
    
    def __init__(self, config_path: str = 'config.yaml'):
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)
        
        mlflow.set_tracking_uri(self.config['mlflow']['tracking_uri'])
        mlflow.set_experiment(self.config['mlflow']['experiment_name'])
    
    def load_data(self, data_path: str) -> pd.DataFrame:
        """Load training data with features"""
        print(f"Loading data from {data_path}...")
        
        if data_path.endswith('.csv'):
            df = pd.read_csv(data_path)
        elif data_path.endswith('.parquet'):
            df = pd.read_parquet(data_path)
        else:
            raise ValueError(f"Unsupported format: {data_path}")
        
        print(f"Loaded {len(df)} samples")
        print(f"  Features: {len(df.columns)}")
        
        return df
    
    def create_churn_labels(
        self,
        df: pd.DataFrame,
        last_activity_col: str = 'last_activity_date',
        prediction_date_col: str = 'prediction_date'
    ) -> pd.Series:
        """Create churn labels (1 if churned, 0 otherwise)"""
        print("Creating churn labels...")
        
        df[last_activity_col] = pd.to_datetime(df[last_activity_col])
        df[prediction_date_col] = pd.to_datetime(df[prediction_date_col])
        
        threshold_days = self.config['models']['churn']['target_threshold_days']
        horizon_days = self.config['models']['churn']['prediction_horizon_days']
        
        # Churn if no activity for threshold_days by prediction_date + horizon
        cutoff_date = df[prediction_date_col] + timedelta(days=horizon_days)
        days_since_activity = (cutoff_date - df[last_activity_col]).dt.days
        
        labels = (days_since_activity >= threshold_days).astype(int)
        
        print(f"  Churn rate: {labels.mean():.2%}")
        print(f"  Churned: {labels.sum()}")
        print(f"  Active: {(1 - labels).sum()}")
        
        return labels
    
    def create_ltv_labels(
        self,
        df: pd.DataFrame,
        future_revenue_col: str = 'future_revenue_365d'
    ) -> pd.Series:
        """Create LTV labels (future revenue)"""
        print("Creating LTV labels...")
        
        if future_revenue_col not in df.columns:
            raise ValueError(f"Column {future_revenue_col} not found")
        
        labels = df[future_revenue_col].fillna(0)
        
        print(f"  Mean LTV: {labels.mean():.2f}")
        print(f"  Median LTV: {labels.median():.2f}")
        print(f"  Max LTV: {labels.max():.2f}")
        
        return labels
    
    def train_churn_model(
        self,
        X_train: pd.DataFrame,
        y_train: pd.Series,
        X_val: pd.DataFrame,
        y_val: pd.Series
    ) -> lgb.Booster:
        """Train churn prediction model"""
        print("Training churn model...")
        
        train_data = lgb.Dataset(X_train, label=y_train)
        val_data = lgb.Dataset(X_val, label=y_val, reference=train_data)
        
        params = {
            'objective': 'binary',
            'metric': 'binary_logloss',
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
    
    def train_ltv_model(
        self,
        X_train: pd.DataFrame,
        y_train: pd.Series,
        X_val: pd.DataFrame,
        y_val: pd.Series
    ) -> lgb.Booster:
        """Train LTV prediction model"""
        print("Training LTV model...")
        
        train_data = lgb.Dataset(X_train, label=y_train)
        val_data = lgb.Dataset(X_val, label=y_val, reference=train_data)
        
        params = {
            'objective': 'regression',
            'metric': 'rmse',
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
    
    def evaluate_churn_model(
        self,
        model: lgb.Booster,
        X: pd.DataFrame,
        y: pd.Series
    ) -> dict:
        """Evaluate churn model"""
        print("Evaluating churn model...")
        
        y_pred_proba = model.predict(X, num_iteration=model.best_iteration)
        y_pred = (y_pred_proba >= 0.5).astype(int)
        
        metrics = {
            'auc': roc_auc_score(y, y_pred_proba),
            'precision': precision_score(y, y_pred, zero_division=0),
            'recall': recall_score(y, y_pred, zero_division=0),
            'f1_score': f1_score(y, y_pred, zero_division=0),
        }
        
        print(f"  AUC: {metrics['auc']:.4f}")
        print(f"  Precision: {metrics['precision']:.4f}")
        print(f"  Recall: {metrics['recall']:.4f}")
        print(f"  F1-Score: {metrics['f1_score']:.4f}")
        
        return metrics
    
    def evaluate_ltv_model(
        self,
        model: lgb.Booster,
        X: pd.DataFrame,
        y: pd.Series
    ) -> dict:
        """Evaluate LTV model"""
        print("Evaluating LTV model...")
        
        y_pred = model.predict(X, num_iteration=model.best_iteration)
        
        metrics = {
            'rmse': np.sqrt(mean_squared_error(y, y_pred)),
            'mae': mean_absolute_error(y, y_pred),
            'r2_score': r2_score(y, y_pred),
        }
        
        print(f"  RMSE: {metrics['rmse']:.2f}")
        print(f"  MAE: {metrics['mae']:.2f}")
        print(f"  R²: {metrics['r2_score']:.4f}")
        
        return metrics
    
    def train(self, data_path: str, model_type: str = 'both') -> dict:
        """Complete training pipeline"""
        results = {}
        
        # Load data
        df = self.load_data(data_path)
        
        # Prepare features (exclude target columns)
        feature_cols = [col for col in df.columns 
                        if col not in ['profile_id', 'churn_label', 'ltv_label', 
                                      'last_activity_date', 'prediction_date', 'future_revenue_365d']]
        X = df[feature_cols]
        
        # Train churn model
        if model_type in ['both', 'churn']:
            with mlflow.start_run(run_name='churn-model') as run:
                print(f"\n{'='*60}")
                print("CHURN MODEL TRAINING")
                print(f"{'='*60}")
                
                y_churn = self.create_churn_labels(df)
                
                # Split
                train_split = self.config['training']['train_split']
                val_split = self.config['training']['val_split']
                test_split = self.config['training']['test_split']
                
                X_train, X_temp, y_train, y_temp = train_test_split(
                    X, y_churn,
                    test_size=(1 - train_split),
                    random_state=self.config['training']['random_seed'],
                    stratify=y_churn
                )
                
                val_size = val_split / (val_split + test_split)
                X_val, X_test, y_val, y_test = train_test_split(
                    X_temp, y_temp,
                    test_size=(1 - val_size),
                    random_state=self.config['training']['random_seed'],
                    stratify=y_temp
                )
                
                # Train
                model = self.train_churn_model(X_train, y_train, X_val, y_val)
                
                # Evaluate
                val_metrics = self.evaluate_churn_model(model, X_val, y_val)
                test_metrics = self.evaluate_churn_model(model, X_test, y_test)
                
                # Log to MLflow
                mlflow.log_params(self.config['hyperparameters'])
                mlflow.log_param('model_type', 'churn')
                mlflow.log_param('target_threshold_days', self.config['models']['churn']['target_threshold_days'])
                
                for metric_name, metric_value in test_metrics.items():
                    mlflow.log_metric(f'test_{metric_name}', metric_value)
                
                mlflow.lightgbm.log_model(
                    model,
                    artifact_path='models',
                    registered_model_name=self.config['models']['churn']['name']
                )
                
                results['churn'] = {
                    'run_id': run.info.run_id,
                    'metrics': test_metrics
                }
                
                print(f"\n✅ Churn model registered: {self.config['models']['churn']['name']}")
        
        # Train LTV model
        if model_type in ['both', 'ltv']:
            with mlflow.start_run(run_name='ltv-model') as run:
                print(f"\n{'='*60}")
                print("LTV MODEL TRAINING")
                print(f"{'='*60}")
                
                y_ltv = self.create_ltv_labels(df)
                
                # Split
                X_train, X_temp, y_train, y_temp = train_test_split(
                    X, y_ltv,
                    test_size=(1 - train_split),
                    random_state=self.config['training']['random_seed']
                )
                
                X_val, X_test, y_val, y_test = train_test_split(
                    X_temp, y_temp,
                    test_size=(1 - val_size),
                    random_state=self.config['training']['random_seed']
                )
                
                # Train
                model = self.train_ltv_model(X_train, y_train, X_val, y_val)
                
                # Evaluate
                val_metrics = self.evaluate_ltv_model(model, X_val, y_val)
                test_metrics = self.evaluate_ltv_model(model, X_test, y_test)
                
                # Log to MLflow
                mlflow.log_params(self.config['hyperparameters'])
                mlflow.log_param('model_type', 'ltv')
                mlflow.log_param('prediction_horizon_days', self.config['models']['ltv']['prediction_horizon_days'])
                
                for metric_name, metric_value in test_metrics.items():
                    mlflow.log_metric(f'test_{metric_name}', metric_value)
                
                mlflow.lightgbm.log_model(
                    model,
                    artifact_path='models',
                    registered_model_name=self.config['models']['ltv']['name']
                )
                
                results['ltv'] = {
                    'run_id': run.info.run_id,
                    'metrics': test_metrics
                }
                
                print(f"\n✅ LTV model registered: {self.config['models']['ltv']['name']}")
        
        return results


def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Train churn and LTV models')
    parser.add_argument('--data', type=str, required=True, help='Training data path')
    parser.add_argument('--config', type=str, default='config.yaml', help='Config file')
    parser.add_argument('--model', type=str, default='both', choices=['both', 'churn', 'ltv'], help='Model to train')
    
    args = parser.parse_args()
    
    trainer = ChurnLTVTrainer(config_path=args.config)
    results = trainer.train(args.data, model_type=args.model)
    
    print(f"\n✅ Training complete!")
    print(f"Results: {results}")


if __name__ == '__main__':
    main()

