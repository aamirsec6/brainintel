#!/bin/bash
# Deploy Dashboard to Vercel

cd /Users/aamirhabibsaudagar/braintel/apps/dashboard

echo "🚀 Deploying to Vercel..."

# Deploy to production
vercel --prod --yes

echo "✅ Deployment complete!"
echo "📝 Setting environment variables..."

# Set environment variables
vercel env add NEXT_PUBLIC_API_URL production <<< "https://api-gateway-production-6d2f.up.railway.app"
vercel env add NEXT_PUBLIC_SUPABASE_URL production <<< "https://opemkjouudqqqvpchltl.supabase.co"
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<< "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZW1ram91dWRxcXF2cGNobHRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MzAzMTQsImV4cCI6MjA4MTEwNjMxNH0.XF9CdfwvJxSd1jvrT_Ql0u036y2Jf-R0XDOo4QJsJsA"

echo "✅ Environment variables set!"
echo "🌐 Your dashboard is live!"

