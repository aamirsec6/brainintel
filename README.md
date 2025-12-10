# Retail Brain

**Omnichannel Identity & Customer Intelligence Platform**

Version: 1.0  
Architecture: Microservices (TypeScript)  
Database: PostgreSQL 15 + pgvector  
Cache: Redis 7+

---

## 🎯 Overview

Retail Brain is an enterprise-grade platform that unifies customer identity across all channels (e-commerce, POS, CRM, apps, WhatsApp, marketplaces) and generates a true **Customer 360** with:

- ✅ **Identity Graph** — Merge duplicates across phone, email, device, loyalty IDs
- ✅ **Customer 360 Profile** — Events, orders, preferences, predictions, timeline
- ✅ **Real-time Personalization** — Rule-based recommendations (ML-powered later)
- ✅ **Store Associate App** — Instant customer lookup with actionable insights
- ✅ **AI Assistant** — Query brand data using local LLM with RAG (no hallucination)
- ✅ **Premium Onboarding** — CSV import + SDK + webhooks + connectors

---

## 📐 Architecture

```
External Sources → API Gateway → Event Collector → Identity Engine → Profile Service
                       ↓                              ↓
                   Raw Event DB                 Merge Log + Snapshot
                       ↓                              ↓
                   Events DB ← Recommender ← Redis Cache
                       ↓
                 Dashboard / Store App / AI Assistant
```

### Services

| Service | Port | Purpose |
|---------|------|---------|
| **api-gateway** | 3000 | Auth, rate limiting, routing |
| **event-collector** | 3001 | Event validation & normalization |
| **identity-engine** | 3002 | Fuzzy matching & merge decisions |
| **profile-service** | 3003 | Customer profiles & search |
| **recommender-service** | 3004 | Personalized recommendations |
| **onboarding-service** | 3005 | CSV import & connectors |
| **ai-assistant-service** | 3006 | Local LLM + RAG queries |

### Shared Modules

- `@retail-brain/db` — PostgreSQL client with transaction support
- `@retail-brain/types` — TypeScript interfaces for all entities
- `@retail-brain/logger` — Structured JSON logging (Pino)
- `@retail-brain/config` — Environment variable loader
- `@retail-brain/validators` — Zod schema validators
- `@retail-brain/utils` — Hashing, normalization, string similarity

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+
- **pnpm** 8+
- **Docker** & Docker Compose

### 1. Clone & Install

```bash
git clone <repo-url>
cd braintel
pnpm install
```

### 2. Configure Environment

```bash
cp env.example .env
# Edit .env with your configuration
```

**Critical variables:**

```env
POSTGRES_PASSWORD=your_secure_password
API_GATEWAY_API_KEYS=your_api_key_1,your_api_key_2
```

### 3. Start Services

```bash
docker-compose up
```

This will start:
- PostgreSQL (port 5432)
- Redis (port 6379)
- API Gateway (port 3000)

### 4. Run Migrations

```bash
pnpm db:migrate
```

### 5. Test API

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "api-gateway",
  "timestamp": "2025-12-09T..."
}
```

---

## 📊 Database Schema

### Core Tables

1. **customer_profile** — Unified customer profiles
2. **profile_identifier** — All identifiers (phone, email, device, etc.)
3. **customer_raw_event** — Raw events before processing
4. **events** — Normalized events linked to profiles
5. **identity_merge_log** — Complete merge history with snapshots

All migrations are in `/migrations/` and run automatically on startup.

---

## 🔐 Authentication

All API requests (except `/health`) require an API key:

```bash
curl -H "Authorization: Bearer your_api_key" \
  http://localhost:3000/v1/customer/search?phone=+919876543210
```

---

## 📡 API Endpoints (Phase 1)

### Health Check

```http
GET /health
```

No authentication required.

### Event Ingestion ✅ **NOW WORKING** (Phase 2)

```http
POST /v1/events
Authorization: Bearer <api_key>
Content-Type: application/json

