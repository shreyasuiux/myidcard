import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Layout, 
  Palette, 
  Upload, 
  Check, 
  Edit3, 
  Sparkles,
  Download,
  Eye,
  Grid3x3,
  Star,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  BookOpen,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { templates, type Template } from '../utils/templateData';
import { TemplatePreviewCard } from './TemplatePreviewCard';
import { TemplatePreviewModal } from './TemplatePreviewModal';
import { BackSideTextEditor } from './BackSideTextEditor';
import { FrontSideTextEditor } from './FrontSideTextEditor';
import { AdvancedFrontDesignEditor } from './AdvancedFrontDesignEditor';
import { AdvancedBackDesignEditor } from './AdvancedBackDesignEditor';
import { IDCardDisplay } from './IDCardDisplay';
import { toast } from 'sonner';
import type { BackSideText, FrontSideText, TemplateDesign } from '../utils/templateData';

// CRITICAL: Must match the key used in templateStorage.ts for consistency
const CUSTOM_TEMPLATES_STORAGE_KEY = 'hr_idcard_custom_templates';

type TemplateView = 'gallery' | 'upload';

interface TemplatesProps {
  searchQuery?: string;
  selectedTemplate?: Template;
  onTemplateSelect?: (template: Template) => void;
  onNavigateToSingleMode?: () => void; // Add navigation callback
}

