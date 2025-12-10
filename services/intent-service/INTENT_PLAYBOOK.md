# Intent Detection Playbook

This playbook captures how to label data, keep the intent model current, and monitor inference quality and drift.

## 1. Labeling & Dataset Growth

1. **Collect representative samples** – Stream realtime messages (WhatsApp/email/chat) through `/v1/intent/whatsapp|email|chat` and pipe the raw text + metadata into your labeling queue. The `metadata.preview` field makes it easy to replay without storing blocked content.
2. **Label schema** – We expect intents such as `purchase`, `inquiry`, `complaint`, `support`, `feedback`, `other`. For new use cases, add the intent to the schema, regenerate the `LabelEncoder`, and log the new class in MLflow with descriptive tags.
3. **Labeling signal sources**:
   - Customer replies that converted on WhatsApp/email (purchase).
   - Agent classifications from support UI (support/complaint).
   - Weak labels via keywords (e.g., “order” → purchase) to seed active learning.
4. **Store metadata** – Preserve `channel`, `customer_id`, `source`, and timestamps with every labeled row so the training corpus can produce per-channel accuracy metrics.

## 2. Training Pipeline

1. **Data extraction** – Pull normalized text + metadata from the `intent_monitoring` sink or our `intent_metrics_store`. Use the preview text for review while storing hashed PII.
2. **Feature engineering** – Use `SentenceTransformer('all-mpnet-base-v2')` to embed text, then pass embeddings + metadata to LightGBM. Track per-channel accuracy and `fallback`/`cache_hit` ratios in MLflow metrics.
3. **Hyperparameter tuning** – Keep the current config under source control. Slice experiments by channel and log metrics such as `ROC-AUC`, `F1`, and `per-channel recall` in MLflow. Promote a run to `Staging` only after drift tests pass.
4. **Explainability** – Register SHAP explainers as artifacts so the inference service can display key embedding dims in responses. If the explainer fails to build, the service automatically falls back but logs the reason.
5. **Deployment** – After a successful run, update the MLflow model registry entry `intent-detection` and restart the service (or run `make restart-intent-service`). The API loads the newest stage automatically and logs warnings if the load fails.

## 3. Monitoring & Drift

1. **Intent metrics** – `/v1/intent/stats` exposes total requests, cache hits, fallback rate, and intent/channel distributions. Drill into `recentActivity` when investigating anomalies.
2. **Cache health** – The cache uses normalized text + channel as a key. Watching `cacheHitRate` ensures repeated customer queries are served quickly. Clear Redis if you notice stale predictions after a retrain.
3. **Fallback alerts** – Drift is flagged when fallback rate exceeds 15%. When that happens, investigate the latest `recentActivity` entries and the `metadata.preview` payload they carry.
4. **Metadata logs** – Each inference emits structured logs with `request_id`, `channel`, `status`, and the `metadata` you supply (customer_id, source). Hook these logs into your observability stack (e.g., Loki, Datadog) for alerting and replay.
5. **Monitoring endpoint** – The service POSTs context to `INTENT_MONITORING_ENDPOINT`. Implement a lightweight collector that ingests these POSTs, indexes them by channel, and triggers retraining when the average confidence drops below a threshold.

## 4. Runbook

- **If the embedding model fails**: The service logs a warning and runs rule-based fallback – `status: fallback`. Investigate whether the `SentenceTransformer` model file is accessible and re-run `mlflow-lightgbm load`.
- **If Redis is unavailable**: The system logs `Cache read/write failed` and keeps serving but with higher latency. Restart Redis and verify `INTENT_CACHE_TTL` is set appropriately.
- **Drift remediation**: When drift alert fires (>15% fallback), label or re-label the latest messages, retrain the LightGBM model, push to MLflow, and restart the service. Afterward, monitor `/v1/intent/stats` to ensure fallback rate returns below 5%.

Follow this playbook during every retraining cycle to keep intent detection accurate, explainable, and safe.