{
  "source": "app",
  "event_type": "purchase",
  "event_ts": "2025-12-09T10:00:00Z",
  "identifiers": {
    "phone": "+919876543210",
    "email": "customer@example.com"
  },
  "payload": {
    "sku": "TSHIRT-123",
    "product_name": "Cool T-Shirt",
    "price": 999,
    "quantity": 1
  }
}
```

**Response (202 Accepted):**
```json
{
  "status": "accepted",
  "event_id": "d5f8c2a1-..."
}
```

**Error Response (400):**
```json
{
  "error": {
    "message": "Event validation failed",
    "code": "VALIDATION_ERROR",
    "details": {...}
  }
}
```

**Test it:**
```bash
bash scripts/test-events.sh
```

### Customer Profile (Coming in Phase 4)

```http
GET /v1/customer/{id}
GET /v1/customer/search?phone=&email=&device=
```

### Recommendations (Coming in Phase 5)

```http
GET /v1/recommendations/{profile_id}
```

### Merge Management (Coming in Phase 3)

```http
GET /v1/merge-logs
POST /v1/merge/manual
POST /v1/merge/rollback
```

---

## 🧠 Identity Engine

### Matching Algorithm

**Step 1: Exact Match**  
- Match on hashed fields: phone, email, device, loyalty_id

**Step 2: Fuzzy Match**  
- Name similarity (Levenshtein distance)
- Email username similarity
- Address overlap
- Purchase history overlap

**Step 3: Scoring**

```
score = 0.6 * phone_match
      + 0.4 * email_match
      + 0.3 * name_similarity
      + 0.4 * device_match
      + 0.2 * purchase_overlap
```

**Thresholds:**
- `>= 0.80` → Auto-merge
- `0.45 - 0.80` → Manual review queue
- `< 0.45` → Create new profile

**Step 4: Snapshot**  
Before every merge, both profiles are dumped to `identity_merge_log` for rollback.

---

## 🏗️ Development

### Build All Services

```bash
pnpm build
```

### Type Check

```bash
pnpm typecheck
```

### Lint & Format

```bash
pnpm lint
pnpm format
```

### Run Tests

```bash
pnpm test
```

---

## 📦 Monorepo Structure

```
/braintel
├── /services
│   ├── /api-gateway         ← Phase 1 ✅
│   ├── /event-collector     ← Phase 2
│   ├── /identity-engine     ← Phase 3
│   ├── /profile-service     ← Phase 4
│   ├── /recommender-service ← Phase 5
│   ├── /onboarding-service  ← Phase 8
│   └── /ai-assistant-service ← Phase 7
├── /apps
│   ├── /dashboard           ← Phase 6 (Next.js)
│   └── /store-associate     ← Phase 6 (Next.js)
├── /shared
│   ├── /db                  ← Phase 1 ✅
│   ├── /types               ← Phase 1 ✅
│   ├── /logger              ← Phase 1 ✅
│   ├── /config              ← Phase 1 ✅
│   ├── /validators          ← Phase 1 ✅
│   └── /utils               ← Phase 1 ✅
├── /migrations              ← Phase 1 ✅
├── docker-compose.yml       ← Phase 1 ✅
├── package.json
└── README.md
```

---

## 🗺️ Roadmap (Phased Delivery)

| Phase | Focus | Status |
|-------|-------|--------|
| **Phase 1** | Foundations (repo, Docker, migrations, API Gateway) | ✅ **DONE** |
| **Phase 2** | Event Pipeline (collector, validation, storage) | ✅ **DONE** |
| **Phase 3** | Identity Engine v0 (matching, scoring, merge) | 🔜 Next |
| **Phase 4** | Profile Service + Search | ⏳ Pending |
| **Phase 5** | Recommender + Redis | ⏳ Pending |
| **Phase 6** | Dashboard UI (Next.js) | ⏳ Pending |
| **Phase 7** | AI Assistant (RAG + Local LLM) | ⏳ Pending |
| **Phase 8** | Onboarding Wizard (CSV + Connectors) | ⏳ Pending |
| **Phase 9** | QA + Observability | ⏳ Pending |
| **Phase 10** | Live Pilot Readiness | ⏳ Pending |

---

## ✅ Phase 1 Done Criteria

- [x] Monorepo structure with pnpm workspaces
- [x] Docker Compose (Postgres + Redis)
- [x] All 5 core database tables migrated
- [x] API Gateway with authentication & rate limiting
- [x] Shared modules (db, types, logger, config, validators, utils)
- [x] Health check endpoint working
- [x] Structured logging (JSON format)
- [x] TypeScript strict mode (no `any`)

---

## 🛡️ Security & Reliability

- **API Key Authentication** — All routes protected except health
- **Rate Limiting** — 100 requests per minute per IP
- **ACID Transactions** — All profile merges are transactional
- **Merge Snapshots** — Full profile dumps before merge for rollback
- **Hashed Identifiers** — SHA256 hashing for privacy
- **Input Validation** — Strict Zod schemas for all inputs
- **Structured Logging** — Every request has request_id and correlation_id

---

## 🧪 Testing (Coming in Phase 9)

Tests will cover:
- Event validation
- Identifier normalization
- Fuzzy matching logic
- Merge scoring accuracy
- API route integration
- Database transactions
- AI assistant RAG retrieval

---

## 📝 License

Proprietary — All rights reserved.

---

## 🤝 Contributing

This is an internal project. For access or questions, contact the engineering team.

---

**Built with ❤️ for retail brands who want to truly know their customers.**

