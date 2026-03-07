/**
 * ═══════════════════════════════════════════════════════════════
 *  ELEMENT INTERACTION HOOK — Drag, Resize, Select, Keyboard
 * ═══════════════════════════════════════════════════════════════
 *
 *  DRAG STRATEGY:
 *  ─ mousedown on element → START_DRAG (capture start pos + offset)
 *  ─ mousemove on canvas → UPDATE_DRAG (track cursor, show ghost)
 *  ─ mouseup → END_DRAG → MOVE_ELEMENT (commit final position)
 *  ─ During drag, the element's visual position is set via
 *    dragState.currentPosition — the actual document.elements
 *    is NOT mutated until mouseup.  This avoids 60fps reducer
 *    dispatches and keeps undo stack clean (one entry per drag).
 *
 *  RESIZE STRATEGY:
 *  Same pattern as drag — only commits on mouseup.
 *  Aspect lock is enforced if element.dimensions.aspectLock is true.
 *
 *  SNAP-TO-GRID:
 *  If enabled, positions are rounded to nearest gridSize during drag.
 *
 *  KEYBOARD:
 *  Arrow keys move selected elements by 1px (or gridSize if snap is on).
 *  Shift+Arrow moves by 10px.
 *  Delete/Backspace removes selected elements.
 *  Ctrl+Z/Y for undo/redo.
 *  Ctrl+D to duplicate.
 * ═══════════════════════════════════════════════════════════════
 */

import { useCallback, useEffect, useRef } from 'react';
import type {
  TemplateDocument,
  TemplateElement,
  Position,
  Dimensions,
  ResizeHandle,
  EngineAction,
  EngineConfig,
} from '../types';
import { isElementLocked } from '../utils/layerManager';

interface UseElementInteractionOptions {
  document: TemplateDocument;
  config: EngineConfig;
  selectedIds: string[];
  dispatch: React.Dispatch<EngineAction>;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

export function useElementInteraction({
  document: doc,
  config,
  selectedIds,
  dispatch,
  canvasRef,
}: UseElementInteractionOptions) {
  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const dragStart = useRef<{ x: number; y: number; elX: number; elY: number } | null>(null);
  const resizeStart = useRef<{
    handle: ResizeHandle;
    mouseX: number;
    mouseY: number;
    elX: number;
    elY: number;
    elW: number;
    elH: number;
    aspectLock: boolean;
  } | null>(null);
  const activeElementId = useRef<string | null>(null);

  // Track last positions during drag/resize for committing on mouseup
  const lastDragPos = useRef<{ x: number; y: number } | null>(null);
  const lastResizeDims = useRef<{ width: number; height: number } | null>(null);

  // ── Selection ──

  const selectElement = useCallback(
    (id: string, additive: boolean) => {
      if (additive) {
        const newIds = selectedIds.includes(id)
          ? selectedIds.filter(i => i !== id)
          : [...selectedIds, id];
        dispatch({ type: 'SELECT_ELEMENTS', payload: newIds });
      } else {
        dispatch({ type: 'SELECT_ELEMENTS', payload: [id] });
      }
    },
    [selectedIds, dispatch],
  );

  const clearSelection = useCallback(() => {
    dispatch({ type: 'SELECT_ELEMENTS', payload: [] });
  }, [dispatch]);

  // ── Drag ──

  const startDrag = useCallback(
    (elementId: string, mouseX: number, mouseY: number) => {
      const element = doc.elements.find(el => el.id === elementId);
      if (!element || isElementLocked(element, doc.layers)) return;

      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;

      const elX = element.position.x * config.scale;
      const elY = element.position.y * config.scale;
      const offsetX = mouseX - canvasRect.left - elX;
      const offsetY = mouseY - canvasRect.top - elY;

      isDragging.current = true;
      activeElementId.current = elementId;
      dragStart.current = {
        x: mouseX,
        y: mouseY,
        elX: element.position.x,
        elY: element.position.y,
      };

      dispatch({
        type: 'START_DRAG',
        payload: {
          elementId,
          startPosition: element.position,
          currentPosition: element.position,
          offset: { x: offsetX, y: offsetY },
        },
      });
    },
    [doc.elements, doc.layers, config.scale, canvasRef, dispatch],
  );

  // ── Resize ──

  const startResize = useCallback(
    (elementId: string, handle: ResizeHandle, mouseX: number, mouseY: number) => {
      const element = doc.elements.find(el => el.id === elementId);
      if (!element || isElementLocked(element, doc.layers)) return;

      isResizing.current = true;
      activeElementId.current = elementId;
      resizeStart.current = {
        handle,
        mouseX,
        mouseY,
        elX: element.position.x,
        elY: element.position.y,
        elW: element.dimensions.width,
        elH: element.dimensions.height,
        aspectLock: element.dimensions.aspectLock ?? false,
      };

      dispatch({
        type: 'START_RESIZE',
        payload: {
          elementId,
          handle,
          startDimensions: element.dimensions,
          startPosition: element.position,
          currentDimensions: element.dimensions,
        },
      });
    },
    [doc.elements, doc.layers, dispatch],
  );

  // ── Mouse Move (global) ──

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const canvasRect = canvasRef.current.getBoundingClientRect();

      if (isDragging.current && dragStart.current) {
        const dx = (e.clientX - dragStart.current.x) / config.scale;
        const dy = (e.clientY - dragStart.current.y) / config.scale;

        let newX = dragStart.current.elX + dx;
        let newY = dragStart.current.elY + dy;

        // Snap to grid
        if (config.snapToGrid && config.gridSize > 0) {
          newX = Math.round(newX / config.gridSize) * config.gridSize;
          newY = Math.round(newY / config.gridSize) * config.gridSize;
        }

        dispatch({
          type: 'UPDATE_DRAG',
          payload: { x: newX, y: newY },
        });

        // Track for mouseup commit
        lastDragPos.current = { x: newX, y: newY };
      }

      if (isResizing.current && resizeStart.current) {
        const rs = resizeStart.current;
        const dx = (e.clientX - rs.mouseX) / config.scale;
        const dy = (e.clientY - rs.mouseY) / config.scale;

        let newW = rs.elW;
        let newH = rs.elH;

        // Calculate new dimensions based on handle
        if (rs.handle.includes('right')) newW = Math.max(10, rs.elW + dx);
        if (rs.handle.includes('left')) newW = Math.max(10, rs.elW - dx);
        if (rs.handle.includes('bottom')) newH = Math.max(10, rs.elH + dy);
        if (rs.handle.includes('top')) newH = Math.max(10, rs.elH - dy);

        // Aspect lock
        if (rs.aspectLock) {
          const ratio = rs.elW / rs.elH;
          if (Math.abs(dx) > Math.abs(dy)) {
            newH = newW / ratio;
          } else {
            newW = newH * ratio;
          }
        }

        // Snap
        if (config.snapToGrid && config.gridSize > 0) {
          newW = Math.round(newW / config.gridSize) * config.gridSize;
          newH = Math.round(newH / config.gridSize) * config.gridSize;
        }

        dispatch({
          type: 'UPDATE_RESIZE',
          payload: { width: newW, height: newH },
        });

        // Track for mouseup commit
        lastResizeDims.current = { width: newW, height: newH };
      }
    };

