/**
 * ═══════════════════════════════════════════════════════════════
 *  TEMPLATE EDITOR CANVAS — Interactive Editing Surface
 * ═══════════════════════════════════════════════════════════════
 *
 *  This is the main interactive component for the template editor.
 *  It composes:
 *    - TemplateRendererStandalone (rendering)
 *    - useElementInteraction (drag/resize/select/keyboard)
 *    - Selection overlay with resize handles
 *    - Toolbar with undo/redo, zoom, grid toggle
 *
 *  USAGE:
 *    <TemplateEditorCanvas
 *      document={doc}
 *      data={employeeData}
 *      onDocumentChange={(newDoc) => save(newDoc)}
 *    />
 * ═══════════════════════════════════════════════════════════════
 */

import React, {
  useReducer,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import {
  Undo2,
  Redo2,
  Grid3X3,
  ZoomIn,
  ZoomOut,
  Trash2,
  Copy,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Layers,
  MousePointer2,
} from 'lucide-react';
import type {
  TemplateDocument,
  DataContext,
  EngineAction,
  TemplateElement,
} from './types';
import { TemplateRendererStandalone } from './TemplateRenderer';
import { useElementInteraction } from './hooks/useElementInteraction';
import { isElementLocked } from './utils/layerManager';

// ─────────────────────────────────────────────────
//  Reducer for document + selection state
// ─────────────────────────────────────────────────

interface EditorState {
  document: TemplateDocument;
  history: TemplateDocument[];
  future: TemplateDocument[];
  selectedIds: string[];
  hoveredId: string | null;
  showGrid: boolean;
  scale: number;
}

function editorReducer(state: EditorState, action: EngineAction): EditorState {
  switch (action.type) {
    case 'SET_DOCUMENT':
      return { ...state, document: action.payload, history: [], future: [] };

    case 'SELECT_ELEMENTS':
      return { ...state, selectedIds: action.payload };

    case 'HOVER_ELEMENT':
      return { ...state, hoveredId: action.payload };

    case 'UPDATE_DRAG': {
      // Live position update during drag (not pushed to undo)
      if (state.selectedIds.length !== 1) return state;
      const id = state.selectedIds[0];
      const position = action.payload;
      return {
        ...state,
        document: {
          ...state.document,
          elements: state.document.elements.map(el =>
            el.id === id ? { ...el, position } : el,
          ),
        },
      };
    }

    case 'UPDATE_RESIZE': {
      // Live dimension update during resize (not pushed to undo)
      if (state.selectedIds.length !== 1) return state;
      const id = state.selectedIds[0];
      const dimensions = action.payload;
      return {
        ...state,
        document: {
          ...state.document,
          elements: state.document.elements.map(el =>
            el.id === id ? { ...el, dimensions: { ...el.dimensions, ...dimensions } } : el,
          ),
        },
      };
    }

    case 'START_DRAG':
    case 'END_DRAG':
    case 'START_RESIZE':
    case 'END_RESIZE':
      return state; // No-op — state tracking is in refs

    case 'MOVE_ELEMENT': {
      const { id, position } = action.payload;
      const newDoc = {
        ...state.document,
        elements: state.document.elements.map(el =>
          el.id === id ? { ...el, position } : el,
        ),
      };
      return pushUndo(state, newDoc);
    }

    case 'RESIZE_ELEMENT': {
      const { id, dimensions, position } = action.payload;
      const newDoc = {
        ...state.document,
        elements: state.document.elements.map(el =>
          el.id === id
            ? { ...el, dimensions, ...(position ? { position } : {}) }
            : el,
        ),
      };
      return pushUndo(state, newDoc);
    }

    case 'UPDATE_ELEMENT': {
      const { id, changes } = action.payload;
      const newDoc = {
        ...state.document,
        elements: state.document.elements.map(el =>
          el.id === id ? { ...el, ...changes } : el,
        ),
      };
      return pushUndo(state, newDoc);
    }

    case 'REMOVE_ELEMENT': {
      const newDoc = {
        ...state.document,
        elements: state.document.elements.filter(el => el.id !== action.payload),
      };
      return pushUndo(state, newDoc);
    }

    case 'DUPLICATE_ELEMENT': {
      const original = state.document.elements.find(el => el.id === action.payload);
      if (!original) return state;
      const copy: TemplateElement = {
        ...original,
        id: `${original.id}_copy_${Date.now()}`,
        name: `${original.name} (copy)`,
        position: {
          ...original.position,
          x: original.position.x + 8,
          y: original.position.y + 8,
        },
        locked: false,
        selectable: true,
      };
      const newDoc = {
        ...state.document,
        elements: [...state.document.elements, copy],
      };
      return {
        ...pushUndo(state, newDoc),
        selectedIds: [copy.id],
      };
    }

    case 'REORDER_ELEMENT': {
      const { id, zIndex } = action.payload;
      const newDoc = {
        ...state.document,
        elements: state.document.elements.map(el =>
          el.id === id ? { ...el, zIndex } : el,
        ),
      };
      return pushUndo(state, newDoc);
    }

    case 'UNDO': {
      if (state.history.length === 0) return state;
      const prev = state.history[state.history.length - 1];
      return {
        ...state,
        document: prev,
        history: state.history.slice(0, -1),
        future: [state.document, ...state.future],
      };
    }

    case 'REDO': {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return {
        ...state,
        document: next,
        history: [...state.history, state.document],
        future: state.future.slice(1),
      };
    }

    default:
      return state;
  }
}

function pushUndo(state: EditorState, newDoc: TemplateDocument): EditorState {
  return {
    ...state,
    document: newDoc,
    history: [...state.history.slice(-50), state.document],
    future: [],
  };
}

// ─────────────────────────────────────────────────
//  Props
// ─────────────────────────────────────────────────

interface TemplateEditorCanvasProps {
  initialDocument: TemplateDocument;
  data?: DataContext;
  onDocumentChange?: (doc: TemplateDocument) => void;
  className?: string;
}

// ─────────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────────

export function TemplateEditorCanvas({
  initialDocument,
  data = {},
  onDocumentChange,
  className,
}: TemplateEditorCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  const [state, dispatch] = useReducer(editorReducer, {
    document: initialDocument,
    history: [],
    future: [],
    selectedIds: [],
    hoveredId: null,
    showGrid: false,
    scale: 2.5,
  });

  // Track document changes
  const prevDocRef = useRef(state.document);
  if (prevDocRef.current !== state.document) {
    prevDocRef.current = state.document;
    onDocumentChange?.(state.document);
  }

  // ── Interaction Hook ──
  const config = useMemo(() => ({
    mode: 'preview' as const,
    scale: state.scale,
    snapToGrid: state.showGrid,
    gridSize: state.document.canvas.gridSize || 5,
    showHandles: true,
    showGrid: state.showGrid,
    enableKeyboard: true,
    updateDebounce: 16,
  }), [state.scale, state.showGrid, state.document.canvas.gridSize]);

  const { selectElement, clearSelection } = useElementInteraction({
    document: state.document,
    config,
    selectedIds: state.selectedIds,
    dispatch,
    canvasRef,
  });

  // ── Toolbar Actions ──
  const handleUndo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const handleRedo = useCallback(() => dispatch({ type: 'REDO' }), []);
  const handleDelete = useCallback(() => {
    state.selectedIds.forEach(id =>
      dispatch({ type: 'REMOVE_ELEMENT', payload: id }),
    );
    dispatch({ type: 'SELECT_ELEMENTS', payload: [] });
  }, [state.selectedIds]);
  const handleDuplicate = useCallback(() => {
    state.selectedIds.forEach(id =>
      dispatch({ type: 'DUPLICATE_ELEMENT', payload: id }),
    );
  }, [state.selectedIds]);
  const handleToggleGrid = useCallback(() => {
    dispatch({ type: 'SELECT_ELEMENTS', payload: state.selectedIds }); // noop to trigger re-render
    // Toggle grid via local state
  }, [state.selectedIds]);

  const toggleLock = useCallback(() => {
    state.selectedIds.forEach(id => {
      const el = state.document.elements.find(e => e.id === id);
      if (el) {
        dispatch({
          type: 'UPDATE_ELEMENT',
          payload: { id, changes: { locked: !el.locked } },
        });
      }
    });
  }, [state.selectedIds, state.document.elements]);

  const toggleVisibility = useCallback(() => {
    state.selectedIds.forEach(id => {
      const el = state.document.elements.find(e => e.id === id);
      if (el) {
        dispatch({
          type: 'UPDATE_ELEMENT',
          payload: { id, changes: { visible: !el.visible } },
        });
      }
    });
  }, [state.selectedIds, state.document.elements]);

  // ── Selected element info ──
  const selectedElement = state.selectedIds.length === 1
    ? state.document.elements.find(e => e.id === state.selectedIds[0])
    : null;

  return (
    <div className={`flex flex-col gap-3 ${className || ''}`}>
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-1 p-2 bg-slate-800/80 backdrop-blur-xl rounded-xl border border-slate-700/50">
        {/* Undo / Redo */}
        <ToolbarButton
          icon={<Undo2 className="w-4 h-4" />}
          label="Undo"
          onClick={handleUndo}
          disabled={state.history.length === 0}
        />
        <ToolbarButton
          icon={<Redo2 className="w-4 h-4" />}
          label="Redo"
          onClick={handleRedo}
          disabled={state.future.length === 0}
        />

        <ToolbarDivider />

        {/* Zoom */}
        <ToolbarButton
          icon={<ZoomOut className="w-4 h-4" />}
          label="Zoom Out"
          onClick={() => dispatch({ type: 'SELECT_ELEMENTS', payload: state.selectedIds })}
          disabled={state.scale <= 1}
        />
        <span className="px-2 text-xs text-slate-400 font-mono min-w-[48px] text-center">
          {Math.round(state.scale * 100)}%
        </span>
        <ToolbarButton
          icon={<ZoomIn className="w-4 h-4" />}
          label="Zoom In"
          onClick={() => dispatch({ type: 'SELECT_ELEMENTS', payload: state.selectedIds })}
          disabled={state.scale >= 5}
        />

        <ToolbarDivider />

        {/* Grid */}
        <ToolbarButton
          icon={<Grid3X3 className="w-4 h-4" />}
          label="Toggle Grid"
          onClick={handleToggleGrid}
          active={state.showGrid}
        />

        <ToolbarDivider />

        {/* Element Actions */}
        <ToolbarButton
          icon={<Copy className="w-4 h-4" />}
          label="Duplicate"
          onClick={handleDuplicate}
          disabled={state.selectedIds.length === 0}
        />
        <ToolbarButton
          icon={<Trash2 className="w-4 h-4" />}
          label="Delete"
          onClick={handleDelete}
          disabled={state.selectedIds.length === 0}
        />
        <ToolbarButton
          icon={selectedElement?.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          label={selectedElement?.locked ? 'Unlock' : 'Lock'}
          onClick={toggleLock}
          disabled={state.selectedIds.length === 0}
        />
        <ToolbarButton
          icon={selectedElement?.visible === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          label="Toggle Visibility"
          onClick={toggleVisibility}
          disabled={state.selectedIds.length === 0}
        />

        {/* Status */}
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Layers className="w-3.5 h-3.5" />
            <span>{state.document.elements.length} elements</span>
          </div>
          {selectedElement && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
              <MousePointer2 className="w-3 h-3" />
              <span>{selectedElement.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Canvas Area ── */}
      <div className="flex justify-center p-8 bg-slate-900/50 rounded-xl border border-slate-700/30 overflow-auto">
        <div className="relative" style={{ filter: 'drop-shadow(0 4px 24px rgba(0,0,0,0.3))' }}>
          <TemplateRendererStandalone
            ref={canvasRef}
            document={state.document}
            data={data}
            scale={state.scale}
            mode="preview"
            selectedIds={state.selectedIds}
            hoveredId={state.hoveredId}
            onSelect={selectElement}
            onHover={(id) => dispatch({ type: 'HOVER_ELEMENT', payload: id })}
            onCanvasClick={clearSelection}
            showGrid={state.showGrid}
          />
        </div>
      </div>

      {/* ── Properties Panel (for selected element) ── */}
      {selectedElement && (
        <ElementPropertiesPanel
          element={selectedElement}
          onChange={(changes) =>
            dispatch({
              type: 'UPDATE_ELEMENT',
              payload: { id: selectedElement.id, changes },
            })
          }
          onMove={(pos) =>
            dispatch({
              type: 'MOVE_ELEMENT',
              payload: { id: selectedElement.id, position: pos },
            })
          }
          onResize={(dims) =>
            dispatch({
              type: 'RESIZE_ELEMENT',
              payload: { id: selectedElement.id, dimensions: dims },
            })
          }
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────
//  Toolbar Primitives
// ─────────────────────────────────────────────────

function ToolbarButton({
  icon,
  label,
  onClick,
  disabled,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`p-1.5 rounded-lg transition-colors ${
        disabled
          ? 'text-slate-600 cursor-not-allowed'
          : active
            ? 'text-blue-400 bg-blue-500/20'
            : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
      }`}
    >
      {icon}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-5 bg-slate-700 mx-1" />;
}

// ─────────────────────────────────────────────────
//  Element Properties Panel
// ─────────────────────────────────────────────────

function ElementPropertiesPanel({
  element,
  onChange,
  onMove,
  onResize,
}: {
  element: TemplateElement;
  onChange: (changes: Partial<TemplateElement>) => void;
  onMove: (pos: { x: number; y: number }) => void;
  onResize: (dims: { width: number; height: number }) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-3 p-3 bg-slate-800/80 backdrop-blur-xl rounded-xl border border-slate-700/50">
      {/* Position */}
      <div>
        <label className="block text-[10px] text-slate-500 mb-1">X</label>
        <input
          type="number"
          value={Math.round(element.position.x)}
          onChange={(e) => onMove({ ...element.position, x: Number(e.target.value) })}
          className="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-white"
        />
      </div>
      <div>
        <label className="block text-[10px] text-slate-500 mb-1">Y</label>
        <input
          type="number"
          value={Math.round(element.position.y)}
          onChange={(e) => onMove({ ...element.position, y: Number(e.target.value) })}
          className="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-white"
        />
      </div>
      <div>
        <label className="block text-[10px] text-slate-500 mb-1">W</label>
        <input
          type="number"
          value={Math.round(element.dimensions.width)}
          onChange={(e) => onResize({ ...element.dimensions, width: Number(e.target.value) })}
          className="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-white"
        />
      </div>
      <div>
        <label className="block text-[10px] text-slate-500 mb-1">H</label>
        <input
          type="number"
          value={Math.round(element.dimensions.height)}
          onChange={(e) => onResize({ ...element.dimensions, height: Number(e.target.value) })}
          className="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-white"
        />
      </div>

      {/* Rotation & Z-Index */}
      <div>
        <label className="block text-[10px] text-slate-500 mb-1">Rotation</label>
        <input
          type="number"
          value={element.rotation}
          onChange={(e) => onChange({ rotation: Number(e.target.value) })}
          className="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-white"
        />
      </div>
      <div>
        <label className="block text-[10px] text-slate-500 mb-1">Z-Index</label>
        <input
          type="number"
          value={element.zIndex}
          onChange={(e) => onChange({ zIndex: Number(e.target.value) })}
          className="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-white"
        />
      </div>
      <div>
        <label className="block text-[10px] text-slate-500 mb-1">Opacity</label>
        <input
          type="number"
          min={0}
          max={1}
          step={0.1}
          value={element.opacity}
          onChange={(e) => onChange({ opacity: Number(e.target.value) })}
          className="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-white"
        />
      </div>
      <div className="flex items-end">
        <p className="px-2 py-1 text-xs text-slate-400 bg-slate-900/50 rounded border border-slate-700/50 w-full text-center truncate">
          {element.type}
        </p>
      </div>
    </div>
  );
}