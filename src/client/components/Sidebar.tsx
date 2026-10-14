import React, { useEffect, useRef, useState } from 'react';
import {
  Home,
  Plane,
  Radar,
  ScrollText,
  KanbanSquare,
  Terminal,
  Boxes,
  ChevronRight,
  ChevronDown,
  Check,
} from 'lucide-react';
import type { ProjectRecord } from '../../shared/types.ts';

export type ViewKey =
  | 'empty'
  | 'flights-all'
  | 'flights-new'
  | 'flights-attach'
  | 'radar-500'
  | 'radar-metrics'
  | 'radar-tdd'
  | 'gov-agent'
  | 'gov-architecture'
  | 'gov-checklist'
  | 'runway-kanban'
  | 'terminal-cli'
  | 'modules-tower';

interface SidebarProps {
  activeView: ViewKey;
  onSelectView: (view: ViewKey) => void;
  projects: ProjectRecord[];
  activeProject: ProjectRecord | null;
  onSelectProject: (p: ProjectRecord | null) => void;
}

interface MenuGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  items: { id: ViewKey; label: string; alert?: boolean }[];
}

const iconProps = { className: 'w-4 h-4 shrink-0 text-slate-500', strokeWidth: 1.75 };

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  projects,
  activeProject,
  onSelectProject,
}) => {
  const over500Count = activeProject?.telemetry?.filesOver500Lines?.length || 0;

  const menuGroups: MenuGroup[] = [
    {
      id: 'flights',
      label: 'Flights',
      icon: Plane,
      items: [
        { id: 'flights-all', label: 'All flights' },
        { id: 'flights-new', label: 'New flight' },
        { id: 'flights-attach', label: 'Attach folder' },
      ],
    },
    {
      id: 'radar',
      label: 'Radar & gates',
      icon: Radar,
      items: [
        { id: 'radar-500', label: '500-line gate', alert: over500Count > 0 },
        { id: 'radar-metrics', label: 'Metrics' },
        { id: 'radar-tdd', label: 'Test health' },
      ],
    },
    {
      id: 'governance',
      label: 'Governance',
      icon: ScrollText,
      items: [
        { id: 'gov-agent', label: 'Agent rules' },
        { id: 'gov-architecture', label: 'Architecture' },
        { id: 'gov-checklist', label: 'Checklists' },
      ],
    },
    {
      id: 'runway',
      label: 'Runway',
      icon: KanbanSquare,
      items: [{ id: 'runway-kanban', label: 'Kanban' }],
    },
    {
      id: 'terminal',
      label: 'CLI engine',
      icon: Terminal,
      items: [{ id: 'terminal-cli', label: 'Terminal' }],
    },
    {
      id: 'modules',
      label: 'Modules',
      icon: Boxes,
      items: [{ id: 'modules-tower', label: 'Plugins' }],
    },
  ];

  const groupOf = (view: ViewKey) => menuGroups.find((g) => g.items.some((i) => i.id === view))?.id;

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const active = groupOf(activeView);
    return active ? { [active]: true } : {};
  });

  // Keep the group holding the active view open when navigation happens elsewhere.
  useEffect(() => {
    const active = groupOf(activeView);
    if (active) setOpenGroups((prev) => (prev[active] ? prev : { ...prev, [active]: true }));
  }, [activeView]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const rowBase =
    'relative w-full h-8 flex items-center gap-2 px-3 rounded-md text-[13px] text-left transition-colors';

  return (
    <aside className="w-60 shrink-0 border-r border-slate-800/60 bg-slate-950 flex flex-col select-none">
      <div className="p-4 pb-2">
        <ProjectPicker projects={projects} activeProject={activeProject} onSelectProject={onSelectProject} />
      </div>

      <nav className="flex-1 overflow-y-auto px-4 pb-4 space-y-0.5">
        <button
          onClick={() => onSelectView('empty')}
          className={`${rowBase} ${
            activeView === 'empty' ? 'bg-slate-900 text-slate-100' : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
          }`}
        >
          {activeView === 'empty' && <ActiveMarker />}
          <Home {...iconProps} />
          <span>Home</span>
        </button>

        <div className="h-3" />

        {menuGroups.map((group) => {
          const isOpen = !!openGroups[group.id];
          const hasActiveChild = group.items.some((item) => item.id === activeView);
          const Icon = group.icon;
          const Chevron = isOpen ? ChevronDown : ChevronRight;

          return (
            <div key={group.id} className="space-y-0.5">
              <button
                onClick={() => toggleGroup(group.id)}
                aria-expanded={isOpen}
                className={`${rowBase} group font-medium ${
                  hasActiveChild ? 'text-slate-200' : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                }`}
              >
                <Icon {...iconProps} />
                <span className="flex-1 truncate">{group.label}</span>
                {!isOpen && group.items.some((i) => i.alert) && <span className="dot bg-amber-400" />}
                <Chevron
                  className={`w-3.5 h-3.5 text-slate-500 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                  strokeWidth={1.75}
                />
              </button>

              {isOpen && (
                <div className="space-y-0.5 pb-1">
                  {group.items.map((sub) => {
                    const isSelected = activeView === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => onSelectView(sub.id)}
                        className={`${rowBase} pl-9 ${
                          isSelected
                            ? 'bg-slate-900 text-slate-100'
                            : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                        }`}
                      >
                        {isSelected && <ActiveMarker />}
                        <span className="flex-1 truncate">{sub.label}</span>
                        {sub.alert && <span className="dot bg-amber-400" title={`${over500Count} files over 500 lines`} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

const ActiveMarker: React.FC = () => (
  <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-sky-400" aria-hidden="true" />
);

interface ProjectPickerProps {
  projects: ProjectRecord[];
  activeProject: ProjectRecord | null;
  onSelectProject: (p: ProjectRecord | null) => void;
}

const ProjectPicker: React.FC<ProjectPickerProps> = ({ projects, activeProject, onSelectProject }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full h-8 flex items-center justify-between gap-2 px-3 rounded-md text-[13px] text-slate-200 hover:bg-slate-900 transition-colors"
      >
        <span className={`truncate ${activeProject ? '' : 'text-slate-400'}`}>
          {activeProject ? activeProject.name : 'No project'}
        </span>
        <ChevronDown className="w-3.5 h-3.5 shrink-0 text-slate-500" strokeWidth={1.75} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-1 max-h-72 overflow-y-auto rounded-lg border border-slate-800 bg-slate-900 p-1.5 shadow-xl z-40 text-[13px]">
          {projects.length === 0 && <div className="px-2.5 py-1.5 text-slate-400">No projects attached yet</div>}
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                onSelectProject(p);
                setOpen(false);
              }}
              className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md text-left text-slate-300 hover:bg-slate-800"
            >
              <span className="truncate">{p.name}</span>
              {activeProject?.id === p.id && <Check className="w-3.5 h-3.5 text-sky-400" strokeWidth={2} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
