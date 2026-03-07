import { forwardRef } from 'react';
import type { EmployeeRecord } from '../utils/employeeStorage';
import type { Template } from '../utils/templateData';
import { templates } from '../utils/templateData';
import { TemplateCardRenderer } from './TemplateCardRenderer';

interface UnifiedIDCardRendererProps {
  employee: EmployeeRecord;
  side: 'front' | 'back';
  template: Template;
  photoUrl?: string;
  scale?: number;
}

/**
 * UnifiedIDCardRenderer
 *
 * Originally intended as the "single source of truth" renderer.
 * Now a thin forwardRef wrapper around TemplateCardRenderer,
 * which is the actual single source of truth.
 */
export const UnifiedIDCardRenderer = forwardRef<HTMLDivElement, UnifiedIDCardRendererProps>(
  ({ employee, side, template, photoUrl, scale = 1 }, ref) => {
    const activeTemplate: Template = template || templates[0];

    return (
      <TemplateCardRenderer
        ref={ref}
        employee={employee}
        side={side}
        template={activeTemplate}
        photoUrl={photoUrl}
        scale={scale}
      />
    );
  },
);

UnifiedIDCardRenderer.displayName = 'UnifiedIDCardRenderer';
