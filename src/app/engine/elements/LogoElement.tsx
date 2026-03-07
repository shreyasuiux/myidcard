/**
 * LOGO ELEMENT RENDERER
 *
 * Renders a logo image maintaining aspect ratio.
 */

import React, { memo, useMemo } from 'react';
import type { ElementRendererProps } from '../registry';
import { elementRegistry } from '../registry';

const LogoElementRenderer = memo<ElementRendererProps<'logo'>>(
  ({ element, scale }) => {
    const { props } = element;

    const style = useMemo<React.CSSProperties>(() => ({
      width: '100%',
      height: '100%',
      position: 'relative' as const,
    }), []);

    if (!props.src) return null;

    return (
      <div style={style}>
        <img
          src={props.src}
          alt="Logo"
          style={{
            position: 'absolute',
            inset: 0,
            maxWidth: 'none',
            objectFit: 'contain',
            pointerEvents: 'none',
            width: '100%',
            height: '100%',
          }}
        />
      </div>
    );
  },
);

LogoElementRenderer.displayName = 'LogoElementRenderer';
elementRegistry.register('logo', LogoElementRenderer);

export { LogoElementRenderer };
