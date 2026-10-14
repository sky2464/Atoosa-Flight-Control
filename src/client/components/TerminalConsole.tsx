import React, { useState } from 'react';
import { Play, RefreshCw } from 'lucide-react';
import { api } from '../lib/api.ts';
import { PageHeader } from './ui/PageHeader.tsx';

interface TerminalConsoleProps {
  onRefresh?: () => void;
}

export const TerminalConsole: React.FC<TerminalConsoleProps> = ({ onRefresh }) => {
  const [selectedCommand, setSelectedCommand] = useState<string>('scan');
  const [customArgs, setCustomArgs] = useState<string>('.');
  const [output, setOutput] = useState<string>('Ready. Pick a command or type arguments, then Run.\n');
  const [isRunning, setIsRunning] = useState(false);

  const quickCommands: { cmd: string; defaultArgs: string; label: string }[] = [
    { cmd: 'scan', defaultArgs: '.', label: 'afc scan .' },
    { cmd: 'radar', defaultArgs: '.', label: 'afc radar .' },
    { cmd: 'connect', defaultArgs: '', label: 'afc connect' },
    { cmd: 'tasks', defaultArgs: 'list', label: 'afc tasks list' },
    { cmd: 'emit', defaultArgs: '.', label: 'afc emit .' },
    { cmd: 'help', defaultArgs: '', label: 'afc help' },
  ];

  const handleRun = async (cmdToRun = selectedCommand, argsToRun = customArgs) => {
    setIsRunning(true);
    setOutput((prev) => prev + `\n$ afc ${cmdToRun} ${argsToRun}\nExecuting on local engine...\n`);

    try {
      const splitArgs = argsToRun.trim() ? argsToRun.trim().split(/\s+/) : [];
      const res = await api.execCLI(cmdToRun, splitArgs);

      if (res.stdout) {
        setOutput((prev) => prev + res.stdout + '\n');
      }
      if (res.stderr) {
        setOutput((prev) => prev + '\x1b[31m' + res.stderr + '\x1b[0m\n');
      }

      setOutput((prev) => prev + `[Process exited with code ${res.exitCode}]\n`);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setOutput((prev) => prev + `\nError executing CLI: ${err.message}\n`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Terminal"
        subtitle={
          <>
            Run the local <code className="font-mono text-slate-300">afc</code> engine.
          </>
        }
        action={
          <button onClick={() => setOutput('')} className="btn-ghost">
            Clear
          </button>
        }
      />

      <section className="space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRun();
          }}
          className="flex items-center gap-2"
        >
          <span className="font-mono text-[13px] text-slate-400 pl-1">afc</span>
          <select
            value={selectedCommand}
            onChange={(e) => {
              setSelectedCommand(e.target.value);
              const found = quickCommands.find((q) => q.cmd === e.target.value);
              if (found) setCustomArgs(found.defaultArgs);
            }}
            className="field w-auto bg-slate-950 font-mono text-[13px]"
            aria-label="Command"
          >
            <option value="scan">scan</option>
            <option value="radar">radar</option>
            <option value="connect">connect</option>
            <option value="emit">emit</option>
            <option value="tasks">tasks</option>
            <option value="help">help</option>
          </select>

          <input
            type="text"
            value={customArgs}
            onChange={(e) => setCustomArgs(e.target.value)}
            placeholder="arguments, e.g. . or /path/to/project"
            className="field flex-1 font-mono text-[13px]"
            aria-label="Arguments"
          />

          <button type="submit" disabled={isRunning} className="btn-primary h-9">
            {isRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Run
          </button>
        </form>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {quickCommands.map((qc) => (
            <button
              key={qc.cmd}
              onClick={() => {
                setSelectedCommand(qc.cmd);
                setCustomArgs(qc.defaultArgs);
                handleRun(qc.cmd, qc.defaultArgs);
              }}
              disabled={isRunning}
              className="font-mono text-slate-400 hover:text-sky-400 disabled:opacity-50 transition-colors"
            >
              {qc.label}
            </button>
          ))}
        </div>
      </section>

      <div className="rounded-xl border border-slate-800/60 p-5 h-[460px] overflow-y-auto">
        <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-300">{output}</pre>
      </div>
    </div>
  );
};
