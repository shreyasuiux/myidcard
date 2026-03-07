/**
 * ═══════════════════════════════════════════════════════════════
 *  BINDING RESOLVER — Maps template fields to live data
 * ═══════════════════════════════════════════════════════════════
 *
 *  BINDING SYSTEM OVERVIEW:
 *
 *  1. An element can have a `bindings` map, e.g.:
 *     bindings: {
 *       "props.content": { field: "employee.name", transform: "formatName" }
 *     }
 *
 *  2. At render time, the resolver reads `employee.name` from
 *     the DataContext, applies the `formatName` transform,
 *     and returns the resolved value.
 *
 *  3. If the field is missing, the `fallback` is returned.
 *
 *  4. If a `formatTemplate` is defined, the resolved value is
 *     interpolated into it:
 *     "Emp ID : {{value}}" → "Emp ID : 1234"
 *
 *  This decouples template layout from data shape entirely.
 * ═══════════════════════════════════════════════════════════════
 */

import type {
  DataBinding,
  DataContext,
  TemplateElement,
  ConditionalVisibility,
} from '../types';

// ─────────────────────────────────────────────────
//  Transform Registry
// ─────────────────────────────────────────────────

type TransformFn = (value: any, data: DataContext) => any;

const transforms = new Map<string, TransformFn>();

/** Register a named transform function */
export function registerTransform(name: string, fn: TransformFn): void {
  transforms.set(name, fn);
}

/** Get a registered transform */
export function getTransform(name: string): TransformFn | undefined {
  return transforms.get(name);
}

// ─────────────────────────────────────────────────
//  Core Resolver
// ─────────────────────────────────────────────────

/**
 * Resolve a single binding against a data context.
 *
 * @param binding  The binding definition
 * @param data     Live data context (e.g. { employee: { name: "John" } })
 * @returns        The resolved value
 */
export function resolveBinding(
  binding: DataBinding,
  data: DataContext,
): any {
  // 1. Walk the dot-path to get the raw value
  let value = getNestedValue(data, binding.field);

  // 2. Apply fallback if empty
  if (value === undefined || value === null || value === '') {
    value = binding.fallback ?? '';
  }

  // 3. Apply transform
  if (binding.transform) {
    const fn = transforms.get(binding.transform);
    if (fn) {
      value = fn(value, data);
    }
  }

  // 4. Apply format template
  if (binding.formatTemplate) {
    value = binding.formatTemplate.replace(/\{\{value\}\}/g, String(value));
  }

  return value;
}

/**
 * Resolve ALL bindings on an element, returning a map of
 * prop paths → resolved values.
 *
 * Usage in renderers:
 *   const resolved = resolveElementBindings(element, data);
 *   const content = resolved['props.content'] ?? element.props.content;
 */
export function resolveElementBindings(
  element: TemplateElement,
  data: DataContext,
): Record<string, any> {
  const result: Record<string, any> = {};

  if (!element.bindings) return result;

  for (const [propPath, binding] of Object.entries(element.bindings)) {
    result[propPath] = resolveBinding(binding, data);
  }

  return result;
}

// ─────────────────────────────────────────────────
//  Conditional Visibility
// ─────────────────────────────────────────────────

/**
 * Evaluate a conditional visibility expression.
 * Returns true if the element should be visible.
 */
export function evaluateCondition(
  condition: ConditionalVisibility,
  data: DataContext,
): boolean {
  const value = getNestedValue(data, condition.field);

  switch (condition.operator) {
    case 'exists':
      return value !== undefined && value !== null && value !== '';
    case 'notExists':
      return value === undefined || value === null || value === '';
    case 'equals':
      return value === condition.value;
    case 'notEquals':
      return value !== condition.value;
    case 'gt':
      return Number(value) > Number(condition.value);
    case 'lt':
      return Number(value) < Number(condition.value);
    case 'contains':
      return String(value).includes(String(condition.value));
    default:
      return true;
  }
}

// ─────────────────────────────────────────────────
//  Utility
// ─────────────────────────────────────────────────

/**
 * Safely read a deeply nested value using dot notation.
 * "employee.name" → data.employee.name
 */
function getNestedValue(obj: any, path: string): any {
  if (!path) return undefined;
  return path.split('.').reduce((acc, key) => {
    if (acc === undefined || acc === null) return undefined;
    return acc[key];
  }, obj);
}

/**
 * Apply resolved bindings to an element, returning a new element
 * with overridden values.  Does NOT mutate the original.
 */
export function applyBindingsToElement(
  element: TemplateElement,
  data: DataContext,
): TemplateElement {
  if (!element.bindings || Object.keys(element.bindings).length === 0) {
    return element;
  }

  const resolved = resolveElementBindings(element, data);
  let updated = { ...element, props: { ...element.props } };

  for (const [path, value] of Object.entries(resolved)) {
    // Handle "props.content", "style.color", etc.
    const parts = path.split('.');
    if (parts[0] === 'props' && parts.length === 2) {
      (updated.props as any)[parts[1]] = value;
    } else if (parts[0] === 'style' && parts.length === 2) {
      updated = {
        ...updated,
        style: { ...updated.style, [parts[1]]: value },
      };
    }
  }

  return updated;
}
