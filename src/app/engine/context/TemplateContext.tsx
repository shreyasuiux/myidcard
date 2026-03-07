/**
 * ═══════════════════════════════════════════════════════════════
 *  TEMPLATE CONTEXT — Central State Management
 * ═══════════════════════════════════════════════════════════════
 *
 *  STATE SPLIT STRATEGY (prevents unnecessary re-renders):
 *
 *  ┌─────────────────────────────────────────────────────────┐
 *  │  DocumentContext   │ Template data (elements, layers,   │
 *  │  (changes rarely)  │ background, canvas settings)       │
 *  ├────────────────────┼────────────────────────────────────┤
 *  │  SelectionContext  │ Selection, hover, drag, resize     │
 *  │  (changes often)   │ state.  Only selection UI reads.   │
 *  ├────────────────────┼────────────────────────────────────┤
 *  │  ConfigContext     │ Engine config (mode, scale, grid). │
 *  │  (changes rarely)  │ Typically set once at mount.       │
 *  ├────────────────────┼────────────────────────────────────┤
 *  │  DataContext       │ Live employee/form data.  Updated  │
 *  │  (changes on input)│ per keystroke; only bound elements │
 *  │                    │ need to re-render.                 │
 *  └────────────────────┴────────────────────────────────────┘
 *
 *  WHY SEPARATE CONTEXTS:
 *  If selection state and document state were in one context,
 *  every element would re-render on every mouse move during drag.
 *  Splitting contexts limits re-renders to subscribers of each slice.
 * ═══════════════════════════════════════════════════════════════
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import type {
  TemplateDocument,
  SelectionState,
  EngineConfig,
  EngineAction,
  DataContext as DataContextType,
  TemplateElement,
  Position,
  Dimensions,
} from '../types';
import { DEFAULT_ENGINE_CONFIG } from '../types';

// ─────────────────────────────────────────────────
//  1. Document State
// ─────────────────────────────────────────────────

interface DocumentState {
  document: TemplateDocument;
  /** Undo stack (max 50) */
  history: TemplateDocument[];
  /** Redo stack */
  future: TemplateDocument[];
}

function documentReducer(state: DocumentState, action: EngineAction): DocumentState {
  switch (action.type) {
    case 'SET_DOCUMENT':
      return {
        document: action.payload,
        history: [],
        future: [],
      };

    case 'UPDATE_ELEMENT': {
      const { id, changes } = action.payload;
      const doc = state.document;
      return pushHistory(state, {
        ...doc,
        elements: doc.elements.map(el =>
          el.id === id ? { ...el, ...changes } : el,
        ),
      });
    }

    case 'MOVE_ELEMENT': {
      const { id, position } = action.payload;
      const doc = state.document;
      return pushHistory(state, {
        ...doc,
        elements: doc.elements.map(el =>
          el.id === id ? { ...el, position } : el,
        ),
      });
    }

    case 'RESIZE_ELEMENT': {
      const { id, dimensions, position } = action.payload;
      const doc = state.document;
      return pushHistory(state, {
        ...doc,
        elements: doc.elements.map(el =>
          el.id === id
            ? { ...el, dimensions, ...(position ? { position } : {}) }
            : el,
        ),
      });
    }

    case 'ADD_ELEMENT': {
      const doc = state.document;
      return pushHistory(state, {
        ...doc,
        elements: [...doc.elements, action.payload],
      });
    }

    case 'REMOVE_ELEMENT': {
      const doc = state.document;
      return pushHistory(state, {
        ...doc,
        elements: doc.elements.filter(el => el.id !== action.payload),
      });
    }

    case 'DUPLICATE_ELEMENT': {
      const doc = state.document;
      const original = doc.elements.find(el => el.id === action.payload);
      if (!original) return state;
      const copy: TemplateElement = {
        ...original,
        id: `${original.id}_copy_${Date.now()}`,
        name: `${original.name} (copy)`,
        position: {
          ...original.position,
          x: original.position.x + 10,
          y: original.position.y + 10,
        },
      };
      return pushHistory(state, {
        ...doc,
        elements: [...doc.elements, copy],
      });
    }

    case 'REORDER_ELEMENT': {
      const { id, zIndex } = action.payload;
      const doc = state.document;
      return pushHistory(state, {
        ...doc,
        elements: doc.elements.map(el =>
          el.id === id ? { ...el, zIndex } : el,
        ),
      });
    }

    case 'SET_BACKGROUND': {
      const doc = state.document;
      return pushHistory(state, {
        ...doc,
        background: { ...doc.background, ...action.payload },
      });
    }

    case 'UPDATE_LAYER': {
      const { id, changes } = action.payload;
      const doc = state.document;
      return pushHistory(state, {
        ...doc,
        layers: doc.layers.map(l =>
          l.id === id ? { ...l, ...changes } : l,
        ),
      });
    }

    case 'SET_VARIABLE': {
      const { name, value } = action.payload;
      const doc = state.document;
      return pushHistory(state, {
        ...doc,
        variables: doc.variables.map(v =>
          v.name === name ? { ...v, value } : v,
        ),
      });
    }

    case 'UNDO': {
      if (state.history.length === 0) return state;
      const prev = state.history[state.history.length - 1];
      return {
        document: prev,
        history: state.history.slice(0, -1),
        future: [state.document, ...state.future],
      };
    }

    case 'REDO': {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return {
        document: next,
        history: [...state.history, state.document],
        future: state.future.slice(1),
      };
    }

    case 'BATCH': {
      let current = state;
      for (const a of action.payload) {
        current = documentReducer(current, a);
      }
      return current;
    }

    default:
      return state;
  }
}

