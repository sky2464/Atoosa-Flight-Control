import React from 'react';
import { Plane } from 'lucide-react';
import type { ProjectRecord } from '../../shared/types.ts';

interface EmptyTowerViewProps {
  activeProject: ProjectRecord | null;
  onNavigate: (viewKey: any) => void;
  onOpenOnboarding: () => void;
}

export const EmptyTowerView: React.FC<EmptyTowerViewProps> = ({ activeProject, onNavigate }) => {
  const links: { label: string; view: string }[] = [
    { label: 'New flight', view: 'flights-new' },
    { label: 'Attach folder', view: 'flights-attach' },
    { label: 'Open terminal', view: 'terminal-cli' },
  ];

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-6 py-24 text-center">
      <Plane className="w-8 h-8 -rotate-45 text-slate-500" strokeWidth={1.5} />

      <h1 className="mt-6 text-2xl font-medium tracking-tight text-slate-100">Welcome back</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-400">
        Pick something from the sidebar, or start here.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
        {links.map((l) => (
          <button
            key={l.view}
            onClick={() => onNavigate(l.view)}
            className="text-slate-300 hover:text-sky-400 transition-colors"
          >
            {l.label}
          </button>
        ))}
      </div>

      {activeProject && (
        <button
          onClick={() => onNavigate('radar-500')}
          className="mt-16 text-[13px] text-slate-400 hover:text-slate-200 transition-colors"
        >
          Continue with <span className="text-slate-200">{activeProject.name}</span> →
        </button>
      )}
    </div>
  );
};
