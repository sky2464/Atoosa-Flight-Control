import React from 'react';
import { RefreshCw } from 'lucide-react';

interface StepLaunchpadProps {
  targetFolder: string;
  setTargetFolder: (v: string) => void;
  isScaffolding: boolean;
  scaffoldSuccess: string[] | null;
  onBack: () => void;
  onScaffold: () => void;
}

export const StepLaunchpad: React.FC<StepLaunchpadProps> = ({
  targetFolder,
  setTargetFolder,
  isScaffolding,
  scaffoldSuccess,
  onBack,
  onScaffold,
}) => {
  const files = [
    { name: 'AGENT.md', desc: 'Rules for coding agents' },
    { name: 'ARCHITECTURE.md', desc: 'System blueprint and decisions' },
    { name: 'FLIGHT_RULES.md', desc: 'Pre-flight and landing checklist' },
  ];

  return (
    <div className="space-y-8">
      <label className="block space-y-1.5">
        <span className="text-[13px] text-slate-400">Project folder</span>
        <input
          type="text"
          placeholder="/Users/you/Code/my-new-project"
          value={targetFolder}
          onChange={(e) => setTargetFolder(e.target.value)}
          className="field font-mono text-[13px]"
          required
        />
      </label>

      <section className="space-y-3">
        <p className="text-[13px] leading-relaxed text-slate-400">
          Only these three markdown files are written. No dependencies or tooling are copied into your project.
        </p>
        <ul className="divide-y divide-slate-800/60 border-y border-slate-800/60 text-[13px]">
          {files.map((f) => (
            <li key={f.name} className="flex items-center justify-between py-2.5">
              <span className="font-mono text-xs text-slate-200">{f.name}</span>
              <span className="text-slate-400">{f.desc}</span>
            </li>
          ))}
        </ul>
      </section>

      {scaffoldSuccess && (
        <p className="flex items-center gap-2 text-[13px] text-slate-300">
          <span className="dot bg-emerald-400" />
          Wrote {scaffoldSuccess.join(', ')}. Registering the flight…
        </p>
      )}

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-ghost">
          Back
        </button>
        <button disabled={isScaffolding || !targetFolder.trim()} onClick={onScaffold} className="btn-primary">
          {isScaffolding && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
          {isScaffolding ? 'Launching…' : 'Create and launch'}
        </button>
      </div>
    </div>
  );
};
