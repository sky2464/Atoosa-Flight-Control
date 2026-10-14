import { describe, it, expect } from 'bun:test';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import { isTowerAppDir, getTowerRoot } from '../../src/server/engine/os/platform.ts';

describe('Engine: Anti-Dogfooding Protection Guard', () => {
  it('should identify the Control Tower repository directory as tower root', () => {
    const towerRoot = getTowerRoot();
    expect(isTowerAppDir(towerRoot)).toBe(true);
    expect(isTowerAppDir(process.cwd())).toBe(true);
  });

  it('should allow external target projects and not flag them as tower', async () => {
    const externalProject = path.join(os.tmpdir(), `afc_external_test_${Date.now()}`);
    await fs.mkdir(externalProject, { recursive: true });

    await fs.writeFile(
      path.join(externalProject, 'package.json'),
      JSON.stringify({ name: 'awesome-target-app', version: '1.0.0' }),
      'utf-8'
    );

    try {
      expect(isTowerAppDir(externalProject)).toBe(false);
    } finally {
      await fs.rm(externalProject, { recursive: true, force: true });
    }
  });

  it('should detect tower even if candidate path is given with relative slashes or dots', () => {
    expect(isTowerAppDir('.')).toBe(true);
    expect(isTowerAppDir('./')).toBe(true);
  });
});
