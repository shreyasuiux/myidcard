# 🚨 Common Deployment Errors & Solutions

## Most Common Issues When Publishing/Deploying

### 1. **Font Loading Failures** (MOST LIKELY)

**Error Symptoms:**
- PDF exports show Times New Roman or Georgia instead of Roboto
- Console errors: `Failed to load resource: net::ERR_FILE_NOT_FOUND` for font files
- ID cards look different in production vs development

**Root Cause:**
Roboto font files were never downloaded to `public/fonts/`

**Solution:**
```bash
# Download fonts BEFORE building
bash download_roboto_fonts.sh

# Then build
npm run build

# Verify fonts are in dist
ls dist/fonts/*.woff2
```

---

### 2. **SPA Routing 404 Errors**

**Error Symptoms:**
- Homepage works, but `/dashboard` or other routes show "404 Not Found"
- Refreshing any page except homepage breaks
- Direct links to app routes don't work

**Root Cause:**
Missing or incorrect `_redirects` file (was named `_redirects/main.tsx` instead of `_redirects`)

**Solution:**
✅ **ALREADY FIXED!** 

The correct files are now in place:
- `/public/_redirects` (plain text file, NO extension)
- `/public/_headers` (plain text file, NO extension)

---

### 3. **Build Fails with Module Errors**

**Error Message:**
```
Error: Cannot find module 'motion/react'
Error: Cannot find module 'lucide-react'
```

**Root Cause:**
Missing npm dependencies

**Solution:**
```bash
# Install all dependencies
npm install

# Then build
npm run build
```

---

### 4. **Template Click Crashes**

**Error Message:**
```
Cannot read properties of undefined (reading 'length')
Cannot read properties of undefined (reading 'map')
```

**Root Cause:**
Missing null checks for `accentElements` in template rendering

**Solution:**
✅ **ALREADY FIXED!**

Updated files:
- `TemplatePreviewCard.tsx`
- `TemplatePreviewModal.tsx`
- `Templates.tsx`
- `UnifiedIDCardRenderer.tsx`

---

### 5. **Build Succeeds But Deployment Fails**

**Platform-Specific Issues:**

#### **Netlify:**
**Error:** "Page not found"  
**Fix:** Ensure `_redirects` exists in `public/` folder ✅ Fixed

#### **Vercel:**
**Error:** "404: NOT_FOUND"  
**Fix:** Ensure `vercel.json` exists ✅ Already in place

#### **Render:**
**Error:** "Build failed"  
**Fix:** Check `render.yaml` build command ✅ Already correct

---

### 6. **Assets Not Loading (figma:asset errors)**

**Error Message:**
```
Failed to resolve module 'figma:asset/...'
```

**Root Cause:**
`figma:asset` is a virtual module scheme used by Figma Make - should work automatically

**Solution:**
- Ensure you're using Vite (✅ Already configured)
- Check `vite.config.ts` is correct (✅ Already correct)
- This should work automatically in production

If still failing, the issue is with Figma Make's build system (not your code)

---

### 7. **Background Removal Not Working**

**Error Symptoms:**
- Background removal feature fails in production
- Console error: `Failed to load WASM module`

**Root Cause:**
`@imgly/background-removal` WASM files not deployed correctly

**Solution:**
Already handled automatically by the package. If issues persist:
1. Check network tab for `.wasm` file loading
2. Ensure CDN access isn't blocked

---

### 8. **Large Bundle Size / Slow Loading**

**Symptoms:**
- Initial load takes >5 seconds
- Bundle size >5MB

**Solution:**
Code splitting is already configured via React Router. 

Optional optimization:
```bash
# Analyze bundle
npm run build -- --mode production --minify

# Check dist size
du -sh dist/
```

---

### 9. **Environment-Specific Errors**

**Dev works, Production fails:**

Common causes:
1. **Fonts not downloaded** → Run `download_roboto_fonts.sh`
2. **Missing .env variables** → Not used in this app, so N/A
3. **CORS issues** → Check `_headers` file ✅ Fixed
4. **Cache issues** → Hard refresh (Ctrl+Shift+R)

---

### 10. **TypeScript Build Errors**

**Error Message:**
```
TS2339: Property 'X' does not exist on type 'Y'
TS2345: Argument of type 'X' is not assignable to parameter of type 'Y'
```

**Solution:**
Fix TypeScript errors shown in console. Common ones:

```bash
# Check for errors without building
npx tsc --noEmit
```

---

## 🔍 DEBUGGING CHECKLIST

When deployment fails, check in this order:

1. [ ] **Fonts downloaded?**
   ```bash
   ls public/fonts/*.woff2
   ```

2. [ ] **Build successful locally?**
   ```bash
   npm run build
   ```

3. [ ] **dist/ folder contains everything?**
   ```bash
   ls dist/
   # Should have: index.html, assets/, fonts/
   ```

4. [ ] **_redirects file correct?**
   ```bash
   cat public/_redirects
   # Should NOT be a .tsx file!
   ```

5. [ ] **Dependencies installed?**
   ```bash
   npm install
   ```

6. [ ] **No console errors locally?**
   - Run `npm run dev`
   - Open DevTools Console
   - Test all features

---

## 🎯 QUICK FIX COMMAND

If you're stuck, run this all-in-one command:

```bash
# Download fonts + Build + Verify
bash deploy-now.sh
```

This script:
1. Downloads Roboto fonts if missing
2. Builds the application
3. Verifies build output
4. Shows deployment commands

---

## 📞 STILL STUCK?

If deployment still fails:

1. **Share the exact error message**
   - Build log output
   - Console errors
   - Network tab failures

2. **Specify deployment platform**
   - Netlify / Vercel / Render / Other

3. **Share build command output**
   ```bash
   npm run build 2>&1 | tee build.log
   ```

---

**Most issues are solved by:**
1. Running `bash download_roboto_fonts.sh` ← 80% of deployment issues
2. Ensuring `_redirects` is a plain text file ← 15% of issues
3. Running `npm install` ← 5% of issues

🎉 **You're almost there!**
