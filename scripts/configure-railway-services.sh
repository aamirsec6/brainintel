#!/bin/bash

# Configure Railway Services with Correct Dockerfile Paths
# Run this script to set Dockerfile paths for each service

echo "🚂 Configuring Railway Services..."
echo ""

# Note: Railway CLI doesn't support setting variables directly
# You need to set these in Railway Dashboard or use Railway's web interface

echo "⚠️  Railway CLI doesn't support setting variables via command line."
echo ""
echo "Please configure each service manually in Railway Dashboard:"
echo ""
echo "1. API Gateway:"
echo "   - Go to retail-brain-api-gateway → Settings → Build"
echo "   - Dockerfile Path: services/api-gateway/Dockerfile"
echo "   - Docker Context: ."
echo ""
echo "2. Event Collector:"
echo "   - Go to retail-brain-event-collector → Settings → Build"
echo "   - Dockerfile Path: services/event-collector/Dockerfile"
echo "   - Docker Context: ."
echo ""
echo "3. Dashboard (if exists):"
echo "   - Go to retail-brain-dashboard → Settings → Build"
echo "   - Dockerfile Path: apps/dashboard/Dockerfile"
echo "   - Docker Context: ."
echo ""
echo "4. MLflow:"
echo "   - Go to retail-brain-mlflow → Settings → Build"
echo "   - Builder: Docker Image"
echo "   - Docker Image: ghcr.io/mlflow/mlflow:v2.8.1"
echo ""

echo "After configuring, Railway will auto-redeploy each service."
echo ""
echo "Or use Railway's web interface:"
echo "https://railway.app/project/8a1dfde0-005a-47d1-b660-bc46133fa8a9"

