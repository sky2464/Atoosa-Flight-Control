import React, { useState, useEffect } from 'react';
import type { ProjectRecord, AISettings } from '../shared/types.ts';
import { api } from './lib/api.ts';
import { Navigation, type ActiveTab } from './components/Navigation.tsx';
import { FlightDeck } from './components/FlightDeck.tsx';
import { PreFlightWizard } from './components/PreFlightWizard.tsx';
import { TelemetryRadar } from './components/TelemetryRadar.tsx';
import { GovernanceSuite } from './components/GovernanceSuite.tsx';
import { ProjectManagerSlot } from './components/ProjectManagerSlot.tsx';
import { ModulesTower } from './components/ModulesTower.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('flight-deck');
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [activeProject, setActiveProject] = useState<ProjectRecord | null>(null);
  const [aiSettings, setAiSettings] = useState<AISettings | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProjects = async () => {
    try {
      const list = await api.getProjects();
      setProjects(list);
      if (list.length > 0 && !activeProject) {
        setActiveProject(list[0]);
      } else if (activeProject) {
        // Refresh active project state
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
      setAiSettings(s);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  useEffect(() => {
    Promise.all([loadProjects(), loadSettings()]).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        projects={projects}
        activeProject={activeProject}
        onSelectProject={(p) => setActiveProject(p)}
        aiSettings={aiSettings}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main className="flex-1">
        {activeTab === 'flight-deck' && (
          <FlightDeck
            projects={projects}
            activeProject={activeProject}
            onSelectProject={(p) => {
              setActiveProject(p);
              setActiveTab('radar');
            }}
            onStartNewProject={() => setActiveTab('pre-flight')}
            onRefreshProjects={loadProjects}
            onOpenRadar={() => setActiveTab('radar')}
            onOpenGovernance={() => setActiveTab('governance')}
          />
        )}

        {activeTab === 'pre-flight' && (
          <PreFlightWizard
            onFlightLaunched={(newFlight) => {
              loadProjects();
              setActiveProject(newFlight);
              setActiveTab('radar');
            }}
            onCancel={() => setActiveTab('flight-deck')}
          />
        )}

        {activeTab === 'radar' && (
          <TelemetryRadar
            project={activeProject}
            onRefreshProject={loadProjects}
            onNavigateGovernance={() => setActiveTab('governance')}
          />
        )}

        {activeTab === 'governance' && (
          <GovernanceSuite
            project={activeProject}
            onRefreshProject={loadProjects}
          />
        )}

        {activeTab === 'project-manager' && (
          <ProjectManagerSlot project={activeProject} />
        )}

        {activeTab === 'modules' && (
          <ModulesTower />
        )}
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={aiSettings}
        onSaved={(updated) => setAiSettings(updated)}
      />

      {/* Global Status Bar */}
      <footer className="border-t border-slate-900 bg-slate-950 py-3 text-slate-500 text-[11px] font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="text-slate-400">Tower Status: Online</span>
            </span>
            <span>•</span>
            <span>Active Project: {activeProject ? activeProject.name : 'None selected'}</span>
          </div>
          <div>
            <span>Atoosa Flight Control • Zero Target Contamination</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
