/**
 * ═══════════════════════════════════════════════════════════════
 *  TEMPLATE ENGINE — COMPLETE TYPE SYSTEM
 * ═══════════════════════════════════════════════════════════════
 *
 *  This is the single source of truth for every data structure
 *  in the rendering engine.  If it's not defined here, it does
 *  not exist.
 *
 *  DESIGN PRINCIPLES:
 *  ─ Every layout/style value is explicit — no implicit defaults
 *  ─ Every element is independent and self-describing
 *  ─ Elements are generic; type-specific data lives in `props`
 *  ─ Bindings map element fields to external data at render time
 *  ─ Layers control grouping/visibility; z-index controls paint order
 *  ─ Units are always px for the engine; conversion happens at export
 *
 *  VERSIONING:
 *  Schema version is embedded in TemplateDocument.  Migrators
 *  convert old versions forward.  Never mutate old schemas.
 * ═══════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────
//  1. DOCUMENT ROOT
// ─────────────────────────────────────────────────

export interface TemplateDocument {
  /** Schema version — bump on breaking changes */
  schemaVersion: number;

  /** Unique template identifier */
  id: string;

  /** Human metadata */
  meta: TemplateMeta;

  /** Canvas / artboard dimensions & settings */
  canvas: CanvasSettings;

  /** Background fill */
  background: BackgroundSettings;

  /** Ordered layer stack (bottom → top) */
  layers: Layer[];

  /** Flat element array — all elements across all layers */
  elements: TemplateElement[];

  /** Global data-binding map */
  bindings: Record<string, DataBinding>;

  /** Template-level variables (colors, sizes, etc.) */
  variables: TemplateVariable[];

  /** Readiness flag — block render until true */
  isReady: boolean;
}

// ─────────────────────────────────────────────────
//  2. META
// ─────────────────────────────────────────────────

export interface TemplateMeta {
  name: string;
  description: string;
  category: string;
  tags: string[];
  author: string;
  createdAt: string;
  updatedAt: string;
  /** The document side this template represents */
  side: 'front' | 'back' | 'single';
}

// ─────────────────────────────────────────────────
//  3. CANVAS
// ─────────────────────────────────────────────────

export interface CanvasSettings {
  /** Artboard width in px */
  width: number;
  /** Artboard height in px */
  height: number;
  /** Physical unit for export (px / mm / in) */
  unit: 'px' | 'mm' | 'in';
  /** DPI for print export */
  dpi: number;
  /** Layout mode:
   *  - absolute: free-form positioning (default for card/badge)
   *  - grid: css-grid based layout
   *  - flex: flex-based layout
   */
  layoutMode: 'absolute' | 'grid' | 'flex';
  /** Grid snap increment (px), 0 = off */
  gridSize: number;
  /** Whether to snap element positions to grid */
  snapToGrid: boolean;
}

// ─────────────────────────────────────────────────
//  4. BACKGROUND
// ─────────────────────────────────────────────────

export interface BackgroundSettings {
  type: 'solid' | 'gradient' | 'image' | 'pattern';
  /** Solid color or fallback */
  color: string;
  /** Gradient definition */
  gradient?: GradientDef;
  /** Image URL or data-URI */
  imageUrl?: string;
  /** Repeating pattern */
  pattern?: PatternDef;
  /** 0–1 */
  opacity: number;
}

export interface GradientDef {
  type: 'linear' | 'radial';
  /** Degrees (linear) or shape (radial) */
  angle: number;
  stops: Array<{ color: string; position: number }>;
}

export interface PatternDef {
  type: 'dots' | 'lines' | 'crosshatch' | 'custom';
  /** Pattern tile size in px */
  size: number;
  color: string;
  /** 0–1 */
  opacity: number;
  /** Only for type === 'custom' */
  svgData?: string;
}

// ─────────────────────────────────────────────────
//  5. LAYERS
// ─────────────────────────────────────────────────

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  /** 0–1 — multiplied with element opacity */
  opacity: number;
  /** Render order (lower = painted first = behind) */
  order: number;
}

// ─────────────────────────────────────────────────
//  6. ELEMENT — The Core Unit
// ─────────────────────────────────────────────────

