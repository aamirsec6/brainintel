"""
Metrics Collector Service
Collects and stores model performance metrics
"""
import psycopg2
import psycopg2.extras
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional


class MetricsCollector:
    """Collect model performance metrics"""
    
    def __init__(self):
        self.conn = None
        self._connect_db()
    
    def _connect_db(self):
        """Connect to PostgreSQL"""
        self.conn = psycopg2.connect(
            host=os.getenv('POSTGRES_HOST', 'localhost'),
            port=int(os.getenv('POSTGRES_PORT', 5432)),
            database=os.getenv('POSTGRES_DB', 'retail_brain'),
            user=os.getenv('POSTGRES_USER', 'retail_brain_user'),
            password=os.getenv('POSTGRES_PASSWORD', 'retail_brain_pass')
        )
        # Avoid lingering aborted transactions across requests
        self.conn.autocommit = True
        # Ensure table exists
        with self.conn.cursor() as cur:
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS ml_prediction_log (
                    id SERIAL PRIMARY KEY,
                    model_name TEXT NOT NULL,
                    profile_id TEXT NOT NULL,
                    features JSONB,
                    prediction DOUBLE PRECISION,
                    actual DOUBLE PRECISION,
                    predicted_at TIMESTAMPTZ DEFAULT NOW()
                );
                """
            )
    
    def log_prediction(
        self,
        model_name: str,
        profile_id: str,
        features: Dict,
        prediction: float,
        actual: Optional[float] = None
    ):
        """Log a prediction"""
        try:
            with self.conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO ml_prediction_log (model_name, profile_id, features, prediction, actual, predicted_at)
                       VALUES (%s, %s, %s::jsonb, %s, %s, NOW())""",
                    [model_name, profile_id, psycopg2.extras.Json(features), prediction, actual]
                )
        except Exception as exc:
            # Log the error for visibility
            print(f"[metrics_collector] Failed to log prediction: {exc}")
    
    def get_metrics(self, model_name: str, days: int = 7) -> Dict:
        """Get model performance metrics"""
        try:
            with self.conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                # Get predictions with actuals
                # Format interval in Python to avoid psycopg2 parameter issues with INTERVAL
                interval_str = f"{days} days"
                cur.execute(
                    """SELECT prediction, actual
                       FROM ml_prediction_log
                       WHERE model_name = %s
                         AND actual IS NOT NULL
                         AND predicted_at >= NOW() - INTERVAL %s""",
                    [model_name, interval_str]
                )
                
                rows = cur.fetchall()
                
                if not rows:
                    return {
                        'model_name': model_name,
                        'period_days': days,
                        'total_predictions': 0,
                        'metrics': {}
                    }
                
                predictions = [float(row['prediction']) for row in rows]
                actuals = [float(row['actual']) for row in rows]
                
                # Calculate metrics
                import numpy as np
                from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
                
                mse = mean_squared_error(actuals, predictions)
                mae = mean_absolute_error(actuals, predictions)
                rmse = np.sqrt(mse)
                r2 = r2_score(actuals, predictions)
                
                return {
                    'model_name': model_name,
                    'period_days': days,
                    'total_predictions': len(predictions),
                    'metrics': {
                        'mse': float(mse),
                        'mae': float(mae),
                        'rmse': float(rmse),
                        'r2': float(r2)
                    }
                }
        except Exception as e:
            return {
                'model_name': model_name,
                'error': str(e)
            }


