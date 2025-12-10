"""
Retraining Pipeline Scheduler
Automated retraining with scheduled and drift-based triggers
"""
import os
import sys
import schedule
import time
import requests
from datetime import datetime
from dotenv import load_dotenv
import logging

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('retrain-scheduler')

ML_MONITORING_URL = os.getenv('ML_MONITORING_SERVICE_URL', 'http://localhost:3020')
MLFLOW_TRACKING_URI = os.getenv('MLFLOW_TRACKING_URI', 'http://localhost:5001')


class RetrainScheduler:
    """Schedule and trigger model retraining"""
    
    def __init__(self):
        self.models = {
            'identity_resolution_model': {
                'training_script': 'ml/training/identity-model/train.py',
                'retrain_interval_days': 7,
                'drift_threshold': 0.05
            },
            'intent-detection': {
                'training_script': 'ml/training/intent-model/train.py',
                'retrain_interval_days': 14,
                'drift_threshold': 0.05
            },
            'recommendation-model': {
                'training_script': 'ml/training/recommendation-model/train.py',
                'retrain_interval_days': 7,
                'drift_threshold': 0.05
            },
            'churn-prediction': {
                'training_script': 'ml/training/churn-ltv-models/train.py',
                'retrain_interval_days': 14,
                'drift_threshold': 0.05
            },
            'ltv-prediction': {
                'training_script': 'ml/training/churn-ltv-models/train.py',
                'retrain_interval_days': 14,
                'drift_threshold': 0.05
            }
        }
    
    def check_drift_and_retrain(self, model_name: str):
        """Check for drift and trigger retraining if needed"""
        logger.info(f"Checking drift for {model_name}")
        
        try:
            # Check drift from monitoring service
            response = requests.get(
                f"{ML_MONITORING_URL}/v1/drift/{model_name}",
                params={'days': 7},
                timeout=10
            )
            
            if response.status_code == 200:
                drift_history = response.json()
                
                # Check if recent drift detected
                if drift_history and len(drift_history) > 0:
                    recent_drift = drift_history[0]
                    if recent_drift.get('drift_detected'):
                        logger.warning(f"Drift detected for {model_name}, triggering retraining")
                        self.trigger_retraining(model_name)
                        return
            
            # Scheduled retraining check
            model_config = self.models.get(model_name)
            if model_config:
                days_since_last_training = self._get_days_since_last_training(model_name)
                if days_since_last_training >= model_config['retrain_interval_days']:
                    logger.info(f"Scheduled retraining for {model_name}")
                    self.trigger_retraining(model_name)
        
        except Exception as e:
            logger.error(f"Error checking drift for {model_name}: {e}")
    
    def trigger_retraining(self, model_name: str):
        """Trigger model retraining"""
        logger.info(f"Triggering retraining for {model_name}")
        
        model_config = self.models.get(model_name)
        if not model_config:
            logger.error(f"No config found for {model_name}")
            return
        
        # In production, this would:
        # 1. Submit training job to Kubernetes/Airflow
        # 2. Or run training script directly
        # 3. Or trigger CI/CD pipeline
        
        training_script = model_config['training_script']
        logger.info(f"Would run: python {training_script}")
        
        # For now, just log
        # In production: subprocess.run(['python', training_script, '--data', data_path])
    
    def _get_days_since_last_training(self, model_name: str) -> int:
        """Get days since last model training"""
        try:
            import mlflow
            mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
            
            client = mlflow.tracking.MlflowClient()
            latest_version = client.get_latest_versions(model_name, stages=["Production", "Staging"])
            
            if latest_version:
                run_id = latest_version[0].run_id
                run = client.get_run(run_id)
                last_training = datetime.fromtimestamp(run.info.start_time / 1000)
                days = (datetime.now() - last_training).days
                return days
            
            return 999  # Never trained
        except Exception as e:
            logger.error(f"Error getting last training time: {e}")
            return 999
    
    def start_scheduler(self):
        """Start the retraining scheduler"""
        logger.info("Starting retraining scheduler...")
        
        # Schedule daily drift checks
        for model_name in self.models.keys():
            schedule.every().day.at("02:00").do(self.check_drift_and_retrain, model_name)
        
        # Run scheduler
        while True:
            schedule.run_pending()
            time.sleep(60)  # Check every minute


def main():
    """Main function"""
    scheduler = RetrainScheduler()
    scheduler.start_scheduler()


if __name__ == '__main__':
    main()

