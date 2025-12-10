# Retail Brain - Architecture Documentation

**Version:** 1.0  
**Last Updated:** December 2025

---

## System Overview

Retail Brain is a microservices-based platform designed to solve the **fragmented customer identity problem** in retail. It provides:

1. **Identity Resolution** — Merge duplicate customer records across channels
2. **Customer 360** — Unified view of customer behavior and preferences
3. **Real-time Intelligence** — Actionable insights for store associates and systems
4. **AI-Powered Queries** — Natural language access to customer data

---

## Architecture Principles

### 1. Microservices Architecture
- Each service is **isolated, independently deployable**
- Services communicate via well-defined APIs
- No direct database access between services
- Failure in one service doesn't cascade

### 2. Event-Driven Design
- All customer interactions are captured as **events**
- Events are immutable (never modified)
- Events flow through a pipeline: Raw → Normalized → Profile-linked

### 3. ACID Compliance
- All critical operations use **PostgreSQL transactions**
- Merge operations include **full snapshots** for rollback
- No eventual consistency for identity resolution

### 4. Privacy by Design
- Identifiers are **hashed (SHA256)** before storage
- PII is encrypted at rest
- Audit logs for all profile changes

### 5. Type Safety
- **Strict TypeScript** across all services (no `any`)
- Shared type definitions in `@retail-brain/types`
- Compile-time validation of contracts

---

## Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      External Sources                        │
│  (Web, App, POS, WhatsApp, CRM, Marketplaces, Loyalty)     │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                       API Gateway                            │
│  • Authentication (API Keys)                                 │
│  • Rate Limiting (100 req/min)                              │
│  • Request ID Generation                                     │
│  • Routing                                                   │
└────────────────┬────────────────────────────────────────────┘
                 │
        ┌────────┴────────┬──────────┬──────────┐
        ▼                 ▼          ▼          ▼
┌───────────────┐  ┌──────────┐  ┌─────┐  ┌─────────┐
│Event Collector│  │ Profile  │  │Merge│  │Recomm-  │
│   Service     │  │ Service  │  │ Log │  │endations│
└───────┬───────┘  └─────┬────┘  └──┬──┘  └────┬────┘
        │                │           │          │
        ▼                │           │          │
┌───────────────┐        │           │          │
│customer_raw_  │        │           │          │
│   event       │        │           │          │
└───────┬───────┘        │           │          │
        │                │           │          │
        ▼                │           │          │
┌───────────────┐        │           │          │
│Identity Engine│        │           │          │
│ • Exact Match │        │           │          │
│ • Fuzzy Match │        │           │          │
│ • Scoring     │        │           │          │
│ • Merge Logic │        │           │          │
└───────┬───────┘        │           │          │
        │                │           │          │
        ▼                ▼           ▼          ▼
┌─────────────────────────────────────────────────┐
│              PostgreSQL 15 + pgvector            │
│  • customer_profile                              │
│  • profile_identifier (hashed)                   │
│  • events (normalized)                           │
│  • identity_merge_log (snapshots)                │
└─────────────────┬────────────────────────────────┘
                  │
                  ▼
          ┌──────────────┐
          │    Redis     │
          │ • Recs Cache │
          │ • Sessions   │
          │ • Rate Limit │
          └──────────────┘
```

---

## Data Flow

### 1. Event Ingestion Flow

```
1. External System → POST /v1/events
   {
     "source": "app",
     "event_type": "purchase",
     "identifiers": { "phone": "+91..." },
     "payload": { ... }
   }

2. API Gateway
   ├─ Validate API Key
   ├─ Rate Limit Check
   └─ Generate request_id

3. Event Collector
   ├─ Validate Schema (Zod)
   ├─ Store in customer_raw_event (immutable)
   └─ Forward to Identity Engine

4. Identity Engine
   ├─ Normalize identifiers (hash)
   ├─ Exact match on hashes
   ├─ Fuzzy match on name/email
   ├─ Calculate confidence score
   └─ Decision:
      ├─ >= 0.80 → Auto-merge
      ├─ 0.45-0.80 → Manual review queue
      └─ < 0.45 → Create new profile

