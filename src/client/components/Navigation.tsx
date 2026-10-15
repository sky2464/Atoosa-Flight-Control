import React from 'react';
import {
  Compass,
  Radar,
  ScrollText,
  KanbanSquare,
  Boxes,
  Settings,
  Plane,
  AlertTriangle,
  FolderGit2,
} from 'lucide-react';
import type { ProjectRecord, AISettings } from '../../shared/types.ts';

export type ActiveTab = 'flight-deck' | 'pre-flight' | 'radar' | 'governance' | 'project-manager' | 'modules';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  projects: ProjectRecord[];
  activeProject: ProjectRecord | null;
  onSelectProject: (p: ProjectRecord | null) => void;
  aiSettings: AISettings | null;
  onOpenSettings: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  projects,
  activeProject,
  onSelectProject,
  aiSettings,
  onOpenSettings,
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'flight-deck', label: 'Flight Deck', icon: <Plane className="w-4 h-4" /> },
    { id: 'pre-flight', label: 'Pre-Flight Discovery', icon: <Compass className="w-4 h-4" /> },
    {
      id: 'radar',
      label: 'Telemetry & Radar',
      icon: <Radar className="w-4 h-4" />,
      badge: activeProject?.telemetry?.filesOver500Lines?.length
        ? `${activeProject.telemetry.filesOver500Lines.length} Alerts`
        : undefined,
    },
    { id: 'governance', label: 'Governance & Rules', icon: <ScrollText className="w-4 h-4" /> },
    { id: 'project-manager', label: 'Project Manager', icon: <KanbanSquare className="w-4 h-4" /> },
    { id: 'modules', label: 'Modules Tower', icon: <Boxes className="w-4 h-4" /> },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('flight-deck')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-500/20">
              <Plane className="w-5 h-5 -rotate-45" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white font-mono">ATOOSA</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-semibold tracking-wider uppercase">
                  Flight Control
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Autonomous Software Dev Tower</p>
            </div>
          </div>

          {/* Active Flight Selector */}
          <div className="hidden md:flex items-center space-x-2 bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-1.5 text-xs">
            <FolderGit2 className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-400">Target Flight:</span>
            <select
              value={activeProject?.id || ''}
              onChange={(e) => {
                const found = projects.find((p) => p.id === e.target.value);
                onSelectProject(found || null);
              }}
              aria-label="Target Flight Selector"
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer pr-2 max-w-[200px] truncate"
            >
              <option value="" className="bg-slate-900 text-slate-400">-- Select Project --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-100">
                  {p.name} {p.telemetry?.flightScore ? `(${p.telemetry.flightScore}pts)` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30 shadow-sm shadow-sky-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  {item.icon}
                  <span className="hidden lg:inline">{item.label}</span>
                  {item.badge && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenSettings}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700 text-xs transition-colors"
              title="Configure AI Engines & Integrations"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-mono text-[11px]">
                {aiSettings?.activeProvider === 'antigravity'
                  ? 'Antigravity'
                  : aiSettings?.activeProvider === 'claude-cli'
                  ? 'Claude CLI'
                  : aiSettings?.activeProvider === 'ollama'
                  ? 'Ollama'
                  : 'AI Bridge'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
