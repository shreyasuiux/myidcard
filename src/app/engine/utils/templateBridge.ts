/**
 * ═══════════════════════════════════════════════════════════════
 *  TEMPLATE BRIDGE — Legacy TemplateDesign → Engine TemplateDocument
 * ═══════════════════════════════════════════════════════════════
 *
 *  This module converts the existing flat TemplateDesign format
 *  (with logoPosition, photoPosition, nameStyle, etc.) into the
 *  new element-based TemplateDocument format.
 *
 *  WHY A BRIDGE:
 *  ─ 10 existing templates + user-customized localStorage templates
 *    all use the old format.  We can't break them.
 *  ─ The AdvancedDesignEditor writes to the old format.
 *  ─ The bridge runs at render time — no data migration needed.
 *  ─ Eventually, the editor will write directly to the new format
 *    and the bridge becomes unnecessary.
 *
 *  USAGE:
 *    const doc = legacyToDocument(template, 'front');
 *    <TemplateRendererStandalone document={doc} data={employeeData} />
 * ═══════════════════════════════════════════════════════════════
 */

import type {
  TemplateDocument,
  TemplateElement,
  BackgroundSettings,
  Layer,
} from '../types';
import type {
  Template,
  TemplateDesign,
  BackSideText,
  FrontSideText,
} from '../../utils/templateData';
import { resolveTemplateDesign } from '../../utils/templateData';
import { DEFAULT_BACK_TEXT } from '../../utils/defaultBackText';
import { DEFAULT_FRONT_TEXT } from '../../utils/defaultFrontText';
import type { EmployeeRecord } from '../../utils/employeeStorage';
import logo from 'figma:asset/6dce495d999ed88e54f35e49635962b824088162.png';

// ── Constants ──
const CARD_W = 153;
const CARD_H = 244;
const LOGO_ASPECT = 42 / 20;

// ─────────────────────────────────────────────────
//  Main Conversion Function
// ─────────────────────────────────────────────────

/**
 * Convert a legacy Template + side into a TemplateDocument.
 *
 * @param template  The old-format Template object
 * @param side      'front' or 'back'
 */
export function legacyToDocument(
  template: Template,
  side: 'front' | 'back',
): TemplateDocument {
  const design = side === 'front' ? template.front : template.back;
  const resolved = resolveTemplateDesign(design);

  // ── Background ──
  const background = convertBackground(resolved);

  // ── Layer ──
  const defaultLayer: Layer = {
    id: 'default',
    name: 'Layer 1',
    visible: true,
    locked: false,
    opacity: 1,
    order: 0,
  };

  // ── Elements ──
  const elements: TemplateElement[] = [];

  // Accent elements (painted first — lowest z-index)
  resolved.accentElements.forEach((accent, i) => {
    elements.push(createAccentElement(accent, i));
  });

  if (side === 'front') {
    elements.push(...createFrontElements(resolved, template));
  } else {
    elements.push(...createBackElements(resolved, template));
  }

  return {
    schemaVersion: 1,
    id: `${template.id}_${side}`,
    meta: {
      name: `${template.name} — ${side}`,
      description: template.description,
      category: template.category,
      tags: [],
      author: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      side,
    },
    canvas: {
      width: CARD_W,
      height: CARD_H,
      unit: 'px',
      dpi: 300,
      layoutMode: 'absolute',
      gridSize: 5,
      snapToGrid: false,
    },
    background,
    layers: [defaultLayer],
    elements,
    bindings: {},
    variables: [],
    isReady: true,
  };
}

// ─────────────────────────────────────────────────
//  Build Data Context from EmployeeRecord
// ─────────────────────────────────────────────────

/**
 * Convert an EmployeeRecord into a DataContext for binding resolution.
 */
export function employeeToDataContext(
  employee: EmployeeRecord,
  photoUrl?: string,
): Record<string, any> {
  return {
    employee: {
      name: employee.name,
      employeeId: employee.employeeId,
      mobile: employee.mobile,
      bloodGroup: employee.bloodGroup,
      website: employee.website,
      joiningDate: employee.joiningDate,
      validTill: employee.validTill,
      photoBase64: photoUrl || employee.photoBase64,
    },
  };
}

