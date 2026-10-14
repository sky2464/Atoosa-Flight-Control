import { describe, it, expect } from 'bun:test';
import { findExecutable, safeSpawn, probeCommandVersion } from '../../src/server/engine/os/process.ts';

describe('Engine: Cross-Platform Process Runner', () => {
  it('should locate available system executables like bun', async () => {
    const bunPath = await findExecutable('bun');
    expect(bunPath).toBeDefined();
    expect(bunPath).not.toBeNull();
    expect(typeof bunPath).toBe('string');
  });

  it('should return null for non-existent executables', async () => {
    const fake = await findExecutable('non_existent_binary_xyz_12345');
    expect(fake).toBeNull();
  });

  it('should safely execute commands and capture stdout with parallel drain', async () => {
    const res = await safeSpawn(['bun', '--version']);
    expect(res.success).toBe(true);
    expect(res.exitCode).toBe(0);
    expect(res.stdout.length).toBeGreaterThan(0);
    expect(res.stderr).toBe('');
  });

  it('should probe command version string cleanly', async () => {
    const ver = await probeCommandVersion('bun', '--version');
    expect(ver).toBeDefined();
    expect(ver).not.toBeNull();
    expect(ver!.length).toBeGreaterThan(0);
  });

  it('should handle process timeouts gracefully without hanging', async () => {
    // Spawning a sleep or blocking command with tight timeout
    const res = await safeSpawn(['bun', '-e', 'setTimeout(() => {}, 2000)'], {
      timeoutMs: 150,
    });
    expect(res.success).toBe(false);
    expect(res.exitCode).not.toBe(0);
  });
});
