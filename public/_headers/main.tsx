# Netlify Headers Configuration
# Ensures proper caching and security for SPA

# Cache static assets
/assets/*
  Cache-Control: public, max-age=31536000, immutable

# Don't cache index.html (needed for SPA routing)
/index.html
  Cache-Control: no-cache, no-store, must-revalidate

# Font files
/fonts/*
  Cache-Control: public, max-age=31536000, immutable
  Access-Control-Allow-Origin: *
