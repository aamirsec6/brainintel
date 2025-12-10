"""
Intent Detection Service
Real-time intent detection for WhatsApp messages
"""
from collections import Counter as PyCounter, deque
from datetime import datetime
from typing import Any, List, Dict, Optional
from uuid import uuid4

import hashlib
import json
import logging
import os
import requests
import shap
import time

import mlflow
import mlflow.lightgbm
import numpy as np
import pickle
import redis
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import Counter, Histogram
from sentence_transformers import SentenceTransformer
from src.adapters import (
    ChatChannelPayload,
    EmailChannelPayload,
    WhatsAppChannelPayload,
    prepare_chat_payload,
    prepare_email_payload,
    prepare_whatsapp_payload,
)
from src.adapters import (
    ChatChannelPayload,
    EmailChannelPayload,
    WhatsAppChannelPayload,
    prepare_whatsapp_payload,
    prepare_email_payload,
    prepare_chat_payload,
)

load_dotenv()

LOG_LEVEL = os.getenv("LOG_LEVEL", "info").upper()
logging.basicConfig(level=LOG_LEVEL)
logger = logging.getLogger("intent-service")

INTENT_CACHE_TTL = int(os.getenv("INTENT_CACHE_TTL", "60"))
INTENT_SHAP_SAMPLE_SIZE = int(os.getenv("INTENT_SHAP_SAMPLE_SIZE", "2"))
INTENT_MONITORING_ENDPOINT = os.getenv("INTENT_MONITORING_ENDPOINT")
INTENT_METRICS_NAMESPACE = os.getenv("INTENT_METRICS_NAMESPACE", "intent_service")

INTENT_REQUEST_COUNTER = Counter(
    "intent_requests_total",
    "Total number of intent detection calls",
    ["status", "channel"],
    namespace=INTENT_METRICS_NAMESPACE,
)
INTENT_CACHE_HITS = Counter(
    "intent_cache_hits_total",
    "Number of cached intent responses returned",
    ["channel"],
    namespace=INTENT_METRICS_NAMESPACE,
)
INTENT_LATENCY = Histogram(
    "intent_latency_seconds",
    "Latency distribution for intent detection",
    ["channel"],
    namespace=INTENT_METRICS_NAMESPACE,
)

intent_metrics_store = {
    "total_requests": 0,
    "cache_hits": 0,
    "fallbacks": 0,
    "intent_distribution": PyCounter(),
    "channel_distribution": PyCounter(),
    "recent": deque(maxlen=30),
    "drift_alert": False,
    "last_drift_at": None,
}

def build_redis_client() -> Optional[redis.Redis]:
    try:
        client = redis.Redis(
            host=os.getenv("REDIS_HOST", "localhost"),
            port=int(os.getenv("REDIS_PORT", 6379)),
            password=os.getenv("REDIS_PASSWORD") or None,
            db=0,
            decode_responses=True,
        )
        client.ping()
        return client
    except Exception as exc:
        logger.warning("Redis unavailable: %s", exc)
        return None

redis_client = build_redis_client()

# Global variables
embedding_model = None
intent_classifier = None
label_encoder = None
model_explainer = None


def sanitize_label(value: Optional[str]) -> str:
    return (value or "unknown").lower()


def normalize_text(text: str) -> str:
    return " ".join(text.strip().split()).lower()


def build_cache_key(text: str, channel: Optional[str]) -> str:
    key_source = f"{sanitize_label(channel)}|{text}"
    return hashlib.sha256(key_source.encode("utf-8")).hexdigest()


def get_cached_intent(key: str) -> Optional[Dict[str, Any]]:
    if not redis_client:
        return None

    try:
        payload = redis_client.get(key)
        if payload:
            return json.loads(payload)
    except Exception as exc:
        logger.warning("Cache read failed: %s", exc)

    return None


def cache_intent(key: str, response: Dict[str, Any]) -> None:
    if not redis_client:
        return

    try:
        redis_client.set(key, json.dumps(response), ex=INTENT_CACHE_TTL)
    except Exception as exc:
        logger.warning("Cache write failed: %s", exc)


def emit_monitoring(payload: Dict[str, Any]) -> None:
    if not INTENT_MONITORING_ENDPOINT:
        return

    try:
        requests.post(INTENT_MONITORING_ENDPOINT, json=payload, timeout=2)
    except Exception as exc:
        logger.debug("Monitoring POST failed (%s): %s", INTENT_MONITORING_ENDPOINT, exc)


