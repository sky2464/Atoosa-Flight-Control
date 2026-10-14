import React, { useState } from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';
import type { ProjectRecord, TelemetrySummary } from '../../shared/types.ts';
import { api } from '../lib/api.ts';
import { PageHeader } from './ui/PageHeader.tsx';

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
      const validation = await api.validateProjectPath(attachPath.trim());
      if (!validation.valid) {
        setAttachError(validation.error || 'Invalid project directory');
        setIsAttaching(false);
        return;
      }

      const derivedName = attachName.trim() || validation.name || 'Project';
      
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
      await api.scanProject(project.path, project.id);
      onRefreshProjects();
    } catch (err: any) {
      alert(`Scan failed: ${err.message}`);
    }
  };


  const scoreDot = (score: number) =>
    score >= 75 ? 'bg-emerald-400' : score >= 50 ? 'bg-amber-400' : 'bg-rose-400';

  return (
    <div className="page">
      <PageHeader
        title="Flights"
        subtitle="Projects registered with the tower. Your files are only read, never changed."
        action={
          <button onClick={onStartNewProject} className="btn-primary">
            New flight
          </button>
        }
      />

      {/* Attach an existing folder */}
      <section className="space-y-3">
        <h2 className="section-title">Attach a local folder</h2>
        <form onSubmit={handleAttachExisting} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="/Users/you/Code/my-project"
            value={attachPath}
            onChange={(e) => setAttachPath(e.target.value)}
            className="field font-mono text-[13px] sm:flex-[2]"
            required
          />
          <input
            type="text"
            placeholder="Name (optional)"
            value={attachName}
            onChange={(e) => setAttachName(e.target.value)}
            className="field sm:flex-1"
          />
          <button type="submit" disabled={isAttaching || !attachPath.trim()} className="btn-ghost h-9 shrink-0">
            {isAttaching && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            {isAttaching ? 'Scanning…' : 'Attach'}
          </button>
        </form>
        {attachError && <p className="text-[13px] text-rose-400">{attachError}</p>}
      </section>

      {/* Registered flights */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="section-title">
            Registered <span className="text-slate-500 font-normal">{projects.length}</span>
          </h2>
          <button onClick={onRefreshProjects} className="icon-btn" title="Refresh" aria-label="Refresh">
            <RefreshCw className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {projects.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-400">
            No flights yet. Start a new flight or attach a folder above.
          </p>
        ) : (
          <ul className="divide-y divide-slate-800/60 border-y border-slate-800/60">
            {projects.map((project) => {
              const isSelected = activeProject?.id === project.id;
              const telemetry = project.telemetry;
              const over500Count = telemetry?.filesOver500Lines?.length || 0;
              const score = telemetry?.flightScore ?? 100;

              return (
                <li
                  key={project.id}
                  onClick={() => onSelectProject(project)}
                  className={`group flex items-center gap-4 px-3 py-3.5 cursor-pointer transition-colors ${
                    isSelected ? 'bg-slate-900/60' : 'hover:bg-slate-900/40'
                  }`}
                >
                  <span className={`dot ${telemetry ? scoreDot(score) : 'bg-slate-600'}`} title={`Flight score ${score}`} />

                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-100 truncate">{project.name}</div>
                    <div className="text-xs text-slate-500 font-mono truncate" title={project.path}>
                      {project.path}
                    </div>
                  </div>

                  <div className="hidden md:flex items-center gap-6 text-xs text-slate-400">
                    {telemetry ? (
                      <>
                        <span>
                          <span className="font-mono text-slate-300">{telemetry.totalFiles}</span> files
                        </span>
                        <span>
                          <span className="font-mono text-slate-300">{telemetry.totalLines.toLocaleString()}</span> lines
                        </span>
                        <span>{telemetry.testSetup.detected ? `${telemetry.testSetup.testFilesCount} tests` : 'No tests'}</span>
                        {over500Count > 0 && (
                          <span className="flex items-center gap-1.5">
                            <span className="dot bg-amber-400" />
                            {over500Count} over 500 lines
                          </span>
                        )}
                      </>
                    ) : (
                      <span>Not scanned</span>
                    )}
                  </div>

                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProject(project);
                        onOpenGovernance();
                      }}
                      className="px-2 h-8 rounded-md text-xs text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                    >
                      Rules
                    </button>
                    <button onClick={(e) => handleRescan(project, e)} className="icon-btn" title="Rescan" aria-label="Rescan">
                      <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(project.id, e)}
                      className="icon-btn hover:text-rose-400"
                      title="Unregister"
                      aria-label="Unregister"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};
