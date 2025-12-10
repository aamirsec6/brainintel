"""
Identity Scorer Service
Loads model from MLflow and provides scoring
"""
import mlflow
import mlflow.lightgbm
import pandas as pd
import numpy as np
from typing import Dict, Tuple, Optional
import os
from dotenv import load_dotenv

load_dotenv()


class IdentityScorer:
    """Identity resolution model scorer"""
    
    def __init__(self):
        self.model = None
        self.model_version = None
        self.feature_cols = None
        self._load_model()
    
    def _load_model(self):
        """Load latest model from MLflow"""
        try:
            mlflow.set_tracking_uri(os.getenv('MLFLOW_TRACKING_URI', 'http://localhost:5000'))
            
            # Get latest model version
            client = mlflow.tracking.MlflowClient()
            model_name = os.getenv('ML_MODEL_NAME', 'identity-resolution')
            
            try:
                latest_version = client.get_latest_versions(model_name, stages=["Production", "Staging", "None"])
                if latest_version:
                    model_version = latest_version[0].version
                    model_uri = f"models:/{model_name}/{model_version}"
                else:
                    # Fallback: get latest run
                    experiment = mlflow.get_experiment_by_name("identity-resolution")
                    if experiment:
                        runs = mlflow.search_runs(experiment_ids=[experiment.experiment_id], order_by=["start_time DESC"], max_results=1)
                        if not runs.empty:
                            run_id = runs.iloc[0]['run_id']
                            model_uri = f"runs:/{run_id}/models"
                            model_version = run_id
                        else:
                            raise ValueError("No model runs found")
                    else:
                        raise ValueError("Experiment not found")
            except Exception:
                # Fallback: use latest run
                experiment = mlflow.get_experiment_by_name("identity-resolution")
                if experiment:
                    runs = mlflow.search_runs(experiment_ids=[experiment.experiment_id], order_by=["start_time DESC"], max_results=1)
                    if not runs.empty:
                        run_id = runs.iloc[0]['run_id']
                        model_uri = f"runs:/{run_id}/models"
                        model_version = run_id
                    else:
                        raise ValueError("No model runs found")
                else:
                    raise ValueError("Experiment not found")
            
            # Load model
            self.model = mlflow.lightgbm.load_model(model_uri)
            self.model_version = model_version
            
            # Get feature columns from model
            self.feature_cols = self.model.feature_name()
            
            print(f"Loaded model version: {model_version}")
            print(f"Features: {len(self.feature_cols)}")
        
        except Exception as e:
            print(f"Warning: Failed to load ML model: {e}")
            print("Falling back to rule-based scoring")
            self.model = None
            self.model_version = "rule-based"
    
    def score(self, features: Dict) -> Tuple[float, str]:
        """
        Score a pair of profiles
        
        Args:
            features: Dictionary of feature values
        
        Returns:
            Tuple of (score, model_version)
        """
        if self.model is None:
            # Fallback to rule-based (weighted sum)
            score = (
                0.6 * features.get('phone_exact', 0) +
                0.4 * features.get('email_exact', 0) +
                0.3 * features.get('name_sim', 0) +
                0.4 * features.get('device_overlap', 0) +
                0.2 * min(features.get('common_orders_count', 0) / 5, 1.0)
            )
            return float(score), "rule-based"
        
        # Prepare features DataFrame
        feature_df = pd.DataFrame([features])
        
        # Ensure all feature columns are present
        for col in self.feature_cols:
            if col not in feature_df.columns:
                feature_df[col] = 0
        
        # Select only model features in correct order
        X = feature_df[self.feature_cols]
        
        # Predict
        score = self.model.predict(X, num_iteration=self.model.best_iteration)[0]
        
        return float(score), self.model_version

