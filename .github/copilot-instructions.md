# Copilot Instructions - ACC ID Cards

## Project Overview

**ACC ID Cards** is a React+Vite web application for generating, managing, and exporting professional ID cards with background-removed photos. It features a template-based design system, employee data management, bulk processing, and multi-format export (PDF, ZIP).

### Key Tech Stack
- **Frontend:** React 18 + TypeScript + Vite
- **UI:** Radix UI, MUI, Tailwind CSS
- **Key Libraries:** 
  - `@imgly/background-removal` - AI photo background removal
  - `html2canvas` + `jspdf` - PDF export
  - `react-router` - SPA routing
  - `react-hook-form` - Form management

### Critical Routing & Deployment Note
This is a **Single Page Application (SPA)** requiring SPA routing configuration:
- Files: `public/_redirects` (Netlify), `vercel.json` (Vercel), `netlify.toml`
- **MUST** exist and be configured for SPA—otherwise page refreshes return 404
- See [DEPLOYMENT_CHECKLIST.md](../DEPLOYMENT_CHECKLIST.md)

---

## Architecture: The Three Layers

### 1. Template Engine (`src/app/engine/`)
**Purpose:** Render ID card designs with element binding and data-driven layout.

**Key Concepts:**
- **TemplateDocument** ([types.ts](../src/app/engine/types.ts#L1-L60)): Schema defining card layout, elements, layers, bindings
- **DataBindings**: Map element properties (text, visibility, position) to live employee data
- **ElementRenderer**: Renders individual elements (text, images, shapes) respecting bindings
- **TemplateContext**: Central state management split into 4 contexts to prevent unnecessary re-renders:
  - `DocumentContext` - template structure (rarely changes)
  - `SelectionContext` - UI selection/drag/resize (high frequency)
  - `ConfigContext` - engine settings (set once)
  - `DataContext` - live form/employee data (per keystroke)

**Key Files:**
- [TemplateContext.tsx](../src/app/engine/context/TemplateContext.tsx) - State management
- [types.ts](../src/app/engine/types.ts) - Complete type system
- [registry.ts](../src/app/engine/registry.ts) - Element type handlers
- [TemplateEditorCanvas.tsx](../src/app/engine/TemplateEditorCanvas.tsx) - Canvas UI

### 2. Employee & Photo Pipeline (`src/app/utils/`)
**Purpose:** Handle photo processing, storage, and data management.

**Critical Flow:**
1. **Upload** → Photo file received
2. **Background Removal** ([backgroundRemoval.ts](../src/app/utils/backgroundRemoval.ts)) → Transparent PNG
3. **Face Detection** → Detect face bounding box
4. **Crop to 64×80px** ([photoCropper.ts](../src/app/utils/photoCropper.ts)) → Face-centered, exact dimensions
5. **Store as Base64** ([employeeStorage.ts](../src/app/utils/employeeStorage.ts)) → Save to localStorage

**Why 64×80px?** Exact dimensions for uniform ID card appearance. Photos are NEVER rescaled after cropping.

**Key Files:**
- [employeeStorage.ts](../src/app/utils/employeeStorage.ts) - localStorage CRUD for EmployeeRecord
- [backgroundRemoval.ts](../src/app/utils/backgroundRemoval.ts) - @imgly integration
- [photoCropper.ts](../src/app/utils/photoCropper.ts) - Face detection + exact crop
- [bulkUploadParser.ts](../src/app/utils/bulkUploadParser.ts) - Parse CSV/Excel

### 3. Export Engine (`src/app/utils/pdfExport.ts` + `freshExportRenderer.ts`)
**Purpose:** Convert card preview to high-quality PDF.

**Core Rule: Preview = Export**
- Cards rendered at 8x scale for crisp output (print-quality)
- `html2canvas` captures DOM as-is—NO rescaling or re-cropping
- Photo dimensions locked at 64×80px throughout pipeline
- PDF uses CR80 card standard: 85.6×53.98mm (153×244px)

**Bulk Export (HR-Optimized):**
- Input: N employees
- Output: 1 PDF with N+1 pages
  - Pages 1-N: Front cards (employee-specific)
  - Page N+1: Common back card (shared design)

**Key Files:**
- [pdfExport.ts](../src/app/utils/pdfExport.ts) - Entry point, validation chain
- [freshExportRenderer.ts](../src/app/utils/freshExportRenderer.ts) - Render card DOM for capture
- [exportValidation.ts](../src/app/utils/exportValidation.ts) - Validation pipeline
- [fontEmbedding.ts](../src/app/utils/fontEmbedding.ts) - Roboto font embedding

**See:** [EXPORT_ARCHITECTURE.md](../EXPORT_ARCHITECTURE.md), [EXPORT_SYSTEM_DOCUMENTATION.md](../EXPORT_SYSTEM_DOCUMENTATION.md)

---

## Data Flow: Employee → Preview → Export

```
User uploads photo
    ↓
[backgroundRemoval] → PNG with transparency
    ↓
[photoCropper] → 64×80px face-centered crop → Base64
    ↓
[employeeStorage.saveEmployee()] → localStorage EmployeeRecord
    ↓
IDCardPreview renders with <img src={photoBase64} />
    ↓
User triggers export
    ↓
[pdfExport] validates template + employee data
    ↓
[freshExportRenderer] renders DOM (8x scale)
    ↓
[html2canvas] captures rendered card
    ↓
[jsPDF] builds PDF with 64×80px photo AS-IS
```

---

## Routing Structure

**Routes** defined in [routes.tsx](../src/app/routes.tsx):
- `/login` - LoginPage
- `/dashboard` - DashboardPage (main app)
- `/engine-playground` - Development/testing
- `/` - Redirects to `/login`

**Key Auth Pattern:**
- Custom event `AUTH_CHANGE_EVENT` dispatched on auth state change
- Use `dispatchAuthChange()` to trigger re-validation across app

---

## Conventions & Patterns

### Component Naming
- **Pages:** `*Page.tsx` (e.g., `DashboardPage`)
- **Features:** Descriptive names (e.g., `BulkUpload`, `TemplateCardRenderer`)
- **Utilities:** Snake_case filenames (e.g., `employeeStorage.ts`)

### State Management
- **Context for:** Global state (template, selection, employee data)
- **Local useState:** Component-level UI state (modal open, loading)
- **localStorage:** Persistent employee records, template data

### Photo Handling (CRITICAL)
- **Always use `photoBase64`** from EmployeeRecord—pre-cropped at 64×80px
- **Rendering style:** `objectFit: 'none'` + `objectPosition: 'center center'`—NO transformation
- **In preview:** [IDCardDisplay.tsx](../src/app/components/IDCardDisplay.tsx)
- **In export:** [IDCardExportRenderer.tsx](../src/app/components/IDCardExportRenderer.tsx)

### Font Strategy
- **Primary:** Roboto (Figma constraint, must be embedded in PDFs)
- **Fallback:** Sans-serif system fonts (for UI)
- **Warning suppression:** [suppressWarnings.ts](../src/app/utils/suppressWarnings.ts) silences ONNX runtime warnings

### Performance
- **Memoization:** Use `React.memo()` for heavy renderers (e.g., `ElementRenderer`, `MemoizedIDCardPreview`)
- **Lazy elements:** Split vendor chunks via Vite (`react-vendor`, `ui-vendor`)
- **Photo caching:** [imageCache.ts](../src/app/utils/imageCache.ts) prevents re-fetching

---

## Build & Deploy

**Development:**
```bash
npm install
npm run dev          # Start Vite dev server (port 5173)
```

**Production:**
```bash
npm run build        # Build to dist/
```

**Deployment:**
- **Netlify:** Use `public/_redirects` file
- **Vercel:** Use `vercel.json`
- **Manual:** Configure server to rewrite all routes to `index.html` (SPA routing)

See [DEPLOYMENT_CHECKLIST.md](../DEPLOYMENT_CHECKLIST.md) for verification steps.

---

## Known Gotchas & Frequently Fixed Issues

1. **Page Refresh Returns 404**
   - Issue: SPA routing not configured
   - Fix: Ensure `_redirects` or `vercel.json` exists and is deployed
   - Check: [DEPLOYMENT_CHECKLIST.md](../DEPLOYMENT_CHECKLIST.md#-post-deployment-testing)

2. **Background Removal Cuts Off Face**
   - Issue: Face detection failed; crop is off-center
   - Fix: Verify `detectFaceForCropping()` in [photoCropper.ts](../src/app/utils/photoCropper.ts) returns valid bbox
   - Test: Use high-contrast photos with clear face

3. **Export PDF Looks Different Than Preview**
   - Issue: Preview uses screen rendering; export uses print rendering
   - Fix: Ensure both use identical `objectFit: 'none'` + `objectPosition: 'center center'`
   - Debug: Compare [IDCardDisplay.tsx](../src/app/components/IDCardDisplay.tsx) vs [IDCardExportRenderer.tsx](../src/app/components/IDCardExportRenderer.tsx)

4. **Fonts Not Embedded in PDF**
   - Issue: Roboto not loaded before PDF generation
   - Fix: Call `preloadRobotoFonts()` before export
   - See: [fontPreloader.ts](../src/app/utils/fontPreloader.ts), [fontEmbedding.ts](../src/app/utils/fontEmbedding.ts)

5. **ONNX Runtime WebAssembly Warnings**
   - Issue: Console spam about multi-threading
   - Fix: Already handled in [App.tsx](../src/app/App.tsx#L3-L11)—sets `ort.env.wasm.numThreads = 1`

---

## Important Documentation

- [EXPORT_SYSTEM_DOCUMENTATION.md](../EXPORT_SYSTEM_DOCUMENTATION.md) - PDF export rules, page structure
- [EXPORT_ARCHITECTURE.md](../EXPORT_ARCHITECTURE.md) - Photo pipeline, preview=export guarantee
- [DEPLOYMENT_CHECKLIST.md](../DEPLOYMENT_CHECKLIST.md) - Pre/post-deployment verification
- [TEMPLATE_SYSTEM_GUIDE.md](../TEMPLATE_SYSTEM_GUIDE.md) - Template editor walkthrough
- [PHOTO_PROCESSING_FLOW.md](../PHOTO_PROCESSING_FLOW.md) - Photo upload → crop → export flow

---

## Quick Command Reference

```bash
# Install + dev
npm i && npm run dev

# Build production
npm run build

# Deployment pre-check
chmod +x fix-deployment.sh && ./fix-deployment.sh

# Deploy script
./complete-deploy.sh
```

---

## Questions to Ask When Debugging

1. **Layout Issue?** Check `TemplateContext` split—which context is being updated?
2. **Photo Problem?** Is it a 64×80px crop issue, or a rendering style issue?
3. **Export Mismatch?** Compare preview render ([IDCardDisplay.tsx](../src/app/components/IDCardDisplay.tsx)) vs export render ([IDCardExportRenderer.tsx](../src/app/components/IDCardExportRenderer.tsx))
4. **Routing Broken?** Verify SPA config deployed; check browser console for 404s.
5. **Font Issues?** Check font preloading chain in [fontPreloader.ts](../src/app/utils/fontPreloader.ts).

---

*Last Updated: March 2026*
