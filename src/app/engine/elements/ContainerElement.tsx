/**
 * CONTAINER ELEMENT RENDERER
 *
 * Renders a grouping container that lays out children
 * according to its layout mode (absolute, flex-row, flex-col, grid).
 */

import React, { memo, useMemo } from 'react';
import type { ElementRendererProps } from '../registry';
import { elementRegistry } from '../registry';
import { parseElementStyle } from '../utils/styleParser';

const ContainerElementRenderer = memo<ElementRendererProps<'container'>>(
  ({ element, scale }) => {
    const { props, style } = element;

    const containerStyle = useMemo<React.CSSProperties>(() => {
      const css = parseElementStyle(style, scale);

      const base: React.CSSProperties = {
        ...css,
        width: '100%',
        height: '100%',
        position: 'relative',
      };

      switch (props.layout) {
        case 'flex-row':
          base.display = 'flex';
          base.flexDirection = 'row';
          break;
        case 'flex-col':
          base.display = 'flex';
          base.flexDirection = 'column';
          break;
        case 'grid':
          base.display = 'grid';
          break;
        case 'absolute':
        default:
          break;
      }

      if (props.gap) base.gap = `${props.gap * scale}px`;
      if (props.alignItems) base.alignItems = props.alignItems;
      if (props.justifyContent) {
        const jcMap: Record<string, string> = {
          start: 'flex-start',
          center: 'center',
          end: 'flex-end',
          between: 'space-between',
          around: 'space-around',
        };
        base.justifyContent = jcMap[props.justifyContent] || props.justifyContent;
      }

      return base;
    }, [props, style, scale]);

    // Children are rendered by TemplateRenderer — container just provides the CSS box
    return <div style={containerStyle} data-container-id={element.id} />;
  },
);

ContainerElementRenderer.displayName = 'ContainerElementRenderer';
elementRegistry.register('container', ContainerElementRenderer);

export { ContainerElementRenderer };
