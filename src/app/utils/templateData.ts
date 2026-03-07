export interface Template {
  id: string;
  name: string;
  category: 'professional' | 'creative' | 'modern' | 'classic';
  description: string;
  front: TemplateDesign;
  back: TemplateDesign;
  backText?: BackSideText;  // Optional custom back side text
  frontText?: FrontSideText;  // Optional custom front side text
  thumbnail: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
}

export interface FrontSideText {
  mobileLabel: string;
  bloodGroupLabel: string;
  field1Label: string;  // Customizable field (Website/Designation/Department/etc.)
  field1Enabled: boolean;
  joiningDateLabel: string;
  validTillLabel: string;
}

export interface BackSideText {
  headquarterLabel: string;
  headquarterLocation: string;
  headquarterAddress: string;
  branchesLabel: string;
  branches: Branch[];
}

export interface Branch {
  id: string;
  label: string;
  address: string;
}

/**
 * ContactRowItems — pixel positions of each item inside the contact row
 */
export interface ContactRowItems {
  phone:      { x: number };
  pipe1:      { x: number };
  bloodGroup: { x: number; width: number };
  pipe2:      { x: number };
  field1:     { x: number };
}

/**
 * ContactRowStyle — full styling for the phone | blood | website row
 */
export interface ContactRowStyle {
  y: number;
  height: number;
  fontSize: number;
  fontWeight: string;
  color: string;
  items: ContactRowItems;
}

/**
 * ValidTillStyle — "Valid till Dec 2030" line
 */
export interface ValidTillStyle {
  y: number;
  height: number;
  fontSize: number;
  color: string;
}

/**
 * JoiningDateStyle — rotated date on the right edge
 */
export interface JoiningDateStyle {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  color: string;
  rotation: number;
}

export interface TemplateDesign {
  backgroundColor: string;
  backgroundPattern?: 'gradient' | 'dots' | 'lines' | 'none';
  layout: 'modern' | 'classic' | 'creative' | 'minimal';

  // Logo
  logoPosition: { x: number; y: number };
  logoSize: number;  // width in px (height derived from aspect ratio)
  showLogo?: boolean;

  // Photo
  photoPosition: { x: number; y: number };  // LEFT, TOP of photo frame
  photoSize: { width: number; height: number };
  photoShape: 'circle' | 'rounded' | 'square';
  showPhoto?: boolean;

  // Name
  nameStyle: {
    fontSize: number;
    fontWeight: string;
    color: string;
    position: { x: number; y: number };
  };

  // Employee ID
  employeeIdStyle: {
    fontSize: number;
    color: string;
    position: { x: number; y: number };
  };

  // Contact Row (phone | blood group | field1)
  contactRowStyle?: ContactRowStyle;

  // "Valid till" line
  validTillStyle?: ValidTillStyle;

  // Joining date (rotated side text)
  joiningDateStyle?: JoiningDateStyle;

  // Decorative elements
  accentElements: Array<{
    type: 'line' | 'circle' | 'rectangle' | 'wave';
    position: { x: number; y: number };
    size: { width: number; height: number };
    color: string;
  }>;
}

// ─────────────────────────────────────────────────
// ACC Default Layout Constants
// These are the CANONICAL pixel positions used
// by IDCardExportRenderer and represent the true
// company-branded layout. All renderers now read
// these from the template instead of hardcoding.
// ─────────────────────────────────────────────────
const ACC_CONTACT_ROW: ContactRowStyle = {
  y: 197,
  height: 9,
  fontSize: 7,
  fontWeight: '700',
  color: '#0f172a',
  items: {
    phone:      { x: 11 },
    pipe1:      { x: 69.75 },
    bloodGroup: { x: 74, width: 15 },
    pipe2:      { x: 92.86 },
    field1:     { x: 100.82 },
  },
};

const ACC_VALID_TILL: ValidTillStyle = {
  y: 218,
  height: 7,
  fontSize: 5,
  color: '#0f172a',
};