// ─────────────────────────────────────────────────
//  Internal Helpers
// ─────────────────────────────────────────────────

function convertBackground(design: ReturnType<typeof resolveTemplateDesign>): BackgroundSettings {
  const bg = design.backgroundColor;
  if (bg.includes('gradient')) {
    // Parse simple linear-gradient
    return {
      type: 'gradient',
      color: '#ffffff',
      gradient: {
        type: 'linear',
        angle: 135,
        stops: [
          { color: '#0066CC', position: 0 },
          { color: '#4A90E2', position: 1 },
        ],
      },
      opacity: 1,
    };
  }

  const bgResult: BackgroundSettings = {
    type: 'solid',
    color: bg,
    opacity: 1,
  };

  // Add pattern
  if (design.backgroundPattern && design.backgroundPattern !== 'none') {
    bgResult.type = 'pattern';
    bgResult.pattern = {
      type: design.backgroundPattern === 'dots' ? 'dots' : 'lines',
      size: 8,
      color: 'currentColor',
      opacity: 0.05,
    };
  }

  return bgResult;
}

function createAccentElement(
  accent: { type: string; position: { x: number; y: number }; size: { width: number; height: number }; color: string },
  index: number,
): TemplateElement<'shape'> {
  return {
    id: `accent_${index}`,
    type: 'shape',
    name: `Accent ${index + 1}`,
    layerId: 'default',
    position: { x: accent.position.x, y: accent.position.y },
    dimensions: { width: accent.size.width, height: accent.size.height },
    rotation: 0,
    zIndex: index,
    style: {},
    opacity: 1,
    visible: true,
    locked: true,
    selectable: false,
    props: {
      shape: accent.type === 'circle' ? 'circle' : 'rectangle',
      fill: accent.color,
    },
  };
}