def record_intent_metrics(
    intent: str,
    channel: Optional[str],
    confidence: float,
    status: str,
    cached: bool,
    metadata: Dict[str, Any],
) -> None:
    intent_metrics_store["total_requests"] += 1
    if cached:
        intent_metrics_store["cache_hits"] += 1
    if status == "fallback":
        intent_metrics_store["fallbacks"] += 1

    intent_metrics_store["intent_distribution"][intent] += 1
    intent_metrics_store["channel_distribution"][sanitize_label(channel)] += 1

    intent_metrics_store["recent"].appendleft({
        "intent": intent,
        "confidence": confidence,
        "channel": sanitize_label(channel),
        "status": status,
        "cached": cached,
        "metadata": metadata,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    })

    fallback_rate = intent_metrics_store["fallbacks"] / max(intent_metrics_store["total_requests"], 1)
    intent_metrics_store["drift_alert"] = fallback_rate > 0.15
    if intent_metrics_store["drift_alert"]:
        intent_metrics_store["last_drift_at"] = datetime.utcnow().isoformat() + "Z"

def log_intent_call(
    request_id: str,
    method: str,
    channel: str,
    duration: float,
    cached: bool,
    status: str,
    metadata: Dict[str, Any],
) -> None:
    INTENT_REQUEST_COUNTER.labels(status=status, channel=channel).inc()
    if cached:
        INTENT_CACHE_HITS.labels(channel=channel).inc()

    INTENT_LATENCY.labels(channel=channel).observe(duration)

    logger.info(
        "Intent call",
        extra={
            "request_id": request_id,
            "method": method,
            "channel": channel,
            "duration_ms": int(duration * 1000),
            "cached": cached,
            "status": status,
            "metadata": metadata,
        },
    )


def compute_shap_summary(embedding: np.ndarray, class_idx: int) -> Optional[List[Dict[str, Any]]]:
    if model_explainer is None:
        return None

    try:
        shap_values = model_explainer.shap_values(embedding)
        if isinstance(shap_values, list):
            class_values = shap_values[class_idx]
        else:
            class_values = shap_values

        if isinstance(class_values, list):
            class_values = np.array(class_values)

        if class_values.ndim > 1:
            class_values = class_values[0]

        top_indices = np.argsort(np.abs(class_values))[-INTENT_SHAP_SAMPLE_SIZE :]
        summary = []
        for idx in reversed(top_indices):
            summary.append(
                {
                    "feature": f"embedding_dim_{int(idx)}",
                    "value": float(class_values[int(idx)]),
                }
            )

        return summary
    except Exception as exc:
        logger.debug("SHAP explainability skipped: %s", exc)
        return None


@app.get("/v1/intent/stats")
async def intent_stats():
    store = intent_metrics_store
    total = store["total_requests"]
    cache_hits = store["cache_hits"]
    fallbacks = store["fallbacks"]
    cache_rate = cache_hits / total if total else 0
    fallback_rate = fallbacks / total if total else 0
    return {
        "totalRequests": total,
        "cacheHits": cache_hits,
        "cacheHitRate": cache_rate,
        "fallbackRate": fallback_rate,
        "driftAlert": store["drift_alert"],
        "driftReason": "Fallback rate above 15%" if store["drift_alert"] else "Stable traffic",
        "lastDriftAt": store["last_drift_at"],
        "intentDistribution": [
            {"intent": intent, "count": count}
            for intent, count in store["intent_distribution"].most_common(5)
        ],
        "channelDistribution": [
            {"channel": channel, "count": count}
            for channel, count in store["channel_distribution"].most_common(5)
        ],
        "recentActivity": list(store["recent"]),
    }