function pushHistory(state: DocumentState, newDoc: TemplateDocument): DocumentState {
  const MAX_HISTORY = 50;
  return {
    document: newDoc,
    history: [...state.history.slice(-MAX_HISTORY), state.document],
    future: [], // Clear redo on new change
  };
}

// ─────────────────────────────────────────────────
//  2. Selection State (separate to avoid re-render cascades)
// ─────────────────────────────────────────────────

const initialSelection: SelectionState = {
  selectedIds: [],
  hoveredId: null,
  dragState: null,
  resizeState: null,
};

function selectionReducer(state: SelectionState, action: EngineAction): SelectionState {
  switch (action.type) {
    case 'SELECT_ELEMENTS':
      return { ...state, selectedIds: action.payload };
    case 'HOVER_ELEMENT':
      return { ...state, hoveredId: action.payload };
    case 'START_DRAG':
      return { ...state, dragState: action.payload };
    case 'UPDATE_DRAG':
      if (!state.dragState) return state;
      return {
        ...state,
        dragState: { ...state.dragState, currentPosition: action.payload },
      };
    case 'END_DRAG':
      return { ...state, dragState: null };
    case 'START_RESIZE':
      return { ...state, resizeState: action.payload };
    case 'UPDATE_RESIZE':
      if (!state.resizeState) return state;
      return {
        ...state,
        resizeState: { ...state.resizeState, currentDimensions: action.payload },
      };
    case 'END_RESIZE':
      return { ...state, resizeState: null };
    default:
      return state;
  }
}

// ─────────────────────────────────────────────────
//  3. Context Definitions
// ─────────────────────────────────────────────────

interface DocumentContextValue {
  document: TemplateDocument;
  canUndo: boolean;
  canRedo: boolean;
}

interface DispatchContextValue {
  dispatch: React.Dispatch<EngineAction>;
}

const DocumentCtx = createContext<DocumentContextValue | null>(null);
const SelectionCtx = createContext<SelectionState>(initialSelection);
const DispatchCtx = createContext<DispatchContextValue | null>(null);
const ConfigCtx = createContext<EngineConfig>(DEFAULT_ENGINE_CONFIG);
const DataCtx = createContext<DataContextType>({});

// ─────────────────────────────────────────────────
//  4. Provider
// ─────────────────────────────────────────────────

interface TemplateProviderProps {
  initialDocument: TemplateDocument;
  config?: Partial<EngineConfig>;
  data?: DataContextType;
  children: ReactNode;
}

export function TemplateProvider({
  initialDocument,
  config: configOverrides,
  data = {},
  children,
}: TemplateProviderProps) {
  // Document state
  const [docState, docDispatch] = useReducer(documentReducer, {
    document: initialDocument,
    history: [],
    future: [],
  });

  // Selection state
  const [selection, selDispatch] = useReducer(selectionReducer, initialSelection);

  // Unified dispatch — fans out to both reducers
  const dispatch = useCallback((action: EngineAction) => {
    docDispatch(action);
    selDispatch(action);
  }, []);

  // Memoize context values
  const docCtxValue = useMemo<DocumentContextValue>(() => ({
    document: docState.document,
    canUndo: docState.history.length > 0,
    canRedo: docState.future.length > 0,
  }), [docState.document, docState.history.length, docState.future.length]);

  const dispatchValue = useMemo<DispatchContextValue>(() => ({ dispatch }), [dispatch]);

  const engineConfig = useMemo<EngineConfig>(
    () => ({ ...DEFAULT_ENGINE_CONFIG, ...configOverrides }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(configOverrides)],
  );

  return (
    <ConfigCtx.Provider value={engineConfig}>
      <DispatchCtx.Provider value={dispatchValue}>
        <DocumentCtx.Provider value={docCtxValue}>
          <SelectionCtx.Provider value={selection}>
            <DataCtx.Provider value={data}>
              {children}
            </DataCtx.Provider>
          </SelectionCtx.Provider>
        </DocumentCtx.Provider>
      </DispatchCtx.Provider>
    </ConfigCtx.Provider>
  );
}

// ─────────────────────────────────────────────────
//  5. Hooks (Clean API)
// ─────────────────────────────────────────────────

export function useDocument(): DocumentContextValue {
  const ctx = useContext(DocumentCtx);
  if (!ctx) throw new Error('useDocument must be used within TemplateProvider');
  return ctx;
}

export function useEngineDispatch(): React.Dispatch<EngineAction> {
  const ctx = useContext(DispatchCtx);
  if (!ctx) throw new Error('useEngineDispatch must be used within TemplateProvider');
  return ctx.dispatch;
}

export function useSelection(): SelectionState {
  return useContext(SelectionCtx);
}

export function useEngineConfig(): EngineConfig {
  return useContext(ConfigCtx);
}

export function useDataContext(): DataContextType {
  return useContext(DataCtx);
}

/** Convenience: get a single element by ID (returns undefined if missing) */
export function useElement(id: string): TemplateElement | undefined {
  const { document } = useDocument();
  return useMemo(
    () => document.elements.find(el => el.id === id),
    [document.elements, id],
  );
}

/** Convenience: check if an element is selected */
export function useIsSelected(id: string): boolean {
  const { selectedIds } = useSelection();
  return selectedIds.includes(id);
}
