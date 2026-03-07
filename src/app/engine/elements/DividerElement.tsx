/**
 * DIVIDER ELEMENT RENDERER
 */

import React, { memo, useMemo } from 'react';
import type { ElementRendererProps } from '../registry';
import { elementRegistry } from '../registry';

const DividerElementRenderer = memo<ElementRendererProps<'divider'>>(
  ({ element, scale }) => {
    const { props } = element;

    const style = useMemo<React.CSSProperties>(() => {
      if (props.direction === 'vertical') {
        return {
          width: `${props.thickness * scale}px`,
          height: '100%',
          backgroundColor: props.color,
          borderStyle: props.style === 'solid' ? undefined : props.style,
        };
      }
      return {
        width: '100%',
        height: `${props.thickness * scale}px`,
        backgroundColor: props.color,
      };
    }, [props, scale]);

    return <div style={style} />;
  },
);

DividerElementRenderer.displayName = 'DividerElementRenderer';
elementRegistry.register('divider', DividerElementRenderer);

export { DividerElementRenderer };
