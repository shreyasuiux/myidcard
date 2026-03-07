/**
 * ═══════════════════════════════════════════════════════════════
 *  STYLE PARSER — Converts ElementStyle → React CSSProperties
 * ═══════════════════════════════════════════════════════════════
 *
 *  Centralizes ALL style-to-CSS conversion.  No renderer may
 *  create its own CSS mapping.  This ensures:
 *  ─ Consistent output across preview and export
 *  ─ Single place to add CSS vendor prefixes
 *  ─ Single place to resolve template variables
 * ═══════════════════════════════════════════════════════════════
 */

import type {
  ElementStyle,
  BackgroundSettings,
  GradientDef,
  PatternDef,
  TemplateVariable,
} from '../types';

// ─────────────────────────────────────────────────
//  Core Conversion
// ─────────────────────────────────────────────────

/**
 * Convert an ElementStyle object to React CSSProperties.
 * Only includes properties that are defined (no undefined keys).
 */
export function parseElementStyle(
  style: ElementStyle,
  scale: number = 1,
): React.CSSProperties {
  const css: React.CSSProperties = {};

  // ── Fill ──
  if (style.backgroundColor) css.backgroundColor = style.backgroundColor;
  if (style.backgroundGradient) {
    css.backgroundImage = gradientToCSS(style.backgroundGradient);
  }
  if (style.backgroundImage) {
    css.backgroundImage = `url(${style.backgroundImage})`;
    css.backgroundSize = 'cover';
    css.backgroundPosition = 'center';
  }

  // ── Border ──
  if (style.borderWidth != null && style.borderWidth > 0) {
    css.borderWidth = `${style.borderWidth * scale}px`;
    css.borderColor = style.borderColor || '#000';
    css.borderStyle = style.borderStyle || 'solid';
  }
  if (style.borderRadius != null) {
    css.borderRadius = typeof style.borderRadius === 'number'
      ? `${style.borderRadius * scale}px`
      : style.borderRadius;
  }

  // ── Shadow ──
  if (style.boxShadow) css.boxShadow = style.boxShadow;

  // ── Typography ──
  if (style.fontFamily) css.fontFamily = style.fontFamily;
  if (style.fontSize != null) css.fontSize = `${style.fontSize * scale}px`;
  if (style.fontWeight != null) css.fontWeight = style.fontWeight;
  if (style.fontStyle) css.fontStyle = style.fontStyle;
  if (style.lineHeight != null) {
    css.lineHeight = typeof style.lineHeight === 'number'
      ? `${style.lineHeight * scale}px`
      : style.lineHeight;
  }
  if (style.letterSpacing != null) css.letterSpacing = `${style.letterSpacing * scale}px`;
  if (style.textAlign) css.textAlign = style.textAlign;
  if (style.textDecoration) css.textDecoration = style.textDecoration;
  if (style.textTransform) css.textTransform = style.textTransform;
  if (style.color) css.color = style.color;

  // ── Overflow ──
  if (style.overflow) css.overflow = style.overflow;

  // ── Image ──
  if (style.objectFit) css.objectFit = style.objectFit;
  if (style.objectPosition) css.objectPosition = style.objectPosition;

  // ── Clip / Mask ──
  if (style.clipPath) css.clipPath = style.clipPath;

  // ── Padding ──
  if (style.padding != null) {
    css.padding = typeof style.padding === 'number'
      ? `${style.padding * scale}px`
      : style.padding;
  }
  if (style.paddingTop != null) css.paddingTop = `${style.paddingTop * scale}px`;
  if (style.paddingRight != null) css.paddingRight = `${style.paddingRight * scale}px`;
  if (style.paddingBottom != null) css.paddingBottom = `${style.paddingBottom * scale}px`;
  if (style.paddingLeft != null) css.paddingLeft = `${style.paddingLeft * scale}px`;

  return css;
}

// ─────────────────────────────────────────────────
//  Background Conversion
// ─────────────────────────────────────────────────

export function parseBackgroundStyle(
  bg: BackgroundSettings,
  scale: number = 1,
): React.CSSProperties {
  const css: React.CSSProperties = {};

  switch (bg.type) {
    case 'solid':
      css.backgroundColor = bg.color;
      break;

    case 'gradient':
      if (bg.gradient) {
        css.backgroundImage = gradientToCSS(bg.gradient);
      } else {
        css.backgroundColor = bg.color;
      }
      break;

    case 'image':
      if (bg.imageUrl) {
        css.backgroundImage = `url(${bg.imageUrl})`;
        css.backgroundSize = 'cover';
        css.backgroundPosition = 'center';
      }
      break;

    case 'pattern':
      if (bg.pattern) {
        css.backgroundImage = patternToCSS(bg.pattern, scale);
        css.backgroundSize = `${bg.pattern.size * scale}px ${bg.pattern.size * scale}px`;
      }
      break;
  }

  if (bg.opacity < 1) css.opacity = bg.opacity;
  return css;
}

// ─────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────

function gradientToCSS(g: GradientDef): string {
  const stops = g.stops
    .map(s => `${s.color} ${s.position * 100}%`)
    .join(', ');
  if (g.type === 'linear') return `linear-gradient(${g.angle}deg, ${stops})`;
  return `radial-gradient(circle, ${stops})`;
}

function patternToCSS(p: PatternDef, scale: number): string {
  switch (p.type) {
    case 'dots':
      return `radial-gradient(circle, ${p.color} ${1 * scale}px, transparent ${1 * scale}px)`;
    case 'lines':
      return `repeating-linear-gradient(45deg, ${p.color} 0, ${p.color} ${1 * scale}px, transparent ${1 * scale}px, transparent ${6 * scale}px)`;
    case 'crosshatch':
      return `repeating-linear-gradient(0deg, ${p.color} 0, ${p.color} ${1 * scale}px, transparent ${1 * scale}px, transparent ${4 * scale}px), ` +
             `repeating-linear-gradient(90deg, ${p.color} 0, ${p.color} ${1 * scale}px, transparent ${1 * scale}px, transparent ${4 * scale}px)`;
    default:
      return 'none';
  }
}

/**
 * Resolve template variables in a style value.
 * Variables are referenced as {{varName}}.
 */
export function resolveVariables(
  value: string,
  variables: TemplateVariable[],
): string {
  return value.replace(/\{\{(\w+)\}\}/g, (_, name) => {
    const v = variables.find(v => v.name === name);
    return v ? String(v.value) : '';
  });
}
