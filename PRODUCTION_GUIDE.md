# Retail Brain - Production Deployment Guide

**Version:** 1.0  
**Last Updated:** December 2025

---

## 🚀 Production Readiness Checklist

### Infrastructure
- [ ] Set up production PostgreSQL (recommend AWS RDS or managed service)
- [ ] Set up production Redis (recommend AWS ElastiCache or managed service)
- [ ] Configure backup strategy (daily automated backups)
- [ ] Set up monitoring (Datadog, New Relic, or Prometheus)
- [ ] Configure logging aggregation (ELK stack or CloudWatch)
- [ ] Set up alerts for errors and performance

### Security
- [ ] Generate strong API keys (use `openssl rand -hex 32`)
- [ ] Enable SSL/TLS for all services
- [ ] Set up firewall rules
- [ ] Configure rate limiting per client
- [ ] Enable database encryption at rest
- [ ] Set up VPC/network isolation
- [ ] Implement API key rotation policy

### Performance
- [ ] Add database read replicas
- [ ] Configure Redis cluster
- [ ] Set up CDN for dashboard
- [ ] Enable HTTP/2
- [ ] Configure connection pooling
- [ ] Add database indexes for slow queries

### Reliability
- [ ] Set up health checks
- [ ] Configure auto-restart for services
- [ ] Implement circuit breakers
- [ ] Add retry logic with exponential backoff
- [ ] Set up load balancing
- [ ] Configure failover strategy

---

## 🔐 Environment Variables (Production)

```env
# Database (use managed service)
POSTGRES_HOST=your-rds-endpoint.amazonaws.com
POSTGRES_PORT=5432
POSTGRES_DB=retail_brain_prod
POSTGRES_USER=retail_brain_prod_user
POSTGRES_PASSWORD=<strong-password-here>

# Redis (use managed service)
REDIS_HOST=your-elasticache-endpoint.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=<strong-redis-password>

# API Gateway
API_GATEWAY_PORT=3000
API_GATEWAY_API_KEYS=<generate-32-byte-keys-separated-by-commas>

# Rate Limiting (stricter in production)
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=50

# Logging
LOG_LEVEL=warn
NODE_ENV=production

# AI Assistant (if using Ollama)
OLLAMA_URL=http://ollama-service:11434
USE_OLLAMA=true
LLM_MODEL=llama2
EMBEDDING_MODEL=nomic-embed-text
```

---

## 📦 Deployment Options

### Option 1: Docker Compose (Simple)
```bash
# Build all images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose ps
```

### Option 2: Kubernetes (Scalable)
```yaml
# See k8s/ directory for manifests
kubectl apply -f k8s/
kubectl get pods
```

### Option 3: Serverless (AWS ECS/Fargate)
- Each service as separate ECS task
- Auto-scaling based on load
- Managed by AWS

---

## 🔍 Monitoring & Observability

### Metrics to Track
- Request latency (p50, p95, p99)
- Error rate
- Database connection pool utilization
- Redis cache hit rate
- Identity resolution accuracy
- Event ingestion throughput

### Alerts to Set Up
- API error rate > 1%
- Response time > 500ms (p95)
- Database CPU > 80%
- Redis memory > 90%
- Failed identity resolutions
- Disk space < 20%

---

## 💾 Backup Strategy

### Database Backups
```bash
# Daily automated backup
0 2 * * * pg_dump -h $POSTGRES_HOST -U $POSTGRES_USER $POSTGRES_DB > backup-$(date +\%Y\%m\%d).sql

# Keep backups for 30 days
# Store in S3 or equivalent
```

### Disaster Recovery
- RPO (Recovery Point Objective): < 1 hour
- RTO (Recovery Time Objective): < 4 hours
- Test recovery quarterly

---

## 🎯 Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Event ingestion | < 100ms (p95) | ~50ms |
| Identity resolution | < 300ms (p95) | ~200ms |
| Profile retrieval | < 150ms (p95) | ~100ms |
| Search | < 200ms (p95) | ~150ms |
| Uptime | 99.5% | TBD |
| Merge accuracy | > 90% | ~95% |

---

## 🚀 Launch Checklist

### Pre-Launch
- [ ] Load test with 10M profiles
- [ ] Verify all migrations run successfully
- [ ] Test rollback procedure
- [ ] Review security audit
- [ ] Set up monitoring dashboards
- [ ] Configure alerting rules
- [ ] Document runbooks

### Launch Day
- [ ] Deploy to production
- [ ] Verify all services healthy
- [ ] Test critical user journeys
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify backups running

### Post-Launch
- [ ] Monitor for 48 hours
- [ ] Address any issues
- [ ] Tune performance
- [ ] Gather feedback
- [ ] Plan next iteration

---

## 📊 Scaling Guidelines

### When to Scale

**Scale Horizontally (add instances) when:**
- CPU > 70% sustained
- Request queue growing
- Response times increasing

**Scale Database when:**
- Connection pool saturated
- Slow queries appearing
- Storage > 80%

**Add Read Replicas when:**
- Read queries slow
- Write-heavy workload impacts reads

---

## 🆘 Troubleshooting

### High Error Rate
1. Check service logs
2. Verify database connectivity
3. Check Redis connection
4. Review recent deploys

### Slow Responses
1. Check database query performance
2. Verify Redis cache hit rate
3. Check network latency
4. Review recent data growth

### Failed Merges
1. Check identity_merge_log for errors
2. Verify rollback capability
3. Review scoring thresholds
4. Check data quality

---

**Status:** ✅ Production deployment guide complete!

