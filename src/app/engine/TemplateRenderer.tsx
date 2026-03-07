/**
 * ═══════════════════════════════════════════════════════════════
 *  TEMPLATE RENDERER — THE CORE RENDERING ENGINE
 * ═══════════════════════════════════════════════════════════════
 *
 *  This is the ONE component that renders a TemplateDocument.
 *
 *  USAGE:
 *    <TemplateProvider initialDocument={doc} data={employeeData}>
 *      <TemplateRenderer />
 *    </TemplateProvider>
 *
 *  OR standalone (without context):
 *    <TemplateRendererStandalone
 *      document={doc}
 *      data={employeeData}
 *      scale={1}
 *      mode="display"
 *    />
 *
 *  RENDERING PIPELINE:
 *  1. Read document from context (or props)
 *  2. Resolve layer visibility + element conditions
 *  3. Sort elements by composite z-index
 *  4. For each visible element:
 *     a. Compute effective opacity (layer × element)
 *     b. Check selection/hover state
 *     c. Render via ElementRenderer → type-specific renderer
 *
 *  PERFORMANCE:
 *  ─ getOrderedElements is memoized via useMemo
 *  ─ ElementRenderer is React.memo'd with custom comparator
 *  ─ Selection state is in a separate context (no cascade)
 *  ─ Grid overlay is a static SVG — never re-renders
 * ═══════════════════════════════════════════════════════════════
 */

import React, { forwardRef, useMemo, useCallback } from 'react';
import type {
  TemplateDocument,
  DataContext,
  RenderMode,
} from './types';
import { ElementRenderer } from './ElementRenderer';
import { getOrderedElements, getEffectiveOpacity } from './utils/layerManager';
import { parseBackgroundStyle } from './utils/styleParser';

// ── Ensure all element types are registered ──
import './elements/TextElement';
import './elements/ImageElement';
import './elements/ShapeElement';
import './elements/LogoElement';
import './elements/DividerElement';
import './elements/ContainerElement';

// ─────────────────────────────────────────────────
//  Standalone Renderer (no context required)
// ─────────────────────────────────────────────────

export interface TemplateRendererStandaloneProps {
  /** The template document to render */
  document: TemplateDocument;
  /** Data context for bindings */
  data?: DataContext;
  /** Scale multiplier */
  scale?: number;
  /** Render mode */
  mode?: RenderMode;
  /** Currently selected element IDs */
  selectedIds?: string[];
  /** Currently hovered element ID */
  hoveredId?: string | null;
  /** Selection callback */
  onSelect?: (id: string, additive: boolean) => void;
  /** Hover callback */
  onHover?: (id: string | null) => void;
  /** Click on empty canvas */
  onCanvasClick?: () => void;
  /** Show grid overlay */
  showGrid?: boolean;
  /** Additional class name for outer container */
  className?: string;
}

export const TemplateRendererStandalone = forwardRef<HTMLDivElement, TemplateRendererStandaloneProps>(
  (
    {
      document: doc,
      data = {},
      scale = 1,
      mode = 'display',
      selectedIds = [],
      hoveredId = null,
      onSelect,
      onHover,
      onCanvasClick,
      showGrid = false,
      className,
    },
    ref,
  ) => {
    const isInteractive = mode === 'preview';

    // ── Template readiness gate ──
    if (!doc.isReady) {
      return (
        <div
          ref={ref}
          style={{
            width: `${doc.canvas.width * scale}px`,
            height: `${doc.canvas.height * scale}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8fafc',
            border: '2px dashed #cbd5e1',
            fontFamily: 'sans-serif',
            fontSize: `${12 * scale}px`,
            color: '#94a3b8',
          }}
        >
          Template not ready
        </div>
      );
    }

    // ── Ordered, visible elements ──
    const orderedElements = useMemo(
      () => getOrderedElements(doc.elements, doc.layers, data),
      [doc.elements, doc.layers, data],
    );

    // ── Background style ──
    const bgStyle = useMemo(
      () => parseBackgroundStyle(doc.background, scale),
      [doc.background, scale],
    );

    // ── Canvas style ──
    const canvasStyle = useMemo<React.CSSProperties>(() => ({
      width: `${doc.canvas.width * scale}px`,
      height: `${doc.canvas.height * scale}px`,
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Roboto, sans-serif',
      ...bgStyle,
    }), [doc.canvas.width, doc.canvas.height, scale, bgStyle]);

    // ── Grid overlay ──
    const gridOverlay = useMemo(() => {
      if (!showGrid || !doc.canvas.gridSize) return null;
      const gs = doc.canvas.gridSize * scale;
      return (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 99998,
            backgroundImage:
              `linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), ` +
              `linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)`,
            backgroundSize: `${gs}px ${gs}px`,
          }}
        />
      );
    }, [showGrid, doc.canvas.gridSize, scale]);

    // ── Handlers ──
    const handleCanvasClick = useCallback(
      (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
          onCanvasClick?.();
        }
      },
      [onCanvasClick],
    );

    const handleHoverEnter = useCallback(
      (id: string) => onHover?.(id),
      [onHover],
    );

    const handleHoverLeave = useCallback(
      () => onHover?.(null),
      [onHover],
    );

    return (
      <div
        ref={ref}
        className={className}
        style={canvasStyle}
        onClick={isInteractive ? handleCanvasClick : undefined}
      >
        {/* Background pattern overlay */}
        {doc.background.pattern && doc.background.type === 'pattern' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: doc.background.pattern.opacity,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Elements */}
        {orderedElements.map(element => (
          <ElementRenderer
            key={element.id}
            element={element}
            scale={scale}
            data={data}
            effectiveOpacity={getEffectiveOpacity(element, doc.layers)}
            isSelected={selectedIds.includes(element.id)}
            isHovered={hoveredId === element.id}
            isInteractive={isInteractive}
            onSelect={onSelect}
            onMouseEnter={handleHoverEnter}
            onMouseLeave={handleHoverLeave}
          />
        ))}

        {/* Grid */}
        {gridOverlay}
      </div>
    );
  },
);

TemplateRendererStandalone.displayName = 'TemplateRendererStandalone';