const ACC_JOINING_DATE: JoiningDateStyle = {
  x: 128.74,
  y: 143.74,
  width: 27.527,
  height: 7,
  fontSize: 5,
  color: '#0f172a',
  rotation: -90,
};

// ─────────────────────────────────────────────────
// resolveTemplateDesign()
//
// Fills in optional fields with ACC-default values.
// Guarantees every renderer always has complete data.
// ─────────────────────────────────────────────────
export function resolveTemplateDesign(design: TemplateDesign): Required<
  Pick<TemplateDesign,
    'contactRowStyle' | 'validTillStyle' | 'joiningDateStyle' | 'showLogo' | 'showPhoto'
  >
> & TemplateDesign {
  return {
    ...design,
    showLogo: design.showLogo ?? true,
    showPhoto: design.showPhoto ?? true,
    contactRowStyle: design.contactRowStyle ?? ACC_CONTACT_ROW,
    validTillStyle: design.validTillStyle ?? ACC_VALID_TILL,
    joiningDateStyle: design.joiningDateStyle ?? ACC_JOINING_DATE,
  };
}

// ─────────────────────────────────────────────────
// Template Gallery
// ─────────────────────────────────────────────────

export const templates: Template[] = [
  // ── 1. Modern Minimal (ACC DEFAULT — canonical positions) ──
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    category: 'modern',
    description: 'Clean, simple design with focus on employee photo and essential information',
    thumbnail: 'modern-minimal',
    colors: {
      primary: '#0066CC',
      secondary: '#FFFFFF',
      accent: '#4A90E2',
      background: '#FFFFFF',
      text: '#1A1A1A',
    },
    front: {
      backgroundColor: '#FFFFFF',
      backgroundPattern: 'none',
      layout: 'minimal',
      logoPosition: { x: 100, y: 10 },
      logoSize: 42,
      photoPosition: { x: 44.5, y: 57 },
      photoSize: { width: 64, height: 80 },
      photoShape: 'rounded',
      nameStyle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#213876',
        position: { x: 0, y: 143 },
      },
      employeeIdStyle: {
        fontSize: 8,
        color: '#0f172a',
        position: { x: 0, y: 175 },
      },
      contactRowStyle: ACC_CONTACT_ROW,
      validTillStyle: ACC_VALID_TILL,
      joiningDateStyle: ACC_JOINING_DATE,
      accentElements: [],
    },
    back: {
      backgroundColor: '#FFFFFF',
      backgroundPattern: 'none',
      layout: 'minimal',
      logoPosition: { x: 55.5, y: 24 },
      logoSize: 42,
      photoPosition: { x: 0, y: 0 },
      photoSize: { width: 0, height: 0 },
      photoShape: 'circle',
      nameStyle: {
        fontSize: 10,
        fontWeight: '600',
        color: '#666666',
        position: { x: 20, y: 60 },
      },
      employeeIdStyle: {
        fontSize: 9,
        color: '#999999',
        position: { x: 20, y: 75 },
      },
      accentElements: [],
    },
  },

  // ── 2. Corporate Professional ──
  {
    id: 'corporate-professional',
    name: 'Corporate Professional',
    category: 'professional',
    description: 'Traditional corporate design with elegant typography and structured layout',
    thumbnail: 'corporate-professional',
    colors: {
      primary: '#0066CC',
      secondary: '#002855',
      accent: '#4A90E2',
      background: '#FFFFFF',
      text: '#1A1A1A',
    },
    front: {
      backgroundColor: '#FFFFFF',
      backgroundPattern: 'lines',
      layout: 'classic',
      logoPosition: { x: 55.5, y: 10 },
      logoSize: 42,
      photoPosition: { x: 31.5, y: 60 },
      photoSize: { width: 90, height: 110 },
      photoShape: 'rounded',
      nameStyle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#002855',
        position: { x: 0, y: 176 },
      },
      employeeIdStyle: {
        fontSize: 8,
        color: '#0066CC',
        position: { x: 0, y: 196 },
      },
      contactRowStyle: {
        y: 210,
        height: 9,
        fontSize: 7,
        fontWeight: '700',
        color: '#0f172a',
        items: ACC_CONTACT_ROW.items,
      },
      validTillStyle: { y: 225, height: 7, fontSize: 5, color: '#0f172a' },
      joiningDateStyle: ACC_JOINING_DATE,
      accentElements: [
        { type: 'rectangle', position: { x: 0, y: 0 }, size: { width: 153, height: 8 }, color: '#0066CC' },
        { type: 'rectangle', position: { x: 0, y: 236 }, size: { width: 153, height: 8 }, color: '#002855' },
      ],
    },
    back: {
      backgroundColor: '#F5F5F5',
      backgroundPattern: 'lines',
      layout: 'classic',
      logoPosition: { x: 55.5, y: 24 },
      logoSize: 42,
      photoPosition: { x: 0, y: 0 },
      photoSize: { width: 0, height: 0 },
      photoShape: 'circle',
      nameStyle: { fontSize: 10, fontWeight: '600', color: '#002855', position: { x: 20, y: 20 } },
      employeeIdStyle: { fontSize: 9, color: '#0066CC', position: { x: 20, y: 35 } },
      accentElements: [
        { type: 'line', position: { x: 20, y: 50 }, size: { width: 113, height: 1 }, color: '#0066CC' },
      ],
    },
  },

  // ── 3. Creative Gradient ──
  {
    id: 'creative-gradient',
    name: 'Creative Gradient',
    category: 'creative',
    description: 'Bold gradient backgrounds with modern aesthetic and vibrant colors',
    thumbnail: 'creative-gradient',
    colors: {
      primary: '#0066CC',
      secondary: '#4A90E2',
      accent: '#7AB8FF',
      background: 'linear-gradient(135deg, #0066CC 0%, #4A90E2 100%)',
      text: '#FFFFFF',
    },
    front: {
      backgroundColor: 'linear-gradient(135deg, #0066CC 0%, #4A90E2 100%)',
      backgroundPattern: 'gradient',
      layout: 'creative',
      logoPosition: { x: 10, y: 12 },
      logoSize: 38,
      photoPosition: { x: 29, y: 58 },
      photoSize: { width: 95, height: 115 },
      photoShape: 'circle',
      nameStyle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
        position: { x: 0, y: 178 },
      },
      employeeIdStyle: {
        fontSize: 8,
        color: '#FFFFFF',
        position: { x: 0, y: 196 },
      },
      contactRowStyle: {
        y: 210,
        height: 9,
        fontSize: 7,
        fontWeight: '700',
        color: '#FFFFFF',
        items: ACC_CONTACT_ROW.items,
      },
      validTillStyle: { y: 225, height: 7, fontSize: 5, color: '#FFFFFF' },
      joiningDateStyle: { ...ACC_JOINING_DATE, color: '#FFFFFF' },
      accentElements: [
        { type: 'circle', position: { x: 130, y: 30 }, size: { width: 60, height: 60 }, color: 'rgba(255,255,255,0.1)' },
      ],
    },
    back: {
      backgroundColor: 'linear-gradient(135deg, #4A90E2 0%, #7AB8FF 100%)',
      backgroundPattern: 'gradient',
      layout: 'creative',
      logoPosition: { x: 55.5, y: 24 },
      logoSize: 42,
      photoPosition: { x: 0, y: 0 },
      photoSize: { width: 0, height: 0 },
      photoShape: 'circle',
      nameStyle: { fontSize: 10, fontWeight: '600', color: '#FFFFFF', position: { x: 20, y: 20 } },
      employeeIdStyle: { fontSize: 9, color: '#FFFFFF', position: { x: 20, y: 35 } },
      accentElements: [],
    },
  },

  // ── 4. Tech Futuristic ──
  {
    id: 'tech-futuristic',
    name: 'Tech Futuristic',
    category: 'modern',
    description: 'Cutting-edge design with geometric patterns and tech-inspired elements',
    thumbnail: 'tech-futuristic',
    colors: {
      primary: '#0066CC',
      secondary: '#00D4FF',
      accent: '#4A90E2',
      background: '#0A0E27',
      text: '#FFFFFF',
    },
    front: {
      backgroundColor: '#0A0E27',
      backgroundPattern: 'dots',
      layout: 'modern',
      logoPosition: { x: 10, y: 10 },
      logoSize: 38,
      photoPosition: { x: 29, y: 55 },
      photoSize: { width: 95, height: 115 },
      photoShape: 'rounded',
      nameStyle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
        position: { x: 0, y: 176 },
      },
      employeeIdStyle: {
        fontSize: 8,
        color: '#00D4FF',
        position: { x: 0, y: 194 },
      },
      contactRowStyle: {
        y: 208,
        height: 9,
        fontSize: 7,
        fontWeight: '700',
        color: '#FFFFFF',
        items: ACC_CONTACT_ROW.items,
      },
      validTillStyle: { y: 223, height: 7, fontSize: 5, color: '#FFFFFF' },
      joiningDateStyle: { ...ACC_JOINING_DATE, color: '#00D4FF' },
      accentElements: [
        { type: 'line', position: { x: 0, y: 172 }, size: { width: 153, height: 2 }, color: '#00D4FF' },
        { type: 'rectangle', position: { x: 0, y: 0 }, size: { width: 153, height: 5 }, color: '#0066CC' },
      ],
    },
    back: {
      backgroundColor: '#0F1429',
      backgroundPattern: 'dots',
      layout: 'modern',
      logoPosition: { x: 55.5, y: 24 },
      logoSize: 42,
      photoPosition: { x: 0, y: 0 },
      photoSize: { width: 0, height: 0 },
      photoShape: 'circle',
      nameStyle: { fontSize: 10, fontWeight: '600', color: '#FFFFFF', position: { x: 20, y: 20 } },
      employeeIdStyle: { fontSize: 9, color: '#00D4FF', position: { x: 20, y: 35 } },
      accentElements: [],
    },
  },

  // ── 5. Executive Elite ──
  {
    id: 'executive-elite',
    name: 'Executive Elite',
    category: 'professional',
    description: 'Premium luxury design with gold accents and sophisticated styling',
    thumbnail: 'executive-elite',
    colors: {
      primary: '#0066CC',
      secondary: '#1A1A1A',
      accent: '#D4AF37',
      background: '#FFFFFF',
      text: '#1A1A1A',
    },
    front: {
      backgroundColor: '#FFFFFF',
      backgroundPattern: 'none',
      layout: 'classic',
      logoPosition: { x: 55.5, y: 10 },
      logoSize: 42,
      photoPosition: { x: 30.5, y: 58 },
      photoSize: { width: 92, height: 112 },
      photoShape: 'rounded',
      nameStyle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1A1A1A',
        position: { x: 0, y: 176 },
      },
      employeeIdStyle: {
        fontSize: 8,
        color: '#0066CC',
        position: { x: 0, y: 194 },
      },
      contactRowStyle: {
        y: 208,
        height: 9,
        fontSize: 7,
        fontWeight: '700',
        color: '#0f172a',
        items: ACC_CONTACT_ROW.items,
      },
      validTillStyle: ACC_VALID_TILL,
      joiningDateStyle: ACC_JOINING_DATE,
      accentElements: [
        { type: 'line', position: { x: 30, y: 172 }, size: { width: 93, height: 1 }, color: '#D4AF37' },
        { type: 'rectangle', position: { x: 0, y: 0 }, size: { width: 5, height: 244 }, color: '#D4AF37' },
      ],
    },
    back: {
      backgroundColor: '#F9F9F9',
      backgroundPattern: 'none',
      layout: 'classic',
      logoPosition: { x: 55.5, y: 24 },
      logoSize: 42,
      photoPosition: { x: 0, y: 0 },
      photoSize: { width: 0, height: 0 },
      photoShape: 'circle',
      nameStyle: { fontSize: 10, fontWeight: '600', color: '#1A1A1A', position: { x: 20, y: 20 } },
      employeeIdStyle: { fontSize: 9, color: '#0066CC', position: { x: 20, y: 35 } },
      accentElements: [
        { type: 'rectangle', position: { x: 148, y: 0 }, size: { width: 5, height: 244 }, color: '#D4AF37' },
      ],
    },
  },

  // ── 6. Clean & Simple ──
  {
    id: 'clean-simple',
    name: 'Clean & Simple',
    category: 'modern',
    description: 'Ultra-minimal design focusing on clarity and readability',
    thumbnail: 'clean-simple',
    colors: {
      primary: '#0066CC',
      secondary: '#F5F5F5',
      accent: '#4A90E2',
      background: '#FFFFFF',
      text: '#333333',
    },
    front: {
      backgroundColor: '#FFFFFF',
      backgroundPattern: 'none',
      layout: 'minimal',
      logoPosition: { x: 55.5, y: 10 },
      logoSize: 42,
      photoPosition: { x: 32.5, y: 55 },
      photoSize: { width: 88, height: 108 },
      photoShape: 'square',
      nameStyle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333333',
        position: { x: 0, y: 170 },
      },
      employeeIdStyle: {
        fontSize: 8,
        color: '#0066CC',
        position: { x: 0, y: 190 },
      },
      contactRowStyle: {
        y: 204,
        height: 9,
        fontSize: 7,
        fontWeight: '700',
        color: '#333333',
        items: ACC_CONTACT_ROW.items,
      },
      validTillStyle: { y: 220, height: 7, fontSize: 5, color: '#333333' },
      joiningDateStyle: { ...ACC_JOINING_DATE, color: '#333333' },
      accentElements: [
        { type: 'line', position: { x: 25, y: 166 }, size: { width: 103, height: 1 }, color: '#E0E0E0' },
      ],
    },
    back: {
      backgroundColor: '#FAFAFA',
      backgroundPattern: 'none',
      layout: 'minimal',
      logoPosition: { x: 55.5, y: 24 },
      logoSize: 42,
      photoPosition: { x: 0, y: 0 },
      photoSize: { width: 0, height: 0 },
      photoShape: 'circle',
      nameStyle: { fontSize: 9, fontWeight: '600', color: '#333333', position: { x: 20, y: 20 } },
      employeeIdStyle: { fontSize: 8, color: '#0066CC', position: { x: 20, y: 32 } },
      accentElements: [],
    },
  },

  // ── 7. Bold & Vibrant ──
  {
    id: 'bold-vibrant',
    name: 'Bold & Vibrant',
    category: 'creative',
    description: 'Eye-catching design with bold colors and dynamic layout',
    thumbnail: 'bold-vibrant',
    colors: {
      primary: '#0066CC',
      secondary: '#FF6B35',
      accent: '#FFD23F',
      background: '#0066CC',
      text: '#FFFFFF',
    },
    front: {
      backgroundColor: '#0066CC',
      backgroundPattern: 'none',
      layout: 'creative',
      logoPosition: { x: 10, y: 12 },
      logoSize: 38,
      photoPosition: { x: 28.5, y: 56 },
      photoSize: { width: 96, height: 116 },
      photoShape: 'circle',
      nameStyle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
        position: { x: 0, y: 178 },
      },
      employeeIdStyle: {
        fontSize: 8,
        color: '#FFD23F',
        position: { x: 0, y: 196 },
      },
      contactRowStyle: {
        y: 210,
        height: 9,
        fontSize: 7,
        fontWeight: '700',
        color: '#FFFFFF',
        items: ACC_CONTACT_ROW.items,
      },
      validTillStyle: { y: 225, height: 7, fontSize: 5, color: '#FFFFFF' },
      joiningDateStyle: { ...ACC_JOINING_DATE, color: '#FFD23F' },
      accentElements: [
        { type: 'rectangle', position: { x: 0, y: 234 }, size: { width: 153, height: 10 }, color: '#FF6B35' },
        { type: 'circle', position: { x: -20, y: 30 }, size: { width: 80, height: 80 }, color: 'rgba(255,210,63,0.15)' },
      ],
    },
    back: {
      backgroundColor: '#0052A3',
      backgroundPattern: 'none',
      layout: 'creative',
      logoPosition: { x: 55.5, y: 24 },
      logoSize: 42,
      photoPosition: { x: 0, y: 0 },
      photoSize: { width: 0, height: 0 },
      photoShape: 'circle',
      nameStyle: { fontSize: 10, fontWeight: '600', color: '#FFFFFF', position: { x: 20, y: 20 } },
      employeeIdStyle: { fontSize: 9, color: '#FFD23F', position: { x: 20, y: 35 } },
      accentElements: [
        { type: 'rectangle', position: { x: 0, y: 0 }, size: { width: 153, height: 10 }, color: '#FF6B35' },
      ],
    },
  },

  // ── 8. Glassmorphism Modern ──
  {
    id: 'glassmorphism-modern',
    name: 'Glassmorphism Modern',
    category: 'modern',
    description: 'Contemporary glassmorphism effect with frosted elements',
    thumbnail: 'glassmorphism-modern',
    colors: {
      primary: '#0066CC',
      secondary: '#FFFFFF',
      accent: '#4A90E2',
      background: 'linear-gradient(135deg, #E0F2FF 0%, #FFFFFF 100%)',
      text: '#1A1A1A',
    },
    front: {
      backgroundColor: 'linear-gradient(135deg, #E0F2FF 0%, #FFFFFF 100%)',
      backgroundPattern: 'gradient',
      layout: 'modern',
      logoPosition: { x: 10, y: 12 },
      logoSize: 38,
      photoPosition: { x: 29.5, y: 56 },
      photoSize: { width: 94, height: 114 },
      photoShape: 'rounded',
      nameStyle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1A1A1A',
        position: { x: 0, y: 176 },
      },
      employeeIdStyle: {
        fontSize: 8,
        color: '#0066CC',
        position: { x: 0, y: 194 },
      },
      contactRowStyle: {
        y: 208,
        height: 9,
        fontSize: 7,
        fontWeight: '700',
        color: '#0f172a',
        items: ACC_CONTACT_ROW.items,
      },
      validTillStyle: { y: 223, height: 7, fontSize: 5, color: '#0f172a' },
      joiningDateStyle: ACC_JOINING_DATE,
      accentElements: [
        { type: 'rectangle', position: { x: 25, y: 50 }, size: { width: 103, height: 125 }, color: 'rgba(255,255,255,0.3)' },
      ],
    },
    back: {
      backgroundColor: 'linear-gradient(135deg, #F0F8FF 0%, #FFFFFF 100%)',
      backgroundPattern: 'gradient',
      layout: 'modern',
      logoPosition: { x: 55.5, y: 24 },
      logoSize: 42,
      photoPosition: { x: 0, y: 0 },
      photoSize: { width: 0, height: 0 },
      photoShape: 'circle',
      nameStyle: { fontSize: 10, fontWeight: '600', color: '#1A1A1A', position: { x: 20, y: 20 } },
      employeeIdStyle: { fontSize: 9, color: '#0066CC', position: { x: 20, y: 35 } },
      accentElements: [],
    },
  },

  // ── 9. Classic Corporate ──
  {
    id: 'classic-corporate',
    name: 'Classic Corporate',
    category: 'classic',
    description: 'Timeless professional design with traditional business aesthetics',
    thumbnail: 'classic-corporate',
    colors: {
      primary: '#0066CC',
      secondary: '#002855',
      accent: '#8B0000',
      background: '#FFFFFF',
      text: '#1A1A1A',
    },
    front: {
      backgroundColor: '#FFFFFF',
      backgroundPattern: 'none',
      layout: 'classic',
      logoPosition: { x: 55.5, y: 12 },
      logoSize: 42,
      photoPosition: { x: 31.5, y: 60 },
      photoSize: { width: 90, height: 110 },
      photoShape: 'square',
      nameStyle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#002855',
        position: { x: 0, y: 176 },
      },
      employeeIdStyle: {
        fontSize: 8,
        color: '#0066CC',
        position: { x: 0, y: 194 },
      },
      contactRowStyle: {
        y: 208,
        height: 9,
        fontSize: 7,
        fontWeight: '700',
        color: '#0f172a',
        items: ACC_CONTACT_ROW.items,
      },
      validTillStyle: { y: 223, height: 7, fontSize: 5, color: '#0f172a' },
      joiningDateStyle: ACC_JOINING_DATE,
      accentElements: [
        { type: 'line', position: { x: 20, y: 56 }, size: { width: 113, height: 2 }, color: '#0066CC' },
        { type: 'line', position: { x: 20, y: 172 }, size: { width: 113, height: 2 }, color: '#0066CC' },
      ],
    },
    back: {
      backgroundColor: '#F8F8F8',
      backgroundPattern: 'none',
      layout: 'classic',
      logoPosition: { x: 55.5, y: 24 },
      logoSize: 42,
      photoPosition: { x: 0, y: 0 },
      photoSize: { width: 0, height: 0 },
      photoShape: 'circle',
      nameStyle: { fontSize: 10, fontWeight: '600', color: '#002855', position: { x: 20, y: 20 } },
      employeeIdStyle: { fontSize: 9, color: '#0066CC', position: { x: 20, y: 35 } },
      accentElements: [
        { type: 'line', position: { x: 0, y: 55 }, size: { width: 153, height: 1 }, color: '#CCCCCC' },
      ],
    },
  },

  // ── 10. Sleek Industrial ──
  {
    id: 'sleek-industrial',
    name: 'Sleek Industrial',
    category: 'modern',
    description: 'Industrial-inspired design with strong lines and modern typography',
    thumbnail: 'sleek-industrial',
    colors: {
      primary: '#0066CC',
      secondary: '#2C2C2C',
      accent: '#00A8E8',
      background: '#FFFFFF',
      text: '#1A1A1A',
    },
    front: {
      backgroundColor: '#FFFFFF',
      backgroundPattern: 'lines',
      layout: 'modern',
      logoPosition: { x: 10, y: 12 },
      logoSize: 38,
      photoPosition: { x: 30.5, y: 55 },
      photoSize: { width: 92, height: 112 },
      photoShape: 'square',
      nameStyle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#2C2C2C',
        position: { x: 0, y: 173 },
      },
      employeeIdStyle: {
        fontSize: 8,
        color: '#0066CC',
        position: { x: 0, y: 191 },
      },
      contactRowStyle: {
        y: 205,
        height: 9,
        fontSize: 7,
        fontWeight: '700',
        color: '#2C2C2C',
        items: ACC_CONTACT_ROW.items,
      },
      validTillStyle: { y: 220, height: 7, fontSize: 5, color: '#2C2C2C' },
      joiningDateStyle: { ...ACC_JOINING_DATE, color: '#0066CC' },
      accentElements: [
        { type: 'rectangle', position: { x: 0, y: 50 }, size: { width: 10, height: 125 }, color: '#0066CC' },
        { type: 'line', position: { x: 0, y: 169 }, size: { width: 153, height: 2 }, color: '#00A8E8' },
      ],
    },
    back: {
      backgroundColor: '#F5F5F5',
      backgroundPattern: 'lines',
      layout: 'modern',
      logoPosition: { x: 55.5, y: 24 },
      logoSize: 42,
      photoPosition: { x: 0, y: 0 },
      photoSize: { width: 0, height: 0 },
      photoShape: 'circle',
      nameStyle: { fontSize: 10, fontWeight: '600', color: '#2C2C2C', position: { x: 20, y: 20 } },
      employeeIdStyle: { fontSize: 9, color: '#0066CC', position: { x: 20, y: 35 } },
      accentElements: [
        { type: 'rectangle', position: { x: 143, y: 0 }, size: { width: 10, height: 244 }, color: '#0066CC' },
      ],
    },
  },
];

export function getTemplateById(id: string): Template | undefined {
  return templates.find(template => template.id === id);
}

export function getTemplatesByCategory(category: Template['category']): Template[] {
  return templates.filter(template => template.category === category);
}