#!/bin/bash
# 🚀 Complete Deployment Script
# Downloads fonts, builds app, verifies output, and deploys

set -e  # Exit on any error

echo "╔════════════════════════════════════════════════════════════╗"
echo "║        HR ID Card Generator - Complete Deployment         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Verify configuration
echo "🔍 Step 1/5: Verifying deployment configuration..."
echo "────────────────────────────────────────────────────────────"
bash verify-deployment.sh
if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Configuration verification failed!"
    echo "   Fix the errors above and try again."
    exit 1
fi
echo ""

# Step 2: Download fonts (if needed)
echo "📦 Step 2/5: Checking Roboto fonts..."
echo "────────────────────────────────────────────────────────────"
if [ -f "public/fonts/Roboto-Regular.woff2" ] && [ -f "public/fonts/Roboto-Medium.woff2" ] && [ -f "public/fonts/Roboto-Bold.woff2" ]; then
    echo "✅ All fonts already downloaded"
    echo ""
else
    echo "📥 Downloading fonts..."
    bash download_roboto_fonts.sh
    if [ $? -ne 0 ]; then
        echo "❌ Font download failed!"
        exit 1
    fi
    echo ""
fi

# Step 3: Install dependencies
echo "📦 Step 3/5: Installing dependencies..."
echo "────────────────────────────────────────────────────────────"
if [ ! -d "node_modules" ]; then
    echo "Installing npm packages..."
    npm install
else
    echo "✅ Dependencies already installed"
fi
echo ""

# Step 4: Build application
echo "🔨 Step 4/5: Building application..."
echo "────────────────────────────────────────────────────────────"
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed! Check errors above."
    exit 1
fi
echo "✅ Build successful!"
echo ""

# Step 5: Verify build output
echo "🔍 Step 5/5: Verifying build output..."
echo "────────────────────────────────────────────────────────────"

# Check dist folder
if [ ! -d "dist" ]; then
    echo "❌ dist/ folder not found!"
    exit 1
fi
echo "✅ dist/ folder exists"

# Check index.html
if [ ! -f "dist/index.html" ]; then
    echo "❌ dist/index.html not found!"
    exit 1
fi
echo "✅ dist/index.html exists"

# Check _redirects
if [ ! -f "dist/_redirects" ]; then
    echo "⚠️  Warning: dist/_redirects not found"
    echo "   Copying from public/..."
    cp public/_redirects dist/_redirects
fi
echo "✅ dist/_redirects exists"

# Check _headers
if [ ! -f "dist/_headers" ]; then
    echo "⚠️  Warning: dist/_headers not found"
    echo "   Copying from public/..."
    cp public/_headers dist/_headers
fi
echo "✅ dist/_headers exists"

# Check fonts
if [ -d "dist/fonts" ]; then
    DIST_FONT_COUNT=$(ls dist/fonts/*.woff2 2>/dev/null | wc -l)
    if [ $DIST_FONT_COUNT -eq 3 ]; then
        echo "✅ All 3 fonts in dist/fonts/"
    else
        echo "⚠️  Warning: Only $DIST_FONT_COUNT fonts in dist/"
    fi
else
    echo "⚠️  Warning: dist/fonts/ not found"
    echo "   Copying from public/..."
    cp -r public/fonts dist/fonts
fi

# Check assets
if [ -d "dist/assets" ]; then
    echo "✅ dist/assets/ folder exists"
else
    echo "❌ dist/assets/ not found!"
    exit 1
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              ✅ BUILD COMPLETE & VERIFIED!                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Show dist size
echo "📦 Build size:"
du -sh dist/
echo ""

# Show deployment options
echo "🚀 Ready to deploy! Choose your platform:"
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║   DEPLOYMENT COMMANDS                                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "  📘 Netlify:"
echo "     netlify deploy --prod --dir=dist"
echo ""
echo "  ▲ Vercel:"
echo "     vercel --prod"
echo ""
echo "  🎨 Render:"
echo "     git add ."
echo "     git commit -m \"Deploy build\""
echo "     git push origin main"
echo ""
echo "  🧪 Test locally first:"
echo "     npx vite preview"
echo "     # Then visit: http://localhost:4173"
echo ""

# Ask user which platform
read -p "Deploy now? (netlify/vercel/test/skip) [skip]: " DEPLOY_CHOICE
DEPLOY_CHOICE=${DEPLOY_CHOICE:-skip}

case $DEPLOY_CHOICE in
    netlify)
        echo ""
        echo "🚀 Deploying to Netlify..."
        netlify deploy --prod --dir=dist
        ;;
    vercel)
        echo ""
        echo "🚀 Deploying to Vercel..."
        vercel --prod
        ;;
    test)
        echo ""
        echo "🧪 Starting local preview server..."
        echo "   Open: http://localhost:4173"
        npx vite preview
        ;;
    *)
        echo ""
        echo "✅ Build complete! Deploy manually when ready."
        ;;
esac

echo ""
echo "🎉 All done!"
