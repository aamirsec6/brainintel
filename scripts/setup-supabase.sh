#!/bin/bash

# Supabase Setup Helper Script
# This script helps you set up Supabase for Retail Brain

echo "🚀 Retail Brain - Supabase Setup"
echo "================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
  echo "📝 Creating .env file from .env.example..."
  cp .env.example .env
  echo "✅ Created .env file"
  echo ""
fi

echo "📋 Supabase Setup Steps:"
echo ""
echo "1. Go to https://supabase.com and create a project"
echo "2. Get your connection string from Settings → Database"
echo "3. Get your API keys from Settings → API"
echo "4. Update your .env file with:"
echo ""
echo "   DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres"
echo "   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co"
echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key"
echo ""
echo "5. Enable pgvector extension in Supabase Dashboard → Database → Extensions"
echo "6. Run migrations using Supabase SQL Editor (see SUPABASE_QUICK_START.md)"
echo ""
echo "📚 Documentation:"
echo "   - Quick Start: SUPABASE_QUICK_START.md"
echo "   - Full Guide: SUPABASE_SETUP.md"
echo "   - Auth Setup: SUPABASE_AUTH_SETUP.md"
echo ""

