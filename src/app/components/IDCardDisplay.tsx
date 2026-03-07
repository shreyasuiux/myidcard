import type { EmployeeRecord } from '../utils/employeeStorage';
import type { Template } from '../utils/templateData';
import { templates } from '../utils/templateData';
import { TemplateCardRenderer } from './TemplateCardRenderer';

interface IDCardDisplayProps {
  employee: EmployeeRecord;
  side: 'front' | 'back';
  scale?: number;
  template?: Template;
}

/**
 * IDCardDisplay — Grid / Editor preview wrapper
 *
 * Delegates 100% of rendering to TemplateCardRenderer.
 * Used by:
 *  - BulkCardPreviews (grid view)
 *  - Templates gallery thumbnails
 *  - AdvancedFrontDesignEditor preview
 *  - AdvancedBackDesignEditor preview
 */
export function IDCardDisplay({ employee, side, scale = 1, template }: IDCardDisplayProps) {
  const activeTemplate: Template = template || templates[0];

  return (
    <TemplateCardRenderer
      employee={employee}
      side={side}
      template={activeTemplate}
      photoUrl={employee.photoBase64}
      scale={scale}
    />
  );
}
