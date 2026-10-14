import { describe, it, expect } from 'bun:test';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import { softReadProject } from '../src/server/modules/scanner/scannerService.ts';

describe('Scanner Service & Telemetry Radar', () => {
  it('should reject scanning the Control Tower itself (anti-dogfooding guard)', async () => {
    const towerDir = process.cwd();
    expect(softReadProject(towerDir)).rejects.toThrow('Control Tower');
  });

  it('should scan an external target project and report metrics accurately', async () => {
    const mockDir = path.join(os.tmpdir(), `afc_mock_project_${Date.now()}`);
    await fs.mkdir(mockDir, { recursive: true });

    // Create a mock codebase with package.json and source files
    await fs.writeFile(
      path.join(mockDir, 'package.json'),
      JSON.stringify({ name: 'my-external-app', dependencies: { react: '^19.0.0' } }),
      'utf-8'
    );
    await fs.writeFile(path.join(mockDir, 'App.tsx'), 'export const App = () => <div>Hello</div>;\n', 'utf-8');
    await fs.writeFile(path.join(mockDir, 'App.test.tsx'), 'test("renders", () => {});\n', 'utf-8');

    try {
      const telemetry = await softReadProject(mockDir);

      expect(telemetry).toBeDefined();
      expect(telemetry.totalFiles).toBe(3); // package.json, App.tsx, App.test.tsx
      expect(telemetry.totalLines).toBeGreaterThan(0);
      expect(telemetry.languageBreakdown).toBeDefined();
      expect(telemetry.flightScore).toBeGreaterThanOrEqual(0);
      expect(telemetry.flightScore).toBeLessThanOrEqual(100);
      expect(telemetry.detectedFrameworks).toContain('React');
      expect(telemetry.testSetup.detected).toBe(true);
    } finally {
      await fs.rm(mockDir, { recursive: true, force: true });
    }
  });

  it('should detect and flag files over 500 lines', async () => {
    // Create a temporary mock directory with a 600-line file
    const tmpDir = path.join(os.tmpdir(), `afc_test_monolith_${Date.now()}`);
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
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('should throw an error for non-existent target directory', async () => {
    expect(softReadProject('/path/that/does/not/exist_12345')).rejects.toThrow();
  });
});
