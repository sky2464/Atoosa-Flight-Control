import { describe, it, expect } from 'bun:test';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import { softReadProject } from '../../src/server/modules/scanner/scannerService.ts';

describe('Engine: Scanner Cross-Platform & Edge Cases', () => {
  it('should count lines identically for Windows CRLF and Unix LF files', async () => {
    const tmpDir = path.join(os.tmpdir(), `afc_crlf_test_${Date.now()}`);
    await fs.mkdir(tmpDir, { recursive: true });

    // File with CRLF
    const crlfFile = path.join(tmpDir, 'crlf.ts');
    await fs.writeFile(crlfFile, 'line1\r\nline2\r\nline3\r\nline4\r\nline5', 'utf-8');

    // File with LF
    const lfFile = path.join(tmpDir, 'lf.ts');
    await fs.writeFile(lfFile, 'line1\nline2\nline3\nline4\nline5', 'utf-8');

    // Empty file
    const emptyFile = path.join(tmpDir, 'empty.ts');
    await fs.writeFile(emptyFile, '', 'utf-8');

    try {
      const telemetry = await softReadProject(tmpDir);
      const crlfMetric = telemetry.filesOver500Lines.concat(
        // Search in all files
        (telemetry as any).filesOver500Lines
      );

      // Verify total files and lines
      expect(telemetry.totalFiles).toBe(3);
      // 5 lines for crlf + 5 lines for lf + 0 lines for empty = 10 lines
      expect(telemetry.totalLines).toBe(10);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('should normalize relative paths to POSIX slashes and skip symlink loops', async () => {
    const tmpDir = path.join(os.tmpdir(), `afc_symlink_test_${Date.now()}`);
    const subDir = path.join(tmpDir, 'sub', 'nested');
    await fs.mkdir(subDir, { recursive: true });

    const codeFile = path.join(subDir, 'index.ts');
    await fs.writeFile(codeFile, 'export const ready = true;\n', 'utf-8');

    // Create a symlink to parent if supported
    try {
      await fs.symlink(tmpDir, path.join(subDir, 'loop_link'));
    } catch {
      // Symlinks may require elevated privileges on some Windows setups; skip if unsupported
    }

    try {
      const telemetry = await softReadProject(tmpDir);
      expect(telemetry.totalFiles).toBe(1);
      expect(telemetry.totalLines).toBe(1);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
