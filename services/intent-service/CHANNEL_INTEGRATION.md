# Intent Service Channel Integration Guide

This service exposes lightweight channel adapters that pre-process messages and forward them to `/v1/intent/detect`. Use the dedicated channel endpoints when integrating WhatsApp, email, or chat providers so you get consistent normalization, metadata extraction, and monitoring.

## Endpoints

| Endpoint | Description | Required Fields |
| --- | --- | --- |
| `/v1/intent/detect` | Generic intent detection. Accepts `text`, optional `channel`, `customer_id`, `source`, and other metadata. | `text` |
| `/v1/intent/whatsapp` | Handles WhatsApp-specific payloads (message ID, sender). | `message_id`, `body`, `from_number` |
| `/v1/intent/email` | Handles email payloads while combining subject+body. | `subject`, `body`, `from_email` |
| `/v1/intent/chat` | Handles in-app chat messages with conversation context. | `conversation_id`, `user_input`, `user_id` |

All channel endpoints add normalized metadata + channel tags so the inference pipeline can cache, log, and monitor traffic per source.

## Normalization & Tokenization Tips

1. **Trim noise early** – Remove line breaks, duplicate whitespace, and URLs before sending payloads. The adapters already collapse multi-line text and remove HTTP links, but doing it upstream reduces payload size and cache variation.
2. **Preserve structure** – When combining subject + body (emails) or thread context (chat), keep related fields (thread ID, conversation ID) in metadata so the dashboard can correlate follow-up attempts.
3. **Avoid punishing punctuation** – Do not aggressively strip emojis or delimited text; the embeddings benefit from contextual cues. Instead, rely on the `normalize_text` helper inside the service, which only condenses whitespace and lowercases text.
4. **Hash customer identifiers** – For privacy, hash or tokenize PII in your upstream connectors before setting `customer_id`. The intent service accepts any string but avoids storing raw identifiers beyond your telemetry payload.

## Metadata & Fallbacks

- Include `customer_id`, `source`, and `channel` when available. These fields drive caching keys, metrics tags, and fallback log entries.
- The service caches per normalized text + channel for `INTENT_CACHE_TTL` seconds. If the ML model is unavailable, the service returns a rule-based fallback and logs `status: fallback` without caching to avoid poisoning the cache.
- Monitoring payloads are POSTed to `INTENT_MONITORING_ENDPOINT` with traceable `request_id`, `status`, and metadata. Ensure your ML monitoring service acknowledges these payloads (e.g., by absorbing duplicates) since the service retries only once.

## Example (WhatsApp)

```jsonc
POST /v1/intent/whatsapp
{
  "message_id": "wamid.GBgM1234==",
  "body": "Hi, can I order the product again? I lost the previous link.",
  "from_number": "+918123456789",
  "customer_id": "profile-0001",
  "metadata": {
    "campaign": "holiday_reminder"
  }
}
```

The service returns `intent`, `confidence`, and optional `shap_contributions`, while logging `channel: whatsapp`, `source: whatsapp`, and caching under the normalized text/hash.

## SDK Suggestions

- Use the channel adapters in this project as a reference for your own SDK (JavaScript, TypeScript, or backend). Keep preprocessing deterministic: same text + channel should always produce identical normalized payloads.
- Add retries with exponential backoff when calling inference endpoints (especially during deployment windows when the ML model may be loading).
- Log both requests and responses so that you can replay them into the ML monitoring pipeline in the future.

