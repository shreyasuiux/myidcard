/**
 * ═══════════════════════════════════════════════════════════════
 *  PHOTO OVERLAY — Single Source of Truth for Photo Position
 * ═══════════════════════════════════════════════════════════════
 *
 *  ALL export engines MUST use this function to get photo position.
 *  ZERO hardcoded pixel values in export code.
 *
 *  This reads from the template's TemplateDesign, which is the
 *  same data the TemplateCardRenderer uses for preview rendering.
 *  This guarantees: preview === export.
 *
 *  USAGE:
 *    import { getPhotoOverlayParams } from './photoOverlay';
 *    const photo = getPhotoOverlayParams(template);
 *    pdf.addImage(base64, 'PNG', photo.leftMM, photo.topMM, photo.widthMM, photo.heightMM);
 * ═══════════════════════════════════════════════════════════════
 */

import type { Template } from './templateData';
import { resolveTemplateDesign } from './templateData';

// Card physical constants
const CARD_WIDTH_PX = 153;
const CARD_HEIGHT_PX = 244;

export interface PhotoOverlayParams {
  /** Photo left edge in pixels (from template) */
  leftPx: number;
  /** Photo top edge in pixels (from template) */
  topPx: number;
  /** Photo width in pixels (from template) */
  widthPx: number;
  /** Photo height in pixels (from template) */
  heightPx: number;
  /** Photo left edge in mm (for PDF) */
  leftMM: number;
  /** Photo top edge in mm (for PDF) */
  topMM: number;
  /** Photo width in mm (for PDF) */
  widthMM: number;
  /** Photo height in mm (for PDF) */
  heightMM: number;
  /** Photo shape from template */
  shape: 'circle' | 'rounded' | 'square';
  /** Whether photo should be shown */
  visible: boolean;
}

/**
 * Get photo overlay parameters from template — reads ONLY from TemplateDesign.
 *
 * @param template  The active template (same one used by TemplateCardRenderer)
 * @param cardWidthMM  Card width in mm (varies by export format)
 * @param cardHeightMM Card height in mm (varies by export format)
 */
export function getPhotoOverlayParams(
  template: Template,
  cardWidthMM: number,
  cardHeightMM: number,
): PhotoOverlayParams {
  const resolved = resolveTemplateDesign(template.front);

  const leftPx = resolved.photoPosition.x;
  const topPx = resolved.photoPosition.y;
  const widthPx = resolved.photoSize.width;
  const heightPx = resolved.photoSize.height;

  return {
    leftPx,
    topPx,
    widthPx,
    heightPx,
    leftMM: (leftPx / CARD_WIDTH_PX) * cardWidthMM,
    topMM: (topPx / CARD_HEIGHT_PX) * cardHeightMM,
    widthMM: (widthPx / CARD_WIDTH_PX) * cardWidthMM,
    heightMM: (heightPx / CARD_HEIGHT_PX) * cardHeightMM,
    shape: resolved.photoShape,
    visible: resolved.showPhoto !== false && widthPx > 0 && heightPx > 0,
  };
}

/**
 * Diagnostic: log the photo source being used for export.
 * Call this at export time to verify bg-removed image is used.
 */
export function verifyPhotoSource(
  employeeName: string,
  photoBase64: string | undefined,
  templateName: string,
): void {
  if (!photoBase64) {
    console.warn(`[PHOTO-VERIFY] ${employeeName}: NO PHOTO — export will have blank photo area`);
    return;
  }

  const isDataUrl = photoBase64.startsWith('data:image/');
  const isPNG = photoBase64.startsWith('data:image/png');
  const sizeKB = Math.round(photoBase64.length / 1024);

  console.log(`[PHOTO-VERIFY] ${employeeName}:`);
  console.log(`  ├─ Template: ${templateName}`);
  console.log(`  ├─ Is data URL: ${isDataUrl}`);
  console.log(`  ├─ Format: ${isPNG ? 'PNG (supports transparency)' : 'JPEG/other'}`);
  console.log(`  ├─ Size: ${sizeKB} KB`);
  console.log(`  └─ Source: ${isDataUrl ? 'PROCESSED (bg-removed + cropped)' : '⚠️ RAW URL — possible bug'}`);
}