function createFrontElements(
  design: ReturnType<typeof resolveTemplateDesign>,
  template: Template,
): TemplateElement[] {
  const elements: TemplateElement[] = [];
  const accentCount = design.accentElements.length;
  let z = accentCount + 1;

  // ── Logo ──
  if (design.showLogo) {
    const logoW = design.logoSize;
    const logoH = logoW / LOGO_ASPECT;
    elements.push({
      id: 'logo',
      type: 'logo',
      name: 'Company Logo',
      layerId: 'default',
      position: { x: design.logoPosition.x, y: design.logoPosition.y },
      dimensions: { width: logoW, height: logoH, aspectLock: true },
      rotation: 0,
      zIndex: z++,
      style: {},
      opacity: 1,
      visible: true,
      locked: false,
      selectable: true,
      props: { src: logo, aspectRatio: LOGO_ASPECT },
    });
  }

  // ── Photo ──
  if (design.showPhoto && design.photoSize.width > 0) {
    const borderRadius =
      design.photoShape === 'circle' ? '50%'
        : design.photoShape === 'rounded' ? '4px'
          : '0px';

    elements.push({
      id: 'photo',
      type: 'image',
      name: 'Employee Photo',
      layerId: 'default',
      position: { x: design.photoPosition.x, y: design.photoPosition.y },
      dimensions: { width: design.photoSize.width, height: design.photoSize.height },
      rotation: 0,
      zIndex: z++,
      style: {
        borderRadius,
        overflow: 'hidden',
        objectFit: 'cover',
        objectPosition: 'center',
      },
      opacity: 1,
      visible: true,
      locked: false,
      selectable: true,
      props: {
        src: '', // Will be overridden by binding
        alt: 'Employee',
        shape: design.photoShape === 'circle' ? 'circle' : design.photoShape === 'rounded' ? 'rounded' : 'rectangle',
        placeholder: 'No photo',
      },
      bindings: {
        'props.src': { field: 'employee.photoBase64', fallback: '' },
      },
    });
  }

  // ── Name ──
  const ns = design.nameStyle;
  elements.push({
    id: 'name',
    type: 'text',
    name: 'Employee Name',
    layerId: 'default',
    position: { x: 0, y: ns.position.y },
    dimensions: { width: CARD_W, height: 20 },
    rotation: 0,
    zIndex: z++,
    style: {
      fontFamily: 'Roboto, sans-serif',
      fontSize: ns.fontSize,
      fontWeight: ns.fontWeight,
      color: ns.color,
      textAlign: 'center',
      padding: '0 12px',
      overflow: 'hidden',
      autoShrink: true,
      minFontSize: 10,
    },
    opacity: 1,
    visible: true,
    locked: false,
    selectable: true,
    props: { content: '', wordWrap: true, maxLines: 1 },
    bindings: {
      'props.content': { field: 'employee.name', transform: 'formatName', fallback: 'Shreyas V.' },
    },
  });

  // ── Employee ID ──
  const es = design.employeeIdStyle;
  elements.push({
    id: 'empId',
    type: 'text',
    name: 'Employee ID',
    layerId: 'default',
    position: { x: 0, y: es.position.y },
    dimensions: { width: CARD_W, height: 10 },
    rotation: 0,
    zIndex: z++,
    style: {
      fontFamily: 'Roboto, sans-serif',
      fontSize: es.fontSize,
      fontWeight: 'bold',
      color: es.color,
      textAlign: 'center',
      overflow: 'hidden',
    },
    opacity: 1,
    visible: true,
    locked: false,
    selectable: true,
    props: { content: '', prefix: 'Emp ID : ' },
    bindings: {
      'props.content': { field: 'employee.employeeId', fallback: '1111' },
    },
  });

  // ── Contact Row ──
  const cr = design.contactRowStyle;

  // Phone
  elements.push({
    id: 'phone',
    type: 'text',
    name: 'Phone',
    layerId: 'default',
    position: { x: cr.items.phone.x, y: cr.y },
    dimensions: { width: 58, height: cr.height },
    rotation: 0,
    zIndex: z++,
    style: {
      fontFamily: 'Roboto, sans-serif',
      fontSize: cr.fontSize,
      fontWeight: cr.fontWeight,
      color: cr.color,
      lineHeight: `${cr.height}px`,
    },
    opacity: 1,
    visible: true,
    locked: true,
    selectable: false,
    props: { content: '' },
    bindings: {
      'props.content': { field: 'employee.mobile', transform: 'formatPhone', fallback: '+91 9898989898' },
    },
  });

  // Pipe 1
  elements.push({
    id: 'pipe1',
    type: 'text',
    name: 'Separator',
    layerId: 'default',
    position: { x: cr.items.pipe1.x, y: cr.y },
    dimensions: { width: 5, height: cr.height },
    rotation: 0,
    zIndex: z++,
    style: {
      fontFamily: 'Roboto, sans-serif',
      fontSize: cr.fontSize,
      fontWeight: cr.fontWeight,
      color: cr.color,
      lineHeight: `${cr.height}px`,
    },
    opacity: 1,
    visible: true,
    locked: true,
    selectable: false,
    props: { content: '|' },
  });

  // Blood Group
  elements.push({
    id: 'bloodGroup',
    type: 'text',
    name: 'Blood Group',
    layerId: 'default',
    position: { x: cr.items.bloodGroup.x, y: cr.y },
    dimensions: { width: cr.items.bloodGroup.width, height: cr.height },
    rotation: 0,
    zIndex: z++,
    style: {
      fontFamily: 'Roboto, sans-serif',
      fontSize: cr.fontSize,
      fontWeight: cr.fontWeight,
      color: cr.color,
      lineHeight: `${cr.height}px`,
      textAlign: 'center',
    },
    opacity: 1,
    visible: true,
    locked: true,
    selectable: false,
    props: { content: '' },
    bindings: {
      'props.content': { field: 'employee.bloodGroup', fallback: 'B+' },
    },
  });

  // Pipe 2
  elements.push({
    id: 'pipe2',
    type: 'text',
    name: 'Separator',
    layerId: 'default',
    position: { x: cr.items.pipe2.x, y: cr.y },
    dimensions: { width: 5, height: cr.height },
    rotation: 0,
    zIndex: z++,
    style: {
      fontFamily: 'Roboto, sans-serif',
      fontSize: cr.fontSize,
      fontWeight: cr.fontWeight,
      color: cr.color,
      lineHeight: `${cr.height}px`,
    },
    opacity: 1,
    visible: true,
    locked: true,
    selectable: false,
    props: { content: '|' },
  });

  // Field 1 (Website / Designation)
  elements.push({
    id: 'field1',
    type: 'text',
    name: 'Website',
    layerId: 'default',
    position: { x: cr.items.field1.x, y: cr.y },
    dimensions: { width: 52, height: cr.height },
    rotation: 0,
    zIndex: z++,
    style: {
      fontFamily: 'Roboto, sans-serif',
      fontSize: cr.fontSize,
      fontWeight: cr.fontWeight,
      color: cr.color,
      lineHeight: `${cr.height}px`,
    },
    opacity: 1,
    visible: true,
    locked: true,
    selectable: false,
    props: { content: '' },
    bindings: {
      'props.content': { field: 'employee.website', fallback: 'www.acc.ltd' },
    },
  });

  // ── Valid Till ──
  const vt = design.validTillStyle;
  elements.push({
    id: 'validTill',
    type: 'text',
    name: 'Valid Till',
    layerId: 'default',
    position: { x: 0, y: vt.y },
    dimensions: { width: CARD_W, height: vt.height },
    rotation: 0,
    zIndex: z++,
    style: {
      fontFamily: 'Roboto, sans-serif',
      fontSize: vt.fontSize,
      color: vt.color,
      textAlign: 'center',
      lineHeight: `${vt.height}px`,
    },
    opacity: 1,
    visible: true,
    locked: true,
    selectable: false,
    props: { content: '', prefix: 'Valid till ' },
    bindings: {
      'props.content': { field: 'employee.validTill', transform: 'formatValidTill', fallback: 'Dec 2030' },
    },
  });

  // ── Joining Date (rotated) ──
  const jd = design.joiningDateStyle;
  elements.push({
    id: 'joiningDate',
    type: 'text',
    name: 'Joining Date',
    layerId: 'default',
    position: { x: jd.x, y: jd.y },
    dimensions: { width: jd.width, height: jd.height },
    rotation: jd.rotation,
    zIndex: z++,
    style: {
      fontFamily: 'Roboto, sans-serif',
      fontSize: jd.fontSize,
      color: jd.color,
      lineHeight: `${jd.height}px`,
    },
    opacity: 1,
    visible: true,
    locked: true,
    selectable: false,
    props: { content: '' },
    bindings: {
      'props.content': { field: 'employee.joiningDate', transform: 'formatJoiningDate', fallback: '12 Jan 2024' },
    },
  });

  return elements;
}

