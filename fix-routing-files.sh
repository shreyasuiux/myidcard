#!/bin/bash
# 🔧 Fix Routing Files - Creates proper _redirects and _headers files
# This script removes any incorrect folder structures and creates proper plain text files

echo "🔧 Fixing routing configuration files..."
echo ""

# Remove old folder structures if they exist
echo "1️⃣ Cleaning up old files..."
if [ -d "public/_redirects" ]; then
    echo "   Removing _redirects folder..."
    rm -rf public/_redirects
fi

if [ -d "public/_headers" ]; then
    echo "   Removing _headers folder..."
    rm -rf public/_headers
fi

if [ -f "public/_redirects" ]; then
    echo "   Removing existing _redirects file..."
    rm -f public/_redirects
fi

if [ -f "public/_headers" ]; then
    echo "   Removing existing _headers file..."
    rm -f public/_headers
fi

echo "   ✅ Cleanup complete"
echo ""

# Create public directory if it doesn't exist
echo "2️⃣ Ensuring public/ directory exists..."
mkdir -p public
echo "   ✅ public/ directory ready"
echo ""

# Create _redirects file
echo "3️⃣ Creating _redirects file..."
cat > public/_redirects << 'EOF'
/*    /index.html   200
EOF

if [ -f "public/_redirects" ]; then
    echo "   ✅ _redirects created successfully"
    echo "   Content:"
    cat public/_redirects | sed 's/^/      /'
else
    echo "   ❌ Failed to create _redirects"
    exit 1
fi
echo ""

# Create _headers file
echo "4️⃣ Creating _headers file..."
cat > public/_headers << 'EOF'
/*
  Cache-Control: no-cache, no-store, must-revalidate

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/fonts/*
  Cache-Control: public, max-age=31536000, immutable
  Access-Control-Allow-Origin: *
EOF

if [ -f "public/_headers" ]; then
    echo "   ✅ _headers created successfully"
    echo "   Content:"
    cat public/_headers | sed 's/^/      /'
else
    echo "   ❌ Failed to create _headers"
    exit 1
fi
echo ""

# Verify files are plain text (not directories)
echo "5️⃣ Verifying file types..."

if [ -d "public/_redirects" ]; then
    echo "   ❌ ERROR: _redirects is still a directory!"
    exit 1
elif [ -f "public/_redirects" ]; then
    echo "   ✅ _redirects is a file"
else
    echo "   ❌ ERROR: _redirects not found!"
    exit 1
fi

if [ -d "public/_headers" ]; then
    echo "   ❌ ERROR: _headers is still a directory!"
    exit 1
elif [ -f "public/_headers" ]; then
    echo "   ✅ _headers is a file"
else
    echo "   ❌ ERROR: _headers not found!"
    exit 1
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              ✅ ROUTING FILES FIXED!                       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📁 Files created:"
echo "   • public/_redirects (plain text file)"
echo "   • public/_headers (plain text file)"
echo ""
echo "🚀 Next steps:"
echo "   1. Run: npm run build"
echo "   2. Verify: ls -la dist/_redirects dist/_headers"
echo "   3. Deploy: netlify deploy --prod --dir=dist"
echo ""
echo "✅ Your SPA routing will now work correctly!"
echo ""
