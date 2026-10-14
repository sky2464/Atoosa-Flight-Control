import React from 'react';
import type { PreFlightInterview } from '../../../shared/types.ts';

interface StepMissionProps {
  projectName: string;
  setProjectName: (v: string) => void;
  projectMission: string;
  setProjectMission: (v: string) => void;
  targetAudience: string;
  setTargetAudience: (v: string) => void;
  scaleAndTraffic: PreFlightInterview['scaleAndTraffic'];
  setScaleAndTraffic: (v: PreFlightInterview['scaleAndTraffic']) => void;
  onNext: () => void;
  onCancel: () => void;
}

export const StepMission: React.FC<StepMissionProps> = ({
  projectName,
  setProjectName,
  projectMission,
  setProjectMission,
  targetAudience,
  setTargetAudience,
  scaleAndTraffic,
  setScaleAndTraffic,
  onNext,
  onCancel,
}) => {
  return (
    <div className="space-y-8">
      <div className="space-y-5">
        <label className="block space-y-1.5">
          <span className="text-[13px] text-slate-400">Project name</span>
          <input
            type="text"
            placeholder="Acme core engine"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="field"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-[13px] text-slate-400">Mission</span>
          <textarea
            rows={5}
            placeholder="What the system is for, the main user journeys, and any scale or latency needs."
            value={projectMission}
            onChange={(e) => setProjectMission(e.target.value)}
            className="field h-auto py-2 leading-relaxed"
          />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block space-y-1.5">
            <span className="text-[13px] text-slate-400">Audience</span>
            <input
              type="text"
              placeholder="Internal ops, traders, public"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="field"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-[13px] text-slate-400">Scale</span>
            <select value={scaleAndTraffic} onChange={(e: any) => setScaleAndTraffic(e.target.value)} className="field bg-slate-950">
              <option value="prototype">Prototype</option>
              <option value="internal-tool">Internal tool</option>
              <option value="production-standard">Production</option>
              <option value="high-throughput-enterprise">Enterprise, strict SLAs</option>
            </select>
          </label>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button onClick={onCancel} className="btn-ghost">
          Cancel
        </button>
        <button disabled={!projectMission.trim()} onClick={onNext} className="btn-primary">
          Continue
        </button>
      </div>
    </div>
  );
};