async def run_intent_pipeline(
    text: str,
    channel: Optional[str] = None,
    customer_id: Optional[str] = None,
    source: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    request_id = str(uuid4())
    start_time = time.time()
    channel_label = sanitize_label(channel)
    normalized_text = normalize_text(text)
    metadata_payload = metadata.copy() if metadata else {}
    metadata_payload["input_text"] = text
    metadata_payload["preview"] = text if len(text) <= 120 else text[:117] + "..."
    cache_key = build_cache_key(normalized_text, channel)

    cached_response = get_cached_intent(cache_key)
    if cached_response:
        duration = time.time() - start_time
        log_intent_call(
            request_id,
            "detect",
            channel_label,
            duration,
            cached=True,
            status="cache_hit",
            metadata=metadata_payload,
        )
        emit_monitoring(
            {
                "request_id": request_id,
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "status": "cache_hit",
                "intent": cached_response.get("intent"),
                "confidence": cached_response.get("confidence"),
                "channel": channel,
                "customer_id": customer_id,
                "source": source,
                "cached": True,
                "metadata": metadata_payload,
            }
        )
        record_intent_metrics(
            cached_response.get("intent", "unknown"),
            channel,
            float(cached_response.get("confidence", 0)),
            "cache_hit",
            True,
            metadata_payload,
        )
        return cached_response

    try:
        if intent_classifier is None or embedding_model is None:
            intent = detect_intent_rules(text)
            duration = time.time() - start_time
            response = {
                "text": text,
                "intent": intent,
                "confidence": 0.5,
                "method": "rule-based",
                "channel": channel,
                "customer_id": customer_id,
                "source": source,
                "metadata": metadata_payload,
                "cached": False,
            }
            log_intent_call(
                request_id,
                "detect",
                channel_label,
                duration,
                cached=False,
                status="fallback",
                metadata=metadata_payload,
            )
            emit_monitoring(
                {
                    "request_id": request_id,
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "status": "fallback",
                    "intent": intent,
                    "confidence": 0.5,
                    "channel": channel,
                    "customer_id": customer_id,
                    "source": source,
                    "cached": False,
                    "metadata": metadata_payload,
                }
            )
            record_intent_metrics(
                intent,
                channel,
                0.5,
                "fallback",
                False,
                metadata_payload,
            )
            return response

        embedding = embedding_model.encode(
            text,
            normalize_embeddings=True,
            convert_to_numpy=True
        )

        proba = intent_classifier.predict(
            embedding.reshape(1, -1),
            num_iteration=intent_classifier.best_iteration
        )
        predicted_class_idx = np.argmax(proba[0])
        confidence = float(proba[0][predicted_class_idx])
        intent = label_encoder.inverse_transform([predicted_class_idx])[0]
        probabilities = {
            label_encoder.inverse_transform([i])[0]: float(proba[0][i])
            for i in range(len(proba[0]))
        }

        shap_summary = compute_shap_summary(embedding.reshape(1, -1), predicted_class_idx)

        response = {
            "text": text,
            "intent": intent,
            "confidence": confidence,
            "probabilities": probabilities,
            "method": "ml",
            "channel": channel,
            "customer_id": customer_id,
            "source": source,
            "metadata": metadata_payload,
            "cached": False,
        }
        if shap_summary:
            response["shap_contributions"] = shap_summary

        cache_intent(cache_key, response)

        duration = time.time() - start_time
        log_intent_call(
            request_id,
            "detect",
            channel_label,
            duration,
            cached=False,
            status="success",
            metadata=metadata_payload,
        )
        emit_monitoring(
            {
                "request_id": request_id,
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "status": "success",
                "intent": intent,
                "confidence": confidence,
                "channel": channel,
                "customer_id": customer_id,
                "source": source,
                "cached": False,
                "metadata": metadata_payload,
            }
        )
        record_intent_metrics(
            intent,
            channel,
            confidence,
            "success",
            False,
            metadata_payload,
        )

        return response
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


app = FastAPI(title="Intent Detection Service", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def load_models():
    """Load embedding model and intent classifier"""
    global embedding_model, intent_classifier, label_encoder, model_explainer
    
    if embedding_model is None:
        print("Loading embedding model...")
        embedding_model = SentenceTransformer('all-mpnet-base-v2')
        print("✅ Embedding model loaded")
    
    if intent_classifier is None:
        try:
            mlflow.set_tracking_uri(os.getenv('MLFLOW_TRACKING_URI', 'http://localhost:5001'))
            
            # Get latest model
            client = mlflow.tracking.MlflowClient()
            model_name = os.getenv('INTENT_MODEL_NAME', 'intent-detection')
            
            try:
                latest_version = client.get_latest_versions(model_name, stages=["Production", "Staging", "None"])
                if latest_version:
                    model_uri = f"models:/{model_name}/{latest_version[0].version}"
                else:
                    # Fallback: latest run
                    experiment = mlflow.get_experiment_by_name("intent-detection")
                    if experiment:
                        runs = mlflow.search_runs(experiment_ids=[experiment.experiment_id], order_by=["start_time DESC"], max_results=1)
                        if not runs.empty:
                            run_id = runs.iloc[0]['run_id']
                            model_uri = f"runs:/{run_id}/models"
                        else:
                            raise ValueError("No model runs found")
                    else:
                        raise ValueError("Experiment not found")
            except Exception:
                # Fallback
                experiment = mlflow.get_experiment_by_name("intent-detection")
                if experiment:
                    runs = mlflow.search_runs(experiment_ids=[experiment.experiment_id], order_by=["start_time DESC"], max_results=1)
                    if not runs.empty:
                        run_id = runs.iloc[0]['run_id']
                        model_uri = f"runs:/{run_id}/models"
                    else:
                        raise ValueError("No model runs found")
                else:
                    raise ValueError("Experiment not found")
            
            # Load model
            intent_classifier = mlflow.lightgbm.load_model(model_uri)
            try:
                model_explainer = shap.TreeExplainer(intent_classifier)
            except Exception as explainer_exc:
                logger.warning("SHAP explainer init failed: %s", explainer_exc)
                model_explainer = None
            
            # Load label encoder
            try:
                label_encoder_path = mlflow.artifacts.download_artifacts(f"{model_uri.replace('/models', '')}/models/label_encoder.pkl")
                with open(label_encoder_path, 'rb') as f:
                    label_encoder = pickle.load(f)
            except Exception as e:
                print(f"Warning: Could not load label encoder: {e}")
                # Create default encoder
                from sklearn.preprocessing import LabelEncoder
                label_encoder = LabelEncoder()
                label_encoder.classes_ = np.array(['purchase', 'inquiry', 'complaint', 'support', 'feedback', 'other'])
            
            print("✅ Intent classifier loaded")
        except Exception as e:
            print(f"Warning: Failed to load ML model: {e}")
            print("Using rule-based fallback")
            intent_classifier = None

@app.on_event("startup")
async def startup_event():
    """Load models on startup"""
    load_models()

class IntentRequest(BaseModel):
    text: str
    channel: Optional[str] = None
    customer_id: Optional[str] = None
    source: Optional[str] = None

class BatchIntentRequest(BaseModel):
    texts: List[str]

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "intent-service",
        "model_loaded": intent_classifier is not None
    }

@app.post("/v1/intent/detect")
async def detect_intent(request: IntentRequest):
    """Detect intent from text"""
    metadata = {k: v for k, v in request.dict().items() if k != "text" and v is not None}
    return await run_intent_pipeline(
        text=request.text,
        channel=request.channel,
        customer_id=request.customer_id,
        source=request.source,
        metadata=metadata,
    )


@app.post("/v1/intent/whatsapp")
async def detect_whatsapp(payload: WhatsAppChannelPayload):
    """Intent endpoint for WhatsApp payloads"""
    return await run_intent_pipeline(**prepare_whatsapp_payload(payload))


@app.post("/v1/intent/email")
async def detect_email(payload: EmailChannelPayload):
    """Intent endpoint for email payloads"""
    return await run_intent_pipeline(**prepare_email_payload(payload))


@app.post("/v1/intent/chat")
async def detect_chat(payload: ChatChannelPayload):
    """Intent endpoint for chat payloads"""
    return await run_intent_pipeline(**prepare_chat_payload(payload))

@app.post("/v1/intent/detect/batch")
async def detect_intent_batch(request: BatchIntentRequest):
    """Detect intent for multiple texts"""
    try:
        if intent_classifier is None or embedding_model is None:
            # Fallback
            results = [
                {
                    "text": text,
                    "intent": detect_intent_rules(text),
                    "confidence": 0.5,
                    "method": "rule-based"
                }
                for text in request.texts
            ]
            return {"results": results}
        
        # Generate embeddings
        embeddings = embedding_model.encode(
            request.texts,
            batch_size=32,
            normalize_embeddings=True,
            convert_to_numpy=True
        )
        
        # Predict
        proba = intent_classifier.predict(embeddings, num_iteration=intent_classifier.best_iteration)
        predicted_indices = np.argmax(proba, axis=1)
        confidences = proba[np.arange(len(proba)), predicted_indices]
        
        intents = label_encoder.inverse_transform(predicted_indices)
        
        results = [
            {
                "text": text,
                "intent": intent,
                "confidence": float(conf),
                "method": "ml"
            }
            for text, intent, conf in zip(request.texts, intents, confidences)
        ]
        
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def detect_intent_rules(text: str) -> str:
    """Rule-based intent detection fallback"""
    text_lower = text.lower()
    
    purchase_keywords = ['buy', 'purchase', 'order', 'want to buy', 'place order']
    inquiry_keywords = ['what', 'when', 'where', 'how', 'do you have', 'price', 'available']
    complaint_keywords = ['broken', 'defective', 'damaged', 'wrong', 'bad', 'problem', 'issue']
    support_keywords = ['help', 'support', 'assist', 'refund', 'return']
    feedback_keywords = ['thank', 'great', 'excellent', 'love', 'amazing', 'good']
    
    if any(kw in text_lower for kw in purchase_keywords):
        return 'purchase'
    elif any(kw in text_lower for kw in complaint_keywords):
        return 'complaint'
    elif any(kw in text_lower for kw in support_keywords):
        return 'support'
    elif any(kw in text_lower for kw in feedback_keywords):
        return 'feedback'
    elif any(kw in text_lower for kw in inquiry_keywords):
        return 'inquiry'
    else:
        return 'other'

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv('INTENT_SERVICE_PORT', 3017))
    uvicorn.run(app, host="0.0.0.0", port=port)

