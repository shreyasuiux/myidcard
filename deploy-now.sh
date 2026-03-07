#!/bin/bash
# 🚀 One-Click Deployment Preparation Script
# This script prepares your app for deployment

set -e  # Exit on any error

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   HR ID Card Generator - Deployment Preparation            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Download Roboto Fonts
echo "📦 Step 1/3: Downloading Roboto fonts..."
echo "────────────────────────────────────────────────────────────"
if [ -f "public/fonts/Roboto-Regular.woff2" ] && [ -f "public/fonts/Roboto-Medium.woff2" ] && [ -f "public/fonts/Roboto-Bold.woff2" ]; then
    echo "✅ Fonts already downloaded!"
    ls -lh public/fonts/*.woff2
else
    bash download_roboto_fonts.sh
    if [ $? -ne 0 ]; then
        echo "❌ Font download failed!"
        exit 1
    fi
fi
echo ""

# Step 2: Build Application
echo "🔨 Step 2/3: Building application..."
echo "────────────────────────────────────────────────────────────"
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed! Check errors above."
    exit 1
fi
echo "✅ Build successful!"
echo ""

# Step 3: Verify Build Output
echo "🔍 Step 3/3: Verifying build output..."
echo "────────────────────────────────────────────────────────────"

# Check if dist folder exists
if [ ! -d "dist" ]; then
    echo "❌ dist/ folder not found!"
    exit 1
fi

# Check if fonts were copied
if [ ! -d "dist/fonts" ] || [ ! -f "dist/fonts/Roboto-Regular.woff2" ]; then
    echo "⚠️  Warning: Fonts not found in dist/fonts/"
    echo "   Fonts may not load correctly in production"
else
    echo "✅ Fonts found in dist/fonts/"
    ls -lh dist/fonts/*.woff2
fi

# Check if index.html exists
if [ ! -f "dist/index.html" ]; then
    echo "❌ index.html not found in dist/"
    exit 1
fi
echo "✅ index.html found"

# Check if assets folder exists
if [ ! -d "dist/assets" ]; then
    echo "❌ assets/ folder not found!"
    exit 1
fi
echo "✅ assets/ folder found"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              ✅ DEPLOYMENT READY!                          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📂 Build output: dist/"
echo ""
echo "🚀 Next steps - Choose your deployment platform:"
echo ""
echo "   Netlify:  netlify deploy --prod --dir=dist"
echo "   Vercel:   vercel --prod"
echo "   Render:   git push origin main (auto-deploys)"
echo ""
echo "💡 Tip: Test locally first with: npx vite preview"
echo ""
