## Intent Inference Upgrade Plan

1. **Dependencies & configuration**
   - Add Redis/ai/metrics libs to `services/intent-service/requirements.txt` and `env.example`.
   - Configure `INTENT_CACHE_TTL`, `INTENT_SHAP_SAMPLE_SIZE`, `INTENT_MONITORING_ENDPOINT`.

2. **Service instrumentation**
   - Wrap `/v1/intent/detect` in structured logging (request_id, latency, channel).
   - Add abstraction `log_intent_call(...)` that writes to `Logger`.
   - Emit metrics for latency/count via `statsd` or Prometheus `collect_metrics`.

3. **Caching & batching**
   - Introduce Redis cache: `get_cached_intent(hash)` and store full response JSON.
   - Cache key derived from normalized text + channel.
   - Batch detection uses single embedding encode call + caching.

4. **Explainability**
   - Add SHAP/attention contributions to response when model available.
   - Provide friendly summary: top two contributing tokens or features.

5. **Monitoring hooks**
   - Log input hashes + output to `intent_monitoring` table.
   - Report drifts to ML monitoring service via new HTTP/queue.

6. **Channel metadata**
   - Accept optional metadata (`channel`, `customer_id`, `source`) to separate metrics.
**

