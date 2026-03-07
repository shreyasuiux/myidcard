/**
 * ═══════════════════════════════════════════════════════════════
 *  LAYER MANAGER — Sorts, filters, and groups elements by layer
 * ═══════════════════════════════════════════════════════════════
 *
 *  Z-INDEX STRATEGY:
 *  ─ Elements within a layer are sorted by element.zIndex
 *  ─ Layers are sorted by layer.order
 *  ─ Final paint order: layer.order * 1000 + element.zIndex
 *  ─ This gives each layer 1000 z-index slots
 *
 *  VISIBILITY RULES:
 *  ─ If layer.visible === false → all elements in that layer are hidden
 *  ─ If element.visible === false → element is hidden
 *  ─ If element.condition fails → element is hidden
 * ═══════════════════════════════════════════════════════════════
 */

import type {
  Layer,
  TemplateElement,
  DataContext,
} from '../types';
import { evaluateCondition } from './bindingResolver';

/**
 * Get the flat, paint-ordered list of elements ready for rendering.
 *
 * Steps:
 * 1. Filter hidden layers
 * 2. Filter hidden elements
 * 3. Evaluate conditional visibility
 * 4. Sort by composite z-index (layer order + element z-index)
 */
export function getOrderedElements(
  elements: TemplateElement[],
  layers: Layer[],
  data: DataContext,
): TemplateElement[] {
  // Build layer lookup
  const layerMap = new Map<string, Layer>();
  for (const layer of layers) {
    layerMap.set(layer.id, layer);
  }

  return elements
    // 1. Filter hidden layers
    .filter(el => {
      const layer = layerMap.get(el.layerId);
      return !layer || layer.visible;
    })
    // 2. Filter hidden elements
    .filter(el => el.visible)
    // 3. Evaluate conditional visibility
    .filter(el => {
      if (!el.condition) return true;
      return evaluateCondition(el.condition, data);
    })
    // 4. Sort by composite z-index
    .sort((a, b) => {
      const layerA = layerMap.get(a.layerId);
      const layerB = layerMap.get(b.layerId);
      const orderA = (layerA?.order ?? 0) * 1000 + a.zIndex;
      const orderB = (layerB?.order ?? 0) * 1000 + b.zIndex;
      return orderA - orderB;
    });
}

/**
 * Group elements by layer for the layers panel.
 */
export function groupByLayer(
  elements: TemplateElement[],
  layers: Layer[],
): Map<string, TemplateElement[]> {
  const groups = new Map<string, TemplateElement[]>();

  // Initialize groups for all layers (ordered)
  for (const layer of [...layers].sort((a, b) => a.order - b.order)) {
    groups.set(layer.id, []);
  }

  // Distribute elements
  for (const el of elements) {
    const group = groups.get(el.layerId);
    if (group) {
      group.push(el);
    }
  }

  // Sort within each layer by z-index
  for (const [, elems] of groups) {
    elems.sort((a, b) => a.zIndex - b.zIndex);
  }

  return groups;
}

/**
 * Calculate the next available z-index for a layer.
 */
export function getNextZIndex(
  elements: TemplateElement[],
  layerId: string,
): number {
  const maxZ = elements
    .filter(el => el.layerId === layerId)
    .reduce((max, el) => Math.max(max, el.zIndex), -1);
  return maxZ + 1;
}

/**
 * Get the effective opacity for an element (layer opacity × element opacity).
 */
export function getEffectiveOpacity(
  element: TemplateElement,
  layers: Layer[],
): number {
  const layer = layers.find(l => l.id === element.layerId);
  const layerOpacity = layer?.opacity ?? 1;
  return layerOpacity * element.opacity;
}

/**
 * Check if an element is locked (either directly or via its layer).
 */
export function isElementLocked(
  element: TemplateElement,
  layers: Layer[],
): boolean {
  if (element.locked) return true;
  const layer = layers.find(l => l.id === element.layerId);
  return layer?.locked ?? false;
}
