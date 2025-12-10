"""
ML Monitoring Service
Monitors model performance, data drift, and concept drift
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="ML Monitoring Service", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from src.services.drift_detector import DriftDetector
from src.services.metrics_collector import MetricsCollector
from src.services.alerting import AlertService

drift_detector = DriftDetector()
metrics_collector = MetricsCollector()
alert_service = AlertService()


class PredictionRequest(BaseModel):
    model_name: str
    profile_id: str
    features: Dict
    prediction: float
    actual: Optional[float] = None


class DriftCheckRequest(BaseModel):
    model_name: str
    reference_data_path: Optional[str] = None
    current_data: List[Dict]


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "ml-monitoring-service"}


@app.post("/v1/predictions/log")
async def log_prediction(request: PredictionRequest):
    """Log a prediction for monitoring"""
    try:
        metrics_collector.log_prediction(
            model_name=request.model_name,
            profile_id=request.profile_id,
            features=request.features,
            prediction=request.prediction,
            actual=request.actual
        )
        return {"status": "logged"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/v1/drift/check")
async def check_drift(request: DriftCheckRequest):
    """Check for data drift"""
    try:
        drift_result = drift_detector.check_drift(
            model_name=request.model_name,
            reference_data_path=request.reference_data_path,
            current_data=request.current_data
        )
        
        # Send alert if drift detected
        if drift_result['drift_detected']:
            alert_service.send_drift_alert(
                model_name=request.model_name,
                drift_metrics=drift_result['metrics']
            )
        
        return drift_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/v1/metrics/{model_name}")
async def get_metrics(model_name: str, days: int = 7):
    """Get model performance metrics"""
    try:
        metrics = metrics_collector.get_metrics(model_name, days=days)
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/v1/drift/{model_name}")
async def get_drift_history(model_name: str, days: int = 30):
    """Get drift detection history"""
    try:
        history = drift_detector.get_drift_history(model_name, days=days)
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/v1/alerts")
async def get_alerts(model_name: Optional[str] = None, limit: int = 50):
    """Get recent alerts"""
    try:
        alerts = alert_service.get_alerts(model_name=model_name, limit=limit)
        return alerts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv('ML_MONITORING_SERVICE_PORT', 3020))
    uvicorn.run(app, host="0.0.0.0", port=port)

