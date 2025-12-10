"""
Churn and LTV Prediction Scorer
Loads and scores churn/LTV models from MLflow
"""
import mlflow
import mlflow.lightgbm
import os
from typing import Dict, Optional, Tuple
import pandas as pd

class ChurnLTVScorer:
    """Scores churn and LTV predictions"""
    
    def __init__(self):
        self.churn_model = None
        self.ltv_model = None
        self.churn_model_version = "not_loaded"
        self.ltv_model_version = "not_loaded"
        self._load_models()
    
    def _load_models(self):
        """Load churn and LTV models from MLflow"""
        mlflow.set_tracking_uri(os.getenv('MLFLOW_TRACKING_URI', 'http://localhost:5001'))
        client = mlflow.tracking.MlflowClient()
        
        # Load churn model
        try:
            churn_model_name = os.getenv('CHURN_MODEL_NAME', 'churn-prediction')
            latest_churn = client.get_latest_versions(churn_model_name, stages=["Production", "Staging", "None"])
            if latest_churn:
                model_uri = f"models:/{churn_model_name}/{latest_churn[0].version}"
                self.churn_model = mlflow.lightgbm.load_model(model_uri)
                self.churn_model_version = latest_churn[0].version
                print(f"✅ Churn model loaded: {model_uri}")
            else:
                print("⚠️  Churn model not found in MLflow")
        except Exception as e:
            print(f"⚠️  Failed to load churn model: {e}")
        
        # Load LTV model
        try:
            ltv_model_name = os.getenv('LTV_MODEL_NAME', 'ltv-prediction')
            latest_ltv = client.get_latest_versions(ltv_model_name, stages=["Production", "Staging", "None"])
            if latest_ltv:
                model_uri = f"models:/{ltv_model_name}/{latest_ltv[0].version}"
                self.ltv_model = mlflow.lightgbm.load_model(model_uri)
                self.ltv_model_version = latest_ltv[0].version
                print(f"✅ LTV model loaded: {model_uri}")
            else:
                print("⚠️  LTV model not found in MLflow")
        except Exception as e:
            print(f"⚠️  Failed to load LTV model: {e}")
    
    def predict_churn(self, profile_features: Dict) -> Tuple[float, str]:
        """Predict churn probability for a profile"""
        if self.churn_model is None:
            # Fallback: simple heuristic based on last_seen_at
            return 0.1, "fallback"
        
        try:
            # Convert features to DataFrame
            # For MVP, use simple features from profile
            features_df = pd.DataFrame([{
                'total_orders': profile_features.get('total_orders', 0),
                'total_spent': profile_features.get('total_spent', 0),
                'avg_order_value': profile_features.get('avg_order_value', 0),
                'days_since_last_purchase': profile_features.get('days_since_last_purchase', 0),
                'days_since_first_seen': profile_features.get('days_since_first_seen', 0),
            }])
            
            # Predict
            proba = self.churn_model.predict_proba(features_df)
            churn_prob = float(proba[0][1]) if len(proba[0]) > 1 else float(proba[0][0])
            
            return churn_prob, self.churn_model_version
        except Exception as e:
            print(f"Error predicting churn: {e}")
            return 0.1, "error"
    
    def predict_ltv(self, profile_features: Dict) -> Tuple[float, str]:
        """Predict LTV for a profile"""
        if self.ltv_model is None:
            # Fallback: use current total_spent * 1.5
            current_ltv = profile_features.get('total_spent', 0)
            return float(current_ltv * 1.5), "fallback"
        
        try:
            # Convert features to DataFrame
            features_df = pd.DataFrame([{
                'total_orders': profile_features.get('total_orders', 0),
                'total_spent': profile_features.get('total_spent', 0),
                'avg_order_value': profile_features.get('avg_order_value', 0),
                'days_since_first_seen': profile_features.get('days_since_first_seen', 0),
                'days_since_last_purchase': profile_features.get('days_since_last_purchase', 0),
            }])
            
            # Predict
            prediction = self.ltv_model.predict(features_df)
            predicted_ltv = float(prediction[0])
            
            return max(0, predicted_ltv), self.ltv_model_version
        except Exception as e:
            print(f"Error predicting LTV: {e}")
            current_ltv = profile_features.get('total_spent', 0)
            return float(current_ltv * 1.5), "error"

