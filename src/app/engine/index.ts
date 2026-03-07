/**
 * ═══════════════════════════════════════════════════════════════
 *  TEMPLATE ENGINE — Public API
 * ═══════════════════════════════════════════════════════════════
 *
 *  FOLDER STRUCTURE:
 *
 *  engine/
 *  ├── index.ts                    ← You are here (barrel export)
 *  ├── types.ts                    ← Complete type system
 *  ├── registry.ts                 ← Element type registry
 *  ├── transforms.ts               ← Data transform functions
 *  ├── ElementRenderer.tsx         ← Element wrapper + factory
 *  ├── TemplateRenderer.tsx        ← Core canvas renderer
 *  ├── context/
 *  │   └── TemplateContext.tsx     ← State management
 *  ├── elements/                   ← Type-specific renderers
 *  │   ├── TextElement.tsx
 *  │   ├── ImageElement.tsx
 *  │   ├── ShapeElement.tsx
 *  │   ├── LogoElement.tsx
 *  │   ├── DividerElement.tsx
 *  │   └── ContainerElement.tsx
 *  ├── hooks/
 *  │   └── useElementInteraction.ts ← Drag/resize/select/keyboard
 *  └── utils/
 *      ├── styleParser.ts          ← ElementStyle → CSS
 *      ├── bindingResolver.ts      ← DataBinding → resolved value
 *      ├── layerManager.ts         ← z-index + visibility
 *      ├── exportEngine.ts         ← PDF/image export
 *      └── templateBridge.ts       ← Legacy format converter
 * ═══════════════════════════════════════════════════════════════
 */

// ── Bootstrap: register transforms (must run before any rendering) ──
import './transforms';

// ── Types ──
export type {
  TemplateDocument,
  TemplateMeta,
  CanvasSettings,
  BackgroundSettings,
  GradientDef,
  PatternDef,
  Layer,
  TemplateElement,
  ElementType,
  Position,
  Dimensions,
  ElementStyle,
  TextProps,
  ImageProps,
  ShapeProps,
  LogoProps,
  QRCodeProps,
  BarcodeProps,
  ContainerProps,
  DividerProps,
  ElementPropsMap,
  DataBinding,
  DataContext,
  ConditionalVisibility,
  TemplateVariable,
  SelectionState,
  DragState,
  ResizeState,
  ResizeHandle,
  EngineAction,
  RenderMode,
  EngineConfig,
} from './types';

export {
  DEFAULT_ENGINE_CONFIG,
  generateElementId,
  generateLayerId,
  createElement,
  createDocument,
} from './types';

// ── Registry ──
export { elementRegistry } from './registry';
export type { ElementRendererProps, ElementRendererComponent } from './registry';

// ── Renderer ──
export { TemplateRendererStandalone } from './TemplateRenderer';
export type { TemplateRendererStandaloneProps } from './TemplateRenderer';

// ── Context ──
export {
  TemplateProvider,
  useDocument,
  useEngineDispatch,
  useSelection,
  useEngineConfig,
  useDataContext,
  useElement,
  useIsSelected,
} from './context/TemplateContext';

// ── Hooks ──
export { useElementInteraction } from './hooks/useElementInteraction';

// ── Utils ──
export { parseElementStyle, parseBackgroundStyle, resolveVariables } from './utils/styleParser';
export {
  resolveBinding,
  resolveElementBindings,
  evaluateCondition,
  applyBindingsToElement,
  registerTransform,
} from './utils/bindingResolver';
export {
  getOrderedElements,
  groupByLayer,
  getNextZIndex,
  getEffectiveOpacity,
  isElementLocked,
} from './utils/layerManager';
export {
  renderDocumentToCanvas,
  extractPhotoPositions,
  pxToMm,
} from './utils/exportEngine';
export type { ExportConfig, ExportResult, PhotoPosition } from './utils/exportEngine';

// ── Bridge ──
export { legacyToDocument, employeeToDataContext } from './utils/templateBridge';

// ── Editor ──
export { TemplateEditorCanvas } from './TemplateEditorCanvas';

// ── Drop-in Legacy Replacement ──
export { EngineCardRenderer } from './EngineCardRenderer';
export type { EngineCardRendererProps } from './EngineCardRenderer';