/**
 * PRODUCTION-STABLE Background Removal System
 * 
 * ARCHITECTURE:
 *   Primary:  PhotoRoom API (both single & bulk) - superior portrait quality
 *   Fallback: @imgly/background-removal WASM (single ONLY — never bulk)
 *
 * RULES ENFORCED:
 *   1. WASM never runs in bulk mode (memory crash prevention)
 *   2. WASM model loaded once, stored globally, reused
 *   3. Processed images cached by employeeId — never processed twice
 *   4. Export never calls this module — pure render only
 *   5. PhotoRoom: resize ≤1500px, FormData, 15s AbortController timeout
 *   6. Safari: canvas.toBlob() everywhere — no toDataURL on large images
 *   7. Single: PhotoRoom → WASM → original. Bulk: PhotoRoom → original (no WASM)
 *   8. Processed flag on every result — skip if already processed
 */

import { detectFaceForCropping, type FaceBox } from './photoCropper';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BGRemovalResult {
  file: File;
  blob: Blob;
  hadTransparency: boolean;
  facePreserved: boolean;
  /** RULE 8 — always true on successful return */
  processed: boolean;
  /** Which method succeeded */
  method: 'cached' | 'removebg' | 'wasm' | 'original' | 'transparent' | 'photoroom';
}

// ─── RULE 3 — Processed Image Cache ─────────────────────────────────────────
// Key: employeeId or file fingerprint
// Value: completed result
// Export MUST NOT re-process — it reads from employee.photoBase64 directly.

const processedCache = new Map<string, BGRemovalResult>();

export function getCachedResult(key: string): BGRemovalResult | null {
  return processedCache.get(key) ?? null;
}

export function setCachedResult(key: string, result: BGRemovalResult): void {
  processedCache.set(key, result);
}

export function hasCachedResult(key: string): boolean {
  return processedCache.has(key);
}

export function clearBGCache(): void {
  processedCache.clear();
}

// ─── RULE 2 — Singleton WASM Model ──────────────────────────────────────────
// Loaded once on first single-mode fallback. Never re-initialized.

let wasmRemoveBackground: ((input: File | Blob, config?: any) => Promise<Blob>) | null = null;
let wasmLoadPromise: Promise<void> | null = null;
let wasmLoadFailed = false;

async function getWasmModel(): Promise<typeof wasmRemoveBackground> {
  // If previously failed, don't retry within session
  if (wasmLoadFailed) return null;

  // Already loaded
  if (wasmRemoveBackground) return wasmRemoveBackground;

  // Currently loading — wait for it
  if (wasmLoadPromise) {
    await wasmLoadPromise;
    return wasmRemoveBackground;
  }

  // First load — initialize once
  wasmLoadPromise = (async () => {
    try {
      console.log('[BG] WASM: Loading model (one-time)...');

      // Configure ONNX before import
      if (typeof window !== 'undefined') {
        (window as any).ort = (window as any).ort || {};
        (window as any).ort.env = (window as any).ort.env || {};
        (window as any).ort.env.wasm = (window as any).ort.env.wasm || {};
        (window as any).ort.env.wasm.numThreads = 1;
        (window as any).ort.env.wasm.simd = true;
        (window as any).ort.env.wasm.proxy = false;
        (window as any).ort.env.wasm.wasmPaths =
          'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.14.0/dist/';
      }

      const lib = await Promise.race([
        import('@imgly/background-removal'),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('WASM import timeout (15s)')), 15000)
        ),
      ]);

      wasmRemoveBackground = lib.removeBackground;
      console.log('[BG] WASM: Model loaded successfully (singleton)');
    } catch (err) {
      wasmLoadFailed = true;
      wasmRemoveBackground = null;
      console.warn('[BG] WASM: Load failed — will not retry this session:', err);
    }
  })();

  await wasmLoadPromise;
  return wasmRemoveBackground;
}

// ─── RULE 5 — Safe PhotoRoom API Call ───────────────────────────────────────
// Resize ≤1500px, FormData, 15s abort timeout, graceful on missing key

async function safePhotoRoomAPI(file: File): Promise<BGRemovalResult> {
  const apiKey = localStorage.getItem('photoroom_api_key')?.trim();

  if (!apiKey) {
    throw new Error('PHOTOROOM_NO_KEY');
  }

  // Resize to max 1500px before sending (saves bandwidth, prevents timeouts)
  const resizedBlob = await resizeForAPI(file, 1500);

  const formData = new FormData();
  formData.append('image_file', resizedBlob, file.name);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    console.log('[BG] PhotoRoom: Calling API...');
    const response = await fetch('https://sdk.photoroom.com/v1/segment', {
      method: 'POST',
      headers: { 
        'x-api-key': apiKey,
      },
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`PhotoRoom ${response.status}: ${errorText || response.statusText}`);
    }

    const blob = await response.blob();
    const resultFile = new File(
      [blob],
      file.name.replace(/\\.\\w+$/, '.png'),
      { type: 'image/png', lastModified: Date.now() }
    );

    console.log('[BG] PhotoRoom: Success');
    return {
      file: resultFile,
      blob,
      hadTransparency: false,
      facePreserved: true,
      processed: true,
      method: 'photoroom',
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('PhotoRoom timeout (15s)');
    }
    throw err;
  }
}

