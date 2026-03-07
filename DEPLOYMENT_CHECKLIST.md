# ☑️ DEPLOYMENT CHECKLIST

Use this checklist to ensure successful deployment.

---

## 📦 PRE-DEPLOYMENT

### **1. Run Fix Script**
- [ ] **Linux/Mac:** `chmod +x fix-deployment.sh && ./fix-deployment.sh`
- [ ] **Windows:** Run `fix-deployment.bat`
- [ ] Script completes without errors

### **2. Verify Files**
- [ ] `public/_redirects` is a **file** (not folder)
- [ ] `public/_headers` is a **file** (not folder)
- [ ] `vercel.json` exists in project root
- [ ] `netlify.toml` exists in project root

### **3. Manual Verification**
```bash
# Check file types (should say "ASCII text")
file public/_redirects
file public/_headers

# Check contents (should show routing rules)
cat public/_redirects
```

### **4. Git Commit**
- [ ] All changes committed
- [ ] Changes pushed to repository
```bash
git add .
git commit -m "Fix: Deployment routing and background removal"
git push
```

---

## 🚀 DEPLOYMENT

### **Choose Your Platform:**

#### **Option A: Netlify**
- [ ] Connect GitHub repository
- [ ] Build command: `npm run build`
- [ ] Publish directory: `dist`
- [ ] Deploy

#### **Option B: Vercel**
- [ ] Connect GitHub repository
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Deploy

#### **Option C: Manual**
- [ ] Run `npm run build` locally
- [ ] Upload `dist` folder to hosting
- [ ] Configure server for SPA routing

---

## ✅ POST-DEPLOYMENT TESTING

### **1. Routing Test (CRITICAL)**
- [ ] Visit homepage: `https://yoursite.com/`
- [ ] Navigate to a different page
- [ ] **Refresh the page (F5)** - Should NOT show 404
- [ ] Direct URL access: `https://yoursite.com/dashboard` - Should work
- [ ] Try all routes in your app
- [ ] All pages load correctly

### **2. Background Removal Test**
- [ ] Go to Single Employee form
- [ ] Upload a photo with a clear face
- [ ] Photo uploads successfully
- [ ] Background is removed
- [ ] Face is NOT cut off
- [ ] Preview shows processed photo

### **3. If Background Removal Fails:**
- [ ] Open browser console (F12)
- [ ] Note the error message
- [ ] Go to Settings → Professional Background Removal
- [ ] Add remove.bg API key (get at https://www.remove.bg/api)
- [ ] Try upload again
- [ ] Should work 100%

### **4. Browser Console Check**
- [ ] Open browser console (F12)
- [ ] Look for these success messages:
  ```
  ✓ ONNX Runtime configured for PRODUCTION
  ✓ Background removal library configured
  ✓ Face detected for protection
  ✓ Background removal complete
  ```
- [ ] No red error messages
- [ ] No CORS errors

### **5. Cross-Browser Testing**
- [ ] Chrome/Edge - Works?
- [ ] Firefox - Works?
- [ ] Safari - Works?
- [ ] Mobile browser - Works?

---

## 🐛 TROUBLESHOOTING

### **If Routing Broken (404 Errors):**

#### **Check A: File Type**
```bash
# Should output "ASCII text", NOT "directory"
file public/_redirects
```
- [ ] Is a file, not folder

#### **Check B: File Content**
```bash
cat public/_redirects
# Should show: /*    /index.html   200
```
- [ ] Contains routing rules

#### **Check C: Build Output**
```bash
# After build, check dist folder
ls -la dist/
# Should contain _redirects and _headers
```
- [ ] `_redirects` in dist folder
- [ ] `_headers` in dist folder

#### **Fix Steps:**
1. [ ] Delete `public/_redirects` folder if it exists
2. [ ] Delete `public/_headers` folder if it exists
3. [ ] Rename `public/redirects.txt` to `public/_redirects`
4. [ ] Rename `public/headers.txt` to `public/_headers`
5. [ ] Rebuild: `npm run build`
6. [ ] Redeploy

---

### **If Background Removal Broken:**

#### **Check A: Console Errors**
- [ ] Open browser console (F12)
- [ ] Look for error messages
- [ ] Note the error type

#### **Common Errors & Fixes:**

**Error: CORS policy**
- [ ] Add remove.bg API key in Settings

**Error: WebAssembly**
- [ ] Add remove.bg API key in Settings

**Error: Failed to fetch model**
- [ ] Add remove.bg API key in Settings

**Error: Face gets cut off**
- [ ] Already fixed with face-aware protection
- [ ] If still happens, add remove.bg API key

#### **Fix Steps:**
1. [ ] Go to Settings (gear icon)
2. [ ] Scroll to "Professional Background Removal"
3. [ ] Get free API key: https://www.remove.bg/api
4. [ ] Paste key and save
5. [ ] Try upload again
6. [ ] Should work 100%

---

## 📊 SUCCESS CRITERIA

Your deployment is successful when:

### **✅ Routing:**
- [ ] All pages load correctly
- [ ] Page refresh works (no 404)
- [ ] Direct URL access works
- [ ] Back/forward buttons work
- [ ] No routing errors in console

### **✅ Background Removal:**
- [ ] Photos upload successfully
- [ ] Background is removed cleanly
- [ ] Face is preserved (not cut off)
- [ ] No console errors during upload
- [ ] Preview shows processed photo

### **✅ Overall:**
- [ ] No 404 errors
- [ ] No console errors
- [ ] All features work as expected
- [ ] Performance is acceptable
- [ ] Mobile responsive

---

## 🎉 WHEN EVERYTHING WORKS

Congratulations! Your deployment is successful.

### **Optional Improvements:**
- [ ] Add remove.bg API key for 100% reliability
- [ ] Test with large batch uploads
- [ ] Monitor browser console for warnings
- [ ] Collect user feedback
- [ ] Plan for future updates

### **Maintenance:**
- [ ] Keep dependencies updated
- [ ] Monitor API usage (if using remove.bg)
- [ ] Check error logs periodically
- [ ] Backup data regularly

---

## 📚 DOCUMENTATION REFERENCE

If you need more help:

- **Quick Fix:** `DEPLOYMENT_QUICK_FIX.md`
- **Complete Guide:** `DEPLOYMENT_FIX_GUIDE.md`
- **BG Removal Details:** `BACKGROUND_REMOVAL_FIX.md`
- **Summary:** `DEPLOYMENT_COMPLETE.md`

---

## 🆘 NEED HELP?

### **Routing Issues:**
See: `DEPLOYMENT_FIX_GUIDE.md` → "ISSUE #1: ROUTING FIX"

### **Background Removal Issues:**
See: `DEPLOYMENT_FIX_GUIDE.md` → "ISSUE #2: BACKGROUND REMOVAL FIX"

### **Platform-Specific:**
See: `DEPLOYMENT_FIX_GUIDE.md` → "DEPLOYMENT PLATFORMS"

---

## ✅ FINAL CHECKS

Before marking as complete:

- [ ] Routing works (refresh, direct URLs)
- [ ] Background removal works
- [ ] No console errors
- [ ] Tested on multiple browsers
- [ ] Tested on mobile
- [ ] Documentation reviewed
- [ ] API key added (optional but recommended)

---

**Deployment Status:**
- [ ] ❌ Not started
- [ ] 🟡 In progress
- [ ] ✅ Complete and tested

---

**Date Deployed:** _________________

**Platform:** _________________

**Issues Encountered:** _________________

**Resolution:** _________________

---

🎉 **Ready to deploy? Start from the top and check off each item!**
