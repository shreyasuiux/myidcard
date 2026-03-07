/**
 * ═══════════════════════════════════════════════════════════════
 *  ELEMENT REGISTRY — Plugin-Ready Extension System
 * ═══════════════════════════════════════════════════════════════
 *
 *  WHY REGISTRY PATTERN > PLUGIN ARCHITECTURE:
 *  ─ Plugins need lifecycle management (init, destroy, update hooks)
 *    which is overkill for element rendering.
 *  ─ Registry is a simple Map<type, renderer> lookup — O(1) access,
 *    zero overhead, no dependency injection container.
 *  ─ New element types are added with ONE line: register('myType', MyRenderer)
 *  ─ Core engine never needs modification when adding types.
 *  ─ Type-safe via generics — TypeScript catches mismatches at compile time.
 *
 *  ADDING A NEW ELEMENT TYPE:
 *  1. Define props interface in types.ts → add to ElementPropsMap
 *  2. Create renderer component in engine/elements/
 *  3. Call elementRegistry.register('myType', MyRenderer) in setup
 *  4. Done. No core engine changes needed.
 * ═══════════════════════════════════════════════════════════════
 */

import React from 'react';
import type { TemplateElement, ElementType, DataContext } from './types';

// ─────────────────────────────────────────────────
//  Element Renderer Component Contract
// ─────────────────────────────────────────────────

export interface ElementRendererProps<T extends ElementType = ElementType> {
  /** The element data from the template document */
  element: TemplateElement<T>;
  /** Scale factor (1 = 100%) */
  scale: number;
  /** Resolved data context for bindings */
  data: DataContext;
  /** Whether this element is currently selected */
  isSelected: boolean;
  /** Whether the engine is in interactive mode */
  isInteractive: boolean;
}

/** Type alias for element renderer components */
export type ElementRendererComponent<T extends ElementType = ElementType> =
  React.ComponentType<ElementRendererProps<T>>;

// ─────────────────────────────────────────────────
//  Registry Implementation
// ─────────────────────────────────────────────────

class ElementRegistry {
  private renderers = new Map<string, ElementRendererComponent<any>>();

  /**
   * Register a renderer for an element type.
   * Overwrites any previous registration (allows hot-replacement).
   */
  register<T extends ElementType>(
    type: T,
    renderer: ElementRendererComponent<T>,
  ): void {
    this.renderers.set(type, renderer as ElementRendererComponent<any>);
  }

  /**
   * Get the renderer for an element type.
   * Returns undefined if type is unregistered.
   */
  get<T extends ElementType>(type: T): ElementRendererComponent<T> | undefined {
    return this.renderers.get(type) as ElementRendererComponent<T> | undefined;
  }

  /**
   * Check if a type is registered.
   */
  has(type: string): boolean {
    return this.renderers.has(type);
  }

  /**
   * Get all registered type names.
   */
  getRegisteredTypes(): string[] {
    return Array.from(this.renderers.keys());
  }

  /**
   * Unregister a type (useful for testing / hot-reload).
   */
  unregister(type: string): boolean {
    return this.renderers.delete(type);
  }

  /**
   * Clear all registrations.
   */
  clear(): void {
    this.renderers.clear();
  }
}

/**
 * Singleton registry instance.
 * Import this and call .register() from your element files.
 */
export const elementRegistry = new ElementRegistry();
