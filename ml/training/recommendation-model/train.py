"""
Recommendation Model Training (LightFM)
Trains collaborative filtering model for product recommendations
"""
import os
import sys
import yaml
import pandas as pd
import numpy as np
from lightfm import LightFM
from lightfm.evaluation import precision_at_k, auc_score
from lightfm.cross_validation import random_train_test_split
from scipy.sparse import csr_matrix
import mlflow
import mlflow.pyfunc
import pickle
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

np.random.seed(42)


class RecommendationTrainer:
    """Train LightFM recommendation model"""
    
    def __init__(self, config_path: str = 'config.yaml'):
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)
        
        mlflow.set_tracking_uri(self.config['mlflow']['tracking_uri'])
        mlflow.set_experiment(self.config['mlflow']['experiment_name'])
    
    def load_interactions(self, data_path: str) -> pd.DataFrame:
        """Load user-item interactions (CSV with user_id, item_id, rating/weight)"""
        print(f"Loading interactions from {data_path}...")
        
        if data_path.endswith('.csv'):
            df = pd.read_csv(data_path)
        elif data_path.endswith('.parquet'):
            df = pd.read_parquet(data_path)
        else:
            raise ValueError(f"Unsupported format: {data_path}")
        
        # Validate columns
        required_cols = ['user_id', 'item_id']
        if not all(col in df.columns for col in required_cols):
            raise ValueError(f"Data must have {required_cols} columns")
        
        # Add rating column if not present (default to 1 for implicit feedback)
        if 'rating' not in df.columns:
            df['rating'] = 1
        
        print(f"Loaded {len(df)} interactions")
        print(f"  Users: {df['user_id'].nunique()}")
        print(f"  Items: {df['item_id'].nunique()}")
        
        return df
    
    def build_interaction_matrix(
        self,
        df: pd.DataFrame,
        user_map: dict,
        item_map: dict
    ) -> csr_matrix:
        """Build sparse interaction matrix"""
        print("Building interaction matrix...")
        
        rows = [user_map[uid] for uid in df['user_id']]
        cols = [item_map[iid] for iid in df['item_id']]
        values = df['rating'].values
        
        matrix = csr_matrix(
            (values, (rows, cols)),
            shape=(len(user_map), len(item_map))
        )
        
        print(f"  Matrix shape: {matrix.shape}")
        print(f"  Non-zero entries: {matrix.nnz}")
        
        return matrix
    
    def filter_sparse_interactions(
        self,
        df: pd.DataFrame,
        min_interactions: int
    ) -> pd.DataFrame:
        """Filter users/items with too few interactions"""
        print(f"Filtering interactions (min: {min_interactions})...")
        
        user_counts = df.groupby('user_id').size()
        item_counts = df.groupby('item_id').size()
        
        valid_users = user_counts[user_counts >= min_interactions].index
        valid_items = item_counts[item_counts >= min_interactions].index
        
        df_filtered = df[
            df['user_id'].isin(valid_users) &
            df['item_id'].isin(valid_items)
        ]
        
        print(f"  Before: {len(df)} interactions")
        print(f"  After: {len(df_filtered)} interactions")
        print(f"  Users: {df_filtered['user_id'].nunique()}")
        print(f"  Items: {df_filtered['item_id'].nunique()}")
        
        return df_filtered
    
    def train_model(
        self,
        train_matrix: csr_matrix,
        epochs: int
    ) -> LightFM:
        """Train LightFM model"""
        print(f"Training LightFM model ({epochs} epochs)...")
        
        model = LightFM(
            loss=self.config['model']['loss'],
            no_components=self.config['hyperparameters']['no_components'],
            learning_rate=self.config['hyperparameters']['learning_rate'],
            item_alpha=self.config['hyperparameters']['item_alpha'],
            user_alpha=self.config['hyperparameters']['user_alpha'],
            random_state=self.config['training']['random_seed']
        )
        
        model.fit(
            train_matrix,
            epochs=epochs,
            num_threads=4,
            verbose=True
        )
        
        return model
    
    def evaluate_model(
        self,
        model: LightFM,
        train_matrix: csr_matrix,
        test_matrix: csr_matrix,
        k: int = 10
    ) -> dict:
        """Evaluate model"""
        print("Evaluating model...")
        
        # Precision@K
        train_precision = precision_at_k(
            model,
            train_matrix,
            k=k,
            num_threads=4
        ).mean()
        
        test_precision = precision_at_k(
            model,
            test_matrix,
            train_interactions=train_matrix,
            k=k,
            num_threads=4
        ).mean()
        
        # AUC
        train_auc = auc_score(
            model,
            train_matrix,
            num_threads=4
        ).mean()
        
        test_auc = auc_score(
            model,
            test_matrix,
            train_interactions=train_matrix,
            num_threads=4
        ).mean()
        
        metrics = {
            'train_precision_at_k': float(train_precision),
            'test_precision_at_k': float(test_precision),
            'train_auc': float(train_auc),
            'test_auc': float(test_auc),
        }
        
        print(f"\n  Train Precision@{k}: {train_precision:.4f}")
        print(f"  Test Precision@{k}: {test_precision:.4f}")
        print(f"  Train AUC: {train_auc:.4f}")
        print(f"  Test AUC: {test_auc:.4f}")
        
        return metrics
    
    def train(self, data_path: str, dataset_id: Optional[str] = None) -> str:
        """Complete training pipeline"""
        with mlflow.start_run() as run:
            print(f"MLflow Run ID: {run.info.run_id}")
            
            # Load data
            df = self.load_interactions(data_path)
            
            # Filter sparse interactions
            df = self.filter_sparse_interactions(
                df,
                self.config['training']['min_interactions']
            )
            
            # Create mappings
            unique_users = df['user_id'].unique()
            unique_items = df['item_id'].unique()
            
            user_map = {uid: idx for idx, uid in enumerate(unique_users)}
            item_map = {iid: idx for idx, iid in enumerate(unique_items)}
            
            print(f"\nMappings:")
            print(f"  Users: {len(user_map)}")
            print(f"  Items: {len(item_map)}")
            
            # Build interaction matrix
            interaction_matrix = self.build_interaction_matrix(df, user_map, item_map)
            
            # Split data
            train_matrix, test_matrix = random_train_test_split(
                interaction_matrix,
                test_percentage=self.config['training']['test_split'],
                random_state=self.config['training']['random_seed']
            )
            
            print(f"\nData splits:")
            print(f"  Train: {train_matrix.nnz} interactions")
            print(f"  Test: {test_matrix.nnz} interactions")
            
            # Train model
            model = self.train_model(
                train_matrix,
                self.config['hyperparameters']['epochs']
            )
            
            # Evaluate
            metrics = self.evaluate_model(
                model,
                train_matrix,
                test_matrix,
                k=self.config['evaluation']['k']
            )
            
            # Log to MLflow
            print("\nLogging to MLflow...")
            
            mlflow.log_params(self.config['hyperparameters'])
            mlflow.log_param('model_type', self.config['model']['type'])
            mlflow.log_param('loss', self.config['model']['loss'])
            mlflow.log_param('num_users', len(user_map))
            mlflow.log_param('num_items', len(item_map))
            mlflow.log_param('train_interactions', train_matrix.nnz)
            
            for metric_name, metric_value in metrics.items():
                mlflow.log_metric(metric_name, metric_value)
            
            # Save mappings
            mappings = {
                'user_map': user_map,
                'item_map': item_map
            }
            
            with open('mappings.pkl', 'wb') as f:
                pickle.dump(mappings, f)
            
            # Log model and mappings
            mlflow.pyfunc.log_model(
                artifact_path='models',
                python_model=LightFMWrapper(model, mappings),
                registered_model_name=self.config['model']['name']
            )
            
            mlflow.log_artifact('mappings.pkl', 'models')
            
            print(f"\n✅ Model registered: {self.config['model']['name']}")
            print(f"Run ID: {run.info.run_id}")
            
            return run.info.run_id