// ─── RULE 6 — Safari-Safe Resize (toBlob, never toDataURL for large) ───────

function resizeForAPI(file: File, maxDim: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Skip resize if already small enough
      if (img.width <= maxDim && img.height <= maxDim) {
        resolve(file);
        return;
      }

      const scale = Math.min(maxDim / img.width, maxDim / img.height);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas context failed')); return; }

      ctx.drawImage(img, 0, 0, w, h);

      // RULE 6: toBlob, not toDataURL
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('toBlob failed'));
        },
        file.type === 'image/png' ? 'image/png' : 'image/jpeg',
        0.92
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image load failed for resize'));
    };

    img.src = url;
  });
}

// ─── WASM Processing (single mode only) ────────────────────────────────────

async function processWithWASM(file: File, faceBox?: FaceBox | null): Promise<BGRemovalResult> {
  const removeBackground = await getWasmModel();
  if (!removeBackground) {
    throw new Error('WASM model unavailable');
  }

  console.log('[BG] WASM: Processing image...');

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('WASM processing timeout (60s)')), 60000)
  );

  const blob = await Promise.race([
    removeBackground(file, {
      // Let the library use its default publicPath (staticimgly.com CDN)
      // DO NOT override to jsdelivr — the npm package has no resources.json
      output: { format: 'image/png', quality: 1.0, type: 'blob' },
      model: 'medium',
      device: 'cpu',
      // @ts-ignore
      numThreads: 1,
      fetchArgs: { mode: 'cors', cache: 'force-cache' },
      progress: (key: string, current: number, total: number) => {
        if (key === 'compute:inference') {
          console.log(`[BG] WASM inference: ${((current / total) * 100).toFixed(0)}%`);
        }
      },
    }),
    timeoutPromise,
  ]);

  // Post-process: clean artifacts (Safari-safe, uses toBlob)
  let refined = await smartCleanup(blob, faceBox);
  refined = await edgeRefinement(refined);

  const resultFile = new File(
    [refined],
    file.name.replace(/\.\w+$/, '.png'),
    { type: 'image/png', lastModified: Date.now() }
  );

  console.log('[BG] WASM: Success');
  return {
    file: resultFile,
    blob: refined,
    hadTransparency: false,
    facePreserved: true,
    processed: true,
    method: 'wasm',
  };
}

// ─── Transparency Detection ────────────────────────────────────────────────

async function hasTransparentBackground(file: File): Promise<boolean> {
  if (file.type !== 'image/png' && file.type !== 'image/webp') return false;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) { URL.revokeObjectURL(url); resolve(false); return; }

        const maxSize = 400;
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let total = 0;
        let transparent = 0;

        for (let i = 3; i < data.length; i += 4) {
          total++;
          if (data[i] === 0) transparent++;
        }

        URL.revokeObjectURL(url);
        resolve(transparent / total > 0.15);
      } catch {
        URL.revokeObjectURL(url);
        resolve(false);
      }
    };

    img.onerror = () => { URL.revokeObjectURL(url); resolve(false); };
    img.src = url;
  });
}

// ─── Smart Cleanup (RULE 6: toBlob only) ───────────────────────────────────

function smartCleanup(blob: Blob, faceBox?: FaceBox | null): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error('No context');

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imageData.data;
        const THRESHOLD = 180;

        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] < THRESHOLD) {
            d[i] = d[i + 1] = d[i + 2] = d[i + 3] = 0;
          } else {
            d[i + 3] = 255;
          }
        }

        ctx.putImageData(imageData, 0, 0);

        // Protect face region
        if (faceBox) {
          const { x, y, width, height } = faceBox;
          const safeX = Math.max(0, x);
          const safeY = Math.max(0, y);
          const safeW = Math.min(width, canvas.width - safeX);
          const safeH = Math.min(height, canvas.height - safeY);
          if (safeW > 0 && safeH > 0) {
            // Redraw face from original
            ctx.drawImage(img, safeX, safeY, safeW, safeH, safeX, safeY, safeW, safeH);
          }
        }

        canvas.toBlob(
          (out) => { URL.revokeObjectURL(url); out ? resolve(out) : reject(new Error('toBlob failed')); },
          'image/png', 1.0
        );
      } catch (e) { URL.revokeObjectURL(url); reject(e); }
    };

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Load failed')); };
    img.src = url;
  });
}

// ─── Edge Refinement (RULE 6: toBlob only) ─────────────────────────────────

