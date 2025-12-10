# Changelog

All notable changes to the Retail Brain platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Phase 3 (In Progress)
- Identity Engine service
- Exact identifier matching
- Fuzzy matching algorithm
- Profile merging with snapshots

---

## [0.2.0] - 2025-12-09

### Phase 2 - Event Pipeline ✅

#### Added
- Event Collector service
  - Express REST API
  - POST /events endpoint (working!)
  - Structured logging
  - Health check endpoint
- Event validation
  - Zod schema validation
  - Business rule validation
  - Timestamp validation
  - Email/phone format validation
  - Helpful error messages
- Event storage
  - Store raw events in `customer_raw_event` table
  - Quarantine invalid events
  - Track processing status
  - Request metadata capture
- Event normalization utilities
  - Phone number normalization
  - Email normalization
  - Identifier hashing (SHA256)
  - E-commerce field extraction
  - Session info extraction
- API Gateway integration
  - Route POST /v1/events to Event Collector
  - Forward request metadata
  - Service health dependency
- Testing
  - Unit tests for event validator
  - Unit tests for normalization
  - Integration test script (`test-events.sh`)
  - 6 test scenarios (valid + invalid events)
- Docker Compose
  - Event Collector service added
  - Service dependencies configured
  - Hot reload in development

#### Technical Details
- Event Collector runs on port 3001
- Validates events in <10ms
- Stores events with full audit trail
- Returns 202 Accepted for valid events
- Returns 400 with details for invalid events
- Quarantines malformed events

---

## [0.1.0] - 2025-12-09

### Phase 1 - Foundations ✅

#### Added
- Monorepo structure with pnpm workspaces
- Docker Compose setup (PostgreSQL 15 + Redis 7)
- Database migrations for 5 core tables:
  - `customer_profile` — Unified customer profiles
  - `profile_identifier` — Hashed identifiers
  - `customer_raw_event` — Raw event storage
  - `events` — Normalized events
  - `identity_merge_log` — Merge history with snapshots
- API Gateway service with:
  - API key authentication
  - Rate limiting (100 req/min)
  - Request ID generation
  - Structured logging
  - Error handling
  - Health check endpoint
- Shared modules:
  - `@retail-brain/db` — PostgreSQL client
  - `@retail-brain/types` — TypeScript interfaces
  - `@retail-brain/logger` — Pino structured logging
  - `@retail-brain/config` — Environment loader
  - `@retail-brain/validators` — Zod schemas
  - `@retail-brain/utils` — Common utilities
- Documentation:
  - README.md — Project overview
  - SETUP.md — Setup guide
  - ARCHITECTURE.md — Technical architecture
  - CHANGELOG.md — This file
- TypeScript strict mode configuration
- ESLint + Prettier setup
- pgvector extension for AI/ML features
- Migration runner script

#### Technical Details
- Node.js 20 LTS
- TypeScript 5.3+ (strict mode, no `any`)
- Express 4.18
- PostgreSQL 15 with pgcrypto + pgvector
- Redis 7
- Pino for logging
- Zod for validation

#### Infrastructure
- Docker containers for all services
- Health checks for Postgres and Redis
- Volume persistence for data
- Development hot-reload support

---

## Roadmap

### Phase 2 - Event Pipeline (Next)
- [ ] Event Collector service
- [ ] Schema validation with Zod
- [ ] Raw event storage
- [ ] Event normalization
- [ ] POST /v1/events endpoint

### Phase 3 - Identity Engine
- [ ] Exact identifier matching
- [ ] Fuzzy name/email matching
- [ ] Scoring algorithm
- [ ] Auto-merge logic
- [ ] Manual review queue
- [ ] Snapshot + rollback

### Phase 4 - Profile Service
- [ ] GET /v1/customer/:id
- [ ] GET /v1/customer/search
- [ ] Profile timeline
- [ ] LTV calculation

### Phase 5 - Recommender
- [ ] Rule-based recommendations
- [ ] Redis caching
- [ ] GET /v1/recommendations/:id

### Phase 6 - Dashboard
- [ ] Next.js dashboard app
- [ ] Customer 360 view
- [ ] Merge review UI
- [ ] Analytics home

### Phase 7 - AI Assistant
- [ ] Local LLM integration
- [ ] pgvector RAG pipeline
- [ ] Citation system
- [ ] Query interface

### Phase 8 - Onboarding
- [ ] CSV importer
- [ ] Webhook connectors
- [ ] Guided setup wizard

### Phase 9 - QA
- [ ] Unit tests
- [ ] Integration tests
- [ ] Load testing
- [ ] Observability

### Phase 10 - Production
- [ ] Live pilot readiness
- [ ] Monitoring
- [ ] Alerting
- [ ] Documentation

---

## Version History

| Version | Date | Phase | Status |
|---------|------|-------|--------|
| 0.1.0 | 2025-12-09 | Phase 1 | ✅ Complete |
| 0.2.0 | TBD | Phase 2 | 🔜 Next |

