import React, { useState, useEffect } from 'react';
import { X, RefreshCw, FolderPlus, GitBranch, Compass, Sparkles, Check, AlertCircle } from 'lucide-react';
import type { DetectedCLI, AppSettings, ProjectRecord } from '../../shared/types.ts';
import { api } from '../lib/api.ts';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted: (settings: AppSettings, attachedProject?: ProjectRecord) => void;
  onStartNewProject?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onCompleted,
  onStartNewProject,
}) => {
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: AI State
  const [clis, setClis] = useState<DetectedCLI[]>([]);
  const [isLoadingCLIs, setIsLoadingCLIs] = useState(true);
  const [selectedCli, setSelectedCli] = useState<string>('antigravity');
  const [customPath, setCustomPath] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; version?: string; error?: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [callsign, setCallsign] = useState('TOWER-1');
  const [commanderName, setCommanderName] = useState('Flight Commander');
  const [savedSettings, setSavedSettings] = useState<AppSettings | null>(null);

  // Step 2: Project Setup State
  const [projectMode, setProjectMode] = useState<'local' | 'clone' | 'new'>('local');
  const [localPath, setLocalPath] = useState('');
  const [cloneUrl, setCloneUrl] = useState('');
  const [cloneTargetDir, setCloneTargetDir] = useState('');
  const [isProcessingProject, setIsProcessingProject] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState<string | null>(null);

  const scanCLIs = async () => {
    setIsLoadingCLIs(true);
    try {
      const detected = await api.getCLIs();
      setClis(detected);

      // Pre-select first available tool (antigravity, claude, codex, etc.)
      const firstAvailable = detected.find((c) => c.available);
      if (firstAvailable) {
        setSelectedCli(firstAvailable.id);
        if (firstAvailable.path) setCustomPath(firstAvailable.path);
      }
    } catch (err: any) {
      console.error('Failed to probe CLIs:', err);
    } finally {
      setIsLoadingCLIs(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setProjectError(null);
      setValidationSuccess(null);
      scanCLIs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestHandshake = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await api.testConnection(selectedCli, customPath || undefined);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveAIStep = async () => {
    try {
      const res = await api.completeOnboarding({
        selectedCli,
        claudeCliPath: customPath || undefined,
        profile: {
          name: commanderName.trim() || 'Flight Commander',
          callsign: callsign.trim() || 'TOWER-1',
          role: 'Lead Architect',
          workstation: 'Localhost',
        },
      });

      if (res.success) {
        setSavedSettings(res.settings);
        setStep(2); // Proceed to Step 2: Flight Project Setup
      }
    } catch (err: any) {
      alert(`Failed to save AI engine: ${err.message}`);
    }
  };

  const handleAttachLocalProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localPath.trim()) return;

    setIsProcessingProject(true);
    setProjectError(null);
    setValidationSuccess(null);

    try {
      // 1. Validate path and enforce anti-dogfooding
      const validation = await api.validateProjectPath(localPath.trim());
      if (!validation.valid) {
        setProjectError(validation.error || 'Invalid project directory');
        setIsProcessingProject(false);
        return;
      }

      setValidationSuccess(`Found ${validation.name} (${validation.hasGit ? 'Git repository' : 'Local folder'})`);

      // 2. Soft-read telemetry
      const telemetry = await api.scanProject(localPath.trim());

      // 3. Create project
      const created = await api.createProject({
        name: validation.name || 'Target Flight',
        path: localPath.trim(),
        status: telemetry.flightScore >= 75 ? 'cleared-for-takeoff' : 'in-flight',
        telemetry,
      });

      if (savedSettings) {
        onCompleted(savedSettings, created);
      }
      onClose();
    } catch (err: any) {
      setProjectError(err.message || 'Failed to attach project');
    } finally {
      setIsProcessingProject(false);
    }
  };

  const handleCloneProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloneUrl.trim() || !cloneTargetDir.trim()) return;

    setIsProcessingProject(true);
    setProjectError(null);

    try {
      const created = await api.cloneProject(cloneUrl.trim(), cloneTargetDir.trim());
      if (savedSettings) {
        onCompleted(savedSettings, created);
      }
      onClose();
    } catch (err: any) {
      setProjectError(err.message || 'Clone failed');
    } finally {
      setIsProcessingProject(false);
    }
  };

  const handleSkipProject = () => {
    if (savedSettings) {
      onCompleted(savedSettings);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 space-y-6 relative shadow-2xl">
        <button onClick={onClose} className="icon-btn absolute top-4 right-4" title="Close" aria-label="Close">
          <X className="w-4 h-4" strokeWidth={1.75} />
        </button>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <span className={`px-2 py-0.5 rounded ${step === 1 ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-slate-800 text-slate-300'}`}>
            Step 1: AI Co-pilot
          </span>
          <span>→</span>
          <span className={`px-2 py-0.5 rounded ${step === 2 ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-slate-800 text-slate-500'}`}>
            Step 2: Flight Runway
          </span>
        </div>

        {/* ================= STEP 1: AI CO-PILOT ================= */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-1.5 pr-8">
              <h2 className="text-base font-medium text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                Connect Local AI Co-pilot
              </h2>
              <p className="text-[13px] leading-relaxed text-slate-400">
                Flight Control connects directly to the local coding agents installed on your machine. Zero cloud API key leaks.
              </p>
            </div>

            <section className="space-y-2">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-slate-400">Found on this machine</span>
                <button onClick={scanCLIs} className="icon-btn" title="Rescan" aria-label="Rescan">
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCLIs ? 'animate-spin' : ''}`} strokeWidth={1.75} />
                </button>
              </div>

              <div className="divide-y divide-slate-800/60 border-y border-slate-800/60 max-h-48 overflow-y-auto pr-1">
                {clis.map((cli) => {
                  const isSelected = selectedCli === cli.id;
                  return (
                    <label
                      key={cli.id}
                      className={`flex items-center gap-3 py-2.5 ${cli.available ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}
                    >
                      <input
                        type="radio"
                        name="selectedCli"
                        checked={isSelected}
                        onChange={() => {
                          setSelectedCli(cli.id);
                          setCustomPath(cli.path || '');
                          setTestResult(null);
                        }}
                        disabled={!cli.available}
                        className="accent-sky-400"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-[13px] text-slate-100 font-medium">
                          {cli.name}
                          {cli.available && <span className="dot bg-emerald-400" title="Ready" />}
                        </div>
                        <div className="text-xs text-slate-400 font-mono truncate">
                          {cli.available ? `${cli.version || 'Installed'} · ${cli.path}` : 'Not found'}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </section>

            <section className="flex items-center justify-between gap-4 text-[13px]">
              <span className="min-w-0 truncate text-slate-300">
                {testResult ? (
                  <span className="flex items-center gap-2">
                    <span className={`dot ${testResult.success ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                    {testResult.success ? `Connected${testResult.version ? ` · ${testResult.version}` : ''}` : testResult.error}
                  </span>
                ) : (
                  <span className="text-slate-400">Check that the selected tool responds.</span>
                )}
              </span>
              <button onClick={handleTestHandshake} disabled={isTesting} className="btn-ghost shrink-0">
                {isTesting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                {isTesting ? 'Testing…' : 'Test connection'}
              </button>
            </section>

            <div className="grid grid-cols-2 gap-3 text-[13px]">
              <label className="block space-y-1.5">
                <span className="text-slate-400">Your name</span>
                <input type="text" value={commanderName} onChange={(e) => setCommanderName(e.target.value)} className="field" />
              </label>
              <label className="block space-y-1.5">
                <span className="text-slate-400">Callsign</span>
                <input type="text" value={callsign} onChange={(e) => setCallsign(e.target.value)} className="field uppercase" />
              </label>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button onClick={onClose} className="btn-ghost">
                Cancel
              </button>
              <button onClick={handleSaveAIStep} className="btn-primary">
                Next: Connect Project Runway →
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: PROJECT RUNWAY ================= */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-1.5 pr-8">
              <h2 className="text-base font-medium text-slate-100 flex items-center gap-2">
                <Compass className="w-4 h-4 text-sky-400" />
                Connect Your Target Project
              </h2>
              <p className="text-[13px] leading-relaxed text-slate-400">
                The Control Tower monitors external repositories from 30,000 feet. It never scans or modifies itself.
              </p>
            </div>

            {/* Mode Selector Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950/60 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => { setProjectMode('local'); setProjectError(null); }}
                className={`py-2 px-3 rounded-md font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  projectMode === 'local' ? 'bg-slate-800 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FolderPlus className="w-3.5 h-3.5" />
                Existing Folder
              </button>

              <button
                type="button"
                onClick={() => { setProjectMode('clone'); setProjectError(null); }}
                className={`py-2 px-3 rounded-md font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  projectMode === 'clone' ? 'bg-slate-800 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
                Clone from Cloud
              </button>

              <button
                type="button"
                onClick={() => { setProjectMode('new'); setProjectError(null); }}
                className={`py-2 px-3 rounded-md font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  projectMode === 'new' ? 'bg-slate-800 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                New Project
              </button>
            </div>

            {/* Mode A: Existing Folder */}
            {projectMode === 'local' && (
              <form onSubmit={handleAttachLocalProject} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Local Project Directory Path
                  </label>
                  <input
                    type="text"
                    value={localPath}
                    onChange={(e) => setLocalPath(e.target.value)}
                    placeholder="/Users/username/Projects/my-app"
                    className="field w-full font-mono text-xs"
                    autoFocus
                  />
                </div>

                <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/40 text-xs text-slate-400 space-y-1 leading-relaxed">
                  <div className="text-slate-300 font-medium flex items-center gap-1.5">
                    💡 Cloud Repository Tip
                  </div>
                  <p>
                    If your project is on GitHub or GitLab, clone it to your local disk first (e.g. <code className="text-slate-200 bg-slate-800 px-1 py-0.5 rounded">git clone &lt;repo-url&gt;</code>), then enter its local folder path above.
                  </p>
                </div>

                {projectError && (
                  <div className="p-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{projectError}</span>
                  </div>
                )}

                {validationSuccess && (
                  <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{validationSuccess}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button type="button" onClick={() => setStep(1)} className="btn-ghost">
                    ← Back
                  </button>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={handleSkipProject} className="btn-ghost text-xs">
                      Skip for now
                    </button>
                    <button type="submit" disabled={isProcessingProject || !localPath.trim()} className="btn-primary">
                      {isProcessingProject ? 'Verifying & Scanning…' : 'Attach & Monitor Flight'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Mode B: Clone from Cloud */}
            {projectMode === 'clone' && (
              <form onSubmit={handleCloneProject} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Git Repository URL (GitHub, GitLab, etc.)
                  </label>
                  <input
                    type="text"
                    value={cloneUrl}
                    onChange={(e) => setCloneUrl(e.target.value)}
                    placeholder="https://github.com/owner/repository.git"
                    className="field w-full font-mono text-xs"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Local Destination Folder
                  </label>
                  <input
                    type="text"
                    value={cloneTargetDir}
                    onChange={(e) => setCloneTargetDir(e.target.value)}
                    placeholder="/Users/username/Projects/new-clone"
                    className="field w-full font-mono text-xs"
                  />
                </div>

                {projectError && (
                  <div className="p-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{projectError}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button type="button" onClick={() => setStep(1)} className="btn-ghost">
                    ← Back
                  </button>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={handleSkipProject} className="btn-ghost text-xs">
                      Skip for now
                    </button>
                    <button type="submit" disabled={isProcessingProject || !cloneUrl.trim() || !cloneTargetDir.trim()} className="btn-primary">
                      {isProcessingProject ? 'Cloning & Soft-Reading…' : 'Clone & Attach Flight'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Mode C: Start Brand New Project */}
            {projectMode === 'new' && (
              <div className="space-y-4 p-4 rounded-xl border border-slate-800 bg-slate-950/40 text-left">
                <div className="space-y-1.5">
                  <h3 className="text-sm font-medium text-slate-100 flex items-center gap-2">
                    <Compass className="w-4 h-4 text-sky-400" />
                    Pre-Flight Discovery Wizard
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Scaffold a brand-new project with a 360° requirements interview, Docker vs. Bare-metal decision matrix, and clean zero-pollution markdown rulebooks (<code className="text-slate-300 font-mono">AGENT.md</code>, <code className="text-slate-300 font-mono">ARCHITECTURE.md</code>).
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button type="button" onClick={() => setStep(1)} className="btn-ghost">
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (savedSettings) onCompleted(savedSettings);
                      onClose();
                      if (onStartNewProject) onStartNewProject();
                    }}
                    className="btn-primary"
                  >
                    Launch Pre-Flight Wizard →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
