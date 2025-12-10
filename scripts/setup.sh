#!/bin/bash

# Retail Brain - Quick Setup Script
# This script automates the initial setup process

set -e  # Exit on error

echo "🚀 Retail Brain - Quick Setup"
echo "==============================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version must be 20 or higher. Current: $(node -v)"
    exit 1
fi
echo "✅ Node.js $(node -v)"

if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Installing..."
    npm install -g pnpm
fi
echo "✅ pnpm $(pnpm -v)"

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker."
    exit 1
fi
echo "✅ Docker $(docker -v)"

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose."
    exit 1
fi
echo "✅ Docker Compose $(docker-compose -v)"

echo ""

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install
echo "✅ Dependencies installed"
echo ""

# Setup environment
if [ ! -f .env ]; then
    echo "⚙️  Setting up environment..."
    cp env.example .env
    echo "✅ Created .env file"
    echo "⚠️  Please edit .env and set:"
    echo "   - POSTGRES_PASSWORD"
    echo "   - API_GATEWAY_API_KEYS"
    echo ""
    read -p "Press Enter to continue after editing .env..."
else
    echo "✅ .env already exists"
fi
echo ""

# Start infrastructure
echo "🐳 Starting Docker containers..."
docker-compose up -d postgres redis
echo "✅ Postgres and Redis started"
echo ""

# Wait for Postgres
echo "⏳ Waiting for Postgres to be ready..."
sleep 5
until docker exec retail-brain-postgres pg_isready -U retail_brain_user > /dev/null 2>&1; do
    echo "   Still waiting..."
    sleep 2
done
echo "✅ Postgres is ready"
echo ""

# Run migrations
echo "🗄️  Running database migrations..."
node migrations/run.js
echo "✅ Migrations completed"
echo ""

# Build shared modules
echo "🔨 Building shared modules..."
pnpm -r --filter "@retail-brain/*" build
echo "✅ Shared modules built"
echo ""

# Final summary
echo ""
echo "✨ Setup Complete!"
echo "================="
echo ""
echo "📍 Next steps:"
echo ""
echo "1. Start API Gateway:"
echo "   docker-compose up api-gateway"
echo ""
echo "2. Test health endpoint:"
echo "   curl http://localhost:3000/health"
echo ""
echo "3. Read documentation:"
echo "   - README.md — Project overview"
echo "   - SETUP.md — Detailed setup guide"
echo "   - ARCHITECTURE.md — Technical details"
echo ""
echo "🎉 Happy building!"

