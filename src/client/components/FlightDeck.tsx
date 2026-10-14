import React, { useState } from 'react';
import {
  Plane,
  FolderPlus,
  Compass,
  Radar,
  ScrollText,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  Code2,
  Layers,
} from 'lucide-react';
import type { ProjectRecord, TelemetrySummary } from '../../shared/types.ts';
import { api } from '../lib/api.ts';

interface FlightDeckProps {
  projects: ProjectRecord[];
  activeProject: ProjectRecord | null;
  onSelectProject: (p: ProjectRecord) => void;
  onStartNewProject: () => void;
  onRefreshProjects: () => void;
  onOpenRadar: () => void;
  onOpenGovernance: () => void;
}

export const FlightDeck: React.FC<FlightDeckProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onStartNewProject,
  onRefreshProjects,
  onOpenRadar,
  onOpenGovernance,
}) => {
  const [attachPath, setAttachPath] = useState('');
  const [attachName, setAttachName] = useState('');
  const [isAttaching, setIsAttaching] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);

  const handleAttachExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attachPath.trim()) return;

    setIsAttaching(true);
    setAttachError(null);

    try {
      const derivedName = attachName.trim() || attachPath.split(/[/\\]/).filter(Boolean).pop() || 'Project';
      
      // Perform soft-read first (zero touch)
      const telemetry = await api.scanProject(attachPath.trim());

      const created = await api.createProject({
        name: derivedName,
        path: attachPath.trim(),
        status: telemetry.flightScore >= 75 ? 'cleared-for-takeoff' : 'in-flight',
        telemetry,
      });

      setAttachPath('');
      setAttachName('');
      onRefreshProjects();
      onSelectProject(created);
    } catch (err: any) {
      setAttachError(err.message || 'Failed to attach project directory');
    } finally {
      setIsAttaching(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Unregister this project from Flight Control? (Your actual project files will NOT be touched)')) {
      await api.deleteProject(id);
      onRefreshProjects();
    }
  };

  const handleRescan = async (project: ProjectRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const telemetry = await api.scanProject(project.path, project.id);
      onRefreshProjects();
    } catch (err: any) {
      alert(`Scan failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Air Traffic Tower Header */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-sky-950/40 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-4">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
            <span>Local Software Air Traffic Control</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3 font-mono">
            Ground Control for Autonomous Development
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Monitor, govern, and steer AI-assisted software projects from an isolated control tower.
            Zero clutter in your repository. Enforces the <span className="text-sky-300 font-semibold">&lt;500 lines/file rule</span>,
            TDD, architecture reviews, and automated prompt hardening.
          </p>
        </div>
      </div>

      {/* Primary Action Gateways */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gateway 1: New Flight */}
        <div className="rounded-2xl border border-sky-500/30 bg-slate-900/60 hover:bg-slate-900/80 p-6 flex flex-col justify-between transition-all shadow-lg hover:border-sky-500/60 group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 group-hover:scale-105 transition-transform">
                <Compass className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono font-semibold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-500/20">
                PATH A: DISCOVERY
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Create New Flight (New Project)</h2>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Start with a structured pre-flight questionnaire. Brainstorm with background research,
              evaluate Docker vs bare-metal tradeoffs, bake in security gates, and scaffold clean governance files.
            </p>
          </div>
          <button
            onClick={onStartNewProject}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-medium text-sm transition-all shadow-md shadow-sky-600/20"
          >
            <span>Launch Pre-Flight Discovery</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Gateway 2: Attach Existing Flight */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <FolderPlus className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                PATH B: SOFT READ
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Attach Existing Flight (Existing Codebase)</h2>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Non-destructive scan of an existing local folder. Computes line metrics, identifies &gt;500-line hazards,
              detects test coverage, and offers selective rulebook integration.
            </p>
            <form onSubmit={handleAttachExisting} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">
                  Local Folder Full Path:
                </label>
                <input
                  type="text"
                  placeholder="/Users/you/Documents/Code/MyProject"
                  value={attachPath}
                  onChange={(e) => setAttachPath(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-sky-500 font-mono"
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Flight Name (optional)"
                  value={attachName}
                  onChange={(e) => setAttachName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-sky-500"
                />
                <button
                  type="submit"
                  disabled={isAttaching || !attachPath.trim()}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-xs transition-colors flex items-center space-x-1"
                >
                  {isAttaching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FolderPlus className="w-3.5 h-3.5" />}
                  <span>{isAttaching ? 'Scanning...' : 'Attach & Scan'}</span>
                </button>
              </div>
            </form>
            {attachError && (
              <p className="mt-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg">
                {attachError}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Active Flights Registry */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Plane className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-bold text-white font-mono">Active Registered Flights ({projects.length})</h2>
          </div>
          <button
            onClick={onRefreshProjects}
            className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded border border-slate-800 hover:border-slate-700"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Sync</span>
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center bg-slate-900/30">
            <Plane className="w-12 h-12 text-slate-600 mx-auto mb-3 stroke-[1.5]" />
            <p className="text-slate-300 font-medium text-sm mb-1">No flights currently registered in the tower.</p>
            <p className="text-slate-500 text-xs mb-4">
              Launch a new pre-flight discovery or attach an existing project directory above.
            </p>
            <button
              onClick={onStartNewProject}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium"
            >
              <Compass className="w-4 h-4" />
              <span>Launch First Flight</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project) => {
              const isSelected = activeProject?.id === project.id;
              const telemetry = project.telemetry;
              const over500Count = telemetry?.filesOver500Lines?.length || 0;
              const score = telemetry?.flightScore ?? 100;

              return (
                <div
                  key={project.id}
                  onClick={() => onSelectProject(project)}
                  className={`rounded-2xl border p-5 cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-sky-500 bg-sky-950/20 shadow-lg shadow-sky-500/10'
                      : 'border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div>
                    {/* Top row: Name & Health Score */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 pr-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-white text-base truncate font-mono">{project.name}</h3>
                          {isSelected && (
                            <span className="text-[10px] bg-sky-500 text-white px-1.5 py-0.2 rounded font-semibold uppercase">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-[11px] truncate font-mono mt-0.5" title={project.path}>
                          {project.path}
                        </p>
                      </div>

                      {/* Health Gauge */}
                      <div
                        className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl border font-mono font-bold text-xs ${
                          score >= 75
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : score >= 50
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        }`}
                      >
                        <span className="text-sm">{score}</span>
                        <span className="text-[9px] uppercase tracking-tighter">PTS</span>
                      </div>
                    </div>

                    {/* Telemetry Metrics */}
                    {telemetry ? (
                      <div className="grid grid-cols-2 gap-2 my-3 text-xs bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/80">
                        <div>
                          <span className="text-slate-500 text-[10px] block uppercase font-mono">Total Files</span>
                          <span className="text-slate-200 font-semibold font-mono">{telemetry.totalFiles}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block uppercase font-mono">Total Lines</span>
                          <span className="text-slate-200 font-semibold font-mono">{telemetry.totalLines.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block uppercase font-mono">Git Status</span>
                          <span className="text-slate-200 font-semibold font-mono">
                            {telemetry.hasGit ? `${telemetry.gitBranch || 'clean'}` : 'No Git'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block uppercase font-mono">TDD Gate</span>
                          <span className={telemetry.testSetup.detected ? 'text-emerald-400 font-semibold font-mono' : 'text-amber-400 font-mono'}>
                            {telemetry.testSetup.detected ? `${telemetry.testSetup.testFilesCount} tests` : 'Missing'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="my-3 text-xs text-slate-500 italic">No telemetry recorded yet.</div>
                    )}

                    {/* 500-Line Code Warning Banner */}
                    {over500Count > 0 ? (
                      <div className="flex items-center space-x-1.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{over500Count} file(s) &gt;500 lines detected</span>
                      </div>
                    ) : telemetry ? (
                      <div className="flex items-center space-x-1.5 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>All files within 500-line ceiling</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Actions footer */}
                  <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => handleRescan(project, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs transition-colors"
                        title="Re-scan code metrics"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectProject(project);
                          onOpenRadar();
                        }}
                        className="px-2 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-medium flex items-center space-x-1"
                      >
                        <Radar className="w-3 h-3 text-sky-400" />
                        <span>Radar</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectProject(project);
                          onOpenGovernance();
                        }}
                        className="px-2 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-medium flex items-center space-x-1"
                      >
                        <ScrollText className="w-3 h-3 text-indigo-400" />
                        <span>Rules</span>
                      </button>
                    </div>

                    <button
                      onClick={(e) => handleDelete(project.id, e)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 text-xs transition-colors"
                      title="Unregister project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
