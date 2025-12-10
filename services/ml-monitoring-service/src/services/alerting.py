"""
Alerting Service
Sends alerts for model degradation and drift
"""
import psycopg2
import psycopg2.extras
import os
from datetime import datetime
from typing import Dict, List, Optional
import logging

logger = logging.getLogger('alert-service')


class AlertService:
    """Send alerts for ML issues"""
    
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
    
    def send_drift_alert(self, model_name: str, drift_metrics: Dict):
        """Send alert for data drift"""
        alert = {
            'type': 'drift',
            'model_name': model_name,
            'severity': 'high',
            'message': f'Data drift detected for model {model_name}',
            'metrics': drift_metrics,
            'created_at': datetime.now()
        }
        
        self._store_alert(alert)
        logger.warn('Drift alert', alert)
        
        # In production, send to Slack/email/PagerDuty
        return alert
    
    def _store_alert(self, alert: Dict):
        """Store alert in database"""
        try:
            with self.conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO ml_alert (type, model_name, severity, message, details, created_at)
                       VALUES (%s, %s, %s, %s, %s::jsonb, %s)""",
                    [
                        alert['type'],
                        alert['model_name'],
                        alert['severity'],
                        alert['message'],
                        str(alert.get('metrics', {})),
                        alert['created_at']
                    ]
                )
                self.conn.commit()
        except Exception:
            # Table might not exist yet
            pass
    
    def get_alerts(self, model_name: Optional[str] = None, limit: int = 50) -> List[Dict]:
        """Get recent alerts"""
        try:
            with self.conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                if model_name:
                    cur.execute(
                        """SELECT id, type, model_name, severity, message, details, created_at FROM ml_alert
                           WHERE model_name = %s
                           ORDER BY created_at DESC
                           LIMIT %s""",
                        [model_name, limit]
                    )
                else:
                    cur.execute(
                        """SELECT id, type, model_name, severity, message, details, created_at FROM ml_alert
                           ORDER BY created_at DESC
                           LIMIT %s""",
                        [limit]
                    )
                rows = cur.fetchall()
                # Ensure all required fields are present
                alerts = []
                for row in rows:
                    alert_dict = dict(row)
                    # Ensure id exists (generate UUID if missing)
                    if 'id' not in alert_dict or alert_dict['id'] is None:
                        import uuid
                        alert_dict['id'] = str(uuid.uuid4())
                    # Ensure created_at is ISO formatted string
                    if 'created_at' in alert_dict and alert_dict['created_at']:
                        if isinstance(alert_dict['created_at'], str):
                            pass  # Already a string
                        else:
                            alert_dict['created_at'] = alert_dict['created_at'].isoformat()
                    alerts.append(alert_dict)
                return alerts
        except Exception as e:
            import logging
            logger.error(f"Error fetching alerts: {e}")
            return []

