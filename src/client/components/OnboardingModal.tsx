import React, { useState, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';
import type { DetectedCLI, AppSettings } from '../../shared/types.ts';
import { api } from '../lib/api.ts';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted: (settings: AppSettings) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onCompleted,
}) => {
  const [clis, setClis] = useState<DetectedCLI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCli, setSelectedCli] = useState<string>('claude-cli');
  const [customPath, setCustomPath] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; version?: string; error?: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [callsign, setCallsign] = useState('TOWER-1');
  const [commanderName, setCommanderName] = useState('Flight Commander');

  const scanCLIs = async () => {
    setIsLoading(true);
    try {
      const detected = await api.getCLIs();
      setClis(detected);

      // Pre-select the first available tool (antigravity, claude, codex, cursor, etc.)
      const firstAvailable = detected.find((c) => c.available);
      if (firstAvailable) {
        setSelectedCli(firstAvailable.id);
        if (firstAvailable.path) setCustomPath(firstAvailable.path);
      }
    } catch (err: any) {
      console.error('Failed to probe CLIs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      scanCLIs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestHandshake = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await api.testConnection(selectedCli, customPath || undefined);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleFinish = async () => {
    try {
      const res = await api.completeOnboarding({
        selectedCli,
        claudeCliPath: customPath || undefined,
        profile: {
          name: commanderName.trim() || 'Flight Commander',
          callsign: callsign.trim() || 'TOWER-1',
          role: 'Lead Architect',
          workstation: 'Localhost Mac',
        },
      });

      if (res.success) {
        onCompleted(res.settings);
        onClose();
      }
    } catch (err: any) {
      alert(`Onboarding failed: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-6 relative">
        <button onClick={onClose} className="icon-btn absolute top-4 right-4" title="Close" aria-label="Close">
          <X className="w-4 h-4" strokeWidth={1.75} />
        </button>

        <div className="space-y-1.5 pr-8">
          <h2 className="text-base font-medium text-slate-100">Connect Local AI Co-pilot</h2>
          <p className="text-[13px] leading-relaxed text-slate-400">
            Flight Control links directly to your local coding tools (Google Antigravity, Claude Code, OpenAI Codex, Cursor, GitHub Copilot, or Ollama) using your existing local accounts. Zero API keys required.
          </p>
        </div>

        <section className="space-y-2">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-slate-400">Found on this machine</span>
            <button onClick={scanCLIs} className="icon-btn" title="Rescan" aria-label="Rescan">
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} strokeWidth={1.75} />
            </button>
          </div>

          <div className="divide-y divide-slate-800/60 border-y border-slate-800/60">
            {clis.map((cli) => {
              const isSelected = selectedCli === cli.id;
              return (
                <label
                  key={cli.id}
                  className={`flex items-center gap-3 py-3 ${cli.available ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                >
                  <input
                    type="radio"
                    name="selectedCli"
                    checked={isSelected}
                    onChange={() => {
                      setSelectedCli(cli.id);
                      setCustomPath(cli.path || '');
                      setTestResult(null);
                    }}
                    disabled={!cli.available}
                    className="accent-sky-400"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-[13px] text-slate-100">
                      {cli.name}
                      {cli.available && <span className="dot bg-emerald-400" title="Ready" />}
                    </div>
                    <div className="text-xs text-slate-400 font-mono truncate">
                      {cli.available ? `${cli.version || 'Installed'} · ${cli.path}` : 'Not found'}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </section>

        <section className="flex items-center justify-between gap-4 text-[13px]">
          <span className="min-w-0 truncate text-slate-300">
            {testResult ? (
              <span className="flex items-center gap-2">
                <span className={`dot ${testResult.success ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                {testResult.success ? `Connected${testResult.version ? ` · ${testResult.version}` : ''}` : testResult.error}
              </span>
            ) : (
              <span className="text-slate-400">Check that the tool responds.</span>
            )}
          </span>
          <button onClick={handleTestHandshake} disabled={isTesting} className="btn-ghost shrink-0">
            {isTesting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            {isTesting ? 'Testing…' : 'Test connection'}
          </button>
        </section>

        <div className="grid grid-cols-2 gap-3 text-[13px]">
          <label className="block space-y-1.5">
            <span className="text-slate-400">Your name</span>
            <input type="text" value={commanderName} onChange={(e) => setCommanderName(e.target.value)} className="field" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-slate-400">Callsign</span>
            <input type="text" value={callsign} onChange={(e) => setCallsign(e.target.value)} className="field uppercase" />
          </label>
        </div>

        <div className="flex items-center justify-between">
          <button onClick={onClose} className="btn-ghost">
            Skip for now
          </button>
          <button onClick={handleFinish} className="btn-primary">
            Finish setup
          </button>
        </div>
      </div>
    </div>
  );
};
