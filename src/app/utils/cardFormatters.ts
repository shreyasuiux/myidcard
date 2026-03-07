/**
 * CARD FORMATTERS — Single Source of Truth
 *
 * All text formatting and measurement functions used by the
 * Template-Driven Rendering Architecture live here.
 * No renderer may define its own format/measure functions.
 */

// ─── Name ───────────────────────────────────────────────

/** Format name: First name + Last initial with period */
export function formatName(name: string): string {
  if (!name) return 'Shreyas V.';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
  }
  const firstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
  const lastInitial = parts[parts.length - 1][0].toUpperCase();
  return `${firstName} ${lastInitial}.`;
}

/**
 * Auto-shrink name font size so it fits within maxWidth.
 * Uses canvas text measurement for pixel-exact results.
 */
export function getNameFontSize(
  name: string,
  baseFontSize = 18,
  maxWidth = 125,
  minFontSize = 10,
): number {
  const formatted = formatName(name);
  const SAFETY = 1.05;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return baseFontSize;

  for (let fs = baseFontSize; fs >= minFontSize; fs--) {
    ctx.font = `bold ${fs}px Roboto`;
    if (ctx.measureText(formatted).width * SAFETY <= maxWidth) return fs;
  }
  return minFontSize;
}

// ─── Phone ──────────────────────────────────────────────

export function formatPhoneNumber(phone: string): string {
  if (!phone) return '+91 9898989898';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) return `+91 ${cleaned}`;
  if (cleaned.startsWith('91') && cleaned.length === 12) return `+91 ${cleaned.substring(2)}`;
  return `+91 ${cleaned}`;
}

// ─── Dates ──────────────────────────────────────────────

function parseDateSafe(date: string): Date | null {
  if (!date) return null;
  // Try DD/MM/YYYY
  if (date.includes('/')) {
    const parts = date.split('/');
    if (parts.length === 3) {
      const d = new Date(
        parseInt(parts[2], 10),
        parseInt(parts[1], 10) - 1,
        parseInt(parts[0], 10),
      );
      if (!isNaN(d.getTime())) return d;
    }
  }
  const d = new Date(date);
  return isNaN(d.getTime()) ? null : d;
}

export function formatValidTill(date: string): string {
  const d = parseDateSafe(date);
  if (!d) return 'Dec 2030';
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

export function formatJoiningDate(date: string): string {
  const d = parseDateSafe(date);
  if (!d) return '12 Jan 2024';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Employee ID ────────────────────────────────────────

export function formatEmployeeId(id: string): string {
  return id || '1111';
}

// ─── Blood Group ────────────────────────────────────────

export function formatBloodGroup(bg: string): string {
  return bg || 'B+';
}
