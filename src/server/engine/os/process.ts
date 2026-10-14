import fs from 'node:fs/promises';
import path from 'node:path';
import { getPlatform, getHomeDir } from './platform.ts';

export interface CommandExecutionResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
}

export interface SafeSpawnOptions {
  timeoutMs?: number;
  env?: Record<string, string | undefined>;
  cwd?: string;
  signal?: AbortSignal;
}

/**
 * Searches for an executable binary across operating systems (macOS, Linux, Windows).
 */
export async function findExecutable(
  command: string,
  candidatePaths: string[] = []
): Promise<string | null> {
  const platform = getPlatform();
  const isWin = platform === 'win32';
  const home = getHomeDir();

  // 1. Try system PATH lookup using `where.exe` (Windows) or `which` (POSIX)
  try {
    const lookupCmd = isWin ? ['where.exe', command] : ['which', command];
    const proc = Bun.spawn(lookupCmd, {
      env: { ...process.env },
      stdout: 'pipe',
      stderr: 'pipe',
    });

    const [stdout, _] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ]);

    const firstLine = stdout.trim().split(/\r\n|\r|\n/)[0];
    if (firstLine && firstLine.length > 0) {
      return path.resolve(firstLine);
    }
  } catch {
    // Lookup command failed, proceed to explicit directory checks
  }

  // 2. Standard platform-specific directories to search
  const standardDirs: string[] = [];
  if (isWin) {
    const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
    const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
    standardDirs.push(
      path.join(localAppData, 'Programs'),
      path.join(localAppData, 'Microsoft', 'WindowsApps'),
      path.join(appData, 'npm'),
      path.join(home, '.bun', 'bin'),
      path.join(home, '.local', 'bin')
    );
  } else if (platform === 'darwin') {
    standardDirs.push(
      '/opt/homebrew/bin',
      '/usr/local/bin',
      '/usr/bin',
      path.join(home, '.local', 'bin'),
      path.join(home, '.bun', 'bin'),
      path.join(home, '.ollama', 'bin')
    );
  } else {
    // Linux
    standardDirs.push(
      '/usr/local/bin',
      '/usr/bin',
      '/snap/bin',
      path.join(home, '.local', 'bin'),
      path.join(home, '.bun', 'bin'),
      path.join(home, '.ollama', 'bin')
    );
  }

  const allCandidatePaths = [...candidatePaths];
  const extensions = isWin ? ['.exe', '.cmd', '.bat', ''] : [''];

  for (const dir of standardDirs) {
    for (const ext of extensions) {
      allCandidatePaths.push(path.join(dir, `${command}${ext}`));
    }
  }

  // 3. Test if any candidate path exists and is a file
  for (const candidate of allCandidatePaths) {
    if (!candidate) continue;
    try {
      const stat = await fs.stat(candidate);
      if (stat.isFile()) {
        return path.resolve(candidate);
      }
    } catch {
      // Continue searching
    }
  }

  return null;
}

/**
 * Executes a process safely with parallel stdout/stderr draining and timeout protection.
 */
export async function safeSpawn(
  command: string[],
  options: SafeSpawnOptions = {}
): Promise<CommandExecutionResult> {
  const { timeoutMs = 5000, env = process.env, cwd, signal } = options;

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutController = new AbortController();

  if (signal) {
    signal.addEventListener('abort', () => timeoutController.abort());
  }

  if (timeoutMs > 0) {
    timeoutId = setTimeout(() => {
      timeoutController.abort();
    }, timeoutMs);
  }

  try {
    const proc = Bun.spawn(command, {
      cwd,
      env: { ...env },
      signal: timeoutController.signal,
      stdout: 'pipe',
      stderr: 'pipe',
    });

    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ]);

    if (timeoutId) clearTimeout(timeoutId);

    return {
      success: exitCode === 0,
      exitCode,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
    };
  } catch (err: any) {
    if (timeoutId) clearTimeout(timeoutId);
    return {
      success: false,
      exitCode: -1,
      stdout: '',
      stderr: err.name === 'AbortError' ? 'Process timed out or was aborted' : err.message,
    };
  }
}

/**
 * Queries an executable for its version string (e.g. `bun --version`, `claude --version`).
 */
export async function probeCommandVersion(
  execPath: string,
  versionFlag = '--version',
  timeoutMs = 4000
): Promise<string | null> {
  const result = await safeSpawn([execPath, versionFlag], { timeoutMs });
  if (result.success && result.stdout) {
    // Return first clean line of stdout
    return result.stdout.split(/\r\n|\r|\n/)[0].trim();
  }
  return null;
}
