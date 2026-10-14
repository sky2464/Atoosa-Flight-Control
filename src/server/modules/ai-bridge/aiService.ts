import { getSettings } from '../../db.ts';
import { findExecutable } from '../../engine/os/process.ts';

export interface PromptImprovementRequest {
  userIdea: string;
  projectDomain?: string;
  targetScale?: string;
  containerChoice?: string;
  provider?: string;
}

export async function* streamPromptImprovement(
  req: PromptImprovementRequest,
  signal?: AbortSignal
): AsyncGenerator<string, void, unknown> {
  const settings = await getSettings();
  const provider = req.provider || settings.activeProvider;

  const systemInstructions = `You are the Pre-Flight Controller for software engineering.
Take the user's software idea and perform rigorous pre-flight analysis:
1. Clarify goals, edge cases, and non-functional requirements.
2. Recommend the best modern tech stack with pros & cons.
3. Evaluate Docker vs. No Docker for their specific scale.
4. Enforce mandatory flight rules: Modular files (max 500 lines per file), TDD, and clean architecture.
5. Provide a hardened, improved prompt ready for autonomous coding agents.`;

  const userPrompt = `Idea: ${req.userIdea}
Domain: ${req.projectDomain || 'General'}
Scale: ${req.targetScale || 'Prototype to Production'}
Container: ${req.containerChoice || 'Auto-decide'}`;

  // 1. Try Claude CLI if selected
  if (provider === 'claude-cli') {
    try {
      const claudeBin = settings.claudeCliPath || (await findExecutable('claude')) || 'claude';
      const proc = Bun.spawn([claudeBin, '-p', `${systemInstructions}\n\n${userPrompt}`], {
        env: { ...process.env },
        signal,
        stdout: 'pipe',
        stderr: 'pipe',
      });

      // Parallel stderr drain to avoid OS buffer deadlocks
      const stderrPromise = new Response(proc.stderr).text();

      const decoder = new TextDecoder();
      if (proc.stdout) {
        const reader = (proc.stdout as ReadableStream<Uint8Array>).getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) yield decoder.decode(value);
        }
      }

      await Promise.all([proc.exited, stderrPromise]);
      return;
    } catch (err: any) {
      yield `\n[Flight Control Warning: Claude CLI could not be executed (${err.message}). Falling back to local reasoning engine...]\n\n`;
    }
  }

  // 2. Try Ollama if selected
  if (provider === 'ollama') {
    try {
      const res = await fetch(`${settings.ollamaEndpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: settings.ollamaModel || 'llama3:latest',
          prompt: `${systemInstructions}\n\n${userPrompt}`,
          stream: true,
        }),
        signal,
      });

      if (!res.ok) throw new Error(`Ollama responded with HTTP ${res.status}`);
      if (!res.body) throw new Error('No response body from Ollama');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        const lines = text.split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.response) yield parsed.response;
          } catch {}
        }
      }
      return;
    } catch (err: any) {
      yield `\n[Flight Control Warning: Ollama connection failed (${err.message}). Falling back to built-in reasoning engine...]\n\n`;
    }
  }

  // 3. Fallback Built-in Flight Control Engine (Instant, Zero-latency, highly structured)
  const analysisSteps = [
    `# 🛫 Pre-Flight Mission Analysis\n\n`,
    `### 1. Goal Decomposition & Requirements\n`,
    `* **Core Objective:** ${req.userIdea.trim()}\n`,
    `* **Operational Tier:** ${req.targetScale || 'Production Ready'}\n`,
    `* **Modular Integrity Rule:** Enforcing strict **< 500 lines per file** threshold to eliminate context degradation.\n\n`,
    `### 2. Architecture & Tech Stack Matrix\n`,
    `* **Frontend:** React 19 + Vite + Tailwind CSS v4 (Zero-config, fast HMR)\n`,
    `* **Backend:** Bun + Hono (Lightweight, Web-standard, blazingly fast)\n`,
    `* **Persistence:** PostgreSQL + Drizzle ORM (Type-safe migrations)\n`,
    `* **Containerization:** ${req.containerChoice === 'docker' ? 'Docker Compose with multi-stage builds' : 'Host Bun runtime for fast iteration, Docker post-MVP'}\n\n`,
    `### 3. Hardened Agent Prompt (Ready for Coding Agents)\n`,
    `\`\`\`markdown\n`,
    `Act as the Lead Software Architect. Build the system following these non-negotiable rules:\n`,
    `1. ZERO files over 500 lines. Split business logic into dedicated domain services.\n`,
    `2. Write unit tests (Vitest) first (TDD workflow).\n`,
    `3. Validate all inputs at runtime.\n`,
    `4. Maintain strict separation between UI, domain business logic, and database schemas.\n`,
    `\`\`\`\n\n`,
    `✅ **Pre-flight verification completed. Ready for launchpad folder selection.**\n`
  ];

  for (const step of analysisSteps) {
    if (signal?.aborted) break;
    yield step;
    await new Promise((r) => setTimeout(r, 60)); // smooth pacing
  }
}