/** All supported element types */
export type ElementType =
  | 'text'
  | 'image'
  | 'shape'
  | 'logo'
  | 'qrcode'
  | 'barcode'
  | 'container'
  | 'divider';

export interface TemplateElement<T extends ElementType = ElementType> {
  /** Unique element ID */
  id: string;

  /** Discriminated union tag */
  type: T;

  /** Human-readable label for layers panel */
  name: string;

  /** Which layer this element belongs to */
  layerId: string;

  // ── Geometry ──────────────────────────────

  position: Position;
  dimensions: Dimensions;
  /** Degrees, clockwise */
  rotation: number;
  /** Paint order — higher = on top */
  zIndex: number;

  // ── Appearance ────────────────────────────

  style: ElementStyle;
  /** 0–1 */
  opacity: number;
  visible: boolean;

  // ── Data Binding ──────────────────────────

  /** Maps prop paths to data source fields */
  bindings?: Record<string, DataBinding>;

  /** Conditional visibility expression */
  condition?: ConditionalVisibility;

  // ── Interaction State ─────────────────────

  locked: boolean;
  selectable: boolean;

  // ── Type-Specific Props ───────────────────
  /**
   * Discriminated by `type`.  Each element type has its own
   * prop shape.  The registry knows which props belong to which type.
   */
  props: ElementPropsMap[T];

  // ── Hierarchy ─────────────────────────────

  /** Parent element ID (for containers) */
  parentId?: string;
  /** Child element IDs (for containers) */
  children?: string[];
}

// ─────────────────────────────────────────────────
//  7. POSITION & DIMENSION
// ─────────────────────────────────────────────────

export interface Position {
  x: number;
  y: number;
  /** Anchor point for transforms (default: top-left) */
  anchor?: 'top-left' | 'center' | 'top-center';
}

export interface Dimensions {
  width: number;
  height: number;
  /** Minimum constraints (for resize handles) */
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  /** Lock aspect ratio during resize */
  aspectLock?: boolean;
}

// ─────────────────────────────────────────────────
//  8. ELEMENT STYLE
// ─────────────────────────────────────────────────

export interface ElementStyle {
  // ── Fill ──
  backgroundColor?: string;
  backgroundGradient?: GradientDef;
  backgroundImage?: string;

  // ── Border ──
  borderWidth?: number;
  borderColor?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  borderRadius?: number | string;

  // ── Shadow ──
  boxShadow?: string;

  // ── Typography (text elements) ──
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number | string;
  fontStyle?: 'normal' | 'italic';
  lineHeight?: number | string;
  letterSpacing?: number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  textDecoration?: 'none' | 'underline' | 'line-through';
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  color?: string;
  /** Auto-shrink to fit container width */
  autoShrink?: boolean;
  /** Minimum font size for auto-shrink */
  minFontSize?: number;

  // ── Overflow ──
  overflow?: 'hidden' | 'visible' | 'clip';

  // ── Image ──
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  objectPosition?: string;

  // ── Clip / Mask ──
  clipPath?: string;
  mask?: string;

  // ── Padding ──
  padding?: number | string;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
}

// ─────────────────────────────────────────────────
//  9. TYPE-SPECIFIC PROPS
// ─────────────────────────────────────────────────

export interface TextProps {
  /** Static text content (overridden by binding) */
  content: string;
  /** Optional prefix (e.g. "Emp ID : ") */
  prefix?: string;
  /** Optional suffix */
  suffix?: string;
  /** Whether content should auto-wrap */
  wordWrap?: boolean;
  /** Max lines before truncation */
  maxLines?: number;
}

export interface ImageProps {
  /** Static image URL or data-URI */
  src: string;
  alt?: string;
  /** Shape mask */
  shape?: 'rectangle' | 'circle' | 'rounded';
  /** Fallback placeholder text */
  placeholder?: string;
}

export interface ShapeProps {
  shape: 'rectangle' | 'circle' | 'ellipse' | 'line' | 'triangle' | 'custom';
  /** Fill color (can differ from style.backgroundColor) */
  fill: string;
  /** Stroke color */
  stroke?: string;
  strokeWidth?: number;
  /** For custom shapes — SVG path data */
  pathData?: string;
}

export interface LogoProps {
  /** Logo image source */
  src: string;
  /** Aspect ratio to maintain (w/h) */
  aspectRatio: number;
}