5. Profile Service
   ├─ Update/create customer_profile
   ├─ Link event in events table
   └─ Return event_id
```

### 2. Identity Resolution Flow

```
Input: New event with identifiers

Step 1: Hash Generation
  phone: "+919876543210" → SHA256 → "abc123..."
  email: "user@example.com" → SHA256 → "def456..."

Step 2: Exact Matching
  SELECT profile_id FROM profile_identifier
  WHERE (type = 'phone' AND value_hash = 'abc123...')
     OR (type = 'email' AND value_hash = 'def456...')

Step 3: Fuzzy Matching (if multiple or no matches)
  For each candidate profile:
    - Compare name similarity (Levenshtein)
    - Compare email username
    - Check purchase overlap
    - Calculate weighted score

Step 4: Merge Decision
  IF score >= 0.80:
    - Take snapshot of both profiles
    - Merge identifiers into target profile
    - Mark source profile as merged
    - Log to identity_merge_log
  ELSE IF score >= 0.45:
    - Add to manual review queue
  ELSE:
    - Create new profile

Step 5: Event Linking
  INSERT INTO events (profile_id, raw_event_id, ...)
```

### 3. Merge Snapshot & Rollback

```sql
-- Before Merge: Take Snapshot
INSERT INTO identity_merge_log (
  source_profile_id,
  target_profile_id,
  source_snapshot,
  target_snapshot,
  scoring_details,
  confidence_score
) VALUES (
  'profile_a_id',
  'profile_b_id',
  '{"id": "...", "first_name": "...", ...}',  -- Full JSON dump
  '{"id": "...", "first_name": "...", ...}',
  '{"phone_match": 1.0, "name_similarity": 0.85, ...}',
  0.92
);

-- Perform Merge
BEGIN;
  UPDATE profile_identifier SET profile_id = 'profile_b_id'
  WHERE profile_id = 'profile_a_id';
  
  UPDATE customer_profile SET is_merged = true, merged_into = 'profile_b_id'
  WHERE id = 'profile_a_id';
COMMIT;

-- Rollback (if needed)
BEGIN;
  -- Restore source profile from snapshot
  UPDATE customer_profile SET ... FROM identity_merge_log.source_snapshot
  WHERE id = source_profile_id;
  
  -- Restore identifiers
  UPDATE profile_identifier SET profile_id = source_profile_id
  WHERE ...;
  
  -- Mark as rolled back
  UPDATE identity_merge_log SET rolled_back = true WHERE id = ...;
COMMIT;
```

---

## Database Schema Design

### Key Design Decisions

1. **Identifiers are Separate**
   - `profile_identifier` table instead of columns in `customer_profile`
   - Allows multiple identifiers per type (e.g., 2 phone numbers)
   - Easier to track identifier history

2. **Hashed Identifiers**
   - `value_hash` column stores SHA256 hash
   - Fast matching without exposing raw data
   - Index on `(type, value_hash)` for O(1) lookups

3. **Raw vs Normalized Events**
   - `customer_raw_event` = exactly what we received (immutable)
   - `events` = normalized, enriched, linked to profile
   - Allows reprocessing if logic changes

4. **pgvector for AI**
   - `customer_profile.embedding` stores 768-dim vector
   - Used for semantic search and similarity
   - AI Assistant queries use cosine similarity

5. **Merge Log as Audit Trail**
   - Complete snapshots of both profiles
   - Scoring details for transparency
   - Rollback capability without complicated logic

---

## API Design Patterns

### 1. Standardized Error Responses

All errors return:

```json
{
  "error": {
    "message": "Human-readable message",
    "code": "MACHINE_READABLE_CODE",
    "request_id": "req_abc123..."
  }
}
```

Error codes:
- `UNAUTHORIZED` — Invalid/missing API key
- `RATE_LIMIT_EXCEEDED` — Too many requests
- `VALIDATION_ERROR` — Invalid input schema
- `NOT_FOUND` — Resource not found
- `INTERNAL_ERROR` — Server error

### 2. Request Tracing

Every request gets:
- `request_id` — Unique per request
- `correlation_id` — Tracks across services
- Both are logged in structured format

### 3. Pagination

All list endpoints support:

```
GET /v1/merge-logs?page=1&limit=50
```

Response:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1234,
    "total_pages": 25
  }
}
```

