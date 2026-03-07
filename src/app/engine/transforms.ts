/**
 * TRANSFORM REGISTRY — Named data transforms for bindings
 *
 * These are referenced by name in DataBinding.transform.
 * The binding resolver calls them at render time.
 */

import { registerTransform } from './utils/bindingResolver';
import {
  formatName,
  formatPhoneNumber,
  formatValidTill,
  formatJoiningDate,
  formatEmployeeId,
  formatBloodGroup,
} from '../utils/cardFormatters';

// ── Register All Transforms ──

registerTransform('formatName', (value: any) => formatName(String(value ?? '')));
registerTransform('formatPhone', (value: any) => formatPhoneNumber(String(value ?? '')));
registerTransform('formatValidTill', (value: any) => formatValidTill(String(value ?? '')));
registerTransform('formatJoiningDate', (value: any) => formatJoiningDate(String(value ?? '')));
registerTransform('formatEmployeeId', (value: any) => formatEmployeeId(String(value ?? '')));
registerTransform('formatBloodGroup', (value: any) => formatBloodGroup(String(value ?? '')));

// Custom transforms
registerTransform('uppercase', (value: any) => String(value ?? '').toUpperCase());
registerTransform('lowercase', (value: any) => String(value ?? '').toLowerCase());
registerTransform('capitalize', (value: any) => {
  const s = String(value ?? '');
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
});
registerTransform('trim', (value: any) => String(value ?? '').trim());
