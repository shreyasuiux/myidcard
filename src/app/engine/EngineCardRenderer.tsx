/**
 * ═══════════════════════════════════════════════════════════════
 *  ENGINE CARD RENDERER — Drop-in replacement for TemplateCardRenderer
 * ═══════════════════════════════════════════════════════════════
 *
 *  This component has the EXACT SAME props interface as
 *  TemplateCardRenderer, but internally uses the new engine.
 *
 *  It converts the legacy Template format → TemplateDocument
 *  via the bridge, then renders using TemplateRendererStandalone.
 *
 *  USAGE (identical to TemplateCardRenderer):
 *    <EngineCardRenderer
 *      employee={employee}
 *      side="front"
 *      template={selectedTemplate}
 *      photoUrl={photoBase64}
 *      scale={1}
 *    />
 *
 *  This component is the MIGRATION PATH:
 *  1. Start by using EngineCardRenderer alongside TemplateCardRenderer
 *  2. Verify visual parity
 *  3. Once validated, replace TemplateCardRenderer with this
 * ═══════════════════════════════════════════════════════════════
 */

import { forwardRef, useMemo } from 'react';
import type { EmployeeRecord } from '../utils/employeeStorage';
import type { Template } from '../utils/templateData';
import { TemplateRendererStandalone } from './TemplateRenderer';
import { legacyToDocument, employeeToDataContext } from './utils/templateBridge';

// Ensure transforms are registered
import './transforms';

export interface EngineCardRendererProps {
  employee: EmployeeRecord;
  side: 'front' | 'back';
  template: Template;
  photoUrl?: string;
  scale?: number;
}

export const EngineCardRenderer = forwardRef<HTMLDivElement, EngineCardRendererProps>(
  ({ employee, side, template, photoUrl, scale = 1 }, ref) => {
    // Convert legacy template → engine document
    const document = useMemo(
      () => legacyToDocument(template, side),
      [template, side],
    );

    // Build data context from employee
    const data = useMemo(
      () => employeeToDataContext(employee, photoUrl),
      [employee, photoUrl],
    );

    return (
      <TemplateRendererStandalone
        ref={ref}
        document={document}
        data={data}
        scale={scale}
        mode="display"
      />
    );
  },
);

EngineCardRenderer.displayName = 'EngineCardRenderer';
