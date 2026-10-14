import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { AppSettings } from '../../shared/types.ts';
import { api } from '../lib/api.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings | null;
  onSaved: (updated: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaved,
}) => {
  const [provider, setProvider] = useState<AppSettings['activeProvider']>(
    settings?.activeProvider || 'claude-cli'
  );
  const [claudePath, setClaudePath] = useState(
    settings?.claudeCliPath || '/Users/chicademy/.local/bin/claude'
  );
  const [ollamaEndpoint, setOllamaEndpoint] = useState(
    settings?.ollamaEndpoint || 'http://localhost:11434'
  );
  const [ollamaModel, setOllamaModel] = useState(
    settings?.ollamaModel || 'llama3:latest'
  );
  const [name, setName] = useState(settings?.profile?.name || 'Flight Commander');
  const [callsign, setCallsign] = useState(settings?.profile?.callsign || 'TOWER-1');

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      const updated = await api.saveAISettings({
        activeProvider: provider,
        selectedCli: provider,
        claudeCliPath: claudePath,
        ollamaEndpoint,
        ollamaModel,
        profile: {
          name,
          callsign,
          role: 'Lead Architect',
          workstation: 'Localhost Mac',
        },
      });

      onSaved(updated);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 600);
    } catch (err: any) {
      alert(`Failed to save settings: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const providers = [
    { id: 'claude-cli', label: 'Claude Code' },
    { id: 'ollama', label: 'Ollama' },
    { id: 'system', label: 'Built-in' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-6 relative">
        <button onClick={onClose} className="icon-btn absolute top-4 right-4" title="Close" aria-label="Close">
          <X className="w-4 h-4" strokeWidth={1.75} />
        </button>

        <h2 className="text-base font-medium text-slate-100">Settings</h2>

        <form onSubmit={handleSave} className="space-y-6 text-[13px]">
          <fieldset className="space-y-2">
            <legend className="text-slate-400 mb-2">AI engine</legend>
            <div className="grid grid-cols-3 gap-2">
              {providers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProvider(p.id as any)}
                  aria-pressed={provider === p.id}
                  className={`h-9 rounded-lg border transition-colors ${
                    provider === p.id ? 'border-sky-400 text-slate-100' : 'border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </fieldset>

          {provider === 'claude-cli' && (
            <label className="block space-y-1.5">
              <span className="text-slate-400">Claude Code binary</span>
              <input
                type="text"
                value={claudePath}
                onChange={(e) => setClaudePath(e.target.value)}
                placeholder="~/.local/bin/claude"
                className="field font-mono text-[13px]"
              />
              <span className="block text-xs text-slate-400">Runs locally. No API keys needed.</span>
            </label>
          )}

          {provider === 'ollama' && (
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="text-slate-400">Endpoint</span>
                <input type="text" value={ollamaEndpoint} onChange={(e) => setOllamaEndpoint(e.target.value)} className="field font-mono text-[13px]" />
              </label>
              <label className="block space-y-1.5">
                <span className="text-slate-400">Model</span>
                <input type="text" value={ollamaModel} onChange={(e) => setOllamaModel(e.target.value)} className="field font-mono text-[13px]" />
              </label>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-slate-400">Name</span>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="field" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-slate-400">Callsign</span>
              <input type="text" value={callsign} onChange={(e) => setCallsign(e.target.value)} className="field uppercase" />
            </label>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-300">
              {savedSuccess && (
                <>
                  <span className="dot bg-emerald-400" />
                  Saved
                </>
              )}
            </span>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="btn-ghost">
                Cancel
              </button>
              <button type="submit" disabled={isSaving} className="btn-primary">
                {isSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
