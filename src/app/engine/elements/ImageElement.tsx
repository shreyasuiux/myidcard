/**
 * IMAGE ELEMENT RENDERER
 *
 * Renders images with shape masks, object-fit,
 * and data-attributes for the export pipeline.
 */

import React, { memo, useMemo } from 'react';
import type { ElementRendererProps } from '../registry';
import { elementRegistry } from '../registry';
import { parseElementStyle } from '../utils/styleParser';

const ImageElementRenderer = memo<ElementRendererProps<'image'>>(
  ({ element, scale }) => {
    const { props, style, dimensions } = element;
    const { src, alt, shape, placeholder } = props;

    const containerStyle = useMemo<React.CSSProperties>(() => {
      const css = parseElementStyle(style, scale);
      return {
        ...css,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        borderRadius:
          shape === 'circle'
            ? '50%'
            : shape === 'rounded'
              ? `${4 * scale}px`
              : css.borderRadius ?? '0px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      };
    }, [style, scale, shape]);

    if (!src) {
      return (
        <div
          style={{
            ...containerStyle,
            backgroundColor: '#f1f5f9',
          }}
        >
          <p
            style={{
              fontFamily: 'Roboto, sans-serif',
              fontSize: `${8 * scale}px`,
              lineHeight: `${12 * scale}px`,
              color: '#94a3b8',
            }}
          >
            {placeholder || 'No image'}
          </p>
        </div>
      );
    }

    return (
      <div data-photo-container="true" style={containerStyle}>
        <img
          data-employee-photo="true"
          src={src}
          alt={alt || ''}
          crossOrigin="anonymous"
          style={{
            display: 'block',
            width: `${dimensions.width * scale}px`,
            height: `${dimensions.height * scale}px`,
            objectFit: style.objectFit ?? 'cover',
            objectPosition: style.objectPosition ?? 'center',
          }}
        />
      </div>
    );
  },
);

ImageElementRenderer.displayName = 'ImageElementRenderer';
elementRegistry.register('image', ImageElementRenderer);

export { ImageElementRenderer };
