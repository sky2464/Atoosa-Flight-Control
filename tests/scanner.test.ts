import { describe, it, expect } from 'bun:test';
import path from 'node:path';
import fs from 'node:fs/promises';
import { softReadProject } from '../src/server/modules/scanner/scannerService.ts';

describe('Scanner Service & Telemetry Radar', () => {
  it('should scan an existing project and report metrics accurately', async () => {
    const currentDir = process.cwd();
    const telemetry = await softReadProject(currentDir);

    expect(telemetry).toBeDefined();
    expect(telemetry.totalFiles).toBeGreaterThan(0);
    expect(telemetry.totalLines).toBeGreaterThan(0);
    expect(telemetry.languageBreakdown).toBeDefined();
    expect(telemetry.flightScore).toBeGreaterThanOrEqual(0);
    expect(telemetry.flightScore).toBeLessThanOrEqual(100);
  });

  it('should detect and flag files over 500 lines', async () => {
    // Create a temporary mock directory with a 600-line file
    const tmpDir = path.join(process.cwd(), 'data', 'test_scan_mock');
    await fs.mkdir(tmpDir, { recursive: true });

    const longFile = path.join(tmpDir, 'monolith.ts');
    const content = Array(600).fill('console.log("line");').join('\n');
    await fs.writeFile(longFile, content, 'utf-8');

    const shortFile = path.join(tmpDir, 'clean.ts');
    await fs.writeFile(shortFile, 'export const val = 42;\n', 'utf-8');

    try {
      const telemetry = await softReadProject(tmpDir);
      expect(telemetry.filesOver500Lines.length).toBe(1);
      expect(telemetry.filesOver500Lines[0].lineCount).toBe(600);
      expect(telemetry.filesOver500Lines[0].warningLevel).toBe('caution');
      expect(telemetry.warnings.some((w) => w.includes('500-line modular limit'))).toBe(true);
    } finally {
      // Clean up mock
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('should throw an error for non-existent target directory', async () => {
    expect(softReadProject('/path/that/does/not/exist_12345')).rejects.toThrow();
  });
});
