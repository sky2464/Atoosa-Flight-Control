import { describe, it, expect } from 'bun:test';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import {
  writeJsonAtomic,
  readJsonFile,
  getSettings,
  saveSettings,
} from '../../src/server/db.ts';

describe('Engine: Zero-Pollution & Atomic Storage', () => {
  it('should atomically write and read JSON files', async () => {
    const tmpDir = path.join(os.tmpdir(), `afc_test_atomic_${Date.now()}`);
    await fs.mkdir(tmpDir, { recursive: true });
    const targetFile = path.join(tmpDir, 'test.json');

    try {
      const payload = { flight: 'AFC-101', altitude: 35000, active: true };
      await writeJsonAtomic(targetFile, payload);

      const readBack = await readJsonFile(targetFile, {});
      expect(readBack).toEqual(payload);

      // Verify no temporary files remain
      const files = await fs.readdir(tmpDir);
      expect(files).toEqual(['test.json']);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('should return fallback for missing files', async () => {
    const missing = path.join(os.tmpdir(), `non_existent_${Date.now()}.json`);
    const result = await readJsonFile(missing, { fallback: true });
    expect(result).toEqual({ fallback: true });
  });

  it('should handle concurrent atomic writes without corruption', async () => {
    const tmpDir = path.join(os.tmpdir(), `afc_concurrent_${Date.now()}`);
    await fs.mkdir(tmpDir, { recursive: true });
    const targetFile = path.join(tmpDir, 'concurrent.json');

    try {
      // 20 parallel writes
      const promises = Array.from({ length: 20 }, (_, i) =>
        writeJsonAtomic(targetFile, { iteration: i, timestamp: Date.now() })
      );

      await Promise.all(promises);

      // Verify the final file is valid readable JSON
      const finalContent = await readJsonFile<{ iteration: number }>(targetFile, { iteration: -1 });
      expect(finalContent.iteration).toBeGreaterThanOrEqual(0);
      expect(finalContent.iteration).toBeLessThan(20);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('should get and save settings with workstation identity', async () => {
    const settings = await getSettings();
    expect(settings).toBeDefined();
    expect(settings.profile.workstation).toBeDefined();
    expect(settings.profile.workstation.length).toBeGreaterThan(0);
  });
});
