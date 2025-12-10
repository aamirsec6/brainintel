"""
SHAP Explainer Service
Provides explainability for ML model predictions
"""
try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False
import pandas as pd
import numpy as np
from typing import Dict, List, Optional
import os
import pickle
import mlflow
from dotenv import load_dotenv

load_dotenv()


class ExplainerService:
    """SHAP explainer service"""
    
    def __init__(self):
        self.explainer = None
        self.model = None
        self._load_explainer()
    
    def _load_explainer(self):
        """Load SHAP explainer from MLflow"""
        try:
            mlflow.set_tracking_uri(os.getenv('MLFLOW_TRACKING_URI', 'http://localhost:5000'))
            
            # Try to load explainer from latest run
            experiment = mlflow.get_experiment_by_name("identity-resolution")
            if experiment:
                runs = mlflow.search_runs(experiment_ids=[experiment.experiment_id], order_by=["start_time DESC"], max_results=1)
                if not runs.empty:
                    run_id = runs.iloc[0]['run_id']
                    
                    # Download explainer artifact
                    client = mlflow.tracking.MlflowClient()
                    artifact_path = f"runs:/{run_id}/explainability/shap_explainer.pkl"
                    
                    try:
                        local_path = mlflow.artifacts.download_artifacts(artifact_path)
                        with open(local_path, 'rb') as f:
                            self.explainer = pickle.load(f)
                        
                        # Also load model for TreeExplainer
                        model_uri = f"runs:/{run_id}/models"
                        self.model = mlflow.lightgbm.load_model(model_uri)
                        
                        print("Loaded SHAP explainer")
                    except Exception as e:
                        print(f"Could not load SHAP explainer: {e}")
                        # Create new explainer
                        self._create_explainer()
        except Exception as e:
            print(f"Warning: Failed to load explainer: {e}")
            self._create_explainer()
    
    def _create_explainer(self):
        """Create new SHAP explainer from model"""
        try:
            if self.model:
                self.explainer = shap.TreeExplainer(self.model)
            else:
                # Load model first
                mlflow.set_tracking_uri(os.getenv('MLFLOW_TRACKING_URI', 'http://localhost:5000'))
                experiment = mlflow.get_experiment_by_name("identity-resolution")
                if experiment:
                    runs = mlflow.search_runs(experiment_ids=[experiment.experiment_id], order_by=["start_time DESC"], max_results=1)
                    if not runs.empty:
                        run_id = runs.iloc[0]['run_id']
                        model_uri = f"runs:/{run_id}/models"
                        self.model = mlflow.lightgbm.load_model(model_uri)
                        self.explainer = shap.TreeExplainer(self.model)
        except Exception as e:
            print(f"Could not create explainer: {e}")
            self.explainer = None
    
    def explain(self, features: Dict) -> Dict:
        """
        Generate SHAP explanation for features
        
        Args:
            features: Dictionary of feature values
        
        Returns:
            Explanation dictionary with feature contributions
        """
        if self.explainer is None or self.model is None:
            # Fallback: return feature importance based on rule weights
            return {
                "method": "rule-based",
                "feature_contributions": {
                    "phone_exact": features.get('phone_exact', 0) * 0.6,
                    "email_exact": features.get('email_exact', 0) * 0.4,
                    "name_sim": features.get('name_sim', 0) * 0.3,
                    "device_overlap": features.get('device_overlap', 0) * 0.4,
                    "common_orders_count": min(features.get('common_orders_count', 0) / 5, 1.0) * 0.2,
                }
            }
        
        # Prepare features DataFrame
        feature_df = pd.DataFrame([features])
        feature_cols = self.model.feature_name()
        
        # Ensure all features are present
        for col in feature_cols:
            if col not in feature_df.columns:
                feature_df[col] = 0
        
        X = feature_df[feature_cols]
        
        # Compute SHAP values
        shap_values = self.explainer.shap_values(X)
        
        # Get feature importance
        if isinstance(shap_values, list):
            shap_values = shap_values[1]  # For binary classification, use positive class
        
        # Create explanation
        feature_contributions = {}
        for i, col in enumerate(feature_cols):
            feature_contributions[col] = float(shap_values[0][i])
        
        # Sort by absolute contribution
        sorted_contributions = sorted(
            feature_contributions.items(),
            key=lambda x: abs(x[1]),
            reverse=True
        )
        
        return {
            "method": "shap",
            "feature_contributions": feature_contributions,
            "top_contributors": [
                {"feature": feat, "contribution": contrib}
                for feat, contrib in sorted_contributions[:10]
            ],
            "base_value": float(self.explainer.expected_value[1] if isinstance(self.explainer.expected_value, list) else self.explainer.expected_value)
        }

