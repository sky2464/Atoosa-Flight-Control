import type { ModuleDescriptor } from '../../shared/types.ts';

export const MODULE_REGISTRY: ModuleDescriptor[] = [
  {
    id: 'scanner',
    name: 'Radar & Telemetry Scanner',
    category: 'scanner',
    version: '0.1.0',
    status: 'active',
    description: 'Non-destructive soft-read engine, 500-line warning gate, dependency parser, and flight health scoring.',
    author: 'Atoosa Flight Control',
  },
  {
    id: 'discovery',
    name: 'Pre-Flight Discovery Engine',
    category: 'discovery',
    version: '0.1.0',
    status: 'active',
    description: '360° deep requirements interview, tech stack recommendation, Docker evaluation matrix, and prompt improvement.',
    author: 'Atoosa Flight Control',
  },
  {
    id: 'governance',
    name: 'Governance & Rulebook Emitter',
    category: 'governance',
    version: '0.1.0',
    status: 'active',
    description: 'Generates clean AGENT.md, ARCHITECTURE.md, and FLIGHT_RULES.md with zero runtime clutter in target projects.',
    author: 'Atoosa Flight Control',
  },
  {
    id: 'ai-bridge',
    name: 'Universal AI Bridge',
    category: 'core',
    version: '0.1.0',
    status: 'active',
    description: 'Native Bun.spawn streaming bridge supporting Claude Code CLI, Ollama, and Cloud BYOK providers.',
    author: 'Atoosa Flight Control',
  },
  {
    id: 'project-manager',
    name: 'Project Manager Tower (Agile/Milestones)',
    category: 'project-management',
    version: '0.1.1',
    status: 'beta',
    description: 'Pluggable module for sprint planning, task dependencies, milestone gates, and AI-assisted burndown.',
    author: 'Atoosa Flight Control',
  },
  {
    id: 'security-tower',
    name: 'Security & Dependency Sentinel',
    category: 'security',
    version: '0.1.2-slot',
    status: 'planned',
    description: 'Automated secret detection, CVE vulnerability scanning, and license compliance audits.',
    author: 'Atoosa Flight Control',
  },
  {
    id: 'math-logic-gate',
    name: 'CS Mathematical & Logic Verification',
    category: 'logic-engine',
    version: '0.1.3-slot',
    status: 'planned',
    description: 'Formal verification helper, edge-case checker, state machine invariant validation.',
    author: 'Atoosa Flight Control',
  },
  {
    id: 'ast-context-graph',
    name: 'AST Symbol & Context Graph Map',
    category: 'core',
    version: '0.1.4-slot',
    status: 'planned',
    description: 'Interactive class/function dependency graph to shrink context windows for autonomous coding agents.',
    author: 'Atoosa Flight Control',
  },
];

export function getModules(): ModuleDescriptor[] {
  return MODULE_REGISTRY;
}
