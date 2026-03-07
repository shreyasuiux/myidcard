#!/bin/bash

# 🔧 Deployment Fix Script
# Fixes routing and prepares for deployment

echo "🚀 Fixing deployment configuration..."
echo ""

# Step 1: Remove old directories
echo "📁 Step 1: Removing old directory structures..."
if [ -d "public/_redirects" ]; then
  rm -rf public/_redirects
  echo "   ✅ Removed public/_redirects directory"
else
  echo "   ℹ️  public/_redirects directory not found (might be already fixed)"
fi

if [ -d "public/_headers" ]; then
  rm -rf public/_headers
  echo "   ✅ Removed public/_headers directory"
else
  echo "   ℹ️  public/_headers directory not found (might be already fixed)"
fi

echo ""

# Step 2: Rename files
echo "📝 Step 2: Creating proper configuration files..."

if [ -f "public/redirects.txt" ]; then
  mv public/redirects.txt public/_redirects
  echo "   ✅ Created public/_redirects"
else
  echo "   ❌ public/redirects.txt not found!"
  exit 1
fi

if [ -f "public/headers.txt" ]; then
  mv public/headers.txt public/_headers
  echo "   ✅ Created public/_headers"
else
  echo "   ❌ public/headers.txt not found!"
  exit 1
fi

echo ""

# Step 3: Verify files
echo "🔍 Step 3: Verifying configuration files..."

if [ -f "public/_redirects" ]; then
  echo "   ✅ public/_redirects exists and is a file"
  echo "   Content preview:"
  head -n 3 public/_redirects | sed 's/^/      /'
else
  echo "   ❌ public/_redirects is not a file!"
  exit 1
fi

if [ -f "public/_headers" ]; then
  echo "   ✅ public/_headers exists and is a file"
  echo "   Content preview:"
  head -n 3 public/_headers | sed 's/^/      /'
else
  echo "   ❌ public/_headers is not a file!"
  exit 1
fi

echo ""

# Step 4: Check other config files
echo "📋 Step 4: Checking platform configuration files..."

if [ -f "vercel.json" ]; then
  echo "   ✅ vercel.json exists (Vercel deployment ready)"
else
  echo "   ⚠️  vercel.json not found (needed for Vercel)"
fi

if [ -f "netlify.toml" ]; then
  echo "   ✅ netlify.toml exists (Netlify deployment ready)"
else
  echo "   ⚠️  netlify.toml not found (needed for Netlify)"
fi

echo ""
echo "✅ Deployment configuration fixed!"
echo ""
echo "Next steps:"
echo "1. Commit and push these changes"
echo "2. Deploy to your hosting platform"
echo "3. Test routing by:"
echo "   - Navigate to any page"
echo "   - Refresh the page (should NOT show 404)"
echo "   - Access pages directly via URL"
echo ""
echo "If background removal fails after deployment:"
echo "1. Go to Settings → Professional Background Removal"
echo "2. Add your remove.bg API key"
echo "3. Get free API key at: https://www.remove.bg/api"
echo ""
echo "For more help, see: DEPLOYMENT_FIX_GUIDE.md"
