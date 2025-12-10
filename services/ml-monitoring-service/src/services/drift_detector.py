"""
Drift Detection Service
Detects data drift and concept drift using statistical tests
"""
import pandas as pd
import numpy as np
from scipy import stats
from typing import List, Dict, Optional
import psycopg2
import psycopg2.extras
import os
from datetime import datetime, timedelta


class DriftDetector:
    """Detect data and concept drift"""
    
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
    
    def check_drift(
        self,
        model_name: str,
        reference_data_path: Optional[str],
        current_data: List[Dict]
    ) -> Dict:
        """Check for data drift"""
        # Load reference data
        if reference_data_path:
            reference_df = pd.read_csv(reference_data_path)
        else:
            # Load from database (last training data)
            reference_df = self._load_reference_data(model_name)
        
        if reference_df.empty:
            return {
                'drift_detected': False,
                'message': 'No reference data available'
            }
        
        # Convert current data to DataFrame
        current_df = pd.DataFrame(current_data)
        
        # Check drift for each feature
        drift_metrics = {}
        drift_detected = False
        
        for col in reference_df.columns:
            if col not in current_df.columns:
                continue
            
            ref_values = reference_df[col].dropna()
            curr_values = current_df[col].dropna()
            
            if len(ref_values) == 0 or len(curr_values) == 0:
                continue
            
            # Kolmogorov-Smirnov test for continuous features
            if ref_values.dtype in ['float64', 'int64']:
                try:
                    ks_stat, p_value = stats.ks_2samp(ref_values, curr_values)
                    drift_metrics[col] = {
                        'test': 'ks',
                        'statistic': float(ks_stat),
                        'p_value': float(p_value),
                        'drift_detected': p_value < 0.05
                    }
                    if p_value < 0.05:
                        drift_detected = True
                except Exception:
                    pass
            
            # Chi-square test for categorical features
            elif ref_values.dtype == 'object':
                try:
                    ref_counts = ref_values.value_counts()
                    curr_counts = curr_values.value_counts()
                    
                    # Align categories
                    all_cats = set(ref_counts.index) | set(curr_counts.index)
                    ref_aligned = [ref_counts.get(cat, 0) for cat in all_cats]
                    curr_aligned = [curr_counts.get(cat, 0) for cat in all_cats]
                    
                    if sum(ref_aligned) > 0 and sum(curr_aligned) > 0:
                        chi2, p_value = stats.chisquare(curr_aligned, f_exp=ref_aligned)
                        drift_metrics[col] = {
                            'test': 'chi2',
                            'statistic': float(chi2),
                            'p_value': float(p_value),
                            'drift_detected': p_value < 0.05
                        }
                        if p_value < 0.05:
                            drift_detected = True
                except Exception:
                    pass
        
        # Store drift check result
        self._store_drift_check(model_name, drift_detected, drift_metrics)
        
        return {
            'drift_detected': drift_detected,
            'metrics': drift_metrics,
            'checked_at': datetime.now().isoformat()
        }
    
    def _load_reference_data(self, model_name: str) -> pd.DataFrame:
        """Load reference data from database"""
        # This would load the last training dataset
        # For now, return empty
        return pd.DataFrame()
    
    def _store_drift_check(self, model_name: str, drift_detected: bool, metrics: Dict):
        """Store drift check result"""
        try:
            with self.conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO ml_drift_check (model_name, drift_detected, metrics, checked_at)
                       VALUES ($1, $2, $3::jsonb, NOW())""",
                    [model_name, drift_detected, str(metrics)]
                )
                self.conn.commit()
        except Exception:
            # Table might not exist yet
            pass
    
    def get_drift_history(self, model_name: str, days: int = 30) -> List[Dict]:
        """Get drift detection history"""
        try:
            with self.conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(
                    """SELECT * FROM ml_drift_check
                       WHERE model_name = $1
                         AND checked_at >= NOW() - INTERVAL '%s days'
                       ORDER BY checked_at DESC""",
                    [model_name, days]
                )
                return [dict(row) for row in cur.fetchall()]
        except Exception:
            return []


