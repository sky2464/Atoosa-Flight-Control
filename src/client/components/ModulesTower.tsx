import React, { useState, useEffect } from 'react';
import {
  Boxes,
  CheckCircle2,
  Clock,
  Sparkles,
  Shield,
  Binary,
  GitGraph,
  ArrowRight,
  Code2,
} from 'lucide-react';
import type { ModuleDescriptor } from '../../shared/types.ts';
import { api } from '../lib/api.ts';

export const ModulesTower: React.FC = () => {
  const [modules, setModules] = useState<ModuleDescriptor[]>([]);

  useEffect(() => {
    api.getModules().then(setModules);
  }, []);

  const getIcon = (category: string) => {
    switch (category) {
      case 'security':
        return <Shield className="w-5 h-5 text-rose-400" />;
      case 'logic-engine':
        return <Binary className="w-5 h-5 text-amber-400" />;
      default:
        return <Boxes className="w-5 h-5 text-sky-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center space-x-2">
          <Boxes className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-mono uppercase text-slate-400">Modular Architecture Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1">Modules & Extensibility Tower</h1>
        <p className="text-xs text-slate-400 font-mono mt-1 max-w-2xl leading-relaxed">
          Atoosa Flight Control is built with a pluggable slot architecture. You can easily add new modules (e.g. security audits,
          mathematical logic checkers, custom linters) post-MVP without refactoring core systems.
        </p>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {modules.map((m) => (
          <div
            key={m.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  {getIcon(m.category)}
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                    m.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : m.status === 'beta'
                      ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {m.status}
                </span>
              </div>

              <h3 className="font-bold text-white text-base font-mono">{m.name}</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{m.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>Category: {m.category}</span>
              <span>v{m.version}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Developer Extension Guide */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950/60 space-y-3 font-mono text-xs">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Code2 className="w-4 h-4 text-sky-400" />
          <span>How to Add a New Module to Flight Control</span>
        </h3>
        <p className="text-slate-400 font-sans leading-relaxed text-xs">
          To add a new function (e.g. mathematical correctness proof, threat modeler, or AST graph visualizer):
        </p>
        <ol className="list-decimal list-inside space-y-1.5 text-slate-300 font-sans text-xs">
          <li>Create your backend service under <code className="text-sky-300">src/server/modules/your-module/</code>.</li>
          <li>Register your route in <code className="text-sky-300">src/server/index.ts</code>.</li>
          <li>Register the module metadata in <code className="text-sky-300">src/server/modules/registry.ts</code>.</li>
          <li>Add a navigation tab in <code className="text-sky-300">src/client/components/Navigation.tsx</code> and create your UI panel.</li>
        </ol>
      </div>
    </div>
  );
};