    const handleMouseUp = () => {
      if (isDragging.current && activeElementId.current && lastDragPos.current) {
        // Commit final position to document
        dispatch({
          type: 'MOVE_ELEMENT',
          payload: { id: activeElementId.current, position: lastDragPos.current },
        });
        dispatch({ type: 'END_DRAG' });
        isDragging.current = false;
        dragStart.current = null;
        lastDragPos.current = null;
      }

      if (isResizing.current && activeElementId.current && lastResizeDims.current) {
        // Commit final dimensions to document
        dispatch({
          type: 'RESIZE_ELEMENT',
          payload: { id: activeElementId.current, dimensions: lastResizeDims.current },
        });
        dispatch({ type: 'END_RESIZE' });
        isResizing.current = false;
        resizeStart.current = null;
        lastResizeDims.current = null;
      }

      activeElementId.current = null;
    };

    if (config.mode === 'preview') {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [config, canvasRef, dispatch]);

  // ── Keyboard ──

  useEffect(() => {
    if (!config.enableKeyboard || config.mode !== 'preview') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIds.length === 0) return;

      const step = e.shiftKey ? 10 : (config.snapToGrid ? config.gridSize : 1);

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          for (const id of selectedIds) {
            const el = doc.elements.find(el => el.id === id);
            if (el && !isElementLocked(el, doc.layers)) {
              dispatch({
                type: 'MOVE_ELEMENT',
                payload: { id, position: { ...el.position, y: el.position.y - step } },
              });
            }
          }
          break;

        case 'ArrowDown':
          e.preventDefault();
          for (const id of selectedIds) {
            const el = doc.elements.find(el => el.id === id);
            if (el && !isElementLocked(el, doc.layers)) {
              dispatch({
                type: 'MOVE_ELEMENT',
                payload: { id, position: { ...el.position, y: el.position.y + step } },
              });
            }
          }
          break;

        case 'ArrowLeft':
          e.preventDefault();
          for (const id of selectedIds) {
            const el = doc.elements.find(el => el.id === id);
            if (el && !isElementLocked(el, doc.layers)) {
              dispatch({
                type: 'MOVE_ELEMENT',
                payload: { id, position: { ...el.position, x: el.position.x - step } },
              });
            }
          }
          break;

        case 'ArrowRight':
          e.preventDefault();
          for (const id of selectedIds) {
            const el = doc.elements.find(el => el.id === id);
            if (el && !isElementLocked(el, doc.layers)) {
              dispatch({
                type: 'MOVE_ELEMENT',
                payload: { id, position: { ...el.position, x: el.position.x + step } },
              });
            }
          }
          break;

        case 'Delete':
        case 'Backspace':
          for (const id of selectedIds) {
            dispatch({ type: 'REMOVE_ELEMENT', payload: id });
          }
          dispatch({ type: 'SELECT_ELEMENTS', payload: [] });
          break;

        case 'z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            dispatch({ type: 'UNDO' });
          }
          break;

        case 'y':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            dispatch({ type: 'REDO' });
          }
          break;

        case 'd':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            for (const id of selectedIds) {
              dispatch({ type: 'DUPLICATE_ELEMENT', payload: id });
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config, selectedIds, doc.elements, doc.layers, dispatch]);

  return {
    selectElement,
    clearSelection,
    startDrag,
    startResize,
  };
}