import React, { useState, useEffect } from 'react';
import type { ProjectRecord, AppSettings } from '../shared/types.ts';
import { api } from './lib/api.ts';
import { TopBar } from './components/TopBar.tsx';
import { Sidebar, type ViewKey } from './components/Sidebar.tsx';
import { EmptyTowerView } from './components/EmptyTowerView.tsx';
import { FlightDeck } from './components/FlightDeck.tsx';
import { PreFlightWizard } from './components/PreFlightWizard.tsx';
import { TelemetryRadar } from './components/TelemetryRadar.tsx';
import { GovernanceSuite } from './components/GovernanceSuite.tsx';
import { ProjectManagerSlot } from './components/ProjectManagerSlot.tsx';
import { TerminalConsole } from './components/TerminalConsole.tsx';
import { ModulesTower } from './components/ModulesTower.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { OnboardingModal } from './components/OnboardingModal.tsx';

export const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewKey>('empty');
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [activeProject, setActiveProject] = useState<ProjectRecord | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProjects = async () => {
    try {
      const list = await api.getProjects();
      setProjects(list);
      if (list.length > 0 && !activeProject) {
        setActiveProject(list[0]);
      } else if (activeProject) {
        const refreshed = list.find((p) => p.id === activeProject.id);
        if (refreshed) setActiveProject(refreshed);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  const loadSettings = async () => {
    try {
      const s = await api.getAISettings();
      setSettings(s);
      // If first-time running and not onboarded, open onboarding modal!
      if (s && !s.onboardingCompleted) {
        setIsOnboardingOpen(true);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  useEffect(() => {
    Promise.all([loadProjects(), loadSettings()]).finally(() => setLoading(false));
  }, []);

  return (
    <div className="h-screen bg-slate-950 text-slate-200 flex flex-col font-sans">
      {/* Top bar: app icon, name and three icon buttons */}
      <TopBar
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTerminal={() => setActiveView('terminal-cli')}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
      />

      {/* Main Workspace with Left Sidebar */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* Left Sidebar Menus & Submenus */}
        <Sidebar
          activeView={activeView}
          onSelectView={setActiveView}
          projects={projects}
          activeProject={activeProject}
          onSelectProject={(p) => setActiveProject(p)}
        />

        {/* Curved navy joint where the top bar meets the sidebar */}
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="absolute left-60 top-0 w-6 h-6 pointer-events-none z-10"
        >
          <path d="M0,0 H24 A24,24 0 0 0 0,24 Z" fill="#020617" />
        </svg>

        {/* Main Viewport: Empty by default, loads content as needed */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-slate-900/50">
          {activeView === 'empty' && (
            <EmptyTowerView
              activeProject={activeProject}
              onNavigate={setActiveView}
              onOpenOnboarding={() => setIsOnboardingOpen(true)}
            />
          )}

          {(activeView === 'flights-all' || activeView === 'flights-attach') && (
            <FlightDeck
              projects={projects}
              activeProject={activeProject}
              onSelectProject={(p) => {
                setActiveProject(p);
                setActiveView('radar-500');
              }}
              onStartNewProject={() => setActiveView('flights-new')}
              onRefreshProjects={loadProjects}
              onOpenRadar={() => setActiveView('radar-500')}
              onOpenGovernance={() => setActiveView('gov-agent')}
            />
          )}

          {activeView === 'flights-new' && (
            <PreFlightWizard
              onFlightLaunched={(newFlight) => {
                loadProjects();
                setActiveProject(newFlight);
                setActiveView('radar-500');
              }}
              onCancel={() => setActiveView('empty')}
            />
          )}

          {(activeView === 'radar-500' || activeView === 'radar-metrics' || activeView === 'radar-tdd') && (
            <TelemetryRadar
              project={activeProject}
              onRefreshProject={loadProjects}
              onNavigateGovernance={() => setActiveView('gov-agent')}
            />
          )}

          {(activeView === 'gov-agent' || activeView === 'gov-architecture' || activeView === 'gov-checklist') && (
            <GovernanceSuite
              project={activeProject}
              onRefreshProject={loadProjects}
              initialDoc={
                activeView === 'gov-architecture' ? 'architecture' : activeView === 'gov-checklist' ? 'rules' : 'agent'
              }
            />
          )}

          {activeView === 'runway-kanban' && (
            <ProjectManagerSlot project={activeProject} />
          )}

          {activeView === 'terminal-cli' && (
            <TerminalConsole onRefresh={loadProjects} />
          )}

          {activeView === 'modules-tower' && (
            <ModulesTower />
          )}
        </main>
      </div>

      {/* Settings Modal (Zero API key clutter) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaved={(updated) => setSettings(updated)}
      />

      {/* First-time Onboarding Modal (Connect to Terminal AI) */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onCompleted={(updated) => setSettings(updated)}
      />
    </div>
  );
};
