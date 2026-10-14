import React, { useState } from 'react';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Server,
  ShieldCheck,
  CheckCircle2,
  FolderPlus,
  Layers,
  FileCode,
  Flame,
  Boxes,
  HelpCircle,
} from 'lucide-react';
import type { PreFlightInterview, PreFlightRecommendation, ProjectRecord } from '../../shared/types.ts';
import { api } from '../lib/api.ts';

interface PreFlightWizardProps {
  onFlightLaunched: (project: ProjectRecord) => void;
  onCancel: () => void;
}

export const PreFlightWizard: React.FC<PreFlightWizardProps> = ({ onFlightLaunched, onCancel }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [projectName, setProjectName] = useState('');
  const [projectMission, setProjectMission] = useState('');
  const [targetAudience, setTargetAudience] = useState('Developers & Teams');
  const [scaleAndTraffic, setScaleAndTraffic] = useState<PreFlightInterview['scaleAndTraffic']>('production-standard');
  const [containerPreference, setContainerPreference] = useState<PreFlightInterview['containerPreference']>('undecided');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['TypeScript']);
  const [securityTier, setSecurityTier] = useState<PreFlightInterview['securityTier']>('strict');
  const [testingStrategy, setTestingStrategy] = useState<PreFlightInterview['testingStrategy']>('tdd-strict');
  const [maxLinesPerFile, setMaxLinesPerFile] = useState(500);

  // Target folder for Step 4
  const [targetFolder, setTargetFolder] = useState('');

  // AI & Recommendation State
  const [recommendation, setRecommendation] = useState<PreFlightRecommendation | null>(null);
  const [aiStreamText, setAiStreamText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isScaffolding, setIsScaffolding] = useState(false);
  const [scaffoldSuccess, setScaffoldSuccess] = useState<string[] | null>(null);

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setAiStreamText('');

    const interview: PreFlightInterview = {
      projectName: projectName.trim() || 'New Flight Project',
      targetFolder: targetFolder.trim(),
      projectMission: projectMission.trim(),
      targetAudience,
      scaleAndTraffic,
      containerPreference,
      preferredLanguages: selectedLanguages,
      securityTier,
      testingStrategy,
      maxLinesPerFile,
    };

    try {
      // 1. Get structured recommendation
      const rec = await api.analyzePreFlight(interview);
      setRecommendation(rec);

      // 2. Stream AI prompt booster
      await api.streamPromptImprovement(
        projectMission,
        {
          domain: targetAudience,
          scale: scaleAndTraffic,
          container: containerPreference,
        },
        (chunk) => setAiStreamText((prev) => prev + chunk),
        () => setIsAnalyzing(false),
        (err) => {
          console.warn('AI Stream warning:', err);
          setIsAnalyzing(false);
        }
      );
    } catch (err: any) {
      alert(`Analysis failed: ${err.message}`);
      setIsAnalyzing(false);
    }
  };

  const handleEmitAndRegister = async () => {
    if (!targetFolder.trim()) {
      alert('Please specify the absolute local target directory path.');
      return;
    }

    if (!recommendation) return;

    setIsScaffolding(true);
    try {
      // 1. Emit clean governance files
      const emitRes = await api.emitGovernance(targetFolder.trim(), [
        { filename: 'AGENT.md', content: recommendation.generatedFiles.agentMd },
        { filename: 'ARCHITECTURE.md', content: recommendation.generatedFiles.architectureMd },
        { filename: 'FLIGHT_RULES.md', content: recommendation.generatedFiles.flightRulesMd },
      ]);

      setScaffoldSuccess(emitRes.writtenFiles || []);

      // 2. Scan the directory to initialize telemetry
      const telemetry = await api.scanProject(targetFolder.trim());

      // 3. Register into Flight Control
      const created = await api.createProject({
        name: projectName.trim() || 'Project',
        path: targetFolder.trim(),
        status: 'cleared-for-takeoff',
        interview: {
          projectName,
          targetFolder,
          projectMission,
          targetAudience,
          scaleAndTraffic,
          containerPreference,
          preferredLanguages: selectedLanguages,
          securityTier,
          testingStrategy,
          maxLinesPerFile,
        },
        recommendation,
        telemetry,
      });

      setTimeout(() => {
        onFlightLaunched(created);
      }, 1000);
    } catch (err: any) {
      alert(`Scaffolding failed: ${err.message}`);
    } finally {
      setIsScaffolding(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Stepper Indicator */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
        {[
          { num: 1, title: 'Mission & Vision' },
          { num: 2, title: 'Architecture Gates' },
          { num: 3, title: 'AI Pre-Flight Review' },
          { num: 4, title: 'Launchpad Scaffolding' },
        ].map((s) => (
          <div
            key={s.num}
            className={`flex items-center space-x-2 text-xs font-mono ${
              step === s.num
                ? 'text-sky-400 font-bold'
                : step > s.num
                ? 'text-emerald-400'
                : 'text-slate-500'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                step === s.num
                  ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                  : step > s.num
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              {step > s.num ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.num}
            </div>
            <span className="hidden sm:inline">{s.title}</span>
          </div>
        ))}
      </div>

      {/* STEP 1: Mission & Objectives */}
      {step === 1 && (
        <div className="space-y-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8">
          <div>
            <h2 className="text-xl font-bold text-white font-mono flex items-center space-x-2">
              <Compass className="w-5 h-5 text-sky-400" />
              <span>Step 1: Mission Objectives & Domain</span>
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              Flight Control needs a 360-degree view of your project before writing code.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono">
                Project Name:
              </label>
              <input
                type="text"
                placeholder="e.g. Acme Analytics Engine"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono">
                What are you building? (Your Vision & Main Problems to Solve):
              </label>
              <textarea
                rows={4}
                placeholder="Describe your vision, core user journeys, key features, and any performance expectations..."
                value={projectMission}
                onChange={(e) => setProjectMission(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 font-sans"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono">
                  Primary Target Users:
                </label>
                <input
                  type="text"
                  placeholder="e.g. High-frequency traders, internal ops, consumers"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono">
                  Operational Scale Tier:
                </label>
                <select
                  value={scaleAndTraffic}
                  onChange={(e: any) => setScaleAndTraffic(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-sky-500"
                >
                  <option value="prototype">Fast Prototype (Speed & simplicity over complexity)</option>
                  <option value="internal-tool">Internal Tool (Low concurrency, reliable)</option>
                  <option value="production-standard">Production Standard (Robust, scalable, clean)</option>
                  <option value="high-throughput-enterprise">High-Throughput Enterprise (Strict SLAs, high concurrency)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-800">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs"
            >
              Cancel
            </button>
            <button
              disabled={!projectMission.trim()}
              onClick={() => setStep(2)}
              className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-medium text-xs shadow-md shadow-sky-600/20"
            >
              <span>Continue to Architecture Gates</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Architecture & Constraints */}
      {step === 2 && (
        <div className="space-y-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8">
          <div>
            <h2 className="text-xl font-bold text-white font-mono flex items-center space-x-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>Step 2: Architecture & Safety Gates</span>
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              Select containerization strategies, testing mandates, and modular limits.
            </p>
          </div>

          <div className="space-y-5">
            {/* Docker Preference */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 font-mono">
                Containerization Preference:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'undecided', label: 'AI Advisor Choice', desc: 'Let Flight Control recommend' },
                  { id: 'bare-metal', label: 'Bare Metal (No Docker)', desc: 'Instant local hot reload' },
                  { id: 'docker', label: 'Docker Single', desc: 'Multi-stage Dockerfile' },
                  { id: 'docker-compose', label: 'Docker Compose', desc: 'App + DB stack orchestration' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setContainerPreference(opt.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      containerPreference === opt.id
                        ? 'border-sky-500 bg-sky-500/10 text-white shadow-sm'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold font-mono">{opt.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 font-mono">
                Preferred Languages & Ecosystems:
              </label>
              <div className="flex flex-wrap gap-2">
                {['TypeScript', 'Python', 'Go', 'Rust', 'Java', 'C#', 'SQL'].map((lang) => {
                  const active = selectedLanguages.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                        active
                          ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/20'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 500-Line Code Gate */}
            <div className="p-4 rounded-xl border border-sky-500/30 bg-sky-950/20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-sky-300 font-mono flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-sky-400" />
                  <span>Modular Code Limit Gate (Max Lines Per File)</span>
                </span>
                <span className="text-xs font-mono text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/30">
                  {maxLinesPerFile} lines ceiling
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2">
                Files exceeding this ceiling are flagged on the radar as structural hazards, keeping AI prompt contexts lean and preventing sprawling monolithic files.
              </p>
              <input
                type="range"
                min="200"
                max="1000"
                step="50"
                value={maxLinesPerFile}
                onChange={(e) => setMaxLinesPerFile(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>

            {/* Testing & Security Tiers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono">
                  Testing Protocol:
                </label>
                <select
                  value={testingStrategy}
                  onChange={(e: any) => setTestingStrategy(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-sky-500"
                >
                  <option value="tdd-strict">TDD Strict (Failing test required before code)</option>
                  <option value="balanced">Balanced (Unit & Integration tests alongside features)</option>
                  <option value="fast-prototype">Prototype Fast (Smoke tests on critical paths)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono">
                  Security Hardening Tier:
                </label>
                <select
                  value={securityTier}
                  onChange={(e: any) => setSecurityTier(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-sky-500"
                >
                  <option value="strict">Strict (Least privilege, input schemas, zero hardcoded secrets)</option>
                  <option value="regulated">Regulated (Audit logs, immutable events, TLS enforced)</option>
                  <option value="standard">Standard (Basic sanitization & .env protection)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-800">
            <button
              onClick={() => setStep(1)}
              className="flex items-center space-x-1 px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              onClick={() => {
                setStep(3);
                handleRunAnalysis();
              }}
              className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs shadow-md shadow-sky-600/20"
            >
              <span>Run Pre-Flight Analysis</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: AI Pre-Flight Review & Decision Matrix */}
      {step === 3 && (
        <div className="space-y-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white font-mono flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-sky-400" />
                <span>Step 3: Pre-Flight Review & Decision Matrix</span>
              </h2>
              {isAnalyzing && (
                <span className="text-xs text-sky-400 font-mono animate-pulse">
                  Analyzing architecture trade-offs...
                </span>
              )}
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Flight Control has synthesized your requirements and evaluated containerization tradeoffs.
            </p>
          </div>

          {/* Docker Evaluation Card */}
          {recommendation?.dockerEvaluation && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Server className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-bold text-white font-mono uppercase">
                    Docker Decision: {recommendation.dockerEvaluation.recommendation}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-300">
                {recommendation.dockerEvaluation.reasoning}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-800/80">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-emerald-400 font-bold block">PROS:</span>
                  {recommendation.dockerEvaluation.pros.map((p, i) => (
                    <div key={i} className="text-slate-400 text-[11px] flex items-start space-x-1">
                      <span className="text-emerald-500 font-bold">+</span>
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-amber-400 font-bold block">TRADE-OFFS & CONS:</span>
                  {recommendation.dockerEvaluation.cons.map((c, i) => (
                    <div key={i} className="text-slate-400 text-[11px] flex items-start space-x-1">
                      <span className="text-amber-500 font-bold">-</span>
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Recommended Stack */}
          {recommendation && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block font-mono uppercase">Frontend</span>
                <span className="font-bold text-white text-xs">{recommendation.recommendedStack.frontend}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block font-mono uppercase">Backend</span>
                <span className="font-bold text-white text-xs">{recommendation.recommendedStack.backend}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block font-mono uppercase">Database</span>
                <span className="font-bold text-white text-xs">{recommendation.recommendedStack.database}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block font-mono uppercase">Container</span>
                <span className="font-bold text-white text-xs uppercase">{recommendation.recommendedStack.containerization}</span>
              </div>
            </div>
          )}

          {/* Streaming Reasoning & Hardened Prompt */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs max-h-72 overflow-y-auto">
            <div className="flex items-center justify-between text-slate-500 pb-2 mb-2 border-b border-slate-800">
              <span>FLIGHT CONTROLLER STREAM TELEMETRY</span>
              {isAnalyzing && <span className="animate-spin text-sky-400">⚡</span>}
            </div>
            <pre className="whitespace-pre-wrap text-slate-300 font-mono text-[11px] leading-relaxed">
              {aiStreamText || 'Preparing pre-flight mission specs...'}
            </pre>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-800">
            <button
              onClick={() => setStep(2)}
              className="flex items-center space-x-1 px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md shadow-emerald-600/20"
            >
              <span>Proceed to Scaffolding</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Launchpad Folder & Clean Scaffolding */}
      {step === 4 && (
        <div className="space-y-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8">
          <div>
            <h2 className="text-xl font-bold text-white font-mono flex items-center space-x-2">
              <FolderPlus className="w-5 h-5 text-emerald-400" />
              <span>Step 4: Launchpad Folder & Clean Governance</span>
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              Select or create a dedicated local folder on your computer for this project.
            </p>
          </div>

          {/* Zero-Pollution Notice */}
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-xs space-y-1">
            <div className="font-bold text-emerald-400 flex items-center space-x-1.5 font-mono">
              <ShieldCheck className="w-4 h-4" />
              <span>Zero-Pollution Guarantee</span>
            </div>
            <p className="text-slate-300">
              Atoosa Flight Control runs completely separate from your project. It will <strong>NOT</strong> copy its own dependencies,
              node_modules, or binaries to your project folder. Only lean markdown rule files (<code className="text-emerald-300">AGENT.md</code>, <code className="text-emerald-300">ARCHITECTURE.md</code>, <code className="text-emerald-300">FLIGHT_RULES.md</code>)
              will be scaffolded to govern your future AI development.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono">
                Local Folder Full Path:
              </label>
              <input
                type="text"
                placeholder="/Users/chicademy/Documents/Code/MyNewProject"
                value={targetFolder}
                onChange={(e) => setTargetFolder(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-emerald-500"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                You can create the folder in terminal or Finder, or Flight Control will create it if it does not yet exist.
              </p>
            </div>

            {/* Governance Files Preview */}
            <div className="space-y-2">
              <span className="text-xs font-mono text-slate-400 font-semibold block">Files to be scaffolded:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { name: 'AGENT.md', desc: 'Rules for coding agents (<500 lines rule, TDD)' },
                  { name: 'ARCHITECTURE.md', desc: 'System blueprint & tech decisions' },
                  { name: 'FLIGHT_RULES.md', desc: 'Pre-flight & landing checklist' },
                ].map((f) => (
                  <div key={f.name} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <div className="font-mono font-bold text-sky-400">{f.name}</div>
                    <div className="text-[10px] text-slate-500">{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {scaffoldSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
              Scaffolded successfully: {scaffoldSuccess.join(', ')}. Registering flight...
            </div>
          )}

          <div className="pt-4 flex items-center justify-between border-t border-slate-800">
            <button
              onClick={() => setStep(3)}
              className="flex items-center space-x-1 px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              disabled={isScaffolding || !targetFolder.trim()}
              onClick={handleEmitAndRegister}
              className="flex items-center space-x-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-xs shadow-md shadow-emerald-600/20"
            >
              {isScaffolding ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                  <span>Scaffolding Flight...</span>
                </>
              ) : (
                <>
                  <span>Scaffold & Launch Flight</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
