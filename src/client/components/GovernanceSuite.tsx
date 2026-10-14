import React, { useState, useEffect } from 'react';
import {
  ScrollText,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Download,
  Flame,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import type { ProjectRecord } from '../../shared/types.ts';
import { api } from '../lib/api.ts';

interface GovernanceSuiteProps {
  project: ProjectRecord | null;
  onRefreshProject: () => void;
}

export const GovernanceSuite: React.FC<GovernanceSuiteProps> = ({ project, onRefreshProject }) => {
  const [selectedDoc, setSelectedDoc] = useState<'agent' | 'architecture' | 'rules'>('agent');
  const [agentContent, setAgentContent] = useState('');
  const [archContent, setArchContent] = useState('');
  const [rulesContent, setRulesContent] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<string | null>(null);

  // Initialize content from project recommendations or default templates
  useEffect(() => {
    if (project?.recommendation?.generatedFiles) {
      setAgentContent(project.recommendation.generatedFiles.agentMd);
      setArchContent(project.recommendation.generatedFiles.architectureMd);
      setRulesContent(project.recommendation.generatedFiles.flightRulesMd);
    } else {
      // Default template
      const maxLines = project?.interview?.maxLinesPerFile || 500;
      setAgentContent(`# AGENT.md - Autonomous Flight Instructions
# Project: ${project?.name || 'Atoosa Flight Target'}

## Non-Negotiable Flight Rules
1. **File Size Ceiling**: NEVER write or edit code files exceeding **${maxLines} lines of code**. If a file approaches this limit, immediately decompose into modular sub-packages.
2. **Architecture**: Modular Hexagonal Domain Architecture.
3. **TDD Protocol**: Always write failing unit tests before creating implementation logic.
4. **Context Window Protection**: Never ingest whole repositories blindly; read isolated module interfaces and types.
`);
      setArchContent(`# ARCHITECTURE.md - ${project?.name || 'System Architecture'}

## 1. Overview
Target Project governed by Atoosa Flight Control Tower.

## 2. Directory Structure
\`\`\`
src/
  ├── modules/     # Modular domain feature slices (max 500 lines per file)
  ├── shared/      # Shared utilities and types
  └── main         # Bootstrap
tests/             # Unit and integration test suites
\`\`\`
`);
      setRulesContent(`# FLIGHT_RULES.md - Software Engineering Checklist

- [ ] All code files under ${maxLines} lines
- [ ] Test suites passing with high coverage
- [ ] No hardcoded secrets or credentials
- [ ] Clean git commit history
`);
    }
  }, [project]);

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <ScrollText className="w-16 h-16 text-slate-700 mx-auto mb-4 stroke-1" />
        <h2 className="text-xl font-bold text-white mb-2 font-mono">No Active Flight Selected</h2>
        <p className="text-slate-400 text-xs">
          Please select a project to view and deploy governance rulebooks.
        </p>
      </div>
    );
  }

  const handleDeployToProject = async () => {
    setIsDeploying(true);
    setDeployResult(null);

    try {
      const res = await api.emitGovernance(
        project.path,
        [
          { filename: 'AGENT.md', content: agentContent },
          { filename: 'ARCHITECTURE.md', content: archContent },
          { filename: 'FLIGHT_RULES.md', content: rulesContent },
        ],
        true
      );

      if (res.success) {
        setDeployResult(`Successfully deployed ${res.writtenFiles?.join(', ')} to target repository!`);
        // Re-scan to update telemetry
        await api.scanProject(project.path, project.id);
        onRefreshProject();
      } else {
        alert(`Deployment failed: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Deployment failed: ${err.message}`);
    } finally {
      setIsDeploying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <ScrollText className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-mono uppercase text-slate-400">Flight Governance & Rules Suite</span>
          </div>
          <h1 className="text-2xl font-bold text-white font-mono mt-1">{project.name} Governance</h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-xl">{project.path}</p>
        </div>

        <button
          onClick={handleDeployToProject}
          disabled={isDeploying}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-medium text-xs shadow-md shadow-emerald-600/20"
        >
          {isDeploying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          <span>{isDeploying ? 'Deploying...' : 'Deploy Rulebooks to Project'}</span>
        </button>
      </div>

      {deployResult && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{deployResult}</span>
        </div>
      )}

      {/* Editor & Document Tabs */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        {/* Document Switcher */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-950/80">
          <div className="flex space-x-2">
            {[
              { id: 'agent', label: 'AGENT.md (AI Rules)' },
              { id: 'architecture', label: 'ARCHITECTURE.md (Blueprint)' },
              { id: 'rules', label: 'FLIGHT_RULES.md (Checklist)' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDoc(d.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                  selectedDoc === d.id
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              const content = selectedDoc === 'agent' ? agentContent : selectedDoc === 'architecture' ? archContent : rulesContent;
              copyToClipboard(content);
            }}
            className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded border border-slate-800"
          >
            <Copy className="w-3 h-3" />
            <span>Copy</span>
          </button>
        </div>

        {/* Editor Area */}
        <div className="p-6">
          <textarea
            rows={18}
            value={selectedDoc === 'agent' ? agentContent : selectedDoc === 'architecture' ? archContent : rulesContent}
            onChange={(e) => {
              if (selectedDoc === 'agent') setAgentContent(e.target.value);
              else if (selectedDoc === 'architecture') setArchContent(e.target.value);
              else setRulesContent(e.target.value);
            }}
            className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-slate-200 font-mono text-xs leading-relaxed focus:outline-none focus:border-sky-500/80 resize-y"
          />
        </div>
      </div>
    </div>
  );
};
