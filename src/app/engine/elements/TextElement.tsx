/**
 * TEXT ELEMENT RENDERER
 *
 * Renders text content with full style support.
 * Supports auto-shrink, word wrap, max lines, prefix/suffix.
 */

import React, { memo, useMemo } from 'react';
import type { ElementRendererProps } from '../registry';
import { elementRegistry } from '../registry';
import { parseElementStyle } from '../utils/styleParser';

const TextElementRenderer = memo<ElementRendererProps<'text'>>(
  ({ element, scale, data }) => {
    const { props, style, dimensions } = element;
    const { content, prefix, suffix, wordWrap, maxLines } = props;

    // Compute final text
    const text = useMemo(() => {
      let t = content || '';
      if (prefix) t = prefix + t;
      if (suffix) t = t + suffix;
      return t;
    }, [content, prefix, suffix]);

    // Auto-shrink: measure text and reduce font size if needed
    const effectiveFontSize = useMemo(() => {
      if (!style.autoShrink || !style.fontSize) return style.fontSize;

      const maxW = dimensions.width * scale;
      const minFS = (style.minFontSize ?? 8) * scale;
      const baseFS = style.fontSize * scale;

      // Quick canvas measurement
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return baseFS;

      const weight = style.fontWeight ?? 400;
      const family = style.fontFamily ?? 'Roboto, sans-serif';

      for (let fs = baseFS; fs >= minFS; fs -= 0.5) {
        ctx.font = `${weight} ${fs}px ${family}`;
        if (ctx.measureText(text).width <= maxW - 4) return fs / scale; // Return unscaled
      }
      return (style.minFontSize ?? 8);
    }, [text, style, dimensions.width, scale]);

    const cssStyle = useMemo(
      () => parseElementStyle({
        ...style,
        fontSize: effectiveFontSize ?? style.fontSize,
      }, scale),
      [style, effectiveFontSize, scale],
    );

    const containerStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'flex-start',
      overflow: style.overflow ?? 'hidden',
    };

    const textStyle: React.CSSProperties = {
      ...cssStyle,
      flex: 1,
      whiteSpace: wordWrap === false ? 'nowrap' : 'pre-wrap',
      wordBreak: 'break-word',
      minWidth: '1px',
      minHeight: '1px',
      ...(maxLines ? {
        display: '-webkit-box',
        WebkitLineClamp: maxLines,
        WebkitBoxOrient: 'vertical' as const,
        overflow: 'hidden',
      } : {}),
    };

    return (
      <div style={containerStyle}>
        <p style={textStyle}>{text}</p>
      </div>
    );
  },
);

TextElementRenderer.displayName = 'TextElementRenderer';

// Self-register
elementRegistry.register('text', TextElementRenderer);

export { TextElementRenderer };
