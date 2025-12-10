#!/bin/bash

# Railway Setup Helper Script
# This script helps verify Railway configuration

set -e

echo "🚂 Railway Setup Verification"
echo "=============================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Install it:"
    echo "   npm i -g @railway/cli"
    exit 1
fi

echo "✅ Railway CLI installed"
echo ""

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "⚠️  Not logged in to Railway. Run: railway login"
    exit 1
fi

echo "✅ Logged in to Railway"
echo ""

# Check project status
echo "📊 Current Project Status:"
railway status

echo ""
echo "📋 Services Checklist:"
echo "----------------------"
echo ""
echo "Please verify in Railway Dashboard:"
echo ""
echo "1. ✅ PostgreSQL Database created"
echo "   - Variables: PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD"
echo ""
echo "2. ✅ Redis Database created (optional)"
echo "   - Variables: REDIS_HOST, REDIS_PORT, REDIS_PASSWORD"
echo ""
echo "3. ✅ API Gateway Service"
echo "   - Dockerfile Path: Dockerfile.api-gateway"
echo "   - Root Directory: ."
echo "   - Variables: POSTGRES_*, REDIS_*, API_GATEWAY_API_KEYS"
echo ""
echo "4. ✅ Event Collector Service"
echo "   - Dockerfile Path: Dockerfile.event-collector"
echo "   - Root Directory: ."
echo "   - Variables: POSTGRES_*"
echo ""
echo "5. ✅ MLflow Service"
echo "   - Docker Image: ghcr.io/mlflow/mlflow:v2.8.1"
echo "   - Variables: MLFLOW_BACKEND_STORE_URI, MLFLOW_DEFAULT_ARTIFACT_ROOT"
echo ""
echo "📖 See RAILWAY_FRESH_START.md for detailed setup instructions"
echo ""

