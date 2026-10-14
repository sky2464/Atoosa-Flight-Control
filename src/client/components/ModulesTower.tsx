import React, { useState, useEffect } from 'react';
import type { ModuleDescriptor } from '../../shared/types.ts';
import { api } from '../lib/api.ts';
import { PageHeader } from './ui/PageHeader.tsx';

const statusDot: Record<string, string> = {
  active: 'bg-emerald-400',
  beta: 'bg-sky-400',
};

export const ModulesTower: React.FC = () => {
  const [modules, setModules] = useState<ModuleDescriptor[]>([]);

  useEffect(() => {
    api.getModules().then(setModules);
  }, []);

  return (
    <div className="page">
      <PageHeader
        title="Plugins"
        subtitle="Modules plug into slots, so new checks can be added without touching the core."
      />

      <ul className="divide-y divide-slate-800/60 border-y border-slate-800/60">
        {modules.map((m) => (
          <li key={m.id} className="flex items-start gap-4 py-4">
            <span className={`dot mt-2 ${statusDot[m.status] || 'bg-amber-400'}`} title={m.status} />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <h2 className="text-sm text-slate-100">{m.name}</h2>
                <span className="text-xs text-slate-400 capitalize">{m.status}</span>
              </div>
              <p className="mt-0.5 text-[13px] leading-relaxed text-slate-400">{m.description}</p>
            </div>
            <div className="shrink-0 text-right text-xs text-slate-400">
              <div>{m.category}</div>
              <div className="font-mono">v{m.version}</div>
            </div>
          </li>
        ))}
      </ul>

      <section className="space-y-3">
        <h2 className="section-title">Add a module</h2>
        <ol className="list-decimal list-inside space-y-1.5 text-[13px] text-slate-400">
          <li>
            Create the service in <code className="font-mono text-xs text-slate-300">src/server/modules/your-module/</code>.
          </li>
          <li>
            Register its route in <code className="font-mono text-xs text-slate-300">src/server/index.ts</code>.
          </li>
          <li>
            Add its metadata to <code className="font-mono text-xs text-slate-300">src/server/modules/registry.ts</code>.
          </li>
          <li>
            Add a menu entry in <code className="font-mono text-xs text-slate-300">src/client/components/Sidebar.tsx</code> and build its view.
          </li>
        </ol>
      </section>
    </div>
  );
};
