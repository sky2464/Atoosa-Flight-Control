import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

export type SupportedPlatform = 'darwin' | 'linux' | 'win32';

export interface PlatformInfo {
  os: SupportedPlatform;
  isWindows: boolean;
  isMacOS: boolean;
  isLinux: boolean;
  homeDir: string;
  dataDir: string;
  workstation: string;
}

/**
 * Normalizes any file path to POSIX format (forward slashes)
 * to ensure consistent display and telemetry metrics across Windows and Unix.
 */
export function toPosixPath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

/**
 * Returns current operating system identifier.
 */
export function getPlatform(): SupportedPlatform {
  const p = os.platform();
  if (p === 'win32') return 'win32';
  if (p === 'darwin') return 'darwin';
  return 'linux';
}

/**
 * Resolves the user's home directory across OSes.
 */
export function getHomeDir(): string {
  return os.homedir() || process.env.USERPROFILE || process.env.HOME || '.';
}

/**
 * Resolves a human-friendly workstation label for the current machine.
 */
export function getWorkstationName(): string {
  const hostname = os.hostname() || 'Localhost';
  const platform = getPlatform();
  const label = platform === 'darwin' ? 'macOS' : platform === 'win32' ? 'Windows' : 'Linux';
  return `${hostname} (${label})`;
}

/**
 * Resolves the zero-pollution data directory for Atoosa Flight Control.
 * Priority:
 * 1. Explicit AFC_DATA_DIR environment variable
 * 2. In-repo local `./data` if running within the Atoosa Flight Control project repository
 * 3. User app data directory:
 *    - Windows: %APPDATA%/AtoosaFlightControl/data
 *    - macOS / Linux: ~/.atoosa-flight-control/data
 */
export function resolveDataDir(overrideDir?: string): string {
  if (overrideDir) {
    return path.resolve(overrideDir);
  }

  if (process.env.AFC_DATA_DIR) {
    return path.resolve(process.env.AFC_DATA_DIR);
  }

  // Check if we are running locally inside the Atoosa Flight Control repository during dev/test
  try {
    const cwd = process.cwd();
    const pkgPath = path.join(cwd, 'package.json');
    const localData = path.join(cwd, 'data');
    if (fs.existsSync(pkgPath) && fs.existsSync(localData)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      if (pkg.name === 'atoosa-flight-control') {
        return localData;
      }
    }
  } catch {
    // Fall through to user profile data directory
  }

  const platform = getPlatform();
  const home = getHomeDir();

  if (platform === 'win32') {
    const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
    return path.join(appData, 'AtoosaFlightControl', 'data');
  }

  // macOS and Linux
  return path.join(home, '.atoosa-flight-control', 'data');
}

/**
 * Returns complete platform diagnostic info.
 */
export function getPlatformInfo(overrideDir?: string): PlatformInfo {
  const p = getPlatform();
  return {
    os: p,
    isWindows: p === 'win32',
    isMacOS: p === 'darwin',
    isLinux: p === 'linux',
    homeDir: getHomeDir(),
    dataDir: resolveDataDir(overrideDir),
    workstation: getWorkstationName(),
  };
}
