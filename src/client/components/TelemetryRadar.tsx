import React, { useState } from 'react';
import {
  Radar,
  AlertTriangle,
  CheckCircle2,
  FileCode,
  Layers,
  GitBranch,
  ShieldCheck,
  Server,
  RefreshCw,
  FolderTree,
  AlertOctagon,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';
import type { ProjectRecord, TelemetrySummary } from '../../shared/types.ts';
import { api } from '../lib/api.ts';

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
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Radar className="w-16 h-16 text-slate-700 mx-auto mb-4 animate-pulse stroke-1" />
        <h2 className="text-xl font-bold text-white mb-2 font-mono">No Active Flight Selected</h2>
        <p className="text-slate-400 text-xs max-w-md mx-auto">
          Select an active project from the top navigation bar or return to the Flight Deck to attach or launch a flight.
        </p>
      </div>
    );
  }

  const telemetry = project.telemetry;
  const over500 = telemetry?.filesOver500Lines || [];
  const score = telemetry?.flightScore ?? 100;

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Flight Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-mono uppercase text-slate-400">In-Flight Telemetry Radar</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1">{project.name}</h1>
          <p className="text-xs text-slate-400 font-mono truncate max-w-xl mt-0.5">{project.path}</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRescan}
            disabled={isScanning}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning...' : 'Re-Scan Runway'}</span>
          </button>
          <button
            onClick={onNavigateGovernance}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium transition-colors shadow-sm shadow-sky-600/20"
          >
            <span>Manage Rules</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Flight Health Indices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Score */}
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-mono block">Flight Health Index</span>
            <span className="text-3xl font-bold font-mono text-white mt-1 block">{score}/100</span>
            <span
              className={`text-[11px] font-semibold uppercase tracking-wider ${
                score >= 75 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-rose-400'
              }`}
            >
              {telemetry?.flightHealthStatus || 'Normal'} Condition
            </span>
          </div>
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center border font-mono font-bold ${
              score >= 75
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : score >= 50
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            <Radar className="w-7 h-7" />
          </div>
        </div>

        {/* 500-Line Metric */}
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-mono block">500-Line Code Violations</span>
            <span className={`text-3xl font-bold font-mono mt-1 block ${over500.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {over500.length}
            </span>
            <span className="text-[11px] text-slate-400">
              {over500.length > 0 ? 'Exceeds modular limit' : 'All files within limits'}
            </span>
          </div>
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
              over500.length > 0
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}
          >
            {over500.length > 0 ? <AlertTriangle className="w-7 h-7" /> : <CheckCircle2 className="w-7 h-7" />}
          </div>
        </div>

        {/* Code Volume */}
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-mono block">Total Codebase Size</span>
            <span className="text-2xl font-bold font-mono text-white mt-1 block">
              {telemetry?.totalLines.toLocaleString() || 0} <span className="text-xs font-normal text-slate-400">lines</span>
            </span>
            <span className="text-[11px] text-slate-400">{telemetry?.totalFiles || 0} scanned files</span>
          </div>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center border bg-sky-500/10 border-sky-500/30 text-sky-400">
            <FileCode className="w-7 h-7" />
          </div>
        </div>

        {/* TDD Protocol */}
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-mono block">TDD & Test Protocol</span>
            <span className="text-xl font-bold font-mono text-white mt-1 block">
              {telemetry?.testSetup.detected ? `${telemetry.testSetup.testFilesCount} Test Suites` : 'Unfulfilled'}
            </span>
            <span className="text-[11px] text-slate-400">
              {telemetry?.testSetup.framework || 'No framework detected'}
            </span>
          </div>
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
              telemetry?.testSetup.detected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            <ShieldCheck className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* CRITICAL RADAR SECTION: 500-Line Code Violations */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <AlertOctagon className={`w-5 h-5 ${over500.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`} />
            <div>
              <h2 className="text-lg font-bold text-white font-mono">
                Modular Code Limit Radar (500-Line Rule)
              </h2>
              <p className="text-xs text-slate-400">
                To keep LLM prompt contexts precise and prevent context degradation, files must not exceed 500 lines.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold border border-slate-800 bg-slate-950 text-slate-300">
            Rule: Max 500 Lines / File
          </span>
        </div>

        {over500.length === 0 ? (
          <div className="py-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/80">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <p className="text-slate-200 text-sm font-semibold font-mono">
              All scanned code files comply with the 500-line ceiling!
            </p>
            <p className="text-slate-500 text-xs mt-1">
              No files currently require modular decomposition.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between">
              <span>
                <strong>Action Required:</strong> {over500.length} file(s) exceed 500 lines. Recommend breaking down into sub-modules.
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">File Path</th>
                    <th className="py-2.5 px-3">Line Count</th>
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">Severity</th>
                    <th className="py-2.5 px-3">Decomposition Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {over500.map((f, i) => (
                    <tr key={i} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 text-slate-200 font-semibold truncate max-w-xs" title={f.path}>
                        {f.relativePath}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-amber-400">
                        {f.lineCount} lines
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {(f.byteSize / 1024).toFixed(1)} KB
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                            f.warningLevel === 'critical'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {f.warningLevel}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 text-[11px] font-sans">
                        Extract helper functions, types, and domain logic into separate dedicated modules.
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Language Breakdown & Environment Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Languages */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <h3 className="text-base font-bold text-white font-mono flex items-center space-x-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <span>Language Composition</span>
          </h3>

          <div className="space-y-3">
            {Object.entries(telemetry?.languageBreakdown || {}).map(([lang, stats]) => (
              <div key={lang} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300 font-medium">{lang}</span>
                  <span className="text-slate-400">
                    {stats.percentage}% ({stats.lines.toLocaleString()} lines)
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-sky-500 to-indigo-500 h-2 rounded-full"
                    style={{ width: `${stats.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stack & Governance Signals */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <h3 className="text-base font-bold text-white font-mono flex items-center space-x-2">
            <Server className="w-4 h-4 text-indigo-400" />
            <span>Stack Signals & Governance Checklist</span>
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 text-[10px] block uppercase">Git Repository</span>
              <span className="text-white font-semibold">
                {telemetry?.hasGit ? `Branch: ${telemetry.gitBranch || 'main'}` : 'Uninitialized'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 text-[10px] block uppercase">Containerization</span>
              <span className="text-white font-semibold">
                {telemetry?.dockerSetup.detected ? 'Dockerfile/Compose active' : 'Host / Bare metal'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 text-[10px] block uppercase">AGENT.md Rules</span>
              <span className={telemetry?.governanceFiles.hasAgentMd ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                {telemetry?.governanceFiles.hasAgentMd ? 'Installed' : 'Missing'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-500 text-[10px] block uppercase">Architecture Blueprint</span>
              <span className={telemetry?.governanceFiles.hasArchitectureMd ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                {telemetry?.governanceFiles.hasArchitectureMd ? 'Installed' : 'Missing'}
              </span>
            </div>
          </div>

          {/* Frameworks tags */}
          {telemetry?.detectedFrameworks && telemetry.detectedFrameworks.length > 0 && (
            <div className="pt-2">
              <span className="text-[11px] font-mono text-slate-400 block mb-1.5">Detected Frameworks:</span>
              <div className="flex flex-wrap gap-1.5">
                {telemetry.detectedFrameworks.map((f) => (
                  <span key={f} className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