export interface QRCodeProps {
  /** Static value (overridden by binding) */
  value: string;
  /** Error correction level */
  errorCorrection?: 'L' | 'M' | 'Q' | 'H';
  foregroundColor?: string;
  backgroundColor?: string;
}

export interface BarcodeProps {
  /** Static value (overridden by binding) */
  value: string;
  format: 'CODE128' | 'CODE39' | 'EAN13' | 'UPC';
  lineColor?: string;
  backgroundColor?: string;
  showText?: boolean;
}

export interface ContainerProps {
  /** How children are laid out inside */
  layout: 'absolute' | 'flex-row' | 'flex-col' | 'grid';
  gap?: number;
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
  justifyContent?: 'start' | 'center' | 'end' | 'between' | 'around';
}

export interface DividerProps {
  direction: 'horizontal' | 'vertical';
  thickness: number;
  color: string;
  style: 'solid' | 'dashed' | 'dotted';
}

/** Map from element type to its props interface */
export interface ElementPropsMap {
  text: TextProps;
  image: ImageProps;
  shape: ShapeProps;
  logo: LogoProps;
  qrcode: QRCodeProps;
  barcode: BarcodeProps;
  container: ContainerProps;
  divider: DividerProps;
}

// ─────────────────────────────────────────────────
//  10. DATA BINDING
// ─────────────────────────────────────────────────

export interface DataBinding {
  /** Dot-notation path into the data context (e.g. "employee.name") */
  field: string;
  /** Transform function name to apply after resolving */
  transform?: string;
  /** Fallback if field is empty/undefined */
  fallback?: string;
  /** Format string (e.g. "Emp ID : {{value}}") */
  formatTemplate?: string;
}

/** The data context passed to the renderer */
export interface DataContext {
  [key: string]: any;
}

// ─────────────────────────────────────────────────
//  11. CONDITIONAL VISIBILITY
// ─────────────────────────────────────────────────

export interface ConditionalVisibility {
  /** Data field to evaluate */
  field: string;
  /** Comparison operator */
  operator: 'equals' | 'notEquals' | 'exists' | 'notExists' | 'gt' | 'lt' | 'contains';
  /** Value to compare against */
  value?: any;
}

// ─────────────────────────────────────────────────
//  12. TEMPLATE VARIABLES
// ─────────────────────────────────────────────────

export interface TemplateVariable {
  /** Variable name (referenced as {{varName}} in styles) */
  name: string;
  type: 'color' | 'number' | 'string' | 'boolean';
  value: any;
  label: string;
  description?: string;
}

// ─────────────────────────────────────────────────
//  13. SELECTION & INTERACTION STATE
// ─────────────────────────────────────────────────

export interface SelectionState {
  /** Currently selected element IDs */
  selectedIds: string[];
  /** Element being hovered */
  hoveredId: string | null;
  /** Active drag state */
  dragState: DragState | null;
  /** Active resize state */
  resizeState: ResizeState | null;
}

export interface DragState {
  elementId: string;
  startPosition: Position;
  currentPosition: Position;
  /** Offset from element origin to mouse down point */
  offset: { x: number; y: number };
}

export interface ResizeState {
  elementId: string;
  handle: ResizeHandle;
  startDimensions: Dimensions;
  startPosition: Position;
  currentDimensions: Dimensions;
}

export type ResizeHandle =
  | 'top-left' | 'top' | 'top-right'
  | 'left'                | 'right'
  | 'bottom-left' | 'bottom' | 'bottom-right';

// ─────────────────────────────────────────────────
//  14. ENGINE ACTIONS (Reducer Events)
// ─────────────────────────────────────────────────