class LightFMWrapper(mlflow.pyfunc.PythonModel):
    """MLflow wrapper for LightFM model"""
    
    def __init__(self, model, mappings):
        self.model = model
        self.mappings = mappings
        self.reverse_user_map = {v: k for k, v in mappings['user_map'].items()}
        self.reverse_item_map = {v: k for k, v in mappings['item_map'].items()}
    
    def predict(self, context, model_input):
        """Predict scores for user-item pairs"""
        # model_input should be DataFrame with 'user_id' and 'item_id' columns
        user_ids = model_input['user_id'].values
        item_ids = model_input['item_id'].values
        
        user_indices = [self.mappings['user_map'].get(uid, -1) for uid in user_ids]
        item_indices = [self.mappings['item_map'].get(iid, -1) for iid in item_ids]
        
        scores = []
        for u_idx, i_idx in zip(user_indices, item_indices):
            if u_idx >= 0 and i_idx >= 0:
                score = self.model.predict(u_idx, i_idx)
                scores.append(score)
            else:
                scores.append(0.0)
        
        return np.array(scores)


def main():
    """Main function"""
    import argparse
    from typing import Optional
    
    parser = argparse.ArgumentParser(description='Train recommendation model')
    parser.add_argument('--data', type=str, required=True, help='Interactions data path (CSV with user_id, item_id, rating)')
    parser.add_argument('--config', type=str, default='config.yaml', help='Config file')
    parser.add_argument('--dataset-id', type=str, default=None, help='Dataset ID')
    
    args = parser.parse_args()
    
    trainer = RecommendationTrainer(config_path=args.config)
    run_id = trainer.train(args.data, dataset_id=args.dataset_id)
    
    print(f"\n✅ Training complete!")
    print(f"Run ID: {run_id}")


if __name__ == '__main__':
    main()

