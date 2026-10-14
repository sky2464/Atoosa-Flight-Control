import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { ProjectRecord } from '../../shared/types.ts';
import { api } from '../lib/api.ts';
import { PageHeader } from './ui/PageHeader.tsx';
import { EmptyState, Stat } from './ui/EmptyState.tsx';

interface TelemetryRadarProps {
  project: ProjectRecord | null;
  onRefreshProject: () => void;
  onNavigateGovernance: () => void;
}

export const TelemetryRadar: React.FC<TelemetryRadarProps> = ({
  project,
  onRefreshProject,
  onNavigateGovernance,
}) => {
  const [isScanning, setIsScanning] = useState(false);

  if (!project) {
    return (
      <EmptyState
        title="No project selected"
        description="Choose a project from the picker at the top of the sidebar, or attach one under Flights."
      />
    );
  }

  const telemetry = project.telemetry;
  const over500 = telemetry?.filesOver500Lines || [];
  const score = telemetry?.flightScore ?? 100;
  const scoreDot = score >= 75 ? 'bg-emerald-400' : score >= 50 ? 'bg-amber-400' : 'bg-rose-400';

  const handleRescan = async () => {
    setIsScanning(true);
    try {
      await api.scanProject(project.path, project.id);
      onRefreshProject();
    } catch (err: any) {
      alert(`Scan failed: ${err.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  const signals: { label: string; value: string; ok?: boolean }[] = [
    { label: 'Git', value: telemetry?.hasGit ? telemetry.gitBranch || 'main' : 'Not initialized', ok: telemetry?.hasGit },
    { label: 'Containers', value: telemetry?.dockerSetup.detected ? 'Docker' : 'Bare metal' },
    { label: 'AGENT.md', value: telemetry?.governanceFiles.hasAgentMd ? 'Installed' : 'Missing', ok: telemetry?.governanceFiles.hasAgentMd },
    {
      label: 'Architecture',
      value: telemetry?.governanceFiles.hasArchitectureMd ? 'Installed' : 'Missing',
      ok: telemetry?.governanceFiles.hasArchitectureMd,
    },
  ];

  return (
    <div className="page">
      <PageHeader
        title={project.name}
        subtitle={<span className="font-mono text-xs">{project.path}</span>}
        action={
          <div className="flex items-center gap-2">
            <button onClick={handleRescan} disabled={isScanning} className="btn-ghost">
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? 'Scanning…' : 'Rescan'}
            </button>
            <button onClick={onNavigateGovernance} className="btn-ghost">
              Rules
            </button>
          </div>
        }
      />

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        <Stat label="Flight score" value={`${score}`} hint={telemetry?.flightHealthStatus || 'Normal'} dot={scoreDot} />
        <Stat
          label="Over 500 lines"
          value={over500.length}
          hint={over500.length > 0 ? 'Needs splitting' : 'All within limit'}
          dot={over500.length > 0 ? 'bg-amber-400' : 'bg-emerald-400'}
        />
        <Stat
          label="Code size"
          value={<span className="font-mono">{(telemetry?.totalLines || 0).toLocaleString()}</span>}
          hint={`${telemetry?.totalFiles || 0} files`}
        />
        <Stat
          label="Tests"
          value={telemetry?.testSetup.detected ? `${telemetry.testSetup.testFilesCount}` : 'None'}
          hint={telemetry?.testSetup.framework || 'No framework detected'}
          dot={telemetry?.testSetup.detected ? 'bg-emerald-400' : 'bg-rose-400'}
        />
      </section>

      {/* 500-line gate */}
      <section className="space-y-3">
        <div>
          <h2 className="section-title">500-line gate</h2>
          <p className="text-[13px] text-slate-400 mt-0.5">
            Files stay under 500 lines so AI prompts keep a precise context.
          </p>
        </div>

        {over500.length === 0 ? (
          <p className="py-6 text-sm text-slate-400 flex items-center gap-2">
            <span className="dot bg-emerald-400" />
            Every scanned file is within the limit.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="text-xs text-slate-400 border-b border-slate-800/60">
                <tr>
                  <th className="py-2 pr-4 font-normal">File</th>
                  <th className="py-2 pr-4 font-normal">Lines</th>
                  <th className="py-2 pr-4 font-normal">Size</th>
                  <th className="py-2 font-normal">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {over500.map((f, i) => (
                  <tr key={i}>
                    <td className="py-2.5 pr-4 font-mono text-xs text-slate-200 truncate max-w-md" title={f.path}>
                      {f.relativePath}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-slate-300">{f.lineCount}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-slate-400">{(f.byteSize / 1024).toFixed(1)} KB</td>
                    <td className="py-2.5">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-300 capitalize">
                        <span className={`dot ${f.warningLevel === 'critical' ? 'bg-rose-400' : 'bg-amber-400'}`} />
                        {f.warningLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-slate-400">
              Move helpers, types and domain logic into their own modules.
            </p>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Languages */}
        <div className="space-y-4">
          <h2 className="section-title">Languages</h2>
          <div className="space-y-3">
            {Object.entries(telemetry?.languageBreakdown || {}).map(([lang, stats]) => (
              <div key={lang} className="space-y-1.5">
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-300">{lang}</span>
                  <span className="text-slate-400 font-mono text-xs">
                    {stats.percentage}% · {stats.lines.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-slate-800/60 rounded-full h-1 overflow-hidden">
                  <div className="bg-sky-400 h-1 rounded-full" style={{ width: `${stats.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stack signals */}
        <div className="space-y-4">
          <h2 className="section-title">Stack</h2>
          <dl className="divide-y divide-slate-800/60 text-[13px]">
            {signals.map((s) => (
              <div key={s.label} className="flex items-center justify-between py-2.5">
                <dt className="text-slate-400">{s.label}</dt>
                <dd className="flex items-center gap-2 text-slate-200">
                  {s.ok === false && <span className="dot bg-amber-400" />}
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
          {telemetry?.detectedFrameworks && telemetry.detectedFrameworks.length > 0 && (
            <p className="text-[13px] text-slate-400">
              Frameworks: <span className="text-slate-200">{telemetry.detectedFrameworks.join(', ')}</span>
            </p>
          )}
        </div>
      </section>
    </div>
  );
};
