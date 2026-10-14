import React from 'react';
import type { PreFlightInterview } from '../../../shared/types.ts';

interface StepArchitectureProps {
  containerPreference: PreFlightInterview['containerPreference'];
  setContainerPreference: (v: PreFlightInterview['containerPreference']) => void;
  selectedLanguages: string[];
  toggleLanguage: (lang: string) => void;
  maxLinesPerFile: number;
  setMaxLinesPerFile: (v: number) => void;
  testingStrategy: PreFlightInterview['testingStrategy'];
  setTestingStrategy: (v: PreFlightInterview['testingStrategy']) => void;
  securityTier: PreFlightInterview['securityTier'];
  setSecurityTier: (v: PreFlightInterview['securityTier']) => void;
  onBack: () => void;
  onNext: () => void;
}

export const StepArchitecture: React.FC<StepArchitectureProps> = ({
  containerPreference,
  setContainerPreference,
  selectedLanguages,
  toggleLanguage,
  maxLinesPerFile,
  setMaxLinesPerFile,
  testingStrategy,
  setTestingStrategy,
  securityTier,
  setSecurityTier,
  onBack,
  onNext,
}) => {
  const containerOptions = [
    { id: 'undecided', label: 'Let AI decide', desc: 'Based on scale' },
    { id: 'bare-metal', label: 'Bare metal', desc: 'Fast local reload' },
    { id: 'docker', label: 'Docker', desc: 'Multi-stage Dockerfile' },
    { id: 'docker-compose', label: 'Compose', desc: 'App + database' },
  ];

  return (
    <div className="space-y-8">
      <fieldset className="space-y-2">
        <legend className="text-[13px] text-slate-400 mb-2">Containers</legend>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {containerOptions.map((opt) => {
            const active = containerPreference === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setContainerPreference(opt.id as any)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  active ? 'border-sky-400 text-slate-100' : 'border-slate-800/60 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="text-[13px]">{opt.label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{opt.desc}</div>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-[13px] text-slate-400 mb-2">Languages</legend>
        <div className="flex flex-wrap gap-2">
          {['TypeScript', 'Python', 'Go', 'Rust', 'Java', 'C#', 'SQL'].map((lang) => {
            const active = selectedLanguages.includes(lang);
            return (
              <button
                key={lang}
                type="button"
                onClick={() => toggleLanguage(lang)}
                aria-pressed={active}
                className={`h-8 px-3 rounded-md border text-[13px] transition-colors ${
                  active ? 'border-sky-400 text-slate-100' : 'border-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                {lang}
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="block space-y-2">
        <span className="flex items-center justify-between text-[13px]">
          <span className="text-slate-400">Max lines per file</span>
          <span className="font-mono text-slate-200">{maxLinesPerFile}</span>
        </span>
        <input
          type="range"
          min="200"
          max="1000"
          step="50"
          value={maxLinesPerFile}
          onChange={(e) => setMaxLinesPerFile(Number(e.target.value))}
          className="w-full accent-sky-400 cursor-pointer"
        />
        <span className="block text-xs text-slate-400">Small files keep AI prompts precise.</span>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block space-y-1.5">
          <span className="text-[13px] text-slate-400">Testing</span>
          <select value={testingStrategy} onChange={(e: any) => setTestingStrategy(e.target.value)} className="field bg-slate-950">
            <option value="tdd-strict">Strict TDD</option>
            <option value="balanced">Balanced</option>
            <option value="fast-prototype">Smoke tests only</option>
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-[13px] text-slate-400">Security</span>
          <select value={securityTier} onChange={(e: any) => setSecurityTier(e.target.value)} className="field bg-slate-950">
            <option value="strict">Strict</option>
            <option value="regulated">Regulated</option>
            <option value="standard">Standard</option>
          </select>
        </label>
      </div>

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-ghost">
          Back
        </button>
        <button onClick={onNext} className="btn-primary">
          Run analysis
        </button>
      </div>
    </div>
  );
};
