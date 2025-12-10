"""
ML Scorer Service
Online inference service for identity resolution ML model
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, List
import mlflow
import os
from dotenv import load_dotenv
import sys

# Add feature engineering path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../../ml/feature-engineering/src'))
from identity_features import extract_pairwise_features

from src.services.identity_scorer import IdentityScorer
from src.services.explainer import ExplainerService
from src.services.churn_ltv_scorer import ChurnLTVScorer

load_dotenv()

app = FastAPI(title="ML Scorer Service", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
mlflow.set_tracking_uri(os.getenv('MLFLOW_TRACKING_URI', 'http://localhost:5001'))
identity_scorer = IdentityScorer()
explainer_service = ExplainerService()
churn_ltv_scorer = ChurnLTVScorer()


class ScoreRequest(BaseModel):
    profile_a_id: str
    profile_b_id: str
    profile_a: Dict
    profile_b: Dict
    identifiers_a: List[Dict]
    identifiers_b: List[Dict]
    events_a: Optional[List[Dict]] = None
    events_b: Optional[List[Dict]] = None


class ExplainRequest(BaseModel):
    profile_a_id: str
    profile_b_id: str
    profile_a: Dict
    profile_b: Dict
    identifiers_a: List[Dict]
    identifiers_b: List[Dict]
    events_a: Optional[List[Dict]] = None
    events_b: Optional[List[Dict]] = None


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "ml-scorer-service"}


@app.post("/v1/score/identity")
async def score_identity(request: ScoreRequest):
    """Score a pair of profiles for identity matching"""
    try:
        # Extract features
        features = extract_pairwise_features(
            request.profile_a,
            request.profile_b,
            request.identifiers_a,
            request.identifiers_b,
            request.events_a,
            request.events_b
        )
        
        # Score with ML model
        score, model_version = identity_scorer.score(features)
        
        return {
            "profile_a_id": request.profile_a_id,
            "profile_b_id": request.profile_b_id,
            "score": float(score),
            "model_version": model_version,
            "features": features
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/v1/explain/identity")
async def explain_identity(request: ExplainRequest):
    """Get SHAP explanation for identity score"""
    try:
        # Extract features
        features = extract_pairwise_features(
            request.profile_a,
            request.profile_b,
            request.identifiers_a,
            request.identifiers_b,
            request.events_a,
            request.events_b
        )
        
        # Get explanation
        explanation = explainer_service.explain(features)
        
        return {
            "profile_a_id": request.profile_a_id,
            "profile_b_id": request.profile_b_id,
            "explanation": explanation
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class RecommendationRequest(BaseModel):
    user_id: str
    item_ids: Optional[List[str]] = None
    n_recommendations: int = 10


@app.post("/v1/recommendations/predict")
async def predict_recommendations(request: RecommendationRequest):
    """Get ML-based recommendations using LightFM"""
    try:
        import mlflow.pyfunc
        
        # Load recommendation model
        model_name = os.getenv('RECOMMENDATION_MODEL_NAME', 'recommendation-model')
        client = mlflow.tracking.MlflowClient()
        
        try:
            latest_version = client.get_latest_versions(model_name, stages=["Production", "Staging", "None"])
            if latest_version:
                model_uri = f"models:/{model_name}/{latest_version[0].version}"
            else:
                # Fallback
                experiment = mlflow.get_experiment_by_name("recommendation-model")
                if experiment:
                    runs = mlflow.search_runs(experiment_ids=[experiment.experiment_id], order_by=["start_time DESC"], max_results=1)
                    if not runs.empty:
                        run_id = runs.iloc[0]['run_id']
                        model_uri = f"runs:/{run_id}/models"
                    else:
                        raise ValueError("No recommendation model found")
                else:
                    raise ValueError("Experiment not found")
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"Model not available: {e}")
        
        # Load model
        model = mlflow.pyfunc.load_model(model_uri)
        
        # Get all items if not specified
        if request.item_ids is None:
            # Fetch from database or use cached list
            import psycopg2
            conn = psycopg2.connect(
                host=os.getenv('POSTGRES_HOST', 'localhost'),
                port=int(os.getenv('POSTGRES_PORT', 5432)),
                database=os.getenv('POSTGRES_DB', 'retail_brain'),
                user=os.getenv('POSTGRES_USER', 'retail_brain_user'),
                password=os.getenv('POSTGRES_PASSWORD', 'retail_brain_pass')
            )
            with conn.cursor() as cur:
                cur.execute("SELECT DISTINCT sku FROM product_catalog LIMIT 1000")
                item_ids = [row[0] for row in cur.fetchall()]
            conn.close()
        else:
            item_ids = request.item_ids
        
        # Predict scores
        import pandas as pd
        predictions_df = pd.DataFrame({
            'user_id': [request.user_id] * len(item_ids),
            'item_id': item_ids
        })
        
        scores = model.predict(predictions_df)
        
        # Sort by score and return top N
        scored_items = list(zip(item_ids, scores))
        scored_items.sort(key=lambda x: x[1], reverse=True)
        
        recommendations = [
            {"item_id": item_id, "score": float(score)}
            for item_id, score in scored_items[:request.n_recommendations]
        ]
        
        return {
            "recommendations": recommendations,
            "method": "ml"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class ChurnPredictionRequest(BaseModel):
    profile_id: str
    profile_features: Optional[Dict] = None


class LTVPredictionRequest(BaseModel):
    profile_id: str
    profile_features: Optional[Dict] = None


@app.post("/v1/predict/churn")
async def predict_churn(request: ChurnPredictionRequest):
    """Predict churn probability for a profile"""
    try:
        # Get profile features from database if not provided
        if request.profile_features is None:
            import psycopg2
            from datetime import datetime, timezone
            
            conn = psycopg2.connect(
                host=os.getenv('POSTGRES_HOST', 'localhost'),
                port=int(os.getenv('POSTGRES_PORT', 5432)),
                database=os.getenv('POSTGRES_DB', 'retail_brain'),
                user=os.getenv('POSTGRES_USER', 'retail_brain_user'),
                password=os.getenv('POSTGRES_PASSWORD', 'retail_brain_pass')
            )
            
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        total_orders,
                        total_spent,
                        avg_order_value,
                        first_seen_at,
                        last_seen_at,
                        last_purchase_at
                    FROM customer_profile
                    WHERE id = %s
                """, (request.profile_id,))
                row = cur.fetchone()
                
                if row:
                    total_orders, total_spent, avg_order_value, first_seen, last_seen, last_purchase = row
                    now = datetime.now(timezone.utc)
                    days_since_first = (now - first_seen).days if first_seen else 0
                    days_since_last = (now - last_purchase).days if last_purchase else (now - last_seen).days if last_seen else 0
                    
                    profile_features = {
                        'total_orders': total_orders or 0,
                        'total_spent': float(total_spent or 0),
                        'avg_order_value': float(avg_order_value or 0),
                        'days_since_first_seen': days_since_first,
                        'days_since_last_purchase': days_since_last,
                    }
                else:
                    profile_features = {
                        'total_orders': 0,
                        'total_spent': 0.0,
                        'avg_order_value': 0.0,
                        'days_since_first_seen': 0,
                        'days_since_last_purchase': 0,
                    }
            conn.close()
        else:
            profile_features = request.profile_features
        
        # Predict
        churn_prob, model_version = churn_ltv_scorer.predict_churn(profile_features)
        
        return {
            "profile_id": request.profile_id,
            "churn_probability": churn_prob,
            "model_version": model_version
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/v1/predict/ltv")
async def predict_ltv(request: LTVPredictionRequest):
    """Predict LTV for a profile"""
    try:
        # Get profile features from database if not provided
        if request.profile_features is None:
            import psycopg2
            from datetime import datetime, timezone
            
            conn = psycopg2.connect(
                host=os.getenv('POSTGRES_HOST', 'localhost'),
                port=int(os.getenv('POSTGRES_PORT', 5432)),
                database=os.getenv('POSTGRES_DB', 'retail_brain'),
                user=os.getenv('POSTGRES_USER', 'retail_brain_user'),
                password=os.getenv('POSTGRES_PASSWORD', 'retail_brain_pass')
            )
            
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        total_orders,
                        total_spent,
                        avg_order_value,
                        first_seen_at,
                        last_purchase_at
                    FROM customer_profile
                    WHERE id = %s
                """, (request.profile_id,))
                row = cur.fetchone()
                
                if row:
                    total_orders, total_spent, avg_order_value, first_seen, last_purchase = row
                    now = datetime.now(timezone.utc)
                    days_since_first = (now - first_seen).days if first_seen else 0
                    days_since_last = (now - last_purchase).days if last_purchase else 0
                    
                    profile_features = {
                        'total_orders': total_orders or 0,
                        'total_spent': float(total_spent or 0),
                        'avg_order_value': float(avg_order_value or 0),
                        'days_since_first_seen': days_since_first,
                        'days_since_last_purchase': days_since_last,
                    }
                else:
                    profile_features = {
                        'total_orders': 0,
                        'total_spent': 0.0,
                        'avg_order_value': 0.0,
                        'days_since_first_seen': 0,
                        'days_since_last_purchase': 0,
                    }
            conn.close()
        else:
            profile_features = request.profile_features
        
        # Predict
        predicted_ltv, model_version = churn_ltv_scorer.predict_ltv(profile_features)
        
        return {
            "profile_id": request.profile_id,
            "predicted_ltv": predicted_ltv,
            "model_version": model_version
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv('ML_SCORER_PORT', 3015))
    uvicorn.run(app, host="0.0.0.0", port=port)

