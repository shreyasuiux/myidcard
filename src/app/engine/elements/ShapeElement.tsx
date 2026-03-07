/**
 * SHAPE ELEMENT RENDERER
 *
 * Renders rectangles, circles, lines, and custom SVG shapes.
 */

import React, { memo, useMemo } from 'react';
import type { ElementRendererProps } from '../registry';
import { elementRegistry } from '../registry';

const ShapeElementRenderer = memo<ElementRendererProps<'shape'>>(
  ({ element, scale }) => {
    const { props, dimensions } = element;
    const { shape, fill, stroke, strokeWidth, pathData } = props;

    const style = useMemo<React.CSSProperties>(() => {
      const base: React.CSSProperties = {
        width: '100%',
        height: '100%',
        backgroundColor: fill,
      };

      if (stroke && strokeWidth) {
        base.border = `${strokeWidth * scale}px solid ${stroke}`;
      }

      switch (shape) {
        case 'circle':
        case 'ellipse':
          base.borderRadius = '50%';
          break;
        case 'line':
          // Line is a thin rectangle
          base.height = `${Math.max(1, (strokeWidth ?? 1)) * scale}px`;
          base.backgroundColor = stroke ?? fill;
          break;
        case 'triangle':
          base.backgroundColor = 'transparent';
          base.borderLeft = `${(dimensions.width / 2) * scale}px solid transparent`;
          base.borderRight = `${(dimensions.width / 2) * scale}px solid transparent`;
          base.borderBottom = `${dimensions.height * scale}px solid ${fill}`;
          break;
        case 'custom':
          if (pathData) {
            base.backgroundColor = 'transparent';
          }
          break;
      }

      return base;
    }, [shape, fill, stroke, strokeWidth, dimensions, scale]);

    // Custom SVG path
    if (shape === 'custom' && pathData) {
      return (
        <svg
          width={dimensions.width * scale}
          height={dimensions.height * scale}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          style={{ display: 'block' }}
        >
          <path
            d={pathData}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        </svg>
      );
    }

    return <div style={style} />;
  },
);

ShapeElementRenderer.displayName = 'ShapeElementRenderer';
elementRegistry.register('shape', ShapeElementRenderer);

export { ShapeElementRenderer };
