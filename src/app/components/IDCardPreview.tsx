import { useState, useEffect } from 'react';
import { Sparkles, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { templates, type Template, type FrontSideText } from '../utils/templateData';
import { ImageCropModal } from './ImageCropModal';
import { TemplateCardRenderer } from './TemplateCardRenderer';
import type { EmployeeRecord } from '../utils/employeeStorage';

interface IDCardPreviewProps {
  employeeData: {
    name: string;
    employeeId: string;
    mobile: string;
    bloodGroup: string;
    website: string;
    joiningDate: string;
    validTill: string;
    photo: File | null;
  };
  photoBase64?: string;
  template?: Template;
  customFrontText?: FrontSideText;
  onPhotoUpdate?: (photoBase64: string) => void;
}

export function IDCardPreview({
  employeeData,
  photoBase64,
  template,
  customFrontText,
  onPhotoUpdate,
}: IDCardPreviewProps) {
  const [zoom, setZoom] = useState<100 | 200>(100);
  const [photoUrl, setPhotoUrl] = useState<string>(photoBase64 || '');
  const [activeTab, setActiveTab] = useState<'front' | 'back'>('front');
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [isPhotoHovered, setIsPhotoHovered] = useState(false);

  const activeTemplate = template || templates[0];

  // Build a virtual EmployeeRecord so TemplateCardRenderer can consume it
  const employeeRecord: EmployeeRecord = {
    id: 'preview',
    name: employeeData.name,
    employeeId: employeeData.employeeId,
    mobile: employeeData.mobile,
    bloodGroup: employeeData.bloodGroup,
    website: employeeData.website,
    joiningDate: employeeData.joiningDate,
    validTill: employeeData.validTill,
    photoBase64: photoUrl,
    createdAt: '',
  };

  // Apply custom front text to template if provided
  const effectiveTemplate: Template = customFrontText
    ? { ...activeTemplate, frontText: customFrontText }
    : activeTemplate;

  // Sync photoBase64 prop → local state
  useEffect(() => {
    if (photoBase64) setPhotoUrl(photoBase64);
  }, [photoBase64]);

  // Convert File → data URL (legacy path)
  useEffect(() => {
    if (employeeData.photo && !photoBase64 && employeeData.photo instanceof Blob) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoUrl(reader.result as string);
      reader.readAsDataURL(employeeData.photo);
    }
  }, [employeeData.photo, photoBase64]);

  const isEmpty = !employeeData.name && !employeeData.employeeId;
  const scale = zoom === 200 ? 2 : 1;

  // Photo edit handlers
  const handleEditPhoto = () => {
    if (photoUrl) setIsEditingPhoto(true);
  };
  const handlePhotoUpdate = (croppedPhoto: string) => {
    setPhotoUrl(croppedPhoto);
    if (onPhotoUpdate) onPhotoUpdate(croppedPhoto);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4, duration: 0.6 }}
      className="sticky top-8"
    >
      {/* ── Header with zoom buttons ── */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[13px] font-medium text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          Live Preview
        </p>
        <div className="flex items-center gap-2">
          {([100, 200] as const).map((z) => (
            <motion.button
              key={z}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setZoom(z)}
              className={`px-3 py-1.5 text-[12px] rounded-lg transition-all ${
                zoom === z
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/50'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
              }`}
            >
              {z}%
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Front / Back tab switcher ── */}
      <div className="mb-4 flex gap-2 bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/50 backdrop-blur-sm">
        {(['front', 'back'] as const).map((tab) => (
          <motion.button
            key={tab}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2.5 text-[12px] font-medium rounded-lg transition-all ${
              activeTab === tab
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            {tab === 'front' ? 'Front Side' : 'Back Side'}
          </motion.button>
        ))}
      </div>

      {/* ── Card container ── */}
      <motion.div
        className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-8 border border-slate-700/50 flex items-center justify-center overflow-auto relative"
        animate={{
          boxShadow: [
            '0 0 20px rgba(59, 130, 246, 0.2)',
            '0 0 40px rgba(168, 85, 247, 0.3)',
            '0 0 20px rgba(59, 130, 246, 0.2)',
          ],
        }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-blue-400 rounded-full"
              animate={{
                x: [Math.random() * 400, Math.random() * 400],
                y: [Math.random() * 400, Math.random() * 400],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: i * 0.5,
              }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'back' ? (
            /* ── Back side ── */
            <motion.div
              key="back"
              initial={{ opacity: 0, rotateY: -90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: 90 }}
              transition={{ duration: 0.4 }}
              className="relative z-10 shadow-2xl"
            >
              <TemplateCardRenderer
                employee={employeeRecord}
                side="back"
                template={effectiveTemplate}
                scale={scale}
              />
            </motion.div>
          ) : (
            /* ── Front side ── */
            <motion.div
              key="front"
              initial={{ opacity: 0, rotateY: -90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: 90 }}
              transition={{ duration: 0.4 }}
              layout
              className="relative z-10 shadow-2xl"
            >
              {isEmpty ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white flex items-center justify-center p-4"
                  style={{
                    width: `${153 * scale}px`,
                    height: `${244 * scale}px`,
                  }}
                >
                  <div className="text-center">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Sparkles
                        className="text-slate-300 mx-auto mb-2"
                        style={{
                          width: `${32 * scale}px`,
                          height: `${32 * scale}px`,
                        }}
                      />
                    </motion.div>
                    <p
                      className="text-slate-400 text-center"
                      style={{ fontSize: `${10 * scale}px` }}
                    >
                      Fill in employee details to see preview
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="filled"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative"
                >
                  {/* The actual card rendered via the single renderer */}
                  <TemplateCardRenderer
                    employee={employeeRecord}
                    side="front"
                    template={effectiveTemplate}
                    photoUrl={photoUrl}
                    scale={scale}
                  />

                  {/* Photo hover overlay — positioned above the card */}
                  {photoUrl && (
                    <div
                      className="absolute cursor-pointer"
                      style={{
                        left: `${(effectiveTemplate.front.photoPosition.x) * scale}px`,
                        top: `${(effectiveTemplate.front.photoPosition.y) * scale}px`,
                        width: `${effectiveTemplate.front.photoSize.width * scale}px`,
                        height: `${effectiveTemplate.front.photoSize.height * scale}px`,
                        zIndex: 10,
                      }}
                      onMouseEnter={() => setIsPhotoHovered(true)}
                      onMouseLeave={() => setIsPhotoHovered(false)}
                      onClick={handleEditPhoto}
                    >
                      <AnimatePresence>
                        {isPhotoHovered && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded"
                          >
                            <motion.div
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0.8 }}
                              className="flex flex-col items-center gap-1"
                            >
                              <Pencil
                                className="text-white"
                                style={{
                                  width: `${16 * scale}px`,
                                  height: `${16 * scale}px`,
                                }}
                              />
                              <span
                                className="text-white font-medium"
                                style={{ fontSize: `${6 * scale}px` }}
                              >
                                Edit Photo
                              </span>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Image Crop Modal */}
      {photoUrl && (
        <ImageCropModal
          isOpen={isEditingPhoto}
          onClose={() => setIsEditingPhoto(false)}
          imageUrl={photoUrl}
          onApply={handlePhotoUpdate}
          employeeData={{
            name: employeeData.name,
            employeeId: employeeData.employeeId,
          }}
          template={activeTemplate}
        />
      )}
    </motion.div>
  );
}
