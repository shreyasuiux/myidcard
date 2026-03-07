/**
 * ═══════════════════════════════════════════════════════════════
 *  ELEMENT RENDERER — Factory + Positioning Wrapper
 * ═══════════════════════════════════════════════════════════════
 *
 *  RESPONSIBILITIES:
 *  1. Position the element absolutely on the canvas
 *  2. Apply rotation, opacity, z-index
 *  3. Resolve data bindings
 *  4. Look up the type-specific renderer from the registry
 *  5. Delegate content rendering to that type renderer
 *
 *  This component wraps EVERY element.  The type-specific
 *  renderer only handles content — it does NOT know about
 *  position, rotation, or z-index.
 *
 *  MEMOIZATION STRATEGY:
 *  ─ React.memo on this component prevents re-render when
 *    element data hasn't changed.
 *  ─ Each type renderer is also memo'd independently.
 *  ─ Result: changing element A does NOT re-render element B.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { memo, useMemo, useCallback } from 'react';
import type { TemplateElement, DataContext } from './types';
import { elementRegistry } from './registry';
import { applyBindingsToElement } from './utils/bindingResolver';

interface ElementRendererProps {
  element: TemplateElement;
  scale: number;
  data: DataContext;
  effectiveOpacity: number;
  isSelected: boolean;
  isHovered: boolean;
  isInteractive: boolean;
  onSelect?: (id: string, additive: boolean) => void;
  onMouseEnter?: (id: string) => void;
  onMouseLeave?: () => void;
}

export const ElementRenderer = memo<ElementRendererProps>(
  ({
    element: rawElement,
    scale,
    data,
    effectiveOpacity,
    isSelected,
    isHovered,
    isInteractive,
    onSelect,
    onMouseEnter,
    onMouseLeave,
  }) => {
    // 1. Resolve bindings → produces element with data-driven prop overrides
    const element = useMemo(
      () => applyBindingsToElement(rawElement, data),
      [rawElement, data],
    );

    // 2. Look up type renderer
    const TypeRenderer = elementRegistry.get(element.type);
    if (!TypeRenderer) {
      console.warn(`[Engine] No renderer registered for type "${element.type}"`);
      return null;
    }

    // 3. Compute wrapper position + transform
    const wrapperStyle = useMemo<React.CSSProperties>(() => {
      const { position, dimensions, rotation, zIndex } = element;
      const x = position.x * scale;
      const y = position.y * scale;
      const w = dimensions.width * scale;
      const h = dimensions.height * scale;

      const css: React.CSSProperties = {
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        width: `${w}px`,
        height: `${h}px`,
        zIndex,
        opacity: effectiveOpacity,
        pointerEvents: element.locked || !element.selectable ? 'none' : 'auto',
      };

      if (rotation !== 0) {
        css.transform = `rotate(${rotation}deg)`;
        css.transformOrigin = 'center center';
      }

      return css;
    }, [element, scale, effectiveOpacity]);

    // 4. Selection outline
    const selectionOverlay = useMemo<React.CSSProperties | null>(() => {
      if (!isInteractive) return null;
      if (!isSelected && !isHovered) return null;
      return {
        position: 'absolute',
        inset: '-1px',
        border: isSelected
          ? '2px solid #3b82f6'
          : '1px dashed #93c5fd',
        borderRadius: '1px',
        pointerEvents: 'none',
        zIndex: 9999,
      };
    }, [isSelected, isHovered, isInteractive]);

    // 5. Interaction handlers
    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        if (!isInteractive || element.locked) return;
        e.stopPropagation();
        onSelect?.(element.id, e.shiftKey || e.metaKey);
      },
      [isInteractive, element.id, element.locked, onSelect],
    );

    const handleMouseEnter = useCallback(() => {
      if (isInteractive) onMouseEnter?.(element.id);
    }, [isInteractive, element.id, onMouseEnter]);

    const handleMouseLeaveLocal = useCallback(() => {
      if (isInteractive) onMouseLeave?.();
    }, [isInteractive, onMouseLeave]);

    return (
      <div
        data-element-id={element.id}
        data-element-type={element.type}
        style={wrapperStyle}
        onMouseDown={isInteractive ? handleMouseDown : undefined}
        onMouseEnter={isInteractive ? handleMouseEnter : undefined}
        onMouseLeave={isInteractive ? handleMouseLeaveLocal : undefined}
      >
        <TypeRenderer
          element={element}
          scale={scale}
          data={data}
          isSelected={isSelected}
          isInteractive={isInteractive}
        />
        {selectionOverlay && <div style={selectionOverlay} />}
      </div>
    );
  },
  // Custom comparison: only re-render when relevant data changes
  (prev, next) => {
    return (
      prev.element === next.element &&
      prev.scale === next.scale &&
      prev.data === next.data &&
      prev.effectiveOpacity === next.effectiveOpacity &&
      prev.isSelected === next.isSelected &&
      prev.isHovered === next.isHovered &&
      prev.isInteractive === next.isInteractive
    );
  },
);

ElementRenderer.displayName = 'ElementRenderer';
