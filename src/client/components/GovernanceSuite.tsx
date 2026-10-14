import React, { useState, useEffect } from 'react';
import { Copy, RefreshCw } from 'lucide-react';
import type { ProjectRecord } from '../../shared/types.ts';
import { api } from '../lib/api.ts';
import { PageHeader } from './ui/PageHeader.tsx';
import { EmptyState } from './ui/EmptyState.tsx';

type DocKey = 'agent' | 'architecture' | 'rules';

interface GovernanceSuiteProps {
  project: ProjectRecord | null;
  onRefreshProject: () => void;
  initialDoc?: DocKey;
}

export const GovernanceSuite: React.FC<GovernanceSuiteProps> = ({ project, onRefreshProject, initialDoc = 'agent' }) => {
  const [selectedDoc, setSelectedDoc] = useState<DocKey>(initialDoc);
  const [agentContent, setAgentContent] = useState('');
  const [archContent, setArchContent] = useState('');
  const [rulesContent, setRulesContent] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<string | null>(null);

  // Follow the sidebar submenu (Agent rules / Architecture / Checklists)
  useEffect(() => setSelectedDoc(initialDoc), [initialDoc]);

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
      <EmptyState
        title="No project selected"
        description="Choose a project from the sidebar to edit and deploy its rulebooks."
      />
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
        setDeployResult(`Deployed ${res.writtenFiles?.join(', ')} to the project.`);
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

  const docs: { id: DocKey; label: string }[] = [
    { id: 'agent', label: 'AGENT.md' },
    { id: 'architecture', label: 'ARCHITECTURE.md' },
    { id: 'rules', label: 'FLIGHT_RULES.md' },
  ];
  const currentContent = selectedDoc === 'agent' ? agentContent : selectedDoc === 'architecture' ? archContent : rulesContent;

  return (
    <div className="page">
      <PageHeader
        title="Governance"
        subtitle={`Rulebooks for ${project.name}. Edit them here, then deploy into the project.`}
        action={
          <button onClick={handleDeployToProject} disabled={isDeploying} className="btn-primary">
            {isDeploying && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            {isDeploying ? 'Deploying…' : 'Deploy to project'}
          </button>
        }
      />

      {deployResult && (
        <p className="flex items-center gap-2 text-[13px] text-slate-300">
          <span className="dot bg-emerald-400" />
          {deployResult}
        </p>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/60">
          <div className="flex gap-6">
            {docs.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDoc(d.id)}
                className={`-mb-px pb-2.5 border-b-2 font-mono text-xs transition-colors ${
                  selectedDoc === d.id
                    ? 'border-sky-400 text-slate-100'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
          <button onClick={() => copyToClipboard(currentContent)} className="icon-btn mb-1" title="Copy" aria-label="Copy">
            <Copy className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        </div>

        <textarea
          rows={20}
          value={currentContent}
          onChange={(e) => {
            if (selectedDoc === 'agent') setAgentContent(e.target.value);
            else if (selectedDoc === 'architecture') setArchContent(e.target.value);
            else setRulesContent(e.target.value);
          }}
          className="w-full p-4 rounded-xl bg-transparent border border-slate-800/60 text-slate-200 font-mono text-xs leading-relaxed focus:outline-none focus:border-slate-600 resize-y"
        />
      </section>
    </div>
  );
};
