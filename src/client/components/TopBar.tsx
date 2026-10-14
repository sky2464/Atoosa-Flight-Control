import React, { useEffect, useRef, useState } from 'react';
import { Plane, Terminal, Settings, User } from 'lucide-react';
import type { AppSettings } from '../../shared/types.ts';

interface TopBarProps {
  settings: AppSettings | null;
  onOpenSettings: () => void;
  onOpenTerminal: () => void;
  onOpenOnboarding: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  settings,
  onOpenSettings,
  onOpenTerminal,
  onOpenOnboarding,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showProfileMenu) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [showProfileMenu]);

  const profile = settings?.profile || {
    name: 'Flight Commander',
    callsign: 'TOWER-1',
    role: 'Lead Architect',
    workstation: 'Localhost Mac',
  };

  const isCliLinked = !!settings?.onboardingCompleted && !!settings.selectedCli;

  return (
    <header className="h-13 shrink-0 bg-slate-950 px-4 flex items-center justify-between select-none z-30">
      <div className="flex items-center gap-2 text-slate-200">
        <Plane className="w-4 h-4 -rotate-45" strokeWidth={1.75} />
        <span className="text-sm font-medium">Atoosa Flight Control</span>
      </div>

      <div className="flex items-center gap-1">
        <button onClick={onOpenTerminal} className="icon-btn" title="Terminal" aria-label="Terminal">
          <Terminal className="w-4 h-4" strokeWidth={1.75} />
          {isCliLinked && <span className="dot bg-emerald-400 absolute top-1.5 right-1.5" />}
        </button>

        <button onClick={onOpenSettings} className="icon-btn" title="Settings" aria-label="Settings">
          <Settings className="w-4 h-4" strokeWidth={1.75} />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="icon-btn"
            title="Profile"
            aria-label="Profile"
            aria-expanded={showProfileMenu}
          >
            <User className="w-4 h-4" strokeWidth={1.75} />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-800 bg-slate-900 p-1.5 shadow-xl z-50 text-[13px]">
              <div className="px-2.5 py-2">
                <div className="text-slate-100 font-medium">{profile.name}</div>
                <div className="text-xs text-slate-400">{profile.role}</div>
              </div>
              <div className="my-1 border-t border-slate-800" />
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  onOpenOnboarding();
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-md text-slate-300 hover:bg-slate-800"
              >
                Terminal handshake
              </button>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  onOpenSettings();
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-md text-slate-300 hover:bg-slate-800"
              >
                Preferences
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
