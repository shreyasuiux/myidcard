/**
 * ENGINE PLAYGROUND — Interactive demo of the Template Rendering Engine
 *
 * Accessible at /engine-playground
 *
 * Shows:
 * 1. Legacy template converted via bridge → rendered by engine
 * 2. Interactive editor with drag/resize/select/keyboard
 * 3. Side-by-side comparison: old renderer vs new engine
 * 4. Element inspector with live property editing
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  Play,
  SplitSquareHorizontal,
  Wand2,
  Layers,
  FileJson,
  Code,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { templates } from '../utils/templateData';
import type { EmployeeRecord } from '../utils/employeeStorage';

// Engine imports
import { legacyToDocument, employeeToDataContext } from '../engine/utils/templateBridge';
import { TemplateEditorCanvas } from '../engine/TemplateEditorCanvas';
import { EngineCardRenderer } from '../engine/EngineCardRenderer';

// Legacy renderer for comparison
import { TemplateCardRenderer } from '../components/TemplateCardRenderer';

// Ensure transforms are loaded
import '../engine/transforms';

// ── Sample Employee ──
const sampleEmployee: EmployeeRecord = {
  id: 'demo-001',
  name: 'Shreyas Verma',
  employeeId: '1847',
  mobile: '9876543210',
  bloodGroup: 'B+',
  website: 'www.acc.ltd',
  joiningDate: '12/01/2024',
  validTill: '31/12/2030',
  photoBase64: '',
  createdAt: new Date().toISOString(),
};

export function EnginePlayground() {
  const navigate = useNavigate();
  const [selectedTemplateIdx, setSelectedTemplateIdx] = useState(0);
  const [selectedSide, setSelectedSide] = useState<'front' | 'back'>('front');
  const [activeTab, setActiveTab] = useState<'editor' | 'compare' | 'json'>('editor');
  const [jsonExpanded, setJsonExpanded] = useState(false);

  const template = templates[selectedTemplateIdx];

  // Convert legacy → engine document
  const engineDoc = useMemo(
    () => legacyToDocument(template, selectedSide),
    [template, selectedSide],
  );

  const dataCtx = useMemo(
    () => employeeToDataContext(sampleEmployee),
    [],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* ── Header ── */}
      <div className="border-b border-slate-800">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
              <Play className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-white text-sm" style={{ fontWeight: 600 }}>
                Template Engine Playground
              </h1>
              <p className="text-slate-500 text-[10px]">
                v1.0 — Element-Based Dynamic Rendering Architecture
              </p>
            </div>
          </div>

          {/* Template Selector */}
          <div className="ml-auto flex items-center gap-3">
            <select
              value={selectedTemplateIdx}
              onChange={(e) => setSelectedTemplateIdx(Number(e.target.value))}
              className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
            >
              {templates.map((t, i) => (
                <option key={t.id} value={i}>{t.name}</option>
              ))}
            </select>

            <div className="flex rounded-lg border border-slate-700 overflow-hidden">
              <button
                onClick={() => setSelectedSide('front')}
                className={`px-3 py-1.5 text-xs transition-colors ${
                  selectedSide === 'front'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Front
              </button>
              <button
                onClick={() => setSelectedSide('back')}
                className={`px-3 py-1.5 text-xs transition-colors ${
                  selectedSide === 'back'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="border-b border-slate-800/50">
        <div className="max-w-[1400px] mx-auto px-4 flex items-center gap-1 pt-2">
          <TabButton
            icon={<Wand2 className="w-3.5 h-3.5" />}
            label="Interactive Editor"
            active={activeTab === 'editor'}
            onClick={() => setActiveTab('editor')}
          />
          <TabButton
            icon={<SplitSquareHorizontal className="w-3.5 h-3.5" />}
            label="Compare Renderers"
            active={activeTab === 'compare'}
            onClick={() => setActiveTab('compare')}
          />
          <TabButton
            icon={<FileJson className="w-3.5 h-3.5" />}
            label="Document Inspector"
            active={activeTab === 'json'}
            onClick={() => setActiveTab('json')}
          />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-[1400px] mx-auto p-4">
        {activeTab === 'editor' && (
          <div>
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-blue-400 text-xs">
                <span style={{ fontWeight: 600 }}>Interactive Mode:</span> Click to select elements.
                Arrow keys to move (Shift = 10px). Delete to remove. Ctrl+D to duplicate.
                Ctrl+Z/Y for undo/redo. Edit properties in the panel below.
              </p>
            </div>
            <TemplateEditorCanvas
              initialDocument={engineDoc}
              data={dataCtx}
            />
          </div>
        )}

        {activeTab === 'compare' && (
          <div>
            <div className="mb-4 p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl">
              <p className="text-violet-400 text-xs">
                <span style={{ fontWeight: 600 }}>Visual Parity Check:</span> The left card uses the
                legacy TemplateCardRenderer. The right card uses the new engine with the bridge converter.
                They should be pixel-identical.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8">
              {/* Legacy */}
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Code className="w-4 h-4 text-orange-400" />
                  <span style={{ fontWeight: 600 }}>Legacy: TemplateCardRenderer</span>
                </div>
                <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700/30">
                  <div style={{ transform: 'scale(2.5)', transformOrigin: 'top center' }}>
                    <TemplateCardRenderer
                      employee={sampleEmployee}
                      side={selectedSide}
                      template={template}
                      photoUrl=""
                      scale={1}
                    />
                  </div>
                  <div style={{ height: `${244 * 1.5}px` }} />
                </div>
                <div className="text-[10px] text-slate-500">
                  Static JSX • Reads TemplateDesign directly • Single monolithic component
                </div>
              </div>

              {/* Engine */}
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span style={{ fontWeight: 600 }}>Engine: TemplateRendererStandalone</span>
                </div>
                <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700/30">
                  <div style={{ transform: 'scale(2.5)', transformOrigin: 'top center' }}>
                    <EngineCardRenderer
                      employee={sampleEmployee}
                      side={selectedSide}
                      template={template}
                      photoUrl=""
                      scale={1}
                    />
                  </div>
                  <div style={{ height: `${244 * 1.5}px` }} />
                </div>
                <div className="text-[10px] text-slate-500">
                  Element-based • Registry pattern • Bridge converter • Per-element React.memo
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'json' && (
          <div>
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <p className="text-emerald-400 text-xs">
                <span style={{ fontWeight: 600 }}>Document Inspector:</span> This is the TemplateDocument
                produced by the bridge converter. The rendering engine reads this JSON to render every element.
                No hardcoded layout exists anywhere.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <StatCard label="Schema Version" value={`v${engineDoc.schemaVersion}`} />
              <StatCard label="Elements" value={String(engineDoc.elements.length)} />
              <StatCard label="Layers" value={String(engineDoc.layers.length)} />
              <StatCard label="Canvas" value={`${engineDoc.canvas.width}×${engineDoc.canvas.height}px`} />
            </div>

            {/* Element List */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/30 overflow-hidden mb-4">
              <div className="px-4 py-2 border-b border-slate-700/50 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm text-white" style={{ fontWeight: 600 }}>Elements</h3>
              </div>
              <div className="divide-y divide-slate-700/30">
                {engineDoc.elements.map(el => (
                  <div key={el.id} className="px-4 py-2 flex items-center gap-3 text-xs hover:bg-slate-700/20">
                    <span className="px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded text-[10px] font-mono min-w-[60px] text-center">
                      {el.type}
                    </span>
                    <span className="text-slate-300 flex-1">{el.name}</span>
                    <span className="text-slate-500 font-mono">
                      ({Math.round(el.position.x)}, {Math.round(el.position.y)})
                    </span>
                    <span className="text-slate-500 font-mono">
                      {Math.round(el.dimensions.width)}×{Math.round(el.dimensions.height)}
                    </span>
                    <span className="text-slate-600 font-mono text-[10px]">
                      z:{el.zIndex}
                    </span>
                    {el.bindings && Object.keys(el.bindings).length > 0 && (
                      <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px]">
                        bound
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Full JSON */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/30 overflow-hidden">
              <button
                onClick={() => setJsonExpanded(!jsonExpanded)}
                className="w-full px-4 py-2 flex items-center gap-2 text-sm text-slate-300 hover:bg-slate-700/20"
              >
                {jsonExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <FileJson className="w-4 h-4 text-yellow-400" />
                <span style={{ fontWeight: 600 }}>Raw TemplateDocument JSON</span>
              </button>
              {jsonExpanded && (
                <pre className="px-4 py-3 text-[11px] text-emerald-300 font-mono overflow-auto max-h-[500px] border-t border-slate-700/50">
                  {JSON.stringify(engineDoc, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ──

function TabButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-t-lg transition-colors border-b-2 ${
        active
          ? 'text-white border-blue-400 bg-slate-800/50'
          : 'text-slate-500 border-transparent hover:text-slate-300'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/30">
      <p className="text-[10px] text-slate-500 mb-1">{label}</p>
      <p className="text-lg text-white" style={{ fontWeight: 700 }}>{value}</p>
    </div>
  );
}