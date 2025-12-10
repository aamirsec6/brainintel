#!/bin/bash

# Push Retail Brain to GitHub
# Usage: ./scripts/push-to-github.sh YOUR_GITHUB_USERNAME REPO_NAME

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: ./scripts/push-to-github.sh YOUR_GITHUB_USERNAME REPO_NAME"
  echo ""
  echo "Example: ./scripts/push-to-github.sh aamirhabibsaudagar braintel"
  echo ""
  echo "Or if you already have a repo URL:"
  echo "  git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git"
  echo "  git branch -M main"
  echo "  git push -u origin main"
  exit 1
fi

GITHUB_USERNAME=$1
REPO_NAME=$2
REPO_URL="https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"

echo "🚀 Pushing to GitHub..."
echo "Repository: ${REPO_URL}"
echo ""

# Add remote
echo "📡 Adding remote origin..."
git remote add origin "${REPO_URL}" 2>/dev/null || git remote set-url origin "${REPO_URL}"

# Set main branch
echo "🌿 Setting main branch..."
git branch -M main

# Push
echo "⬆️  Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Successfully pushed to GitHub!"
  echo "🌐 View your repo: ${REPO_URL}"
  echo ""
  echo "Next steps:"
  echo "1. Go to https://render.com"
  echo "2. Click 'New +' → 'Blueprint'"
  echo "3. Connect your GitHub account"
  echo "4. Select this repository"
  echo "5. Render will auto-detect render.yaml and deploy!"
else
  echo ""
  echo "❌ Push failed. Make sure:"
  echo "1. The repository exists on GitHub: ${REPO_URL}"
  echo "2. You have push access to the repository"
  echo "3. You're authenticated with GitHub (git config --global user.name and user.email)"
  echo ""
  echo "To create the repo on GitHub:"
  echo "1. Go to https://github.com/new"
  echo "2. Repository name: ${REPO_NAME}"
  echo "3. Choose Public or Private"
  echo "4. DO NOT initialize with README, .gitignore, or license"
  echo "5. Click 'Create repository'"
  echo "6. Then run this script again"
fi

