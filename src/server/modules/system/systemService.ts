import type { DetectedCLI } from '../../../shared/types.ts';
import { findExecutable, probeCommandVersion } from '../../engine/os/process.ts';

interface CLIProbe {
  id: string;
  name: string;
  command: string;
  defaultPaths: string[];
  versionFlag: string;
  description: string;
}

const PROBES: CLIProbe[] = [
  {
    id: 'claude-cli',
    name: 'Claude Code CLI',
    command: 'claude',
    defaultPaths: [],
    versionFlag: '--version',
    description: 'Anthropic Claude Code CLI running with your local account and active subscription.',
  },
  {
    id: 'ollama',
    name: 'Ollama Local LLM',
    command: 'ollama',
    defaultPaths: [],
    versionFlag: '--version',
    description: 'Local offline LLM runner (Llama 3, Mistral, Qwen, DeepSeek).',
  },
  {
    id: 'cursor',
    name: 'Cursor Agent CLI',
    command: 'cursor',
    defaultPaths: [],
    versionFlag: '--version',
    description: 'Cursor IDE agent CLI for local context navigation.',
  },
  {
    id: 'gh',
    name: 'GitHub CLI (gh / Copilot)',
    command: 'gh',
    defaultPaths: [],
    versionFlag: '--version',
    description: 'GitHub CLI with potential GitHub Copilot extension.',
  },
  {
    id: 'bun',
    name: 'Bun Runtime',
    command: 'bun',
    defaultPaths: [],
    versionFlag: '--version',
    description: 'High-speed JavaScript/TypeScript runtime & package manager.',
  },
];

async function probeBinary(probe: CLIProbe): Promise<DetectedCLI> {
  const binPath = await findExecutable(probe.command, probe.defaultPaths);

  if (!binPath) {
    return {
      id: probe.id,
      name: probe.name,
      command: probe.command,
      available: false,
      description: probe.description,
    };
  }

  const version = await probeCommandVersion(binPath, probe.versionFlag);

  return {
    id: probe.id,
    name: probe.name,
    command: probe.command,
    available: true,
    version: version || 'Installed',
    path: binPath,
    description: probe.description,
  };
}

export async function detectSystemCLIs(): Promise<DetectedCLI[]> {
  return Promise.all(PROBES.map(probeBinary));
}