function createBackElements(
  design: ReturnType<typeof resolveTemplateDesign>,
  template: Template,
): TemplateElement[] {
  const elements: TemplateElement[] = [];
  const backText = template.backText || DEFAULT_BACK_TEXT;
  const accentCount = design.accentElements.length;
  let z = accentCount + 1;

  // ── Logo (centered) ──
  if (design.showLogo) {
    const logoW = design.logoSize;
    const logoH = logoW / LOGO_ASPECT;
    elements.push({
      id: 'back_logo',
      type: 'logo',
      name: 'Logo',
      layerId: 'default',
      position: { x: design.logoPosition.x, y: 24 },
      dimensions: { width: logoW, height: logoH, aspectLock: true },
      rotation: 0,
      zIndex: z++,
      style: {},
      opacity: 1,
      visible: true,
      locked: true,
      selectable: false,
      props: { src: logo, aspectRatio: LOGO_ASPECT },
    });
  }

  // ── HQ Label ──
  elements.push({
    id: 'hq_label',
    type: 'text',
    name: 'HQ Label',
    layerId: 'default',
    position: { x: 15, y: 63 },
    dimensions: { width: 123, height: 9 },
    rotation: 0,
    zIndex: z++,
    style: {
      fontFamily: 'Roboto, sans-serif',
      fontSize: 7,
      fontWeight: 'bold',
      lineHeight: '9px',
      color: '#0f172a',
    },
    opacity: 1,
    visible: true,
    locked: true,
    selectable: false,
    props: { content: backText.headquarterLabel },
  });

  // ── HQ Location ──
  elements.push({
    id: 'hq_location',
    type: 'text',
    name: 'HQ Location',
    layerId: 'default',
    position: { x: 15, y: 78 },
    dimensions: { width: 25, height: 9 },
    rotation: 0,
    zIndex: z++,
    style: {
      fontFamily: 'Roboto, sans-serif',
      fontSize: 7,
      fontWeight: 'bold',
      lineHeight: '9px',
      color: '#0f172a',
    },
    opacity: 1,
    visible: true,
    locked: true,
    selectable: false,
    props: { content: backText.headquarterLocation },
  });

  // ── HQ Address ──
  elements.push({
    id: 'hq_address',
    type: 'text',
    name: 'HQ Address',
    layerId: 'default',
    position: { x: 42, y: 78 },
    dimensions: { width: 101, height: 28 },
    rotation: 0,
    zIndex: z++,
    style: {
      fontFamily: 'Roboto, sans-serif',
      fontSize: 6,
      fontWeight: 'normal',
      lineHeight: '9px',
      color: '#0f172a',
    },
    opacity: 1,
    visible: true,
    locked: true,
    selectable: false,
    props: { content: backText.headquarterAddress, wordWrap: true },
  });

  // ── Branches Label ──
  elements.push({
    id: 'branches_label',
    type: 'text',
    name: 'Branches Label',
    layerId: 'default',
    position: { x: 15, y: 110 },
    dimensions: { width: 123, height: 9 },
    rotation: 0,
    zIndex: z++,
    style: {
      fontFamily: 'Roboto, sans-serif',
      fontSize: 7,
      fontWeight: 'bold',
      lineHeight: '9px',
      color: '#0f172a',
    },
    opacity: 1,
    visible: true,
    locked: true,
    selectable: false,
    props: { content: backText.branchesLabel },
  });

  // ── Dynamic Branches ──
  let branchTop = 124;
  backText.branches.forEach((branch, idx) => {
    // Branch label
    elements.push({
      id: `branch_${idx}_label`,
      type: 'text',
      name: `Branch ${idx + 1} Label`,
      layerId: 'default',
      position: { x: 15, y: branchTop },
      dimensions: { width: 30, height: 9 },
      rotation: 0,
      zIndex: z++,
      style: {
        fontFamily: 'Roboto, sans-serif',
        fontSize: 7,
        fontWeight: 'bold',
        lineHeight: '9px',
        color: '#0f172a',
      },
      opacity: 1,
      visible: true,
      locked: true,
      selectable: false,
      props: { content: branch.label },
    });

    // Branch address
    elements.push({
      id: `branch_${idx}_address`,
      type: 'text',
      name: `Branch ${idx + 1} Address`,
      layerId: 'default',
      position: { x: 48, y: branchTop },
      dimensions: { width: 97, height: 36 },
      rotation: 0,
      zIndex: z++,
      style: {
        fontFamily: 'Roboto, sans-serif',
        fontSize: 6,
        fontWeight: 'normal',
        lineHeight: '9px',
        color: '#0f172a',
      },
      opacity: 1,
      visible: true,
      locked: true,
      selectable: false,
      props: { content: branch.address, wordWrap: true },
    });

    branchTop += 40;
  });

  return elements;
}
