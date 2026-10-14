import React, { useState } from 'react';
import {
  Settings,
  X,
  Cpu,
  Terminal,
  Key,
  CheckCircle2,
  Save,
} from 'lucide-react';
import type { AISettings } from '../../shared/types.ts';
import { api } from '../lib/api.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AISettings | null;
  onSaved: (updated: AISettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaved,
}) => {
  const [provider, setProvider] = useState<AISettings['activeProvider']>(
    settings?.activeProvider || 'system'
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
  const [geminiKey, setGeminiKey] = useState(settings?.geminiApiKey || '');
  const [openaiKey, setOpenaiKey] = useState(settings?.openaiApiKey || '');
  const [anthropicKey, setAnthropicKey] = useState(settings?.anthropicApiKey || '');

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
        claudeCliPath: claudePath,
        ollamaEndpoint,
        ollamaModel,
        geminiApiKey: geminiKey,
        openaiApiKey: openaiKey,
        anthropicApiKey: anthropicKey,
      });

      onSaved(updated);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 700);
    } catch (err: any) {
      alert(`Failed to save settings: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-sky-400" />
          <h2 className="text-lg font-bold text-white font-mono">Flight AI Engine Configuration</h2>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs font-mono">
          <div>
            <label className="block text-slate-400 mb-1.5 uppercase tracking-wider text-[11px]">
              Active AI Provider:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'system', label: 'Built-in Flight Engine' },
                { id: 'claude-cli', label: 'Claude Code CLI' },
                { id: 'ollama', label: 'Local Ollama' },
                { id: 'gemini', label: 'Google Gemini (BYOK)' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProvider(p.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    provider === p.id
                      ? 'border-sky-500 bg-sky-500/10 text-white font-bold'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Claude CLI path */}
          {provider === 'claude-cli' && (
            <div className="space-y-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-300 font-bold block flex items-center space-x-1.5">
                <Terminal className="w-4 h-4 text-sky-400" />
                <span>Claude Code CLI Binary Path</span>
              </span>
              <input
                type="text"
                value={claudePath}
                onChange={(e) => setClaudePath(e.target.value)}
                placeholder="/Users/chicademy/.local/bin/claude"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-sky-500 text-[11px]"
              />
              <p className="text-[10px] text-slate-500">
                Spawns locally with your existing Claude subscription credentials via Bun.spawn.
              </p>
            </div>
          )}

          {/* Ollama Endpoint */}
          {provider === 'ollama' && (
            <div className="space-y-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-300 font-bold block flex items-center space-x-1.5">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span>Local Ollama Server</span>
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">Endpoint:</label>
                  <input
                    type="text"
                    value={ollamaEndpoint}
                    onChange={(e) => setOllamaEndpoint(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-[11px]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">Model Name:</label>
                  <input
                    type="text"
                    value={ollamaModel}
                    onChange={(e) => setOllamaModel(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-[11px]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* API Keys (Optional) */}
          <div className="space-y-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 font-bold block flex items-center space-x-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Cloud API Keys (Optional BYOK)</span>
            </span>
            <div>
              <label className="text-[10px] text-slate-500 block mb-0.5">Gemini API Key:</label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-[11px]"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            {savedSuccess ? (
              <span className="text-emerald-400 text-xs flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Settings saved!</span>
              </span>
            ) : (
              <span></span>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium shadow-md shadow-sky-600/20"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