---

## Security Architecture

### 1. Authentication
- **API Keys** in `Authorization` header
- Keys stored as comma-separated list in env
- No user sessions (stateless)

### 2. Rate Limiting
- **100 requests per minute** per IP
- Uses `express-rate-limit`
- Can be backed by Redis for distributed rate limiting

### 3. Data Privacy
- Phone/email hashed before storage
- Only hashes are indexed
- Raw values encrypted at rest (future: pgcrypto)

### 4. Audit Logging
- Every merge logged with reason
- Every API call logged with request_id
- All logs include timestamp + user context

---

## Scalability Considerations

### Phase 1 (Current)
- Single API Gateway
- Single Postgres instance
- Single Redis instance
- Target: **1,000 requests/minute**, **10M profiles**

### Phase 2+ (Future)
- Multiple API Gateway instances (load balanced)
- Read replicas for Postgres
- Redis cluster for distributed caching
- Event queue (RabbitMQ/Kafka) for async processing
- Target: **100,000 requests/minute**, **500M profiles**

---

## Observability

### Logging
- **Structured JSON logs** (via Pino)
- Fields: `timestamp`, `level`, `service`, `request_id`, `message`
- Shipped to centralized logging (future: ELK/Datadog)

### Metrics (Future)
- Request latency (p50, p95, p99)
- Error rate
- Database query time
- Cache hit rate
- Identity merge accuracy

### Tracing (Future)
- Distributed tracing with OpenTelemetry
- Trace requests across services
- Identify bottlenecks

---

## Technology Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| **Language** | TypeScript | Type safety, modern syntax |
| **Runtime** | Node.js 20 | LTS, fast, great ecosystem |
| **Database** | PostgreSQL 15 | ACID, pgvector, proven scale |
| **Cache** | Redis 7 | Fast, simple, reliable |
| **Web Framework** | Express | Simple, well-documented |
| **Validation** | Zod | Type-safe schema validation |
| **Logging** | Pino | Fast structured logging |
| **Monorepo** | pnpm workspaces | Fast, space-efficient |
| **Container** | Docker | Consistent environments |

---

## Design Trade-offs

### 1. Synchronous Identity Resolution
**Decision:** Resolve identity immediately during event ingestion  
**Pro:** Real-time profile updates, immediate insights  
**Con:** Higher latency per event  
**Alternative:** Async processing with event queue (future)

### 2. Auto-Merge Threshold
**Decision:** Auto-merge at 0.80 confidence  
**Pro:** Reduces manual work  
**Con:** Risk of incorrect merges  
**Mitigation:** Full snapshots + rollback capability

### 3. Local AI Model
**Decision:** Use local LLM (Llama/Mistral) instead of OpenAI  
**Pro:** Data privacy, no API costs  
**Con:** Lower quality answers, more infrastructure  
**Mitigation:** RAG with citations prevents hallucination

### 4. PostgreSQL vs NoSQL
**Decision:** PostgreSQL for everything (not Mongo/DynamoDB)  
**Pro:** ACID, complex queries, pgvector for AI  
**Con:** Harder to scale horizontally  
**Mitigation:** Read replicas + partitioning later

---

## Future Enhancements

### Phase 3+
- [ ] Machine learning for merge scoring
- [ ] Real-time event streaming (Kafka)
- [ ] Segmentation engine
- [ ] Predictive LTV models
- [ ] Graph database for relationships
- [ ] Multi-region deployment

---

## References

- PRD: See `README.md`
- Setup: See `SETUP.md`
- API Docs: See `/docs/api` (future)

---

**For questions about architecture decisions, contact the engineering team.**

