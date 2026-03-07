import type { BackSideText, Branch } from '../utils/templateData';
import { templates } from '../utils/templateData';
import { DEFAULT_BACK_TEXT } from '../utils/defaultBackText';
import { TemplateCardRenderer } from './TemplateCardRenderer';
import type { EmployeeRecord } from '../utils/employeeStorage';

interface IDCardBackPreviewProps {
  scale?: number;
  backText?: BackSideText;
}

/**
 * IDCardBackPreview — Back-side preview wrapper
 *
 * Delegates 100% of rendering to TemplateCardRenderer.
 * Preserves old backText migration for backward compatibility.
 */
export function IDCardBackPreview({
  scale = 1,
  backText = DEFAULT_BACK_TEXT,
}: IDCardBackPreviewProps) {
  // Migrate old backText format to new format with branches array
  const migrateBackText = (oldBackText: any): BackSideText => {
    if (!oldBackText) return DEFAULT_BACK_TEXT;

    if (oldBackText.branches && Array.isArray(oldBackText.branches)) {
      return oldBackText as BackSideText;
    }

    if ('branch1Label' in oldBackText) {
      const branches: Branch[] = [];
      if (oldBackText.branch1Label || oldBackText.branch1Address) {
        branches.push({
          id: '1',
          label: oldBackText.branch1Label || '',
          address: oldBackText.branch1Address || '',
        });
      }
      if (oldBackText.branch2Label || oldBackText.branch2Address) {
        branches.push({
          id: '2',
          label: oldBackText.branch2Label || '',
          address: oldBackText.branch2Address || '',
        });
      }
      return {
        headquarterLabel: oldBackText.headquarterLabel || DEFAULT_BACK_TEXT.headquarterLabel,
        headquarterLocation:
          oldBackText.headquarterLocation || DEFAULT_BACK_TEXT.headquarterLocation,
        headquarterAddress:
          oldBackText.headquarterAddress || DEFAULT_BACK_TEXT.headquarterAddress,
        branchesLabel: oldBackText.branchesLabel || DEFAULT_BACK_TEXT.branchesLabel,
        branches: branches.length > 0 ? branches : DEFAULT_BACK_TEXT.branches,
      };
    }

    return DEFAULT_BACK_TEXT;
  };

  const currentBackText = migrateBackText(backText);

  // Dummy employee — back side uses only backText, not employee data
  const dummyEmployee: EmployeeRecord = {
    id: 'back-preview',
    name: '',
    employeeId: '',
    mobile: '',
    bloodGroup: '',
    website: '',
    joiningDate: '',
    validTill: '',
    photoBase64: '',
    createdAt: '',
  };

  // Use the first template with overridden backText
  const templateWithBackText = {
    ...templates[0],
    backText: currentBackText,
  };

  return (
    <TemplateCardRenderer
      employee={dummyEmployee}
      side="back"
      template={templateWithBackText}
      scale={scale}
    />
  );
}
