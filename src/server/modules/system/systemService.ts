import type { DetectedCLI } from '../../../shared/types.ts';

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
    defaultPaths: ['/Users/chicademy/.local/bin/claude', `${process.env.HOME}/.local/bin/claude`, '/usr/local/bin/claude'],
    versionFlag: '--version',
    description: 'Anthropic Claude Code CLI running with your local account and active subscription.',
  },
  {
    id: 'ollama',
    name: 'Ollama Local LLM',
    command: 'ollama',
    defaultPaths: ['/usr/local/bin/ollama', '/opt/homebrew/bin/ollama', `${process.env.HOME}/.ollama/bin/ollama`],
    versionFlag: '--version',
    description: 'Local offline LLM runner (Llama 3, Mistral, Qwen, DeepSeek).',
  },
  {
    id: 'cursor',
    name: 'Cursor Agent CLI',
    command: 'cursor',
    defaultPaths: ['/Users/chicademy/.local/bin/cursor', `${process.env.HOME}/.local/bin/cursor`],
    versionFlag: '--version',
    description: 'Cursor IDE agent CLI for local context navigation.',
  },
  {
    id: 'gh',
    name: 'GitHub CLI (gh / Copilot)',
    command: 'gh',
    defaultPaths: ['/opt/homebrew/bin/gh', '/usr/local/bin/gh', '/usr/bin/gh'],
    versionFlag: '--version',
    description: 'GitHub CLI with potential GitHub Copilot extension.',
  },
  {
    id: 'bun',
    name: 'Bun Runtime',
    command: 'bun',
    defaultPaths: ['/opt/homebrew/bin/bun', `${process.env.HOME}/.bun/bin/bun`, '/usr/local/bin/bun'],
    versionFlag: '--version',
    description: 'High-speed JavaScript/TypeScript runtime & package manager.',
  },
];

async function probeBinary(probe: CLIProbe): Promise<DetectedCLI> {
  // 1. Try finding binary path via `which`
  let binPath: string | null = null;
  try {
    const whichProc = Bun.spawn(['which', probe.command], {
      env: { ...process.env },
      stdout: 'pipe',
      stderr: 'pipe',
    });
    const stdout = await new Response(whichProc.stdout).text();
    await whichProc.exited;
    if (stdout.trim()) {
      binPath = stdout.trim();
    }
  } catch {}

  // 2. If which failed, check default paths
  if (!binPath) {
    for (const p of probe.defaultPaths) {
      try {
        const stat = await Bun.file(p).stat();
        if (stat) {
          binPath = p;
          break;
        }
      } catch {}
    }
  }

  if (!binPath) {
    return {
      id: probe.id,
      name: probe.name,
      command: probe.command,
      available: false,
      description: probe.description,
    };
  }

  // 3. Test execution for version with parallel drain and timeout
  let version = 'Installed';
  try {
    const verProc = Bun.spawn([binPath, probe.versionFlag], {
      env: { ...process.env },
      stdout: 'pipe',
      stderr: 'pipe',
    });
    const stdoutPromise = new Response(verProc.stdout).text();
    const stderrPromise = new Response(verProc.stderr).text();
    const [stdoutText, _] = await Promise.all([stdoutPromise, stderrPromise, verProc.exited]);
    if (stdoutText.trim()) {
      version = stdoutText.trim().split('\n')[0];
    }
  } catch {}

  return {
    id: probe.id,
    name: probe.name,
    command: probe.command,
    available: true,
    version,
    path: binPath,
    description: probe.description,
  };
}

export async function detectSystemCLIs(): Promise<DetectedCLI[]> {
  const results = await Promise.all(PROBES.map(probeBinary));
  return results;
}