export type EngineAction =
  | { type: 'SET_DOCUMENT'; payload: TemplateDocument }
  | { type: 'UPDATE_ELEMENT'; payload: { id: string; changes: Partial<TemplateElement> } }
  | { type: 'MOVE_ELEMENT'; payload: { id: string; position: Position } }
  | { type: 'RESIZE_ELEMENT'; payload: { id: string; dimensions: Dimensions; position?: Position } }
  | { type: 'ADD_ELEMENT'; payload: TemplateElement }
  | { type: 'REMOVE_ELEMENT'; payload: string }
  | { type: 'DUPLICATE_ELEMENT'; payload: string }
  | { type: 'REORDER_ELEMENT'; payload: { id: string; zIndex: number } }
  | { type: 'SET_BACKGROUND'; payload: Partial<BackgroundSettings> }
  | { type: 'UPDATE_LAYER'; payload: { id: string; changes: Partial<Layer> } }
  | { type: 'SELECT_ELEMENTS'; payload: string[] }
  | { type: 'HOVER_ELEMENT'; payload: string | null }
  | { type: 'START_DRAG'; payload: DragState }
  | { type: 'UPDATE_DRAG'; payload: Position }
  | { type: 'END_DRAG'; payload?: undefined }
  | { type: 'START_RESIZE'; payload: ResizeState }
  | { type: 'UPDATE_RESIZE'; payload: Dimensions }
  | { type: 'END_RESIZE'; payload?: undefined }
  | { type: 'UNDO'; payload?: undefined }
  | { type: 'REDO'; payload?: undefined }
  | { type: 'SET_VARIABLE'; payload: { name: string; value: any } }
  | { type: 'BATCH'; payload: EngineAction[] };

// ─────────────────────────────────────────────────
//  15. RENDER MODE
// ─────────────────────────────────────────────────

export type RenderMode =
  | 'preview'    // Interactive with selection/drag
  | 'display'    // Read-only view
  | 'export'     // High-quality hidden render for PDF
  | 'thumbnail'; // Small-scale read-only

// ─────────────────────────────────────────────────
//  16. ENGINE CONFIGURATION
// ─────────────────────────────────────────────────

export interface EngineConfig {
  mode: RenderMode;
  /** Scale multiplier (1 = 100%, 2 = 200% zoom, etc.) */
  scale: number;
  /** Enable/disable grid snap */
  snapToGrid: boolean;
  /** Grid size override */
  gridSize: number;
  /** Show selection handles */
  showHandles: boolean;
  /** Show grid overlay */
  showGrid: boolean;
  /** Enable keyboard shortcuts */
  enableKeyboard: boolean;
  /** Debounce ms for style updates */
  updateDebounce: number;
}

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  mode: 'preview',
  scale: 1,
  snapToGrid: false,
  gridSize: 5,
  showHandles: true,
  showGrid: false,
  enableKeyboard: true,
  updateDebounce: 16,
};

// ─────────────────────────────────────────────────
//  17. FACTORY HELPERS
// ─────────────────────────────────────────────────

let _idCounter = 0;
export function generateElementId(): string {
  return `el_${Date.now()}_${++_idCounter}`;
}

export function generateLayerId(): string {
  return `layer_${Date.now()}_${++_idCounter}`;
}

/** Create a new element with sensible defaults */
export function createElement<T extends ElementType>(
  type: T,
  props: ElementPropsMap[T],
  overrides?: Partial<TemplateElement<T>>,
): TemplateElement<T> {
  return {
    id: generateElementId(),
    type,
    name: `${type} element`,
    layerId: 'default',
    position: { x: 0, y: 0 },
    dimensions: { width: 100, height: 40 },
    rotation: 0,
    zIndex: 0,
    style: {},
    opacity: 1,
    visible: true,
    locked: false,
    selectable: true,
    props,
    ...overrides,
  } as TemplateElement<T>;
}

/** Create a blank document */
export function createDocument(
  width: number,
  height: number,
  overrides?: Partial<TemplateDocument>,
): TemplateDocument {
  return {
    schemaVersion: 1,
    id: `doc_${Date.now()}`,
    meta: {
      name: 'Untitled',
      description: '',
      category: 'general',
      tags: [],
      author: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      side: 'single',
    },
    canvas: {
      width,
      height,
      unit: 'px',
      dpi: 300,
      layoutMode: 'absolute',
      gridSize: 5,
      snapToGrid: false,
    },
    background: {
      type: 'solid',
      color: '#ffffff',
      opacity: 1,
    },
    layers: [{ id: 'default', name: 'Layer 1', visible: true, locked: false, opacity: 1, order: 0 }],
    elements: [],
    bindings: {},
    variables: [],
    isReady: true,
    ...overrides,
  };
}