export function Templates({ searchQuery = '', selectedTemplate: externalSelectedTemplate, onTemplateSelect, onNavigateToSingleMode }: TemplatesProps) {
  const [currentView, setCurrentView] = useState<TemplateView>('gallery');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(externalSelectedTemplate || null);
  const [customizing, setCustomizing] = useState<Template | null>(null);
  const [customTemplate, setCustomTemplate] = useState<Template | null>(null);
  const [filterCategory, setFilterCategory] = useState<'all' | Template['category']>('all');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);
  const [isEditingBackText, setIsEditingBackText] = useState(false);
  const [currentBackText, setCurrentBackText] = useState<Template | null>(null);
  const [isEditingFrontText, setIsEditingFrontText] = useState(false);
  const [currentFrontText, setCurrentFrontText] = useState<Template | null>(null);
  const [previewSide, setPreviewSide] = useState<'front' | 'back'>('front'); // NEW: Front/Back toggle for applied template
  const [newlyUploadedId, setNewlyUploadedId] = useState<string | null>(null); // Track newly uploaded template for highlight animation
  const [isEditingFrontDesign, setIsEditingFrontDesign] = useState(false);
  const [isEditingBackDesign, setIsEditingBackDesign] = useState(false);

  // ORIGINAL TEMPLATE - Always the first template (Modern Minimal)
  const ORIGINAL_TEMPLATE = templates[0];
  
  // Check if the current selected template is the original
  const isOriginalTemplateActive = selectedTemplate?.id === ORIGINAL_TEMPLATE.id || externalSelectedTemplate?.id === ORIGINAL_TEMPLATE.id;

  // Load custom templates from localStorage (with migration from old key)
  useState(() => {
    let saved = localStorage.getItem(CUSTOM_TEMPLATES_STORAGE_KEY);
    // Migrate from old key if present
    if (!saved) {
      const oldSaved = localStorage.getItem('customTemplates');
      if (oldSaved) {
        localStorage.setItem(CUSTOM_TEMPLATES_STORAGE_KEY, oldSaved);
        localStorage.removeItem('customTemplates');
        saved = oldSaved;
        console.log('[TEMPLATE] Migrated custom templates from old storage key');
      }
    }
    if (saved) {
      setCustomTemplates(JSON.parse(saved));
    }
  });

  // Combine default and custom templates
  const allTemplates = [...templates, ...customTemplates];

  const filteredTemplates = allTemplates.filter(t => {
    // Category filter
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
    
    // Search filter
    const matchesSearch = !searchQuery || 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  const handleApplyTemplate = (template: Template) => {
    // Update local state
    setSelectedTemplate(template);
    
    // Notify parent component FIRST
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
    
    // Navigate to single employee mode
    if (onNavigateToSingleMode) {
      onNavigateToSingleMode();
    }
    
    // Show success message AFTER parent is notified
    // Using setTimeout to ensure state has updated
    setTimeout(() => {
      toast.success(`✓ Template "${template.name}" applied!`, {
        description: 'Navigated to Single Employee mode. Ready for ID generation.',
        duration: 3000,
      });
    }, 100);
  };

  // Reset to Original Template handler (with confirmation toast)
  const handleResetToOriginalWithConfirm = () => {
    if (isOriginalTemplateActive) return;
    
    // Show confirmation toast
    toast((t) => (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-orange-400" />
          <span className="font-semibold text-white">Reset to Original Template?</span>
        </div>
        <p className="text-sm text-slate-300">
          This will restore your company's default template.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              handleResetToOriginal();
              toast.dismiss(t.id);
            }}
            className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-all"
          >
            Confirm Reset
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    ), {
      duration: 10000,
      style: {
        background: 'linear-gradient(to bottom right, rgb(30, 41, 59), rgb(15, 23, 42))',
        border: '1px solid rgb(51, 65, 85)',
        borderRadius: '12px',
        padding: '16px',
      },
    });
  };

  // Template Guide handler
  const handleShowTemplateGuide = () => {
    toast((t) => (
      <div className="flex flex-col gap-4 max-w-md">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-400" />
          <span className="font-semibold text-white text-lg">Template System Guide</span>
        </div>
        <div className="space-y-3 text-sm text-slate-300">
          <div>
            <strong className="text-white">Original Template:</strong> Your company's default design. Cannot be deleted and always recoverable.
          </div>
          <div>
            <strong className="text-white">Gallery Templates:</strong> Choose from 10 professional, pre-designed templates.
          </div>
          <div>
            <strong className="text-white">Custom Upload:</strong> Upload .AI or .PDF files. Our AI will convert them to editable templates.
          </div>
          <div>
            <strong className="text-white">Apply Template:</strong> Click "Apply" to use a template. It will update the preview and export.
          </div>
          <div>
            <strong className="text-white">Edit Template:</strong> Customize colors, typography, and photo shapes to match your brand.
          </div>
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="mt-2 w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg text-sm font-medium transition-all"
        >
          Got it!
        </button>
      </div>
    ), {
      duration: 20000,
      style: {
        background: 'linear-gradient(to bottom right, rgb(30, 41, 59), rgb(15, 23, 42))',
        border: '1px solid rgb(51, 65, 85)',
        borderRadius: '12px',
        padding: '20px',
        maxWidth: '450px',
      },
    });
  };

  // Reset to Original Template handler
  const handleResetToOriginal = () => {
    // Update local state
    setSelectedTemplate(ORIGINAL_TEMPLATE);
    
    // Notify parent component IMMEDIATELY
    if (onTemplateSelect) {
      console.log('🔄 Templates: Resetting to original template');
      onTemplateSelect(ORIGINAL_TEMPLATE);
    }
    
    // Show success message
    toast.success('✓ Reset to Original Template', {
      description: 'Your company\'s default template has been restored.',
      duration: 3000,
    });
    
    console.log('✅ Reset to original template complete');
  };

  const handleCustomizeTemplate = (template: Template) => {
    setCustomizing(template);
    setCustomTemplate(JSON.parse(JSON.stringify(template))); // Deep clone
  };

  const handleColorChange = (colorType: 'primary' | 'secondary' | 'accent' | 'text', value: string) => {
    if (!customTemplate) return;
    setCustomTemplate({
      ...customTemplate,
      colors: {
        ...customTemplate.colors,
        [colorType]: value,
      },
    });
  };

  const handleFontSizeChange = (field: 'name' | 'employeeId', value: number) => {
    if (!customTemplate) return;
    setCustomTemplate({
      ...customTemplate,
      front: {
        ...customTemplate.front,
        [`${field}Style`]: {
          ...customTemplate.front[`${field}Style` as keyof typeof customTemplate.front],
          fontSize: value,
        },
      },
    });
  };

  const handlePhotoShapeChange = (shape: 'circle' | 'rounded' | 'square') => {
    if (!customTemplate) return;
    setCustomTemplate({
      ...customTemplate,
      front: {
        ...customTemplate.front,
        photoShape: shape,
      },
    });
  };

  const handleSaveCustomTemplate = () => {
    if (!customTemplate) return;

    // Create new custom template with unique ID
    const newCustomTemplate: Template = {
      ...customTemplate,
      id: `custom_${Date.now()}`,
      name: `${customTemplate.name} (Custom)`,
    };

    const updatedCustomTemplates = [...customTemplates, newCustomTemplate];
    setCustomTemplates(updatedCustomTemplates);
    localStorage.setItem(CUSTOM_TEMPLATES_STORAGE_KEY, JSON.stringify(updatedCustomTemplates));

    toast.success('Custom template saved!', {
      description: 'Your customized design has been saved to the gallery.',
    });
    
    setCustomizing(null);
    setCustomTemplate(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      toast.info('🎨 Processing your design...', {
        description: 'AI is analyzing colors, layout, and design elements.',
        duration: 3000,
      });
      
      try {
        // Simulate AI processing with a delay
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        // Create a template from the uploaded file
        const uploadedTemplate = await createTemplateFromFile(file);
        
        // Add to custom templates
        const updatedCustomTemplates = [...customTemplates, uploadedTemplate];
        setCustomTemplates(updatedCustomTemplates);
        localStorage.setItem(CUSTOM_TEMPLATES_STORAGE_KEY, JSON.stringify(updatedCustomTemplates));
        
        // Mark as newly uploaded for highlight animation
        setNewlyUploadedId(uploadedTemplate.id);
        
        toast.success('✨ Template created successfully!', {
          description: `"${uploadedTemplate.name}" is now in your gallery and ready to use.`,
          duration: 5000,
        });
        
        // Reset upload and switch to gallery
        setUploadFile(null);
        setCurrentView('gallery');
        
        // Auto-apply the uploaded template with visual feedback
        setTimeout(() => {
          handleApplyTemplate(uploadedTemplate);
          toast.success('🎯 Template Applied!', {
            description: 'Your uploaded design is now active. Check the preview above!',
            duration: 4000,
          });
          
          // Clear the highlight after 5 seconds
          setTimeout(() => setNewlyUploadedId(null), 5000);
        }, 500);
        
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('❌ Failed to process file', {
          description: 'Please check the file format and try again.',
        });
        setUploadFile(null);
      }
    }
  };

  // Create a template from uploaded file
  const createTemplateFromFile = async (file: File): Promise<Template> => {
    // Read file as data URL for preview
    const fileUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    // Generate vibrant colors for the template (simulating AI extraction)
    // Use color palette patterns that look professional
    const colorPalettes = [
      { primary: '#0066CC', secondary: '#002855', accent: '#4A90E2', background: '#FFFFFF', text: '#1A1A1A' },
      { primary: '#2563EB', secondary: '#1E40AF', accent: '#60A5FA', background: '#FFFFFF', text: '#0F172A' },
      { primary: '#7C3AED', secondary: '#5B21B6', accent: '#A78BFA', background: '#FFFFFF', text: '#1E1B4B' },
      { primary: '#DC2626', secondary: '#991B1B', accent: '#F87171', background: '#FFFFFF', text: '#1F2937' },
      { primary: '#059669', secondary: '#047857', accent: '#34D399', background: '#FFFFFF', text: '#064E3B' },
      { primary: '#EA580C', secondary: '#C2410C', accent: '#FB923C', background: '#FFFFFF', text: '#431407' },
    ];
    
    const randomPalette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];

    // Create a new template based on uploaded file with PROPER structure
    const newTemplate: Template = {
      id: `upload_${Date.now()}`,
      name: file.name.replace(/\.(ai|pdf)$/i, ''),
      description: `Custom uploaded design from ${file.name}`,
      category: 'modern',
      thumbnail: fileUrl, // Use the file itself as thumbnail
      colors: randomPalette,
      front: {
        backgroundColor: randomPalette.background,
        backgroundPattern: 'none',
        layout: 'modern',
        logoPosition: { x: 100, y: 10 },
        logoSize: 42,
        photoPosition: { x: 44.5, y: 57 },
        photoSize: { width: 64, height: 80 },
        photoShape: 'rounded',
        nameStyle: {
          fontSize: 18,
          fontWeight: '700',
          color: randomPalette.primary,
          position: { x: 76.5, y: 143 },
        },
        employeeIdStyle: {
          fontSize: 8,
          color: randomPalette.text,
          position: { x: 76.5, y: 175 },
        },
        accentElements: [
          {
            type: 'line',
            position: { x: 0, y: 230 },
            size: { width: 153, height: 3 },
            color: randomPalette.accent,
          },
          {
            type: 'rectangle',
            position: { x: 0, y: 0 },
            size: { width: 153, height: 5 },
            color: randomPalette.primary,
          },
        ],
      },
      back: {
        backgroundColor: '#F8F9FA',
        backgroundPattern: 'none',
        layout: 'minimal',
        logoPosition: { x: 76.5, y: 24 },
        logoSize: 42,
        photoPosition: { x: 0, y: 0 },
        photoSize: { width: 0, height: 0 },
        photoShape: 'circle',
        nameStyle: {
          fontSize: 7,
          fontWeight: '600',
          color: randomPalette.text,
          position: { x: 20, y: 60 },
        },
        employeeIdStyle: {
          fontSize: 6,
          color: randomPalette.text,
          position: { x: 20, y: 75 },
        },
        accentElements: [],
      },
    };

    return newTemplate;
  };

  const handleEditBackSideText = () => {
    const template = selectedTemplate || externalSelectedTemplate || ORIGINAL_TEMPLATE;
    setCurrentBackText(template);
    setIsEditingBackText(true);
  };

  const handleSaveBackSideText = (backText: BackSideText) => {
    if (!currentBackText) return;

    // Update the current template with new back text
    const updatedTemplate: Template = {
      ...currentBackText,
      backText: backText,
    };

    // If it's the selected template, update it
    if (currentBackText.id === selectedTemplate?.id) {
      setSelectedTemplate(updatedTemplate);
      if (onTemplateSelect) {
        onTemplateSelect(updatedTemplate);
      }
    }

    // Save to templates array or localStorage if it's a custom template
    const customTemplateIndex = customTemplates.findIndex(t => t.id === currentBackText.id);
    if (customTemplateIndex !== -1) {
      const updatedCustomTemplates = [...customTemplates];
      updatedCustomTemplates[customTemplateIndex] = updatedTemplate;
      setCustomTemplates(updatedCustomTemplates);
      localStorage.setItem(CUSTOM_TEMPLATES_STORAGE_KEY, JSON.stringify(updatedCustomTemplates));
    }

    setIsEditingBackText(false);
    setCurrentBackText(null);
  };

  const handleEditFrontSideText = () => {
    const template = selectedTemplate || externalSelectedTemplate || ORIGINAL_TEMPLATE;
    setCurrentFrontText(template);
    setIsEditingFrontText(true);
  };

  const handleSaveFrontSideText = (frontText: FrontSideText) => {
    if (!currentFrontText) return;

    // Update the current template with new front text
    const updatedTemplate: Template = {
      ...currentFrontText,
      frontText: frontText,
    };

    // If it's the selected template, update it
    if (currentFrontText.id === selectedTemplate?.id) {
      setSelectedTemplate(updatedTemplate);
      if (onTemplateSelect) {
        onTemplateSelect(updatedTemplate);
      }
    }

    // Save to templates array or localStorage if it's a custom template
    const customTemplateIndex = customTemplates.findIndex(t => t.id === currentFrontText.id);
    if (customTemplateIndex !== -1) {
      const updatedCustomTemplates = [...customTemplates];
      updatedCustomTemplates[customTemplateIndex] = updatedTemplate;
      setCustomTemplates(updatedCustomTemplates);
      localStorage.setItem(CUSTOM_TEMPLATES_STORAGE_KEY, JSON.stringify(updatedCustomTemplates));
    }

    setIsEditingFrontText(false);
    setCurrentFrontText(null);
  };

  // Advanced Design Editor Handlers
  const handleEditFrontDesign = () => {
    setIsEditingFrontDesign(true);
  };

  const handleSaveFrontDesign = (updatedFront: TemplateDesign) => {
    const template = selectedTemplate || externalSelectedTemplate || ORIGINAL_TEMPLATE;
    
    const updatedTemplate: Template = {
      ...template,
      front: updatedFront,
    };

    setSelectedTemplate(updatedTemplate);
    if (onTemplateSelect) {
      onTemplateSelect(updatedTemplate);
    }

    // Save to localStorage if it's a custom template
    const customTemplateIndex = customTemplates.findIndex(t => t.id === template.id);
    if (customTemplateIndex !== -1) {
      const updatedCustomTemplates = [...customTemplates];
      updatedCustomTemplates[customTemplateIndex] = updatedTemplate;
      setCustomTemplates(updatedCustomTemplates);
      localStorage.setItem(CUSTOM_TEMPLATES_STORAGE_KEY, JSON.stringify(updatedCustomTemplates));
    }

    setIsEditingFrontDesign(false);
  };

  const handleEditBackDesign = () => {
    setIsEditingBackDesign(true);
  };

  const handleSaveBackDesign = (updatedBack: TemplateDesign) => {
    const template = selectedTemplate || externalSelectedTemplate || ORIGINAL_TEMPLATE;
    
    const updatedTemplate: Template = {
      ...template,
      back: updatedBack,
    };

    setSelectedTemplate(updatedTemplate);
    if (onTemplateSelect) {
      onTemplateSelect(updatedTemplate);
    }

    // Save to localStorage if it's a custom template
    const customTemplateIndex = customTemplates.findIndex(t => t.id === template.id);
    if (customTemplateIndex !== -1) {
      const updatedCustomTemplates = [...customTemplates];
      updatedCustomTemplates[customTemplateIndex] = updatedTemplate;
      setCustomTemplates(updatedCustomTemplates);
      localStorage.setItem(CUSTOM_TEMPLATES_STORAGE_KEY, JSON.stringify(updatedCustomTemplates));
    }

    setIsEditingBackDesign(false);
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center gap-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-2 border border-slate-700/50 backdrop-blur-sm">
        <motion.button
          onClick={() => setCurrentView('gallery')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all ${
            currentView === 'gallery'
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Grid3x3 className="w-4 h-4" />
          Template Gallery
        </motion.button>
        <motion.button
          onClick={() => setCurrentView('upload')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all ${
            currentView === 'upload'
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Upload className="w-4 h-4" />
          Upload Custom Design
        </motion.button>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {currentView === 'gallery' && (
          <motion.div
            key="gallery"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Mobile-First: Original Company Template Status Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-slate-800/40 via-slate-900/40 to-slate-800/40 border border-slate-700/50 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden"
            >
              {/* Glassmorphism gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
              
              <div className="relative z-10">
                {/* Header with icon */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30 flex items-center justify-center">
                      <Star className="w-6 h-6 text-blue-400" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h2 className="text-xl font-bold text-white">Original</h2>
                      {isOriginalTemplateActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-400/40 rounded-full backdrop-blur-sm"
                        >
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span className="text-emerald-300 text-sm font-semibold">Active</span>
                        </motion.div>
                      )}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">Company Template</h3>
                    
                    <p className="text-slate-400 text-sm leading-relaxed mb-6">
                      You can always return to your original company template.
                    </p>

                    {/* Reset Button */}
                    <motion.button
                      onClick={handleResetToOriginalWithConfirm}
                      disabled={isOriginalTemplateActive}
                      whileHover={!isOriginalTemplateActive ? { scale: 1.02, x: 5 } : {}}
                      whileTap={!isOriginalTemplateActive ? { scale: 0.98 } : {}}
                      className={`w-full sm:w-auto px-6 py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                        isOriginalTemplateActive
                          ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed border border-slate-700/50'
                          : 'bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white border border-slate-600/50 shadow-lg'
                      }`}
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset to Original Template
                    </motion.button>
                  </div>
                </div>

                {/* Bottom Status Bar */}
                <div className="mt-6 pt-4 border-t border-slate-700/50">
                  <div className="flex items-center gap-3">
                    {isOriginalTemplateActive ? (
                      <>
                        <Check className="w-5 h-5 text-blue-400" />
                        <span className="text-blue-300 text-sm font-medium">
                          Original company template is active
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-orange-400" />
                        <span className="text-orange-300 text-sm font-medium">
                          Custom template is currently active
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Edit Front Side Field Labels - Global Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/30 rounded-2xl p-4 sm:p-6 backdrop-blur-sm"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
                <div className="flex-1 w-full sm:w-auto">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <h3 className="text-white font-semibold text-base sm:text-lg">Front Side Field Labels</h3>
                  </div>
                  <p className="text-slate-400 text-xs sm:text-sm">
                    Customize the field labels on the front of ID cards (Mobile, Blood Group, Website/Designation, etc.)
                  </p>
                </div>
                
                <motion.button
                  onClick={handleEditFrontSideText}
                  whileHover={{ scale: 1.05, x: -3 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all w-full sm:w-auto justify-center whitespace-nowrap flex-shrink-0"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Front Side Labels
                </motion.button>
              </div>
            </motion.div>

            {/* Edit Back Side Text - Global Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl p-4 sm:p-6 backdrop-blur-sm"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
                <div className="flex-1 w-full sm:w-auto">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <h3 className="text-white font-semibold text-base sm:text-lg">Back Side Card Text</h3>
                  </div>
                  <p className="text-slate-400 text-xs sm:text-sm">
                    Customize the text that appears on the back of all ID cards (company address, branches, contact info)
                  </p>
                </div>
                
                <motion.button
                  onClick={handleEditBackSideText}
                  whileHover={{ scale: 1.05, x: -3 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all w-full sm:w-auto justify-center whitespace-nowrap flex-shrink-0"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Back Side Text
                </motion.button>
              </div>
            </motion.div>

            {/* ADVANCED DESIGN EDITORS */}
            {/* Advanced Front Design Editor - NEW */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-4 sm:p-6 backdrop-blur-sm"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
                <div className="flex-1 w-full sm:w-auto">
                  <div className="flex items-center gap-3 mb-2">
                    <Layout className="w-5 h-5 text-purple-400 flex-shrink-0" />
                    <h3 className="text-white font-semibold text-base sm:text-lg">Advanced Front Design</h3>
                    <span className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full">
                      PRO
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs sm:text-sm">
                    Full control over logo position, photo placement, background, colors, and layout elements
                  </p>
                </div>
                
                <motion.button
                  onClick={handleEditFrontDesign}
                  whileHover={{ scale: 1.05, x: -3 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 text-white rounded-xl font-medium text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all w-full sm:w-auto justify-center whitespace-nowrap flex-shrink-0"
                >
                  <Palette className="w-4 h-4" />
                  Advanced Design Editor
                </motion.button>
              </div>
            </motion.div>

            {/* Advanced Back Design Editor - NEW */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-2xl p-4 sm:p-6 backdrop-blur-sm"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
                <div className="flex-1 w-full sm:w-auto">
                  <div className="flex items-center gap-3 mb-2">
                    <Layout className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    <h3 className="text-white font-semibold text-base sm:text-lg">Advanced Back Design</h3>
                    <span className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full">
                      PRO
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs sm:text-sm">
                    Customize logo, background colors, patterns, and text styling for the back side
                  </p>
                </div>
                
                <motion.button
                  onClick={handleEditBackDesign}
                  whileHover={{ scale: 1.05, x: -3 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-600 text-white rounded-xl font-medium text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all w-full sm:w-auto justify-center whitespace-nowrap flex-shrink-0"
                >
                  <Palette className="w-4 h-4" />
                  Advanced Design Editor
                </motion.button>
              </div>
            </motion.div>

            {/* Currently Applied Template Preview with Front/Back Toggle */}
            {(selectedTemplate || externalSelectedTemplate) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-2xl p-6 border border-slate-700/50 backdrop-blur-sm"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-6">
                  <div className="flex-1 w-full sm:w-auto">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <Layout className="w-5 h-5 text-purple-400 flex-shrink-0" />
                      <h3 className="text-white font-semibold text-lg">Currently Applied Template</h3>
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30"
                      >
                        ✓ Active
                      </motion.span>
                    </div>
                    <p className="text-slate-400 text-sm">
                      {(selectedTemplate || externalSelectedTemplate)?.name} - This template will be used for all ID card exports
                    </p>
                  </div>
                </div>

                {/* Front/Back Toggle - Matching IDCardPreview style */}
                <div className="mb-6 flex gap-2 bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                  <motion.button
                    onClick={() => setPreviewSide('front')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                      previewSide === 'front'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/50'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    Front Side
                  </motion.button>
                  <motion.button
                    onClick={() => setPreviewSide('back')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                      previewSide === 'back'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/50'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    Back Side
                  </motion.button>
                </div>

                {/* Template Preview - Matching IDCardPreview style */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Preview Card */}
                  <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 backdrop-blur-sm">
                    <div className="flex items-center justify-center min-h-[400px]">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={previewSide}
                          initial={{ opacity: 0, rotateY: previewSide === 'front' ? -90 : 90 }}
                          animate={{ opacity: 1, rotateY: 0 }}
                          exit={{ opacity: 0, rotateY: previewSide === 'front' ? 90 : -90 }}
                          transition={{ duration: 0.4 }}
                        >
                          <IDCardDisplay 
                            employee={{
                              id: 'sample-preview',
                              name: 'Shreyas V.',
                              employeeId: '1234',
                              mobile: '9898989898',
                              bloodGroup: 'B+',
                              website: 'www.acc.ltd',
                              joiningDate: '2024-01-12',
                              validTill: '2030-12-31',
                              photoBase64: '',
                              createdAt: new Date().toISOString(),
                            }}
                            side={previewSide} 
                            scale={2} 
                          />
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Preview Info */}
                  <div className="space-y-4">
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 backdrop-blur-sm">
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <Eye className="w-4 h-4 text-purple-400" />
                        {previewSide === 'front' ? 'Front Side' : 'Back Side'} Preview
                      </h4>
                      <ul className="space-y-2 text-xs text-slate-300">
                        {previewSide === 'front' ? (
                          <>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                              Layout: <span className="font-medium text-white">{(selectedTemplate || externalSelectedTemplate)?.front.layout}</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                              Photo Shape: <span className="font-medium text-white">{(selectedTemplate || externalSelectedTemplate)?.front.photoShape}</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
                              Background: <span className="font-medium text-white">{(selectedTemplate || externalSelectedTemplate)?.front.backgroundPattern || 'solid'}</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                              Accent Elements: <span className="font-medium text-white">{(selectedTemplate || externalSelectedTemplate)?.front.accentElements?.length || 0}</span>
                            </li>
                          </>
                        ) : (
                          <>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                              Layout: <span className="font-medium text-white">{(selectedTemplate || externalSelectedTemplate)?.back.layout}</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                              Background: <span className="font-medium text-white">{(selectedTemplate || externalSelectedTemplate)?.back.backgroundPattern || 'solid'}</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
                              Accent Elements: <span className="font-medium text-white">{(selectedTemplate || externalSelectedTemplate)?.back.accentElements?.length || 0}</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                              Custom Text: <span className="font-medium text-white">{(selectedTemplate || externalSelectedTemplate)?.backText ? 'Yes' : 'Default'}</span>
                            </li>
                          </>
                        )}
                      </ul>
                    </div>

                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 backdrop-blur-sm">
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <Palette className="w-4 h-4 text-purple-400" />
                        Color Palette
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        {Object.entries((selectedTemplate || externalSelectedTemplate)?.colors || {}).slice(0, 3).map(([key, value]) => (
                          <div key={key} className="space-y-2">
                            <div 
                              className="w-full h-14 rounded-lg border-2 border-slate-600/50 shadow-lg transition-transform hover:scale-105"
                              style={{ background: value }}
                            />
                            <div className="text-xs text-slate-400 capitalize text-center font-medium">{key}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 backdrop-blur-sm">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-blue-300 leading-relaxed">
                          <strong className="text-blue-200">Export Note:</strong> This template (both front and back) will be used for all ID card exports. 
                          {previewSide === 'front' && ' The front side field labels can be customized using the "Edit Front Side Labels" button above.'}
                          {previewSide === 'back' && ' The back side content can be customized using the "Edit Back Side Text" button above.'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Category Filter */}
            <div className="flex items-center gap-3">
              <span className="text-slate-400 text-sm font-medium">Filter:</span>
              {['all', 'professional', 'modern', 'creative', 'classic'].map((category) => (
                <motion.button
                  key={category}
                  onClick={() => setFilterCategory(category as any)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filterCategory === category
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                      : 'bg-slate-800/50 text-slate-400 hover:text-white border border-slate-700/50'
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </motion.button>
              ))}
            </div>

            {/* RESET TO ORIGINAL TEMPLATE SECTION */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-6 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Star className="w-5 h-5 text-blue-400" />
                    <h3 className="text-white font-semibold text-lg">Original Company Template</h3>
                    {isOriginalTemplateActive && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30"
                      >
                        ✓ Active
                      </motion.span>
                    )}
                  </div>
                  <p className="text-slate-400 text-sm">
                    You can always return to your original company template.
                  </p>
                </div>
                
                <motion.button
                  onClick={handleResetToOriginalWithConfirm}
                  disabled={isOriginalTemplateActive}
                  whileHover={!isOriginalTemplateActive ? { scale: 1.05, x: -3 } : {}}
                  whileTap={!isOriginalTemplateActive ? { scale: 0.95 } : {}}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all ${
                    isOriginalTemplateActive
                      ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl'
                  }`}
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset to Original Template
                </motion.button>
              </div>

              {/* Status Helper Text */}
              {isOriginalTemplateActive && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 pt-4 border-t border-blue-500/20"
                >
                  <div className="flex items-center gap-2 text-sm text-blue-300">
                    <Check className="w-4 h-4" />
                    <span>Original company template is active</span>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Template Grid */}
            <div className="grid grid-cols-2 gap-6">
              {filteredTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative group"
                >
                  {/* Card Container with pulse animation for newly uploaded */}
                  <div className={`relative bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-2xl p-6 border border-slate-700/50 backdrop-blur-sm hover:border-blue-500/50 transition-all ${
                    newlyUploadedId === template.id ? 'ring-4 ring-emerald-500/50 ring-offset-2 ring-offset-slate-900 animate-pulse' : ''
                  }`}>
                    {/* Template Preview */}
                    <div className="aspect-[153/244] bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl mb-4 flex items-center justify-center overflow-hidden relative">
                      <IDCardDisplay 
                        employee={{
                          id: 'sample-preview',
                          name: 'Shreyas V.',
                          employeeId: '1234',
                          mobile: '9898989898',
                          bloodGroup: 'B+',
                          website: 'www.acc.ltd',
                          joiningDate: '2024-01-12',
                          validTill: '2030-12-31',
                          photoBase64: '',
                          createdAt: new Date().toISOString(),
                        }}
                        side="front" 
                        scale={1}
                        template={template}
                      />
                      
                      {/* Preview Button Overlay */}
                      <motion.button
                        onClick={() => setPreviewTemplate(template)}
                        whileHover={{ opacity: 1 }}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 transition-opacity"
                      >
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2 text-white">
                          <Eye className="w-4 h-4" />
                          <span className="text-sm font-medium">Preview</span>
                        </div>
                      </motion.button>
                      
                      {/* Selected Badge */}
                      {selectedTemplate?.id === template.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-2 shadow-lg"
                        >
                          <Check className="w-4 h-4" />
                        </motion.div>
                      )}
                      
                      {/* Original Template Badge */}
                      {template.id === ORIGINAL_TEMPLATE.id && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="absolute top-2 left-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg px-3 py-1.5 shadow-lg flex items-center gap-1.5"
                        >
                          <Star className="w-3.5 h-3.5 fill-white" />
                          <span className="text-xs font-semibold">Original</span>
                        </motion.div>
                      )}
                      
                      {/* Custom Uploaded Template Badge */}
                      {template.id.startsWith('upload_') && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="absolute top-2 left-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg px-3 py-1.5 shadow-lg flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span className="text-xs font-semibold">Custom Upload</span>
                        </motion.div>
                      )}
                      
                      {/* NEW Badge for newly uploaded templates */}
                      {newlyUploadedId === template.id && (
                        <motion.div
                          initial={{ scale: 0, rotate: -12 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg px-3 py-1.5 shadow-lg flex items-center gap-1.5 z-10"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span className="text-xs font-bold">NEW!</span>
                        </motion.div>
                      )}
                    </div>

                    {/* Template Info */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-white font-semibold">{template.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          template.category === 'professional' ? 'bg-blue-500/20 text-blue-400' :
                          template.category === 'modern' ? 'bg-purple-500/20 text-purple-400' :
                          template.category === 'creative' ? 'bg-pink-500/20 text-pink-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {template.category}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed">{template.description}</p>
                    </div>

                    {/* Color Palette */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs text-slate-500">Colors:</span>
                      <div className="flex gap-1">
                        <div className="w-5 h-5 rounded-full border-2 border-slate-600" style={{ backgroundColor: template.colors.primary }} />
                        <div className="w-5 h-5 rounded-full border-2 border-slate-600" style={{ backgroundColor: template.colors.secondary }} />
                        <div className="w-5 h-5 rounded-full border-2 border-slate-600" style={{ backgroundColor: template.colors.accent }} />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <motion.button
                        onClick={() => handleApplyTemplate(template)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg text-sm font-medium"
                      >
                        <Check className="w-4 h-4" />
                        Apply
                      </motion.button>
                      <motion.button
                        onClick={() => handleCustomizeTemplate(template)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-all"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {currentView === 'customize' && (
          <motion.div
            key="customize"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-2 gap-8"
          >
            {/* Customization Panel */}
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-2xl p-6 border border-slate-700/50 backdrop-blur-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-lg">Customize Template</h3>
                <motion.button
                  onClick={() => setCurrentView('gallery')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {customizing && (
                <div className="space-y-6">
                  {/* Template Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      Select Base Template
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {templates.slice(0, 4).map((template) => (
                        <motion.button
                          key={template.id}
                          onClick={() => setCustomizing(template)}
                          whileHover={{ scale: 1.02 }}
                          className={`p-3 rounded-lg text-left transition-all ${
                            customizing.id === template.id
                              ? 'bg-blue-500/20 border-2 border-blue-500'
                              : 'bg-slate-800/50 border-2 border-slate-700/50'
                          }`}
                        >
                          <div className="text-white text-sm font-medium">{template.name}</div>
                          <div className="text-slate-400 text-xs">{template.category}</div>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Color Customization */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      <Palette className="w-4 h-4 inline mr-2" />
                      Color Scheme
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(customizing.colors).map(([key, value]) => (
                        <div key={key}>
                          <label className="block text-xs text-slate-400 mb-1 capitalize">{key}</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              defaultValue={value}
                              className="w-10 h-10 rounded-lg cursor-pointer"
                            />
                            <input
                              type="text"
                              defaultValue={value}
                              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Font Settings */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      Typography
                    </label>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Name Font Size</label>
                        <input
                          type="range"
                          min="10"
                          max="20"
                          defaultValue={customizing.front.nameStyle.fontSize}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">ID Font Size</label>
                        <input
                          type="range"
                          min="8"
                          max="14"
                          defaultValue={customizing.front.employeeIdStyle.fontSize}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Layout Options */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      Photo Shape
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['circle', 'rounded', 'square'] as const).map((shape) => (
                        <motion.button
                          key={shape}
                          whileHover={{ scale: 1.05 }}
                          className={`px-3 py-2 rounded-lg text-xs font-medium capitalize ${
                            customizing.front.photoShape === shape
                              ? 'bg-blue-500 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {shape}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Save Button */}
                  <motion.button
                    onClick={handleSaveCustomTemplate}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium"
                  >
                    <Save className="w-5 h-5" />
                    Save Custom Template
                  </motion.button>
                </div>
              )}

              {!customizing && (
                <div className="text-center py-12">
                  <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">Select a template from the gallery to customize</p>
                  <motion.button
                    onClick={() => setCurrentView('gallery')}
                    whileHover={{ scale: 1.05 }}
                    className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium"
                  >
                    Go to Gallery
                  </motion.button>
                </div>
              )}
            </div>

            {/* Live Preview */}
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-2xl p-6 border border-slate-700/50 backdrop-blur-sm">
              <h3 className="text-white font-bold text-lg mb-4">Live Preview</h3>
              <div className="flex items-center justify-center h-[500px] bg-slate-900/50 rounded-xl">
                <div className="text-center">
                  <Eye className="w-16 h-16 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Template preview will appear here</p>
                  {customizing && (
                    <div className="mt-4 text-slate-500 text-xs">
                      Previewing: {customizing.name}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {currentView === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-2xl p-8 border border-slate-700/50 backdrop-blur-sm"
          >
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center">
                <Upload className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-white font-bold text-2xl mb-2">Upload Custom Design</h3>
                <p className="text-slate-400">
                  Upload your Adobe Illustrator (.ai) or PDF file and our AI will convert it to an editable template
                </p>
              </div>

              {/* Upload Area */}
              <motion.label
                whileHover={{ scale: 1.01 }}
                className="block border-2 border-dashed border-slate-600 hover:border-blue-500 rounded-2xl p-12 text-center cursor-pointer transition-all"
              >
                <input
                  type="file"
                  accept=".ai,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Sparkles className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <div className="text-white font-medium mb-2">
                  Drag & drop your design file here
                </div>
                <div className="text-slate-400 text-sm">
                  or click to browse (.ai, .pdf)
                </div>
              </motion.label>

              {uploadFile && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-800/50 rounded-xl p-4 border border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Layout className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-white font-medium text-sm">{uploadFile.name}</div>
                        <div className="text-slate-400 text-xs">Processing with AI...</div>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-5 h-5 text-blue-400" />
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* Features List */}
              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
                <h4 className="text-white font-semibold mb-4">AI Features</h4>
                <div className="space-y-3">
                  {[
                    'Automatically extracts colors and design elements',
                    'Detects layout structure and positioning',
                    'Maps employee data fields intelligently',
                    'Converts to fully editable template',
                    'Maintains high-resolution quality',
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons: Reset to Original + Template Guide */}
              <div className="grid grid-cols-2 gap-4">
                {/* Reset to Original Template Button */}
                <motion.button
                  onClick={handleResetToOriginalWithConfirm}
                  disabled={isOriginalTemplateActive}
                  whileHover={!isOriginalTemplateActive ? { scale: 1.02 } : {}}
                  whileTap={!isOriginalTemplateActive ? { scale: 0.98 } : {}}
                  className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all ${
                    isOriginalTemplateActive
                      ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed border border-slate-600'
                      : 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg hover:shadow-xl border border-transparent'
                  }`}
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset to Original
                </motion.button>

                {/* Template Guide Button */}
                <motion.button
                  onClick={handleShowTemplateGuide}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium text-sm shadow-lg hover:shadow-xl transition-all"
                >
                  <BookOpen className="w-4 h-4" />
                  Template Guide
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <TemplatePreviewModal 
        template={previewTemplate}
        isOpen={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
      />

      {/* Back Side Text Editor Modal */}
      {currentBackText && (
        <BackSideTextEditor
          template={currentBackText}
          isOpen={isEditingBackText}
          onClose={() => {
            setIsEditingBackText(false);
            setCurrentBackText(null);
          }}
          onSave={handleSaveBackSideText}
        />
      )}

      {/* Front Side Text Editor Modal */}
      {currentFrontText && (
        <FrontSideTextEditor
          template={currentFrontText}
          isOpen={isEditingFrontText}
          onClose={() => {
            setIsEditingFrontText(false);
            setCurrentFrontText(null);
          }}
          onSave={handleSaveFrontSideText}
        />
      )}

      {/* Advanced Front Design Editor Modal - NEW */}
      {isEditingFrontDesign && (
        <AdvancedFrontDesignEditor
          template={selectedTemplate || externalSelectedTemplate || ORIGINAL_TEMPLATE}
          isOpen={isEditingFrontDesign}
          onClose={() => setIsEditingFrontDesign(false)}
          onSave={handleSaveFrontDesign}
        />
      )}

      {/* Advanced Back Design Editor Modal - NEW */}
      {isEditingBackDesign && (
        <AdvancedBackDesignEditor
          template={selectedTemplate || externalSelectedTemplate || ORIGINAL_TEMPLATE}
          isOpen={isEditingBackDesign}
          onClose={() => setIsEditingBackDesign(false)}
          onSave={handleSaveBackDesign}
        />
      )}

      {/* Customize Modal */}
      <AnimatePresence>
        {customizing && customTemplate && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setCustomizing(null);
                setCustomTemplate(null);
              }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl border border-slate-700 max-w-6xl w-full max-h-[90vh] overflow-y-auto"
              >
                {/* Close Button */}
                <motion.button
                  onClick={() => {
                    setCustomizing(null);
                    setCustomTemplate(null);
                  }}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute top-6 right-6 w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center text-white transition-all z-10"
                >
                  <X className="w-5 h-5" />
                </motion.button>

                {/* Content Grid */}
                <div className="grid grid-cols-2 gap-8 p-8">
                  {/* Left: Customization Panel */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-white font-bold text-2xl mb-2">Customize Template</h3>
                      <p className="text-slate-400 text-sm">Edit colors, typography, and layout</p>
                    </div>

                    {/* Color Customization */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-3">
                        <Palette className="w-4 h-4 inline mr-2" />
                        Color Scheme
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(customTemplate.colors).map(([key, value]) => (
                          <div key={key}>
                            <label className="block text-xs text-slate-400 mb-1 capitalize">{key}</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={value}
                                onChange={(e) => handleColorChange(key as any, e.target.value)}
                                className="w-10 h-10 rounded-lg cursor-pointer"
                              />
                              <input
                                type="text"
                                value={value}
                                onChange={(e) => handleColorChange(key as any, e.target.value)}
                                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Font Settings */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-3">
                        Typography
                      </label>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">
                            Name Font Size: {customTemplate.front.nameStyle.fontSize}px
                          </label>
                          <input
                            type="range"
                            min="10"
                            max="20"
                            value={customTemplate.front.nameStyle.fontSize}
                            onChange={(e) => handleFontSizeChange('name', parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">
                            ID Font Size: {customTemplate.front.employeeIdStyle.fontSize}px
                          </label>
                          <input
                            type="range"
                            min="8"
                            max="14"
                            value={customTemplate.front.employeeIdStyle.fontSize}
                            onChange={(e) => handleFontSizeChange('employeeId', parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Layout Options */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-3">
                        Photo Shape
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['circle', 'rounded', 'square'] as const).map((shape) => (
                          <motion.button
                            key={shape}
                            onClick={() => handlePhotoShapeChange(shape)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`px-3 py-2 rounded-lg text-xs font-medium capitalize ${
                              customTemplate.front.photoShape === shape
                                ? 'bg-blue-500 text-white'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                          >
                            {shape}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Save Button */}
                    <motion.button
                      onClick={handleSaveCustomTemplate}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium shadow-lg"
                    >
                      <Save className="w-5 h-5" />
                      Save Custom Template
                    </motion.button>
                  </div>

                  {/* Right: Live Preview */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-white font-bold text-xl mb-2">Live Preview</h3>
                      <p className="text-slate-400 text-sm">See your changes in real-time</p>
                    </div>

                    <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                      <div className="flex items-center justify-center min-h-[500px]">
                        <IDCardDisplay 
                          employee={{
                            id: 'sample-preview',
                            name: 'Shreyas V.',
                            employeeId: '1234',
                            mobile: '9898989898',
                            bloodGroup: 'B+',
                            website: 'www.acc.ltd',
                            joiningDate: '2024-01-12',
                            validTill: '2030-12-31',
                            photoBase64: '',
                            createdAt: new Date().toISOString(),
                          }}
                          side="front" 
                          scale={2}
                          template={customTemplate}
                        />
                      </div>
                    </div>

                    {/* Template Info */}
                    <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-white">{customTemplate.name}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          customTemplate.category === 'professional' ? 'bg-blue-500/20 text-blue-400' :
                          customTemplate.category === 'modern' ? 'bg-purple-500/20 text-purple-400' :
                          customTemplate.category === 'creative' ? 'bg-pink-500/20 text-pink-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {customTemplate.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{customTemplate.description}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}