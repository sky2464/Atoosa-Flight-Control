import React from 'react';
import { Plane, Sparkles, FolderPlus, Terminal, Compass } from 'lucide-react';
import type { ProjectRecord, AppSettings } from '../../shared/types.ts';

interface EmptyTowerViewProps {
  activeProject: ProjectRecord | null;
  settings?: AppSettings | null;
  onNavigate: (viewKey: any) => void;
  onOpenOnboarding: () => void;
}

export const EmptyTowerView: React.FC<EmptyTowerViewProps> = ({
  activeProject,
  settings,
  onNavigate,
  onOpenOnboarding,
}) => {
  const isCliLinked = !!settings?.onboardingCompleted && !!settings?.selectedCli;
  const cliLabel = settings?.selectedCli === 'claude-cli'
    ? 'Claude Code CLI'
    : settings?.selectedCli === 'antigravity'
    ? 'Google Antigravity CLI'
    : settings?.selectedCli === 'codex'
    ? 'OpenAI Codex CLI'
    : settings?.selectedCli === 'cursor'
    ? 'Cursor Agent CLI'
    : settings?.selectedCli === 'ollama'
    ? 'Ollama Local LLM'
    : settings?.selectedCli || 'Local AI Engine';

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-6 py-16 text-center max-w-xl mx-auto">
      <Plane className="w-10 h-10 -rotate-45 text-sky-400" strokeWidth={1.5} />

      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-100">
        Flight Control Tower
      </h1>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
        Autonomous Air Traffic Control for modern engineering and AI coding agents.
      </p>

      {/* AI Co-pilot Connection Status Card */}
      <div className="mt-8 w-full p-4 rounded-xl border border-slate-800 bg-slate-900/80 text-left shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-medium text-slate-200">Local AI Co-pilot</h2>
                {isCliLinked ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    <span className="dot bg-emerald-400" /> Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    Not configured
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                {isCliLinked
                  ? `Linked to ${cliLabel}. Uses your local subscription without API key leaks.`
                  : 'Connect to local Google Antigravity (agy), Claude Code, OpenAI Codex, Cursor, or Ollama.'}
              </p>
            </div>
          </div>
          <button
            onClick={onOpenOnboarding}
            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-500 hover:bg-sky-400 text-slate-950 transition-colors shadow-sm"
          >
            {isCliLinked ? 'Reconfigure' : 'Connect AI'}
          </button>
        </div>
      </div>

      {/* Primary Actions Grid */}
      <div className="mt-6 w-full grid grid-cols-3 gap-3">
        <button
          onClick={() => onNavigate('flights-new')}
          className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800/60 hover:border-slate-700 transition-all text-left flex flex-col gap-2 group"
        >
          <Compass className="w-5 h-5 text-sky-400 group-hover:scale-105 transition-transform" />
          <div>
            <div className="text-xs font-medium text-slate-200">New Flight</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Pre-flight wizard</div>
          </div>
        </button>

        <button
          onClick={() => onNavigate('flights-attach')}
          className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800/60 hover:border-slate-700 transition-all text-left flex flex-col gap-2 group"
        >
          <FolderPlus className="w-5 h-5 text-emerald-400 group-hover:scale-105 transition-transform" />
          <div>
            <div className="text-xs font-medium text-slate-200">Attach Folder</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Soft-read telemetry</div>
          </div>
        </button>

        <button
          onClick={() => onNavigate('terminal-cli')}
          className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800/60 hover:border-slate-700 transition-all text-left flex flex-col gap-2 group"
        >
          <Terminal className="w-5 h-5 text-purple-400 group-hover:scale-105 transition-transform" />
          <div>
            <div className="text-xs font-medium text-slate-200">CLI Engine</div>
            <div className="text-[11px] text-slate-500 mt-0.5">afc command deck</div>
          </div>
        </button>
      </div>

      {activeProject && (
        <button
          onClick={() => onNavigate('radar-500')}
          className="mt-8 text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5"
        >
          <span>Continue radar monitoring on</span>
          <span className="text-sky-400 font-medium">{activeProject.name}</span>
          <span>→</span>
        </button>
      )}
    </div>
  );
};
