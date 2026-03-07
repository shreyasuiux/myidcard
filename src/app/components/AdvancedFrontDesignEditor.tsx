import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Save, 
  RotateCcw, 
  Layout, 
  Eye, 
  EyeOff,
  ImageIcon, 
  Palette, 
  Move,
  Maximize2,
  Circle,
  Square,
  SquareStack,
  Layers,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import type { Template, TemplateDesign } from '../utils/templateData';
import { IDCardDisplay } from './IDCardDisplay';
import { toast } from 'sonner';

interface AdvancedFrontDesignEditorProps {
  template: Template;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedFront: TemplateDesign) => void;
}

export function AdvancedFrontDesignEditor({ template, isOpen, onClose, onSave }: AdvancedFrontDesignEditorProps) {
  const [frontDesign, setFrontDesign] = useState<TemplateDesign>(template.front);
  const [showLogo, setShowLogo] = useState(true);
  const [showPhoto, setShowPhoto] = useState(true);
  const [activeTab, setActiveTab] = useState<'logo' | 'photo' | 'background' | 'text'>('logo');

  const handleSave = () => {
    onSave(frontDesign);
    toast.success('✨ Front design saved!', {
      description: 'Your custom design will be applied to all ID cards',
    });
    onClose();
  };

  const handleReset = () => {
    setFrontDesign(template.front);
    toast.info('🔄 Reset to current template', {
      description: 'All changes have been discarded',
    });
  };

  const updateDesign = (updates: Partial<TemplateDesign>) => {
    setFrontDesign(prev => ({ ...prev, ...updates }));
  };

  // Sample employee for preview
  const sampleEmployee = {
    id: 'preview',
    name: 'Shreyas Verma',
    employeeId: '1234',
    mobile: '9876543210',
    bloodGroup: 'B+',
    website: 'www.acc.ltd',
    joiningDate: '2024-01-12',
    validTill: '2030-12-31',
    photoBase64: '',
    createdAt: new Date().toISOString(),
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden border border-slate-700/50"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Layout className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Advanced Front Design Editor</h2>
                <p className="text-sm text-blue-100">Customize logo, photo, background, and layout</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          <div className="flex flex-col lg:flex-row h-[calc(95vh-180px)]">
            {/* Control Panel */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Tab Navigation */}
              <div className="flex gap-2 mb-6 bg-slate-800/50 p-1.5 rounded-xl">
                {[
                  { id: 'logo', icon: Sparkles, label: 'Logo' },
                  { id: 'photo', icon: ImageIcon, label: 'Photo' },
                  { id: 'background', icon: Palette, label: 'Background' },
                  { id: 'text', icon: Layers, label: 'Text Style' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Info Banner */}
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-300 font-medium mb-1">💡 Pro Tips</p>
                    <p className="text-xs text-slate-300">
                      • Use position controls (X/Y) to move elements around the card
                      <br />• Toggle visibility to hide logo or photo completely
                      <br />• Changes are live-previewed on the right
                    </p>
                  </div>
                </div>
              </div>

              {/* Tab Content */}
              <div className="space-y-6">
                {/* LOGO TAB */}
                {activeTab === 'logo' && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-5"
                  >
                    {/* Logo Visibility Toggle */}
                    <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-xl p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-white font-semibold mb-1">Logo Visibility</h3>
                          <p className="text-xs text-slate-400">Show or hide the company logo</p>
                        </div>
                        <button
                          onClick={() => {
                            setShowLogo(!showLogo);
                            if (!showLogo) {
                              toast.success('Logo enabled');
                            } else {
                              toast.info('Logo hidden');
                            }
                          }}
                          className={`p-3 rounded-xl transition-all ${
                            showLogo 
                              ? 'bg-green-500 text-white' 
                              : 'bg-slate-700 text-slate-400'
                          }`}
                        >
                          {showLogo ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Logo Position */}
                    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                      <div className="flex items-center gap-2 mb-4">
                        <Move className="w-4 h-4 text-purple-400" />
                        <h3 className="text-white font-semibold">Logo Position</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-slate-300 mb-2">
                            X Position (Left ↔ Right)
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="153"
                            value={frontDesign.logoPosition.x}
                            onChange={(e) => updateDesign({
                              logoPosition: { ...frontDesign.logoPosition, x: Number(e.target.value) }
                            })}
                            className="w-full accent-purple-500"
                          />
                          <div className="flex justify-between text-xs text-slate-500 mt-1">
                            <span>0</span>
                            <span className="text-purple-400 font-medium">{frontDesign.logoPosition.x}px</span>
                            <span>153</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm text-slate-300 mb-2">
                            Y Position (Top ↕ Bottom)
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="244"
                            value={frontDesign.logoPosition.y}
                            onChange={(e) => updateDesign({
                              logoPosition: { ...frontDesign.logoPosition, y: Number(e.target.value) }
                            })}
                            className="w-full accent-purple-500"
                          />
                          <div className="flex justify-between text-xs text-slate-500 mt-1">
                            <span>0</span>
                            <span className="text-purple-400 font-medium">{frontDesign.logoPosition.y}px</span>
                            <span>244</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Logo Size */}
                    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                      <div className="flex items-center gap-2 mb-4">
                        <Maximize2 className="w-4 h-4 text-purple-400" />
                        <h3 className="text-white font-semibold">Logo Size</h3>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="80"
                        value={frontDesign.logoSize}
                        onChange={(e) => updateDesign({ logoSize: Number(e.target.value) })}
                        className="w-full accent-purple-500"
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-2">
                        <span>Small (20px)</span>
                        <span className="text-purple-400 font-medium">{frontDesign.logoSize}px</span>
                        <span>Large (80px)</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* PHOTO TAB */}
                {activeTab === 'photo' && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-5"
                  >
                    {/* Photo Visibility Toggle */}
                    <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-xl p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-white font-semibold mb-1">Photo Visibility</h3>
                          <p className="text-xs text-slate-400">Show or hide employee photo</p>
                        </div>
                        <button
                          onClick={() => {
                            setShowPhoto(!showPhoto);
                            if (!showPhoto) {
                              toast.success('Photo enabled');
                            } else {
                              toast.info('Photo hidden');
                            }
                          }}
                          className={`p-3 rounded-xl transition-all ${
                            showPhoto 
                              ? 'bg-green-500 text-white' 
                              : 'bg-slate-700 text-slate-400'
                          }`}
                        >
                          {showPhoto ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Photo Shape */}
                    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                      <h3 className="text-white font-semibold mb-4">Photo Shape</h3>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: 'circle', icon: Circle, label: 'Circle' },
                          { value: 'rounded', icon: SquareStack, label: 'Rounded' },
                          { value: 'square', icon: Square, label: 'Square' },
                        ].map(shape => (
                          <button
                            key={shape.value}
                            onClick={() => updateDesign({ photoShape: shape.value as any })}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                              frontDesign.photoShape === shape.value
                                ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            <shape.icon className="w-6 h-6" />
                            <span className="text-xs font-medium">{shape.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Photo Position */}
                    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                      <div className="flex items-center gap-2 mb-4">
                        <Move className="w-4 h-4 text-purple-400" />
                        <h3 className="text-white font-semibold">Photo Position</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-slate-300 mb-2">X Position</label>
                          <input
                            type="range"
                            min="0"
                            max="153"
                            value={frontDesign.photoPosition.x}
                            onChange={(e) => updateDesign({
                              photoPosition: { ...frontDesign.photoPosition, x: Number(e.target.value) }
                            })}
                            className="w-full accent-purple-500"
                          />
                          <span className="text-xs text-purple-400 font-medium">{frontDesign.photoPosition.x}px</span>
                        </div>
                        <div>
                          <label className="block text-sm text-slate-300 mb-2">Y Position</label>
                          <input
                            type="range"
                            min="0"
                            max="244"
                            value={frontDesign.photoPosition.y}
                            onChange={(e) => updateDesign({
                              photoPosition: { ...frontDesign.photoPosition, y: Number(e.target.value) }
                            })}
                            className="w-full accent-purple-500"
                          />
                          <span className="text-xs text-purple-400 font-medium">{frontDesign.photoPosition.y}px</span>
                        </div>
                      </div>
                    </div>

                    {/* Photo Size */}
                    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                      <div className="flex items-center gap-2 mb-4">
                        <Maximize2 className="w-4 h-4 text-purple-400" />
                        <h3 className="text-white font-semibold">Photo Size</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-slate-300 mb-2">Width</label>
                          <input
                            type="range"
                            min="30"
                            max="100"
                            value={frontDesign.photoSize.width}
                            onChange={(e) => updateDesign({
                              photoSize: { ...frontDesign.photoSize, width: Number(e.target.value) }
                            })}
                            className="w-full accent-purple-500"
                          />
                          <span className="text-xs text-purple-400 font-medium">{frontDesign.photoSize.width}px</span>
                        </div>
                        <div>
                          <label className="block text-sm text-slate-300 mb-2">Height</label>
                          <input
                            type="range"
                            min="40"
                            max="120"
                            value={frontDesign.photoSize.height}
                            onChange={(e) => updateDesign({
                              photoSize: { ...frontDesign.photoSize, height: Number(e.target.value) }
                            })}
                            className="w-full accent-purple-500"
                          />
                          <span className="text-xs text-purple-400 font-medium">{frontDesign.photoSize.height}px</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* BACKGROUND TAB */}
                {activeTab === 'background' && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-5"
                  >
                    {/* Background Color */}
                    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                      <h3 className="text-white font-semibold mb-4">Background Color</h3>
                      <div className="flex gap-3 items-center mb-4">
                        <input
                          type="color"
                          value={frontDesign.backgroundColor}
                          onChange={(e) => updateDesign({ backgroundColor: e.target.value })}
                          className="w-16 h-16 rounded-xl cursor-pointer border-2 border-slate-600"
                        />
                        <div className="flex-1">
                          <input
                            type="text"
                            value={frontDesign.backgroundColor}
                            onChange={(e) => updateDesign({ backgroundColor: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white font-mono text-sm"
                            placeholder="#FFFFFF"
                          />
                          <p className="text-xs text-slate-400 mt-1">Enter hex color code</p>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateDesign({ backgroundColor: '#FFFFFF' })}
                          className="flex-1 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-all"
                        >
                          Reset to White
                        </button>
                        <button
                          onClick={() => updateDesign({ backgroundColor: 'transparent' })}
                          className="flex-1 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg text-xs transition-all font-medium"
                        >
                          Remove Background
                        </button>
                      </div>
                      
                      {/* Quick Color Presets */}
                      <div className="mt-4">
                        <p className="text-xs text-slate-400 mb-2">Quick Presets:</p>
                        <div className="flex flex-wrap gap-2">
                          {['#FFFFFF', '#F8F9FA', '#E5E7EB', '#DBEAFE', '#FEF3C7', '#D1FAE5'].map(color => (
                            <button
                              key={color}
                              onClick={() => updateDesign({ backgroundColor: color })}
                              className="w-10 h-10 rounded-lg border-2 border-slate-600 hover:border-purple-500 transition-all"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Background Pattern */}
                    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                      <h3 className="text-white font-semibold mb-4">Background Pattern</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 'none', label: 'None' },
                          { value: 'gradient', label: 'Gradient' },
                          { value: 'dots', label: 'Dots' },
                          { value: 'lines', label: 'Lines' },
                        ].map(pattern => (
                          <button
                            key={pattern.value}
                            onClick={() => updateDesign({ backgroundPattern: pattern.value as any })}
                            className={`p-4 rounded-xl text-sm font-medium transition-all ${
                              frontDesign.backgroundPattern === pattern.value
                                ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {pattern.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TEXT STYLE TAB */}
                {activeTab === 'text' && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-5"
                  >
                    {/* Name Style */}
                    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                      <h3 className="text-white font-semibold mb-4">Employee Name Style</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-slate-300 mb-2">Font Size</label>
                          <input
                            type="range"
                            min="12"
                            max="24"
                            value={frontDesign.nameStyle.fontSize}
                            onChange={(e) => updateDesign({
                              nameStyle: { ...frontDesign.nameStyle, fontSize: Number(e.target.value) }
                            })}
                            className="w-full accent-purple-500"
                          />
                          <span className="text-xs text-purple-400 font-medium">{frontDesign.nameStyle.fontSize}px</span>
                        </div>

                        <div>
                          <label className="block text-sm text-slate-300 mb-2">Font Weight</label>
                          <select
                            value={frontDesign.nameStyle.fontWeight}
                            onChange={(e) => updateDesign({
                              nameStyle: { ...frontDesign.nameStyle, fontWeight: e.target.value }
                            })}
                            className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white"
                          >
                            <option value="400">Regular (400)</option>
                            <option value="500">Medium (500)</option>
                            <option value="700">Bold (700)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm text-slate-300 mb-2">Text Color</label>
                          <div className="flex gap-3 items-center">
                            <input
                              type="color"
                              value={frontDesign.nameStyle.color}
                              onChange={(e) => updateDesign({
                                nameStyle: { ...frontDesign.nameStyle, color: e.target.value }
                              })}
                              className="w-12 h-12 rounded-lg cursor-pointer border-2 border-slate-600"
                            />
                            <input
                              type="text"
                              value={frontDesign.nameStyle.color}
                              onChange={(e) => updateDesign({
                                nameStyle: { ...frontDesign.nameStyle, color: e.target.value }
                              })}
                              className="flex-1 px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white font-mono text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Employee ID Style */}
                    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                      <h3 className="text-white font-semibold mb-4">Employee ID Style</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-slate-300 mb-2">Font Size</label>
                          <input
                            type="range"
                            min="6"
                            max="14"
                            value={frontDesign.employeeIdStyle.fontSize}
                            onChange={(e) => updateDesign({
                              employeeIdStyle: { ...frontDesign.employeeIdStyle, fontSize: Number(e.target.value) }
                            })}
                            className="w-full accent-purple-500"
                          />
                          <span className="text-xs text-purple-400 font-medium">{frontDesign.employeeIdStyle.fontSize}px</span>
                        </div>

                        <div>
                          <label className="block text-sm text-slate-300 mb-2">Text Color</label>
                          <div className="flex gap-3 items-center">
                            <input
                              type="color"
                              value={frontDesign.employeeIdStyle.color}
                              onChange={(e) => updateDesign({
                                employeeIdStyle: { ...frontDesign.employeeIdStyle, color: e.target.value }
                              })}
                              className="w-12 h-12 rounded-lg cursor-pointer border-2 border-slate-600"
                            />
                            <input
                              type="text"
                              value={frontDesign.employeeIdStyle.color}
                              onChange={(e) => updateDesign({
                                employeeIdStyle: { ...frontDesign.employeeIdStyle, color: e.target.value }
                              })}
                              className="flex-1 px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white font-mono text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Live Preview Section */}
            <div className="lg:w-[420px] bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-t lg:border-t-0 lg:border-l border-slate-700/50 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-purple-400" />
                  Live Preview
                </h3>
                <div className="px-3 py-1.5 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30">
                  ⚡ Real-time
                </div>
              </div>

              <div className="bg-slate-900 rounded-2xl p-6 border border-slate-700/50">
                <p className="text-xs text-slate-400 mb-6 text-center">
                  Changes are reflected instantly
                </p>
                <div className="flex justify-center">
                  <div className="transform scale-[1.4]">
                    <IDCardDisplay
                      employee={sampleEmployee}
                      side="front"
                      scale={1}
                      template={{ ...template, front: frontDesign }}
                    />
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <p className="text-xs text-slate-400 mb-1">Logo Size</p>
                  <p className="text-lg font-bold text-white">{frontDesign.logoSize}px</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <p className="text-xs text-slate-400 mb-1">Photo Shape</p>
                  <p className="text-lg font-bold text-white capitalize">{frontDesign.photoShape}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-slate-900/80 border-t border-slate-700/50 p-5 flex items-center justify-between backdrop-blur-sm">
            <motion.button
              onClick={handleReset}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Changes
            </motion.button>
            
            <div className="flex gap-3">
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white rounded-xl font-medium transition-all"
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={handleSave}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white rounded-xl font-medium shadow-lg transition-all"
              >
                <Save className="w-4 h-4" />
                Save Design
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}