#!/bin/bash
# 🔍 Deployment Verification Script
# Checks if all files are properly configured for deployment

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Deployment Configuration Verification                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

ERRORS=0
WARNINGS=0

# Check 1: _redirects file
echo "📝 Checking _redirects file..."
if [ -f "public/_redirects" ]; then
    echo "   ✅ public/_redirects exists (FILE)"
    
    # Check if it's actually a file, not a directory
    if [ -d "public/_redirects" ]; then
        echo "   ❌ ERROR: public/_redirects is a DIRECTORY (should be a FILE)"
        ERRORS=$((ERRORS + 1))
    else
        # Check content
        if grep -q "/*.*index.html.*200" public/_redirects; then
            echo "   ✅ SPA routing rule found"
        else
            echo "   ⚠️  WARNING: SPA routing rule might be missing"
            WARNINGS=$((WARNINGS + 1))
        fi
    fi
else
    echo "   ❌ ERROR: public/_redirects NOT FOUND"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 2: _headers file
echo "📝 Checking _headers file..."
if [ -f "public/_headers" ]; then
    echo "   ✅ public/_headers exists (FILE)"
    
    # Check if it's actually a file, not a directory
    if [ -d "public/_headers" ]; then
        echo "   ❌ ERROR: public/_headers is a DIRECTORY (should be a FILE)"
        ERRORS=$((ERRORS + 1))
    else
        echo "   ✅ Headers file is valid"
    fi
else
    echo "   ❌ ERROR: public/_headers NOT FOUND"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 3: Roboto fonts
echo "📝 Checking Roboto fonts..."
FONT_COUNT=0
if [ -f "public/fonts/Roboto-Regular.woff2" ]; then
    FONT_COUNT=$((FONT_COUNT + 1))
fi
if [ -f "public/fonts/Roboto-Medium.woff2" ]; then
    FONT_COUNT=$((FONT_COUNT + 1))
fi
if [ -f "public/fonts/Roboto-Bold.woff2" ]; then
    FONT_COUNT=$((FONT_COUNT + 1))
fi

if [ $FONT_COUNT -eq 3 ]; then
    echo "   ✅ All 3 Roboto fonts found"
    ls -lh public/fonts/*.woff2 | awk '{print "      " $9 " (" $5 ")"}'
elif [ $FONT_COUNT -gt 0 ]; then
    echo "   ⚠️  WARNING: Only $FONT_COUNT/3 fonts found"
    WARNINGS=$((WARNINGS + 1))
else
    echo "   ⚠️  WARNING: No Roboto fonts found"
    echo "      Run: bash download_roboto_fonts.sh"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 4: netlify.toml
echo "📝 Checking netlify.toml..."
if [ -f "netlify.toml" ]; then
    echo "   ✅ netlify.toml exists"
else
    echo "   ⚠️  WARNING: netlify.toml not found (optional)"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 5: vercel.json
echo "📝 Checking vercel.json..."
if [ -f "vercel.json" ]; then
    echo "   ✅ vercel.json exists"
else
    echo "   ⚠️  WARNING: vercel.json not found (optional)"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 6: React Router configuration
echo "📝 Checking React Router..."
if [ -f "src/app/routes.tsx" ]; then
    echo "   ✅ routes.tsx exists"
    
    # Check for wildcard route
    if grep -q "\*" src/app/routes.tsx; then
        echo "   ✅ Wildcard route configured"
    else
        echo "   ⚠️  WARNING: Wildcard route might be missing"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "   ❌ ERROR: src/app/routes.tsx NOT FOUND"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 7: Build command
echo "📝 Checking package.json..."
if [ -f "package.json" ]; then
    echo "   ✅ package.json exists"
    
    if grep -q '"build"' package.json; then
        echo "   ✅ Build script found"
    else
        echo "   ❌ ERROR: Build script missing"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "   ❌ ERROR: package.json NOT FOUND"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Summary
echo "╔════════════════════════════════════════════════════════════╗"
echo "║   VERIFICATION SUMMARY                                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "🎉 All checks passed! Ready to deploy!"
    echo ""
    echo "Next steps:"
    echo "  1. npm run build"
    echo "  2. netlify deploy --prod --dir=dist"
    echo ""
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "✅ No critical errors found"
    echo "⚠️  $WARNINGS warning(s) found (optional fixes)"
    echo ""
    echo "You can proceed with deployment, but consider fixing warnings."
    echo ""
    exit 0
else
    echo "❌ $ERRORS critical error(s) found"
    echo "⚠️  $WARNINGS warning(s) found"
    echo ""
    echo "❌ DEPLOYMENT WILL FAIL - Fix errors above first!"
    echo ""
    exit 1
fi