function edgeRefinement(blob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error('No context');

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imageData.data;

        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] === 0) continue;

          const r = d[i], g = d[i + 1], b = d[i + 2];
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const sat = max === 0 ? 0 : (max - min) / max;

          // Remove obvious white/gray halos
          if (sat < 0.1 && max > 230) {
            d[i] = d[i + 1] = d[i + 2] = d[i + 3] = 0;
            continue;
          }

          // Remove green screen remnants
          if (g > r * 1.5 && g > b * 1.5 && (g - Math.max(r, b)) / 255 > 0.3) {
            d[i] = d[i + 1] = d[i + 2] = d[i + 3] = 0;
          }
        }

        ctx.putImageData(imageData, 0, 0);
        canvas.toBlob(
          (out) => { URL.revokeObjectURL(url); out ? resolve(out) : reject(new Error('toBlob failed')); },
          'image/png', 1.0
        );
      } catch (e) { URL.revokeObjectURL(url); reject(e); }
    };

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Load failed')); };
    img.src = url;
  });
}

// ─── Build "original" fallback result ──────────────────────────────────────

function buildOriginalResult(file: File): BGRemovalResult {
  return {
    file,
    blob: file,
    hadTransparency: false,
    facePreserved: true,
    processed: true,
    method: 'original',
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * SINGLE EMPLOYEE MODE
 * 
 * Pipeline: cache → transparency check → PhotoRoom → WASM fallback → original
 * 
 * Used by: SingleEmployeeForm, EditEmployeeModal, BulkEmployeeManager (individual re-upload)
 */
export async function removeImageBackground(
  file: File,
  faceBox?: FaceBox | null,
  cacheKey?: string
): Promise<BGRemovalResult> {
  console.log('[BG] Single mode — processing:', file.name);

  // RULE 3 & 8: Check cache first
  if (cacheKey && processedCache.has(cacheKey)) {
    console.log('[BG] Cache HIT:', cacheKey);
    return processedCache.get(cacheKey)!;
  }

  // Detect face if not provided
  if (!faceBox) {
    try {
      faceBox = await detectFaceForCropping(file);
    } catch { /* non-critical */ }
  }

  // Check existing transparency
  if (await hasTransparentBackground(file)) {
    console.log('[BG] Already transparent — skipping removal');
    const result: BGRemovalResult = {
      file,
      blob: file,
      hadTransparency: true,
      facePreserved: true,
      processed: true,
      method: 'transparent',
    };
    if (cacheKey) processedCache.set(cacheKey, result);
    return result;
  }

  // RULE 5: Try PhotoRoom first
  try {
    const result = await safePhotoRoomAPI(file);
    if (cacheKey) processedCache.set(cacheKey, result);
    return result;
  } catch (apiErr: any) {
    if (apiErr.message === 'PHOTOROOM_NO_KEY') {
      console.log('[BG] No PhotoRoom API key — trying WASM fallback');
    } else {
      console.warn('[BG] PhotoRoom failed:', apiErr.message, '— trying WASM fallback');
    }
  }

  // RULE 2 & 7: Try WASM once (singleton)
  try {
    const result = await processWithWASM(file, faceBox);
    if (cacheKey) processedCache.set(cacheKey, result);
    return result;
  } catch (wasmErr) {
    console.warn('[BG] WASM failed:', wasmErr);
  }

  // RULE 7: Use original with soft warning
  console.log('[BG] All methods failed — using original image');
  const fallback = buildOriginalResult(file);
  if (cacheKey) processedCache.set(cacheKey, fallback);
  return fallback;
}

/**
 * BULK MODE — RULE 1: NEVER use WASM
 *
 * Pipeline: cache → transparency check → PhotoRoom → FAIL (no WASM)
 *
 * If PhotoRoom fails, throws an error. Caller must:
 *   - Mark employee as failed (for BG removal)
 *   - Continue processing others
 *   - Show summary at end
 *
 * Used by: zipImageExtractor (bulk ZIP processing)
 */
export async function removeImageBackgroundBulk(
  file: File,
  employeeId: string
): Promise<BGRemovalResult> {
  console.log(`[BG] Bulk mode — processing: ${employeeId}`);

  // RULE 3 & 8: Check cache first
  if (processedCache.has(employeeId)) {
    console.log(`[BG] Cache HIT (bulk): ${employeeId}`);
    return processedCache.get(employeeId)!;
  }

  // Check existing transparency
  if (await hasTransparentBackground(file)) {
    console.log(`[BG] Already transparent (bulk): ${employeeId}`);
    const result: BGRemovalResult = {
      file,
      blob: file,
      hadTransparency: true,
      facePreserved: true,
      processed: true,
      method: 'transparent',
    };
    processedCache.set(employeeId, result);
    return result;
  }

  // RULE 1 & 5: Try PhotoRoom API ONLY — no WASM fallback
  try {
    const result = await safePhotoRoomAPI(file);
    processedCache.set(employeeId, result);
    return result;
  } catch (apiErr: any) {
    // RULE 1: Do NOT fall back to WASM — throw to caller
    if (apiErr.message === 'PHOTOROOM_NO_KEY') {
      throw new Error(`BG_SKIP_NO_KEY:${employeeId}`);
    }
    throw new Error(`BG_FAIL:${employeeId}:${apiErr.message}`);
  }
}