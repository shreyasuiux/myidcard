import { forwardRef } from 'react';
import type { EmployeeRecord } from '../utils/employeeStorage';
import type { Template } from '../utils/templateData';
import { templates } from '../utils/templateData';
import { TemplateCardRenderer } from './TemplateCardRenderer';

interface IDCardExportRendererProps {
  employee: EmployeeRecord;
  side: 'front' | 'back';
  template?: Template;
  photoUrl?: string;
}

/**
 * IDCardExportRenderer
 *
 * Thin forwardRef wrapper around TemplateCardRenderer used
 * for hidden DOM rendering → html2canvas → PDF export.
 *
 * All layout logic lives in TemplateCardRenderer.
 * This wrapper exists solely so existing import sites
 * (`DashboardPage`, `EmployeeDatabase`) keep working
 * without changes.
 */
export const IDCardExportRenderer = forwardRef<HTMLDivElement, IDCardExportRendererProps>(
  ({ employee, side, template, photoUrl }, ref) => {
    // Template is required for rendering; fall back to first template if missing.
    const activeTemplate: Template = template || templates[0];

    return (
      <TemplateCardRenderer
        ref={ref}
        employee={employee}
        side={side}
        template={activeTemplate}
        photoUrl={photoUrl}
        scale={1}
      />
    );
  },
);

IDCardExportRenderer.displayName = 'IDCardExportRenderer';