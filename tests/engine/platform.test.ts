import { describe, it, expect } from 'bun:test';
import path from 'node:path';
import os from 'node:os';
import {
  getPlatform,
  getHomeDir,
  getWorkstationName,
  toPosixPath,
  resolveDataDir,
  getPlatformInfo,
} from '../../src/server/engine/os/platform.ts';

describe('Engine: OS & Platform Abstraction', () => {
  it('should detect current platform accurately', () => {
    const p = getPlatform();
    expect(['darwin', 'linux', 'win32']).toContain(p);
  });

  it('should resolve home directory', () => {
    const home = getHomeDir();
    expect(home).toBeDefined();
    expect(home.length).toBeGreaterThan(0);
  });

  it('should format workstation name with host and platform', () => {
    const workstation = getWorkstationName();
    expect(workstation).toBeDefined();
    expect(workstation).toContain('(');
    expect(workstation).toContain(')');
  });

  it('should normalize Windows backslash paths to clean POSIX forward slashes', () => {
    expect(toPosixPath('src\\server\\index.ts')).toBe('src/server/index.ts');
    expect(toPosixPath('C:\\Users\\Pilot\\Project\\README.md')).toBe('C:/Users/Pilot/Project/README.md');
    expect(toPosixPath('already/posix/path.ts')).toBe('already/posix/path.ts');
  });

  it('should prioritize explicit override or AFC_DATA_DIR', () => {
    const custom = path.join(os.tmpdir(), 'afc_custom_data_test');
    expect(resolveDataDir(custom)).toBe(path.resolve(custom));

    process.env.AFC_DATA_DIR = custom;
    try {
      expect(resolveDataDir()).toBe(path.resolve(custom));
    } finally {
      delete process.env.AFC_DATA_DIR;
    }
  });

  it('should provide full platform diagnostics', () => {
    const info = getPlatformInfo();
    expect(info.os).toBe(getPlatform());
    expect(typeof info.isWindows).toBe('boolean');
    expect(typeof info.isMacOS).toBe('boolean');
    expect(typeof info.isLinux).toBe('boolean');
    expect(info.homeDir).toBe(getHomeDir());
    expect(info.dataDir).toBeDefined();
  });
});
